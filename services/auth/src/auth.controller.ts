import { Controller, Body, Req, Res, Post } from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login/google')
  async login(@Body() body: any, @Res() res: Response) {
    if (!body.code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const { user } = await this.authService.googleLogin(body.code);
    
    // Call tokens service via HTTP
    const tokensResponse = await axios.post('http://localhost:5003/api/tokens/generate', { userId: user.id });
    const tokens = tokensResponse.data;

    this.setCookies(res, tokens, user.id);

    return res.json({ user, tokens });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log('!!!!!!!! Auth.logout !!!!!!!')
    const refreshToken = req.cookies?.refresh_token;
    
    if (refreshToken) {
      try {
        // Invalidate tokens in Redis
        await axios.post('http://localhost:5003/api/tokens/invalidate', { token: refreshToken });
      } catch (error) {
        console.error('Token invalidation failed:', error);
        // Continue with logout even if invalidation fails
      }
    }
    
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('user_id');
    return res.status(200).json({ message: 'Logged out' });
  }

  private setCookies(res: Response, tokens: { accessToken: string; refreshToken: string }, userId: string) {
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15min
    });

    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    // Set user_id cookie for wallet and other services (not httpOnly so frontend can read)
    res.cookie("user_id", userId, {
      httpOnly: false, // Frontend needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });
  }
}
