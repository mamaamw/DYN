// Constantes pour les priorités client
export const CLIENT_PRIORITIES = {
  IMMEDIATE: 'immediate',
  HAUTE: 'haute',
  MOYENNE: 'moyenne',
  FAIBLE: 'faible',
} as const;

export type ClientPriority = typeof CLIENT_PRIORITIES[keyof typeof CLIENT_PRIORITIES];

// Constantes pour les statuts de tâches
export const TODO_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  FAILED: 'failed',
  SUCCESS: 'success',
} as const;

export type TodoStatus = typeof TODO_STATUS[keyof typeof TODO_STATUS];

// Constantes pour les niveaux de log
export const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Constantes pour les devises
export const CURRENCIES = {
  BTC: 'BTC',
  EUR: 'EUR',
  USD: 'USD',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BTC: '₿',
  EUR: '€',
  USD: '$',
};

export const CURRENCY_FLAGS: Record<Currency, string> = {
  BTC: '🪙',
  EUR: '🇪🇺',
  USD: '🇺🇸',
};

// Constantes pour les pays (principaux)
export const COUNTRY_FLAGS: Record<string, string> = {
  FR: '🇫🇷',
  BE: '🇧🇪',
  CH: '🇨🇭',
  LU: '🇱🇺',
  CA: '🇨🇦',
  DE: '🇩🇪',
  GB: '🇬🇧',
  US: '🇺🇸',
  ES: '🇪🇸',
  IT: '🇮🇹',
  NL: '🇳🇱',
  PT: '🇵🇹',
  AT: '🇦🇹',
  SE: '🇸🇪',
  NO: '🇳🇴',
  DK: '🇩🇰',
  FI: '🇫🇮',
  IE: '🇮🇪',
  PL: '🇵🇱',
  CZ: '🇨🇿',
  GR: '🇬🇷',
  RU: '🇷🇺',
  TR: '🇹🇷',
  JP: '🇯🇵',
  CN: '🇨🇳',
  KR: '🇰🇷',
  IN: '🇮🇳',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  BR: '🇧🇷',
  AR: '🇦🇷',
  MX: '🇲🇽',
  ZA: '🇿🇦',
  SA: '🇸🇦',
  AE: '🇦🇪',
  IL: '🇮🇱',
  EG: '🇪🇬',
  MA: '🇲🇦',
  TN: '🇹🇳',
  DZ: '🇩🇿',
  SN: '🇸🇳',
  CI: '🇨🇮',
};

// Constantes pour les rôles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Constantes pour les références générales de recherche
export const GENERAL_REFERENCES = [
  'Article',
  'BD',
  'Film',
] as const;

export type GeneralReference = typeof GENERAL_REFERENCES[number];
