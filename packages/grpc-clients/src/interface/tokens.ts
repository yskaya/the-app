export interface TokenMessage {
  token: string;
}

export interface Tokens {
  refreshToken: string;
  accessToken: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  userId?: string;
}
