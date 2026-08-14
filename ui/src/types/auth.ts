export type BanStatus = {
  active: boolean;
  reason: string | null;
  expiry: number | null;
}

export type User = {
  username: string;
  avatarUrl: string;
  ban: BanStatus | null;
}

type LoginSuccess = {
  success: true;
  user: User;
}

type LoginFailure = {
  success: false;
  error: string; 
}

export type LoginResponse = LoginSuccess | LoginFailure;

export type LoginCreds = {
  username?: string;
  password?: string;
}
