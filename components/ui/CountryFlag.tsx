interface CountryFlagProps {
  emoji: string;
  colors: string[];
  type: 'horizontal' | 'vertical' | 'complex';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CountryFlag({ emoji, colors, type, size = 'md', className = '' }: CountryFlagProps) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  // Toujours afficher l'emoji du drapeau pour un rendu fidèle
  return (
    <span className={`${sizeClasses[size]} ${className}`} role="img" aria-label="flag">
      {emoji}
    </span>
  );
}
