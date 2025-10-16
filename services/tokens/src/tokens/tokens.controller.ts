import { Controller, Post, Body } from '@nestjs/common';
import { TokensService } from './tokens.service';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post('validate')
  public async validateAccessToken(@Body() body: { token: string }): Promise<{ valid: boolean; userId?: string }> {
    return this.tokensService.validateAccessToken(body.token);
  }

  @Post('rotate')
  public async rotateTokens(@Body() body: { token: string }): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokensService.rotateTokens(body.token);
  }

  @Post('generate')
  public async generateTokens(@Body() body: { userId: string }): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokensService.generateTokens(body.userId);
  }

  @Post('invalidate')
  public async invalidateToken(@Body() body: { token: string }): Promise<{ success: boolean }> {
    return this.tokensService.invalidateToken(body.token);
  }
}
