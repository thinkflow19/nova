'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type BrandColorContextType = {
  brandColor: string;
  setBrandColor: (color: string) => void;
};

const defaultColor = '#6366f1'; // Default indigo color

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: defaultColor,
  setBrandColor: () => {},
});

export const useBrandColor = () => useContext(BrandColorContext);

export const BrandColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandColor, setBrandColor] = useState(defaultColor);

  // Persist brand color in localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('brandColor');
    if (savedColor) {
      setBrandColor(savedColor);
    }
  }, []);

  const updateBrandColor = (color: string) => {
    setBrandColor(color);
    localStorage.setItem('brandColor', color);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--primary', color);
    
    // Calculate a slightly darker version for hover states
    const darkerColor = calculateDarkerColor(color);
    document.documentElement.style.setProperty('--primary-dark', darkerColor);
  };

  // Helper function to calculate a darker version of a color
  const calculateDarkerColor = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken by 15%
    const darkenFactor = 0.85;
    const newR = Math.floor(r * darkenFactor);
    const newG = Math.floor(g * darkenFactor);
    const newB = Math.floor(b * darkenFactor);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  return (
    <BrandColorContext.Provider value={{ brandColor, setBrandColor: updateBrandColor }}>
      {children}
    </BrandColorContext.Provider>
  );
}; 