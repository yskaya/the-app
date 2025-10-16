import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';

dotenv.config(); 

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXP = process.env.REFRESH_TOKEN_EXP;
const ACCESS_TOKEN_EXP = process.env.ACCESS_TOKEN_EXP;

export function generateAccessToken(userId: string): string {
  console.log('*****ACCESS_SECRET*******', ACCESS_SECRET);
  if (!ACCESS_SECRET) {
    throw new Error('Missing TOKEN SECRETS in environment variables');
  }
  return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string): string {
  console.log('*****REFRESH_SECRET*******', REFRESH_SECRET);
  if (!REFRESH_SECRET) {
    throw new Error('Missing TOKEN SECRETS in environment variables');
  }
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "2d" });
}

export function extractIdFromToken({ refreshToken, accessToken }: {refreshToken?: string; accessToken?: string}): string | undefined {
  console.log('************', refreshToken, accessToken, REFRESH_SECRET, ACCESS_SECRET);
  try {
    if (!REFRESH_SECRET && !ACCESS_SECRET) {
      throw new Error('Missing TOKEN SECRETS in environment variables');
    }

    let decodedUser: string | jwt.JwtPayload | undefined;

    if (refreshToken) {
        decodedUser = jwt.verify(refreshToken, REFRESH_SECRET as jwt.Secret)
    }

    if (accessToken) {
        decodedUser = jwt.verify(accessToken, ACCESS_SECRET as jwt.Secret)
    }

    if (typeof decodedUser === 'object' && decodedUser !== null && 'userId' in decodedUser) {
      return decodedUser.userId as string;
    }

    return undefined;
  } catch {
    throw new Error("Invalid refresh token");
  }
}
