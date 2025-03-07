import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import type { User, UserMessage, Profile } from '../../interface';

export interface UserClientGrpc {
  getProfileById(req: UserMessage): Observable<Profile>;
  verifyUserByMail(req: UserMessage): Observable<User>;
  createUser(req: Profile): Observable<User>;
}

@Injectable()
export class GrpcUserService implements OnModuleInit {
  private userService!: UserClientGrpc;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserClientGrpc>('UserService');
  }

  async getProfileById(userToVerify: UserMessage): Promise<Profile> {
    try {
      console.log('---- GRPC.getUser ----', userToVerify)
      const user = await firstValueFrom(this.userService.getProfileById(userToVerify));
      console.log('---- GRPC.getUser ---- result ----', user)
      return user;
    } catch(error) {
      console.log('---- GRPC.getUser.error ----', error)
      throw error;
    }
  }

  async verifyUserByMail(userToVerify: UserMessage): Promise<User> {
    try {
      console.log('---- GRPC.verifyUserByMail ----', userToVerify)
      const user = await firstValueFrom(this.userService.verifyUserByMail(userToVerify));
      console.log('---- GRPC.verifyUserByMail ---- result ----', user)
      return user;
    } catch(error) {
      console.log('---- GRPC.verifyUserByMail.error ----', error)
      throw error;
    }
  }

  async createUser(profile: Profile): Promise<User> {
    try {
      console.log('---- GRPC.createUser', profile)
      const user = await firstValueFrom(this.userService.createUser(profile));
      console.log('---- GRPC.createUser ---- result ----', user)
      return user;
    } catch(error) {
      console.log('----  GRPC.createUser.error ---- ', error)
      throw error;
    }
  }
}
