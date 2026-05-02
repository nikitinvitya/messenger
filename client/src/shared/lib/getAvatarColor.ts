const AVATAR_COLORS = [
  '#2196F3',
  '#32c12c',
  '#ff9800',
  '#e91e63',
  '#9c27b0',
  '#f44336',
  '#00bcd4',
];

export const getAvatarColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
};