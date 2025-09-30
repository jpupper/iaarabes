import { writable } from 'svelte/store';

// Definir los temas disponibles
export const themes = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#000000',
      primary: '#1f2937',
      secondary: '#f8fafc',
      accent: '#4076f6',
      error: '#ef4444',
      success: '#4ade80',
      textPrimary: '#f8fafc',
      textSecondary: '#d1d5db',
      border: '#4b5563',
      hover: '#2563eb',
      disabled: '#6b7280',
      backgroundLight: '#374151',
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: '#f8fafc',
      primary: '#ffffff',
      secondary: '#1f2937',
      accent: '#2563eb',
      error: '#ef4444',
      success: '#22c55e',
      textPrimary: '#1f2937',
      textSecondary: '#4b5563',
      border: '#e5e7eb',
      hover: '#3b82f6',
      disabled: '#d1d5db',
      backgroundLight: '#f1f5f9',
    }
  }
};

// Tipo para los temas
export type ThemeType = keyof typeof themes;

// Store para el tema actual
export const currentTheme = writable<ThemeType>('dark');

// Función para cambiar el tema
export function setTheme(theme: ThemeType) {
  currentTheme.set(theme);
  
  // Aplicar variables CSS
  const root = document.documentElement;
  const colors = themes[theme].colors;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Guardar preferencia en localStorage
  localStorage.setItem('theme', theme);
}

// Función para inicializar el tema
export function initTheme() {
  // Obtener tema guardado o usar preferencia del sistema
  const savedTheme = localStorage.getItem('theme') as ThemeType;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  setTheme(initialTheme);
}
