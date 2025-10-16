import { Module } from '@nestjs/common';
import { RedisModule } from '@paypay/redis';
import { PrismaModule } from '@paypay/prisma';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRestController } from './users.rest.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [UsersService],
  controllers: [UsersController, UsersRestController],
  exports: [UsersService],
})
export class UsersModule {}