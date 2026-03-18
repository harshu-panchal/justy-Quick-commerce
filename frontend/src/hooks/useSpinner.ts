import { useState, useEffect, useCallback } from 'react';

export type SpinnerTrigger = 'onLogin' | 'afterOrder' | 'manual';
export type SpinnerFrequency = 'once' | 'daily' | 'always';

export interface SpinnerConfig {
  enabled: boolean;
  trigger: SpinnerTrigger;
  frequency: SpinnerFrequency;
  rewards: any[];
}

export const useSpinner = (initialSettings?: SpinnerConfig | null) => {
  const [showLuckySpin, setShowLuckySpin] = useState(false);
  const [config, setConfig] = useState<SpinnerConfig | null>(initialSettings || null);

  useEffect(() => {
    if (initialSettings) {
      setConfig(initialSettings);
    } else {
      const savedConfig = localStorage.getItem('spinnerConfig');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (err) {
          console.error('Failed to parse spinner configuration', err);
        }
      }
    }
  }, [initialSettings]);

  const canShowSpinner = useCallback((trigger: SpinnerTrigger, currentConfig: SpinnerConfig | null) => {
    if (!currentConfig || !currentConfig.enabled) return false;
    if (currentConfig.trigger !== trigger && trigger !== 'manual') return false;

    if (trigger === 'manual') return true;

    const today = new Date().toLocaleDateString();
    const lastShown = localStorage.getItem('last_spin_shown_date');
    const shownOnce = localStorage.getItem('spinner_shown_once');

    if (currentConfig.frequency === 'once' && shownOnce === 'true') {
      return false;
    }

    if (currentConfig.frequency === 'daily' && lastShown === today) {
      return false;
    }

    return true;
  }, []);

  const triggerSpinner = useCallback((trigger: SpinnerTrigger, delay = 0) => {
    if (canShowSpinner(trigger, config)) {
      const timer = setTimeout(() => {
        setShowLuckySpin(true);
        localStorage.setItem('last_spin_shown_date', new Date().toLocaleDateString());
        localStorage.setItem('spinner_shown_once', 'true');
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [canShowSpinner, config]);

  return {
    showLuckySpin,
    setShowLuckySpin,
    config,
    triggerSpinner
  };
};
