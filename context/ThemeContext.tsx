import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DARK = {
  bg: '#0F0F14',
  bg2: '#1A1A22',
  bg3: '#2A2A38',
  text: '#FFFFFF',
  text2: '#AAAABC',
  text3: '#666680',
  brand: '#FF5C00',
  border: '#2A2A38',
  card: '#1A1A22',
  green: '#2ECC71',
  amber: '#F59E0B',
  red: '#E74C3C',
  inputBg: '#0F0F14',
  shadow: 'rgba(0,0,0,0.4)',
};

export const LIGHT = {
  bg: '#F2F2F7',
  bg2: '#FFFFFF',
  bg3: '#E5E5EA',
  text: '#000000',
  text2: '#3A3A3C',
  text3: '#8E8E93',
  brand: '#FF5C00',
  border: '#C6C6C8',
  card: '#FFFFFF',
  green: '#34C759',
  amber: '#FF9500',
  red: '#FF3B30',
  inputBg: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.1)',
};

export type Theme = typeof DARK;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK,
  isDark: true,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('sw_theme').then(v => {
      if (v === 'light') setIsDark(false);
      else setIsDark(true);
    });
  }, []);

  const toggle = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('sw_theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme: isDark ? DARK : LIGHT, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
