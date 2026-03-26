import { ReactNode } from 'react';
import WarehouseSidebar from './WarehouseSidebar';

interface WarehouseLayoutProps {
  children: ReactNode;
}

export default function WarehouseLayout({ children }: WarehouseLayoutProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <WarehouseSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          <div className="max-w-7xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
