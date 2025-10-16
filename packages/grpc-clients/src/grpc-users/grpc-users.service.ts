import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import type { UserResponse, UserInfo, Profile } from '../interface';
import { GRPC_USERS_CLIENT_NAME, GRPC_USERS_SERVICE_NAME } from './grpc-users.config';

export interface UsersClientGrpc {
  getProfile(req: UserInfo): Observable<UserResponse>;
  verifyEmail(req: UserInfo): Observable<UserResponse>;
  createUser(req: Profile): Observable<UserResponse>;
}

@Injectable()
export class GrpcUsersService implements OnModuleInit {
  private grpcUsersService!: UsersClientGrpc;

  constructor(@Inject(GRPC_USERS_CLIENT_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.grpcUsersService = this.client.getService<UsersClientGrpc>(GRPC_USERS_SERVICE_NAME);
  }

  async getProfile(user: UserInfo): Promise<UserResponse> {
    try {
      return await firstValueFrom(this.grpcUsersService.getProfile(user));
    } catch(error) {
      throw error;
    }
  }

  async verifyEmail(user: UserInfo): Promise<UserResponse> {
    try {
      return await firstValueFrom(this.grpcUsersService.verifyEmail(user));
    } catch(error) {
      throw error;
    }
  }

  async createUser(profile: Profile): Promise<UserResponse> {
    try {
      return await firstValueFrom(this.grpcUsersService.createUser(profile));
    } catch(error) {
      throw error;
    }
  }
}
