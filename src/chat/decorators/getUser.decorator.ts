import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, executionContext: ExecutionContext) => {
    const request = executionContext.switchToHttp().getRequest();

      console.log('Authenticated user:', request?.user);
    
    return data ? request?.user?.[data] : request?.user;
  },
);
