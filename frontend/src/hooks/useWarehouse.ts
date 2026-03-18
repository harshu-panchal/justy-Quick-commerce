import { useState, useEffect } from 'react';

/**
 * Hook to determine if warehouse mode is enabled.
 * In a real application, this might come from a global configuration,
 * an environment variable, or a user setting.
 */
export function useWarehouse() {
  // Mock flag for now - can be connected to real data later
  const [isWarehouseEnabled, setIsWarehouseEnabled] = useState(true);

  return {
    isWarehouseEnabled,
    setIsWarehouseEnabled
  };
}
