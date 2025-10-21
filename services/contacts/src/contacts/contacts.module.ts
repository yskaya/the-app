import { Module } from '@nestjs/common';
import { RedisModule } from '@paypay/redis';
import { PrismaModule } from '../prisma/prisma.module';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [ContactsService],
  controllers: [ContactsController],
  exports: [ContactsService],
})
export class ContactsModule {}

