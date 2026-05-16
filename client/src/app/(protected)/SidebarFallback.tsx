import { Box, Loader } from '@mantine/core';
import sidebarCls from '@/widgets/sidebar/ui/Sidebar.module.scss';

export function SidebarFallback() {
  return (
    <aside className={sidebarCls.sidebar}>
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader size="md" />
      </Box>
    </aside>
  );
}
