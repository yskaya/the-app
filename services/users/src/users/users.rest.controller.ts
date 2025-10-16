import { Request } from 'express';
import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersRestController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    const userId = req.headers['x-user-id'];
    
    console.log('!!!!! Users.me. userId=', userId);
    
    if (!userId) return { error: 'Unauthorized' };
    
    return this.usersService.getProfile(userId as string);
  }
}