import { OAuth2Client } from 'google-auth-library';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService
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

    // Call users service via HTTP with error handling
    let verifiedUser;
    try {
      const verifyResponse = await axios.post('http://localhost:5002/api/users/verify-email', { 
        email: payload.email 
      });
      verifiedUser = verifyResponse.data.user;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User not found, create new user
        try {
          const createResponse = await axios.post('http://localhost:5002/api/users/create', {
            id: payload.sub,
            email: payload.email,
            firstName: payload.given_name ?? '',
            lastName: payload.family_name ?? '',
            role: 'user',
          });
          return { user: createResponse.data.user };
        } catch (createError) {
          throw new Error('Failed to create user account');
        }
      }
      throw new Error('User service unavailable');
    }

    if (!verifiedUser) {
      try {
        const createResponse = await axios.post('http://localhost:5002/api/users/create', {
          id: payload.sub,
          email: payload.email,
          firstName: payload.given_name ?? '',
          lastName: payload.family_name ?? '',
          role: 'user',
        });
        return { user: createResponse.data.user };
      } catch (createError) {
        throw new Error('Failed to create user account');
      }
    }

    return { user: verifiedUser };
  }

  async logout(refreshToken: string) {
    // TODO: Invalidate refresh token in Redis via tokens
    // await this.grpcTokensService.invalidateRefreshToken(refreshToken);
  }
}