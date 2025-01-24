import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from './dtos/login.dto';
import { VerificationOTPDto } from './dtos/verificationOTP.dto';
import { OtpDto } from "./dtos/otp.dto";
import { Cron } from "@nestjs/schedule";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { Request } from "express";
import { ResendOtpDto } from "./dtos/resendOTP.dto";
import { VerifyOtpDto } from "./dtos/verifyOtp.dto";
import { LogoutDto } from "./dtos/logout.dto";
import { GetUser } from "./decorators/getUser.decorator";
import { PaginationDto } from "./dtos/pagination.dto";


@Controller('/auth')
export class AuthController{
    constructor(private readonly authService:AuthService){}

    @UseGuards(AuthGuard)
  @Get()
  async getAllUser(@Query() paginationDto: PaginationDto): Promise<any> {
    return this.authService.fetchAllUser(paginationDto);
  }

    @Post('/login')
    async login (@Body() userData:LoginDto):Promise<any>{
        return await this.authService.loginUser(userData);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() body: VerifyOtpDto) {
        const { email, otp } = body;
        return await this.authService.verifyOtp(email, otp);
    }

    @Post('resend-otp')
    async resendOtp(@Body() body: ResendOtpDto) {
        const { email } = body;
        return this.authService.resendOtp(email);
    }

    @Cron('0 * * * *') // Run every hour
    async cleanupExpiredOtps() {
        const { count } = await this.authService.deleteExpiredOtps();
        console.log(`Cleaned up ${count} expired OTPs.`);
    }
    @UseGuards(AuthGuard)
    @Get('/user-data')
    async authHome(@Req() req:Request){
        const user = req.user;
        return {
            message:'Fetching User Data!',
            data:user,
        };
    }

    @UseGuards(AuthGuard)
    @Post('/logout')
    async logout(@GetUser() res:any) {
        const user = res;
        const id=user.userId;
        return await this.authService.logout(id);
    }
}