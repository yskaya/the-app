import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { TokenMessage, UserIdMessage, Tokens, TokenValidationResponse } from '../interface';
import { GRPC_TOKENS_CLIENT_NAME, GRPC_TOKENS_SERVICE_NAME } from './grpc-tokens.config';

export interface TokensServiceGrpc {
  validateAccessToken(req: TokenMessage): Observable<TokenValidationResponse>;
  rotateTokens(req: TokenMessage): Observable<Tokens>;
  generateTokens(req: UserIdMessage): Observable<Tokens>;
}

@Injectable()
export class GrpcTokensService implements OnModuleInit {
  private grpcTokensService!: TokensServiceGrpc;

  constructor(@Inject(GRPC_TOKENS_CLIENT_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.grpcTokensService = this.client.getService<TokensServiceGrpc>(GRPC_TOKENS_SERVICE_NAME);
  }

  async validateAccessToken(tokenMessage: TokenMessage): Promise<TokenValidationResponse> {
    try {
      return await firstValueFrom(this.grpcTokensService.validateAccessToken(tokenMessage));
    } catch(error) {
      throw error;
    }
  }

  async rotateTokens(tokenMessage: TokenMessage): Promise<Tokens> {
    try {
      return await firstValueFrom(this.grpcTokensService.rotateTokens(tokenMessage));
    } catch(error) {
      throw error;
    }
  }

  async generateTokens(userIdMessage: UserIdMessage): Promise<Tokens> {
    try {
      return await firstValueFrom(this.grpcTokensService.generateTokens(userIdMessage));
    } catch(error) {
      throw error;
    }
  }
}
