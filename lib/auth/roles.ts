export const ROLES = {
  ADMIN: "admin" as const,
  USER: "user" as const,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 2,
  user: 1,
};

export function hasRole(
  userRole: Role | undefined,
  requiredRole: Role,
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role?: Role): boolean {
  return role === ROLES.ADMIN;
}

export function isUser(role?: Role): boolean {
  return role === ROLES.USER;
}

export function getDefaultRole(): Role {
  return ROLES.USER;
}
