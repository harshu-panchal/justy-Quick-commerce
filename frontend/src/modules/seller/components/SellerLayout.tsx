import { ReactNode, useState, useCallback } from 'react';
import SellerHeader from './SellerHeader';
import SellerSidebar from './SellerSidebar';
import { useSellerSocket, SellerNotification } from '../hooks/useSellerSocket';
import SellerNotificationAlert from './SellerNotificationAlert';
import { EquipmentCartProvider } from '../../../context/EquipmentCartContext';

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<SellerNotification | null>(null);

  const handleNotificationReceived = useCallback((notification: SellerNotification) => {
    setActiveNotification(notification);
  }, []);

  useSellerSocket(handleNotificationReceived);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 relative">
      {/* Real-time Notification Alert */}
      <SellerNotificationAlert
        notification={activeNotification}
        onClose={closeNotification}
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <SellerSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'pl-0'
          }`}
      >
        {/* Header */}
        <SellerHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-neutral-50 overflow-x-hidden">
          <EquipmentCartProvider>
            {children}
          </EquipmentCartProvider>
        </main>
      </div>
    </div>
  );
}

