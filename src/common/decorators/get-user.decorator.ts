import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorization = request.headers['authorization'] || '';
    const token = authorization.replace('Bearer ', '');

    if (!token) {
      return null; // Or throw an error if a token is required
    }

    try {
      const jwtService = new JwtService({
        secret: process.env.JWT_SECRET, // Ensure your secret is configured
      });
      const decoded = jwtService.decode(token);
      return decoded;
    } catch (err) {
      return null; // Or handle invalid token appropriately
    }
  },
);
