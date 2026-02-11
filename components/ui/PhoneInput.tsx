'use client';

import { useMemo } from 'react';
import { countries, Country } from '@/lib/countries';
import { CountryFlag } from './CountryFlag';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = '+33 6 12 34 56 78',
  className = '',
  error = false
}: PhoneInputProps) {
  // Détecter le pays à partir du préfixe
  const detectedCountry = useMemo<Country | null>(() => {
    if (!value || !value.startsWith('+')) {
      return null;
    }

    // Trier les pays par longueur de préfixe (du plus long au plus court)
    // pour éviter les conflits (ex: +1 vs +12, +3 vs +33)
    const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
    
    // Chercher le pays dont le préfixe correspond
    for (const country of sortedCountries) {
      if (value.startsWith(country.dialCode + ' ') || value === country.dialCode) {
        return country;
      }
    }
    
    // Si aucune correspondance exacte, chercher une correspondance partielle
    // (pour afficher le pays pendant que l'utilisateur tape)
    const partialMatch = sortedCountries.find(country => 
      country.dialCode.startsWith(value.trim()) || value.trim().startsWith(country.dialCode.substring(0, Math.min(value.trim().length, country.dialCode.length)))
    );
    
    if (partialMatch && value.startsWith(partialMatch.dialCode.substring(0, value.trim().length))) {
      return partialMatch;
    }

    return null;
  }, [value]);

  return (
    <div className={`${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error 
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500' 
            : 'border-gray-300 dark:border-[#1b2436] focus:ring-blue-500'
        } dark:bg-transparent dark:text-white`}
      />
      
      {/* Affichage du pays détecté */}
      {detectedCountry && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <CountryFlag 
            emoji={detectedCountry.flag}
            colors={detectedCountry.flagColors}
            type={detectedCountry.flagType}
            size="md"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{detectedCountry.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{detectedCountry.dialCode}</p>
          </div>
        </div>
      )}
    </div>
  );
}
