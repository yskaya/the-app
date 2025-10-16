export interface UserInfo {
  id?: string;
  email?: string;
}

export interface UserIdMessage {
  userId: string;
}

export interface Profile {
  id: string;
  email: string;
  lastName: string;
  firstName: string;
  role: string;
  profileUrl?: string;
}

export interface UserResponse {
  user: Profile;
}
