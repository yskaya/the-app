import { Request } from 'express';
import { Controller, Get, Post, Req, Body } from '@nestjs/common';
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

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string }) {
    console.log('!!!!! Users.verifyEmail. email=', body.email);
    return this.usersService.verifyEmail(body.email);
  }

  @Post('create')
  async createUser(@Body() body: any) {
    console.log('!!!!! Users.createUser. body=', body);
    return this.usersService.createUser(body);
  }
}