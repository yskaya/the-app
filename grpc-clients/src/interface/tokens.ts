import { UserMessage } from './user';

export interface TokenMessage {
  token: string;
}

export interface Tokens {
  refreshToken: string;
  accessToken: string;
}

export interface RotateTokensResponse {
  user: UserMessage;
  tokens: Tokens;
}
