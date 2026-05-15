import { createTheme } from '@mantine/core';

export const messengerTheme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e8f4fc',
      '#d1e9f9',
      '#a8d6f4',
      '#7fc0ef',
      '#5aa8e8',
      '#3390ec',
      '#2b7fd4',
      '#256bb3',
      '#1d5691',
      '#164070',
    ],
  },
  primaryShade: { light: 5, dark: 5 },
  defaultRadius: 'md',
  fontFamily:
    'var(--font-family-main, Roboto, "Helvetica Neue", Arial, sans-serif)',
});
