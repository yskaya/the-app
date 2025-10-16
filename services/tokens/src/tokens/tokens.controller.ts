import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_TOKENS_SERVICE_NAME } from '@paypay/grpc-clients';
import type { Tokens, TokenMessage, TokenValidationResponse, UserIdMessage } from '@paypay/grpc-clients';
import { TokensService } from './tokens.service';

@Controller()
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @GrpcMethod(GRPC_TOKENS_SERVICE_NAME, 'ValidateAccessToken')
  public async validateAccessToken({ token }: TokenMessage): Promise<TokenValidationResponse> {
    return this.tokensService.validateAccessToken(token);
  }

  @GrpcMethod(GRPC_TOKENS_SERVICE_NAME, 'RotateTokens')
  public async rotateTokens({ token }: TokenMessage): Promise<Tokens> {
    return this.tokensService.rotateTokens(token);
  }

  @GrpcMethod(GRPC_TOKENS_SERVICE_NAME, 'GenerateTokens')
  public async generateTokens({ userId }: UserIdMessage): Promise<Tokens> {
    return this.tokensService.generateTokens(userId);
  }
}
