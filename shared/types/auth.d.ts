export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isCreator: boolean;
  isBrand: boolean;
  referralCode: string | null;
  referralPercentage: number;
  referredById: number | null;
  appsflyerLink: string | null;
  new_20: boolean;
  createdAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type CreateAccountInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isCreator?: boolean;
  isBrand?: boolean;
  referralCode?: string;
};

export type CreateAccountResponse = {
  user: AuthUser;
  token: string;
};

