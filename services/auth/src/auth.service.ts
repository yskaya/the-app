import { OAuth2Client } from 'google-auth-library';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrpcTokensService, GrpcUsersService } from '@paypay/grpc-clients';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly grpcTokensService: GrpcTokensService,
    private readonly grpcUsersService: GrpcUsersService
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      'postmessage'
    );
  }

  async googleLogin(authCode: string) {
    if (!authCode) {
      throw new Error('No code provided');
    }

    const { tokens } = await this.googleClient.getToken(authCode);
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google credentials');
    }

    const { user: verifiedUser } = await this.grpcUsersService.verifyEmail({ email: payload.email });

    if (!verifiedUser) {
      const { user: newUser } = await this.grpcUsersService.createUser({
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name ?? '',
        lastName: payload.family_name ?? '',
        role: 'user',
      });

      return { user: newUser };
    }

    return { user: verifiedUser };
  }

  async logout(refreshToken: string) {
    // TODO: Invalidate refresh token in Redis via tokens
    // await this.grpcTokensService.invalidateRefreshToken(refreshToken);
  }
}