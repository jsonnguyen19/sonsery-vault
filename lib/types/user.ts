export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
