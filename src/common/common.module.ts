// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { GetUser } from './decorators/get-user.decorator';

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [GetUser],
})
export class CommonModule {}
