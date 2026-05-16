import { Box, Loader } from '@mantine/core';

export default function ChatLoading() {
  return (
    <Box
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Loader size="md" />
    </Box>
  );
}
