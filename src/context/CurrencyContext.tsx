import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CurrencyCode,
  CURRENCY_CONFIGS,
  convertUsdToCurrency,
  convertCurrencyToUsd,
  formatCurrencyValue,
} from '../utils/currencyPppEngine';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  isPppMode: boolean;
  setIsPppMode: (enabled: boolean) => void;
  currencySymbol: string;
  rateToUsd: number;
  formatAmount: (amountUsd: number, compact?: boolean) => string;
  toLocal: (amountUsd: number) => number;
  toUsd: (amountLocal: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('talent_radar_currency');
      if (saved && saved in CURRENCY_CONFIGS) {
        return saved as CurrencyCode;
      }
    } catch (_) {}
    return 'USD';
  });

  const [isPppMode, setIsPppModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('talent_radar_ppp_mode') === 'true';
    } catch (_) {}
    return false;
  });

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem('talent_radar_currency', code);
    } catch (_) {}
  };

  const setIsPppMode = (enabled: boolean) => {
    setIsPppModeState(enabled);
    try {
      localStorage.setItem('talent_radar_ppp_mode', enabled ? 'true' : 'false');
    } catch (_) {}
  };

  const activeConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;

  const toLocal = (amountUsd: number) => convertUsdToCurrency(amountUsd, currency);
  const toUsd = (amountLocal: number) => convertCurrencyToUsd(amountLocal, currency);

  const formatAmount = (amountUsd: number, compact: boolean = false) => {
    const localVal = toLocal(amountUsd);
    return formatCurrencyValue(localVal, currency, compact);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        isPppMode,
        setIsPppMode,
        currencySymbol: activeConfig.symbol,
        rateToUsd: activeConfig.rateToUsd,
        formatAmount,
        toLocal,
        toUsd,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
