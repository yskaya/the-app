import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { TokenMessage, RotateTokensResponse, User } from '../../interface';

export interface AuthServiceGrpc {
  verifyAccessToken(req: TokenMessage): Observable<User>;
  rotateTokens(req: TokenMessage): Observable<RotateTokensResponse>;
}

@Injectable()
export class GrpcAuthService implements OnModuleInit {
  private authService!: AuthServiceGrpc;

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  async verifyAccessToken(token: TokenMessage): Promise<User> {
    try {
      console.log('---- GRPC.verifyAccessToken ----', this.authService.verifyAccessToken, token)
      const user = await firstValueFrom(this.authService.verifyAccessToken(token));
      console.log('---- GRPC.verifyAccessToken ---- result ----', user)
      return user;
    } catch(error) {
      console.log('----  GRPC.verifyAccessToken.error ---- ', error)
      throw error;
    }
  }

  async rotateTokens(token: TokenMessage): Promise<RotateTokensResponse> {
    try {
      console.log('---- GRPC.rotateTokens ----', token)
      const { user, tokens } = await firstValueFrom(this.authService.rotateTokens(token));
      console.log('---- GRPC.rotateTokens ---- result ----', { user, tokens })
      return { user, tokens };
    } catch(error) {
      console.log('----  GRPC.rotateTokens.error ---- ', error)
      throw error;
    }
  }
}
