import { ReactNode } from 'react';
import WarehouseSidebar from './WarehouseSidebar';

interface WarehouseLayoutProps {
  children: ReactNode;
}

export default function WarehouseLayout({ children }: WarehouseLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-orange-50/30">
      <WarehouseSidebar />
      <main className="flex-1 overflow-y-auto p-6 h-full">
        <div className="max-w-7xl mx-auto pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
