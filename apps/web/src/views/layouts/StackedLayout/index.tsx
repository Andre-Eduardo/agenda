import { Outlet } from '@tanstack/react-router';

export function StackedLayout() {
  return (
    <div>
      <h1>Stacked Layout</h1>
      <Outlet />
    </div>
  );
}

export default StackedLayout;
