export const publicRoutes = {
  login: '/sign-in',
  signup: '/sign-up',
} as const;

export const protectedRoutes = {
  chats: '/chats',
  profile: '/profile',
} as const;

export const AppRoutes = {
  ...protectedRoutes,
  ...publicRoutes,
} as const;

export const protectedRoutePatterns = [
  /^\/chats(\/.*)?$/,
  /^\/profile(\/.*)?$/,
];