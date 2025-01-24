import { PrismaService } from "src/prisma.service";
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import * as crypto from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { nanoid } from "nanoid";
import { PaginationDto } from "./dtos/pagination.dto";

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService, private jwtService: JwtService, private mailerService: MailerService) { }

    // Pagination
    async fetchAllUser(paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
            }),
            this.prisma.user.count(),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async loginUser(signupData: LoginDto) {
        const { email, name } = signupData;

        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            });

            if (user) {
                // Generate OTP for existing but unverified user
                await this.generateVerificationOtp(user.id);

                return {
                    isVerified: false,
                    message: 'Check email for OTP Verification!',
                };
            }

            // Create a new user if not found
            const newUser = await this.prisma.user.create({
                data: {
                    name,
                    email,
                    verified: false,
                },
            });

            // Generate OTP for new user
            await this.generateVerificationOtp(newUser.id);

            return {
                isVerified: false,
                message: 'User created successfully. Please verify your email. Check email for OTP Verification!',
            };
        } catch (error) {
            console.error(error);

            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException('Email already exists.');
            }

            throw new InternalServerErrorException('Error during signup.');
        }
    }

    // Example JWT token generation method
    private generateJwtToken(user: any): string {
        const tokenData = {
            userId: user.id,
            name: user.name,
            email: user.email,
        };

        const token = this.jwtService.sign(tokenData, { expiresIn: '3h' });

        return token;
    }


    //

    async generateVerificationOtp(userId: number) {
        // Fetch the user
        const user = await this.prisma.user.findUnique({
            where: { id: +userId },
            select: { email: true, id: true },
        });

        if (!user || !user.email) {
            throw new NotFoundException('User not found or email is missing.');
        }

        // Check for an existing OTP that is still valid
        const existingOtp = await this.prisma.verificationOtp.findFirst({
            where: {
                userId: user.id,
                expiresAt: { gte: new Date() }, // Check if OTP is not expired
            },
        });

        if (existingOtp) {
            throw new BadRequestException('An active OTP already exists. Please wait until it expires.');
        }

        // Generate a new OTP
        const otpSimple = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otpSimple, 10); // Hash the OTP
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Save the OTP to the database
        try {
            await this.prisma.verificationOtp.create({
                data: {
                    otp: otpHash,
                    expiresAt,
                    email: user.email,
                    userId: user.id,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error saving OTP to the database.');
        }

        // Send OTP via email
        await this.mailerService.sendMail(
            user.email,
            'Your OTP for Email Verification',
            `Your OTP is: ${otpSimple}. It will expire in 5 minutes.`,
            `<p>Your OTP is <strong>${otpSimple}</strong>. It will expire in 5 minutes.</p>`
        );

        return { message: 'OTP sent successfully', email: user.email };
    }

    async verifyOtp(email: string, otp: string): Promise<{ token: string; verified: boolean }> {
        const verificationOtp = await this.prisma.verificationOtp.findFirst({
            where: {
                email,
                expiresAt: { gte: new Date() }, // Ensure OTP is not expired
            },
        });

        if (!verificationOtp) {
            throw new BadRequestException('Invalid or expired OTP.');
        }

        const isOtpValid = await bcrypt.compare(otp, verificationOtp.otp);

        if (!isOtpValid) {
            throw new BadRequestException('Invalid OTP.');
        }

        try {
            // Mark user as verified
            await this.prisma.user.update({
                where: { email },
                data: { verified: true },
            });

            // Generate JWT token after successful verification
            const user = await this.prisma.user.findUnique({
                where: { email },
                select: { id: true, name: true, email: true },
            });

            const tokenData = {
                userId: user.id,
                name: user.name,
                email: user.email,
            };

            const token = this.jwtService.sign(tokenData, { expiresIn: '3h' });

            // Delete the OTP after successful verification
            await this.prisma.verificationOtp.delete({
                where: { id: verificationOtp.id },
            });

            return {
                token,
                verified: true,
            };
        } catch (error) {
            console.error('Error in User Update Verification:', error);
            throw new InternalServerErrorException('Error while updating user status.');
        }
    }

    async deleteExpiredOtps(): Promise<{ count: number }> {
        try {
            const result = await this.prisma.verificationOtp.deleteMany({
                where: {
                    expiresAt: { lt: new Date() }, // Delete OTPs where the expiry date is less than the current date
                },
            });

            return { count: result.count }; // Correctly return the count property
        } catch (error) {
            throw new InternalServerErrorException('Error deleting expired OTPs from the database.');
        }
    }

    async resendOtp(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }
        console.log(user.verified);
        if (user.verified) {
            // Generate JWT token for verified user
            const token = this.generateJwtToken(user);
            return {
                isVerified: true,
                message: 'Joining the Chat',
                userData: user,
                token,
            };
        }

        const existingOtp = await this.prisma.verificationOtp.findFirst({
            where: {
                email: user.email,
                expiresAt: { gte: new Date() }, // Check if OTP is still valid
            },
        });

        if (existingOtp) {
            // Delete the existing OTP before sending a new one
            try {
                await this.prisma.verificationOtp.delete({
                    where: { id: existingOtp.id },
                });
            } catch (error) {
                throw new InternalServerErrorException('Error deleting the existing OTP.');
            }
        }

        // Generate a new OTP
        const otpSimple = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otpSimple, 10); // Hash the OTP
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // Save the new OTP to the database
        try {
            await this.prisma.verificationOtp.create({
                data: {
                    otp: otpHash,
                    expiresAt,
                    email: user.email,
                    userId: user.id,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error saving OTP to the database.');
        }

        // Send OTP via email
        await this.mailerService.sendMail(
            user.email,
            'Your OTP for Email Verification',
            `Your OTP is: ${otpSimple}. It will expire in 5 minutes.`,
            `<p>Your OTP is <strong>${otpSimple}</strong>. It will expire in 5 minutes.</p>`
        );

        return { message: 'OTP sent successfully', email: user.email };
    }


    async logout(id: any) {
        try {
            console.log(id);
            await this.prisma.user.update({
                where: { id: +id },
                data: { verified: false },
            });

            return { message: 'Logged out successfully' };
        } catch (error) {
            console.error(error);
            throw new NotFoundException('Error during logout');
        }
    }
}