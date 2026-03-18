import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  message: string;
  date: string;
}

interface CoinContextType {
  totalCoins: number;
  transactions: Transaction[];
  addCoins: (amount: number, message?: string) => void;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const CoinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const savedCoins = localStorage.getItem('userCoins');
    return savedCoins ? parseInt(savedCoins, 10) : 100;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTx = localStorage.getItem('coinTransactions');
    return savedTx ? JSON.parse(savedTx) : [];
  });

  const addCoins = (amount: number, message: string = 'Received coins') => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: amount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      message,
      date: new Date().toISOString(),
    };

    setTotalCoins((prev) => {
      const newTotal = prev + amount;
      localStorage.setItem('userCoins', newTotal.toString());
      return newTotal;
    });

    setTransactions((prev) => {
      const newTxList = [newTx, ...prev];
      localStorage.setItem('coinTransactions', JSON.stringify(newTxList));
      return newTxList;
    });
  };

  return (
    <CoinContext.Provider value={{ totalCoins, transactions, addCoins }}>
      {children}
    </CoinContext.Provider>
  );
};

export const useCoins = () => {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};
