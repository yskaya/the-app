import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from '@paypay/redis';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    ContactsModule,
    PrismaModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}

