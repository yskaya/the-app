import { Controller, Body, Req, Res, Post } from '@nestjs/common';
import { Request, Response } from 'express';
import { GrpcTokensService, Tokens } from '@paypay/grpc-clients';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly grpcTokensService: GrpcTokensService,
  ) {}

  @Post('login/google')
  async login(@Body() body: any, @Res() res: Response) {
    if (!body.code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    const { user } = await this.authService.googleLogin(body.code);
    const tokens = await this.grpcTokensService.generateTokens({ userId: user.id });

    this.setCookies(res, tokens);

    return res.json({ user, tokens });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    console.log('!!!!!!!! Auth.logout !!!!!!!')
    // const refreshToken = req.cookies.refresh_token;
    // if (refreshToken) {
    //   await this.authService.logout(refreshToken);
    // }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'Logged out' });
  }

  private setCookies(res: Response, tokens: Tokens) {
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
  }
}
