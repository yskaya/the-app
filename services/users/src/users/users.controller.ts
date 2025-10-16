import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('GrpcUsersService', 'VerifyEmail')
  async verifyEmail(userInfo: { email: string }) {
    console.log('!!!! GrpcUsersService.VerifyEmail', userInfo)
    return this.usersService.verifyEmail(userInfo.email);
  }

  @GrpcMethod('GrpcUsersService', 'GetProfile')
  async getProfile(user: { id: string }) {
    console.log('!!!! GrpcUsersService.GetProfile', user)
    return this.usersService.getProfile(user.id);
  }

  @GrpcMethod('GrpcUsersService', 'CreateUser')
  async createUser(userProfile: any) {
    console.log('!!!! GrpcUsersService.CreateUser', userProfile)
    return this.usersService.createUser(userProfile);
  }
}