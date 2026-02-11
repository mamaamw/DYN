export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  flagColors: string[];
  flagType: 'horizontal' | 'vertical' | 'complex';
}

export const countries: Country[] = [
  // Europe
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', flagColors: ['#002395', '#FFFFFF', '#ED2939'], flagType: 'vertical' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', dialCode: '+32', flagColors: ['#000000', '#FFD100', '#EF3340'], flagType: 'vertical' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', dialCode: '+41', flagColors: ['#FF0000', '#FFFFFF'], flagType: 'complex' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352', flagColors: ['#ED2939', '#FFFFFF', '#00A2E1'], flagType: 'horizontal' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49', flagColors: ['#000000', '#DD0000', '#FFCE00'], flagType: 'horizontal' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44', flagColors: ['#012169', '#FFFFFF', '#C8102E'], flagType: 'complex' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸', dialCode: '+34', flagColors: ['#AA151B', '#F1BF00', '#AA151B'], flagType: 'horizontal' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹', dialCode: '+39', flagColors: ['#009246', '#FFFFFF', '#CE2B37'], flagType: 'vertical' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', dialCode: '+31', flagColors: ['#AE1C28', '#FFFFFF', '#21468B'], flagType: 'horizontal' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', flagColors: ['#006600', '#FF0000'], flagType: 'vertical' },
  { code: 'AT', name: 'Autriche', flag: '🇦🇹', dialCode: '+43', flagColors: ['#ED2939', '#FFFFFF', '#ED2939'], flagType: 'horizontal' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪', dialCode: '+46', flagColors: ['#006AA7', '#FECC00'], flagType: 'complex' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴', dialCode: '+47', flagColors: ['#BA0C2F', '#FFFFFF', '#00205B'], flagType: 'complex' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰', dialCode: '+45', flagColors: ['#C8102E', '#FFFFFF'], flagType: 'complex' },
  { code: 'FI', name: 'Finlande', flag: '🇫🇮', dialCode: '+358', flagColors: ['#FFFFFF', '#003580'], flagType: 'complex' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪', dialCode: '+353', flagColors: ['#169B62', '#FFFFFF', '#FF883E'], flagType: 'vertical' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱', dialCode: '+48', flagColors: ['#FFFFFF', '#DC143C'], flagType: 'horizontal' },
  { code: 'CZ', name: 'République tchèque', flag: '🇨🇿', dialCode: '+420', flagColors: ['#FFFFFF', '#D7141A', '#11457E'], flagType: 'complex' },
  { code: 'GR', name: 'Grèce', flag: '🇬🇷', dialCode: '+30', flagColors: ['#0D5EAF', '#FFFFFF'], flagType: 'complex' },
  { code: 'RO', name: 'Roumanie', flag: '🇷🇴', dialCode: '+40', flagColors: ['#002B7F', '#FCD116', '#CE1126'], flagType: 'vertical' },
  { code: 'HU', name: 'Hongrie', flag: '🇭🇺', dialCode: '+36', flagColors: ['#CD2A3E', '#FFFFFF', '#436F4D'], flagType: 'horizontal' },
  { code: 'BG', name: 'Bulgarie', flag: '🇧🇬', dialCode: '+359', flagColors: ['#FFFFFF', '#00966E', '#D62612'], flagType: 'horizontal' },
  { code: 'HR', name: 'Croatie', flag: '🇭🇷', dialCode: '+385', flagColors: ['#FF0000', '#FFFFFF', '#171796'], flagType: 'horizontal' },
  { code: 'SK', name: 'Slovaquie', flag: '🇸🇰', dialCode: '+421', flagColors: ['#FFFFFF', '#0B4EA2', '#EE1C25'], flagType: 'horizontal' },
  { code: 'SI', name: 'Slovénie', flag: '🇸🇮', dialCode: '+386', flagColors: ['#FFFFFF', '#005DA4', '#ED1C24'], flagType: 'horizontal' },
  { code: 'EE', name: 'Estonie', flag: '🇪🇪', dialCode: '+372', flagColors: ['#0072CE', '#000000', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'LV', name: 'Lettonie', flag: '🇱🇻', dialCode: '+371', flagColors: ['#9E3039', '#FFFFFF', '#9E3039'], flagType: 'horizontal' },
  { code: 'LT', name: 'Lituanie', flag: '🇱🇹', dialCode: '+370', flagColors: ['#FDB913', '#006A44', '#C1272D'], flagType: 'horizontal' },
  { code: 'IS', name: 'Islande', flag: '🇮🇸', dialCode: '+354', flagColors: ['#02529C', '#FFFFFF', '#DC1E35'], flagType: 'complex' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377', flagColors: ['#CE1126', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'AD', name: 'Andorre', flag: '🇦🇩', dialCode: '+376', flagColors: ['#0018A8', '#FEDF00', '#D50032'], flagType: 'vertical' },
  { code: 'MT', name: 'Malte', flag: '🇲🇹', dialCode: '+356', flagColors: ['#FFFFFF', '#CF142B'], flagType: 'vertical' },
  { code: 'CY', name: 'Chypre', flag: '🇨🇾', dialCode: '+357', flagColors: ['#FFFFFF', '#D57800'], flagType: 'complex' },
  { code: 'AL', name: 'Albanie', flag: '🇦🇱', dialCode: '+355', flagColors: ['#E41E20'], flagType: 'horizontal' },
  { code: 'BA', name: 'Bosnie-Herzégovine', flag: '🇧🇦', dialCode: '+387', flagColors: ['#002395', '#FECB00'], flagType: 'complex' },
  { code: 'RS', name: 'Serbie', flag: '🇷🇸', dialCode: '+381', flagColors: ['#C6363C', '#0C4076', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'ME', name: 'Monténégro', flag: '🇲🇪', dialCode: '+382', flagColors: ['#C40308', '#D4AF37'], flagType: 'complex' },
  { code: 'MK', name: 'Macédoine du Nord', flag: '🇲🇰', dialCode: '+389', flagColors: ['#D20000', '#FFE600'], flagType: 'complex' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', flagColors: ['#005BBB', '#FFD500'], flagType: 'horizontal' },
  { code: 'BY', name: 'Biélorussie', flag: '🇧🇾', dialCode: '+375', flagColors: ['#CE1720', '#007C30'], flagType: 'horizontal' },
  { code: 'MD', name: 'Moldavie', flag: '🇲🇩', dialCode: '+373', flagColors: ['#003DA5', '#FFD200', '#CC092F'], flagType: 'vertical' },
  
  // Amérique du Nord
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1', flagColors: ['#B22234', '#FFFFFF', '#3C3B6E'], flagType: 'complex' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', flagColors: ['#FF0000', '#FFFFFF', '#FF0000'], flagType: 'vertical' },
  { code: 'MX', name: 'Mexique', flag: '🇲🇽', dialCode: '+52', flagColors: ['#006847', '#FFFFFF', '#CE1126'], flagType: 'vertical' },
  
  // Amérique du Sud et Centrale
  { code: 'BR', name: 'Brésil', flag: '🇧🇷', dialCode: '+55', flagColors: ['#009B3A', '#FEDF00', '#002776'], flagType: 'complex' },
  { code: 'AR', name: 'Argentine', flag: '🇦🇷', dialCode: '+54', flagColors: ['#74ACDF', '#FFFFFF', '#74ACDF'], flagType: 'horizontal' },
  { code: 'CL', name: 'Chili', flag: '🇨🇱', dialCode: '+56', flagColors: ['#FFFFFF', '#D52B1E', '#0039A6'], flagType: 'complex' },
  { code: 'CO', name: 'Colombie', flag: '🇨🇴', dialCode: '+57', flagColors: ['#FCD116', '#003893', '#CE1126'], flagType: 'horizontal' },
  { code: 'PE', name: 'Pérou', flag: '🇵🇪', dialCode: '+51', flagColors: ['#D91023', '#FFFFFF', '#D91023'], flagType: 'vertical' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', flagColors: ['#FFD200', '#00247D', '#CF142B'], flagType: 'horizontal' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', flagColors: ['#FFFFFF', '#0038A8'], flagType: 'horizontal' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595', flagColors: ['#D52B1E', '#FFFFFF', '#0038A8'], flagType: 'horizontal' },
  { code: 'EC', name: 'Équateur', flag: '🇪🇨', dialCode: '+593', flagColors: ['#FFD100', '#034EA2', '#ED1C24'], flagType: 'horizontal' },
  { code: 'BO', name: 'Bolivie', flag: '🇧🇴', dialCode: '+591', flagColors: ['#D52B1E', '#F9E300', '#007934'], flagType: 'horizontal' },
  
  // Asie
  { code: 'JP', name: 'Japon', flag: '🇯🇵', dialCode: '+81', flagColors: ['#FFFFFF', '#BC002D'], flagType: 'complex' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳', dialCode: '+86', flagColors: ['#DE2910', '#FFDE00'], flagType: 'complex' },
  { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷', dialCode: '+82', flagColors: ['#FFFFFF', '#C60C30', '#003478'], flagType: 'complex' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳', dialCode: '+91', flagColors: ['#FF9933', '#FFFFFF', '#138808'], flagType: 'horizontal' },
  { code: 'TH', name: 'Thaïlande', flag: '🇹🇭', dialCode: '+66', flagColors: ['#ED1C24', '#FFFFFF', '#241D4F'], flagType: 'horizontal' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', flagColors: ['#DA251D', '#FFCD00'], flagType: 'complex' },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬', dialCode: '+65', flagColors: ['#ED2939', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'MY', name: 'Malaisie', flag: '🇲🇾', dialCode: '+60', flagColors: ['#FFFFFF', '#CC0001', '#010066', '#FFCC00'], flagType: 'complex' },
  { code: 'ID', name: 'Indonésie', flag: '🇮🇩', dialCode: '+62', flagColors: ['#FF0000', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', flagColors: ['#0038A8', '#CE1126', '#FCD116', '#FFFFFF'], flagType: 'complex' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', flagColors: ['#01411C', '#FFFFFF'], flagType: 'complex' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', flagColors: ['#006A4E', '#F42A41'], flagType: 'complex' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94', flagColors: ['#8B0000', '#FFA500', '#008000', '#FFCC00'], flagType: 'complex' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95', flagColors: ['#FECB00', '#34B233', '#EA2839', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'KH', name: 'Cambodge', flag: '🇰🇭', dialCode: '+855', flagColors: ['#032EA1', '#E00025', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856', flagColors: ['#CE1126', '#002868', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', flagColors: ['#DE2910', '#FFFFFF'], flagType: 'complex' },
  { code: 'TW', name: 'Taïwan', flag: '🇹🇼', dialCode: '+886', flagColors: ['#FE0000', '#000095', '#FFFFFF'], flagType: 'complex' },
  { code: 'KP', name: 'Corée du Nord', flag: '🇰🇵', dialCode: '+850', flagColors: ['#024FA2', '#ED1C27', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'MN', name: 'Mongolie', flag: '🇲🇳', dialCode: '+976', flagColors: ['#C4272F', '#015197', '#FDCF35'], flagType: 'vertical' },
  { code: 'NP', name: 'Népal', flag: '🇳🇵', dialCode: '+977', flagColors: ['#DC143C', '#003893', '#FFFFFF'], flagType: 'complex' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93', flagColors: ['#000000', '#D32011', '#007A36'], flagType: 'vertical' },
  
  // Moyen-Orient
  { code: 'TR', name: 'Turquie', flag: '🇹🇷', dialCode: '+90', flagColors: ['#E30A17', '#FFFFFF'], flagType: 'complex' },
  { code: 'SA', name: 'Arabie saoudite', flag: '🇸🇦', dialCode: '+966', flagColors: ['#165B33', '#FFFFFF'], flagType: 'complex' },
  { code: 'AE', name: 'Émirats arabes unis', flag: '🇦🇪', dialCode: '+971', flagColors: ['#00732F', '#FFFFFF', '#000000', '#FF0000'], flagType: 'horizontal' },
  { code: 'IL', name: 'Israël', flag: '🇮🇱', dialCode: '+972', flagColors: ['#FFFFFF', '#0038B8'], flagType: 'complex' },
  { code: 'IQ', name: 'Irak', flag: '🇮🇶', dialCode: '+964', flagColors: ['#CE1126', '#FFFFFF', '#007A3D'], flagType: 'horizontal' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98', flagColors: ['#239F40', '#FFFFFF', '#DA0000'], flagType: 'horizontal' },
  { code: 'JO', name: 'Jordanie', flag: '🇯🇴', dialCode: '+962', flagColors: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], flagType: 'horizontal' },
  { code: 'LB', name: 'Liban', flag: '🇱🇧', dialCode: '+961', flagColors: ['#ED1C24', '#FFFFFF', '#00A651'], flagType: 'horizontal' },
  { code: 'SY', name: 'Syrie', flag: '🇸🇾', dialCode: '+963', flagColors: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'], flagType: 'horizontal' },
  { code: 'YE', name: 'Yémen', flag: '🇾🇪', dialCode: '+967', flagColors: ['#CE1126', '#FFFFFF', '#000000'], flagType: 'horizontal' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968', flagColors: ['#FFFFFF', '#ED1C24', '#008000'], flagType: 'horizontal' },
  { code: 'KW', name: 'Koweït', flag: '🇰🇼', dialCode: '+965', flagColors: ['#007A3D', '#FFFFFF', '#CE1126', '#000000'], flagType: 'horizontal' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974', flagColors: ['#8D1B3D', '#FFFFFF'], flagType: 'complex' },
  { code: 'BH', name: 'Bahreïn', flag: '🇧🇭', dialCode: '+973', flagColors: ['#CE1126', '#FFFFFF'], flagType: 'complex' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', dialCode: '+970', flagColors: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], flagType: 'horizontal' },
  
  // Afrique
  { code: 'EG', name: 'Égypte', flag: '🇪🇬', dialCode: '+20', flagColors: ['#CE1126', '#FFFFFF', '#000000'], flagType: 'horizontal' },
  { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', dialCode: '+27', flagColors: ['#007A4D', '#FFFFFF', '#DE3831', '#002395', '#FFB612', '#000000'], flagType: 'complex' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212', flagColors: ['#C1272D', '#006233'], flagType: 'complex' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216', flagColors: ['#E70013', '#FFFFFF'], flagType: 'complex' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213', flagColors: ['#006233', '#FFFFFF', '#D21034'], flagType: 'vertical' },
  { code: 'LY', name: 'Libye', flag: '🇱🇾', dialCode: '+218', flagColors: ['#E70013', '#000000', '#239E46', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221', flagColors: ['#00853F', '#FDEF42', '#E31B23'], flagType: 'vertical' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225', flagColors: ['#F77F00', '#FFFFFF', '#009E60'], flagType: 'vertical' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', flagColors: ['#008751', '#FFFFFF'], flagType: 'vertical' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', flagColors: ['#000000', '#BB0000', '#006600', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', flagColors: ['#CE1126', '#FCD116', '#006B3F', '#000000'], flagType: 'horizontal' },
  { code: 'ET', name: 'Éthiopie', flag: '🇪🇹', dialCode: '+251', flagColors: ['#078930', '#FCDD09', '#DA121A', '#0F47AF'], flagType: 'horizontal' },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', dialCode: '+255', flagColors: ['#1EB53A', '#000000', '#FCD116', '#00A3DD'], flagType: 'complex' },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬', dialCode: '+256', flagColors: ['#000000', '#FCDC04', '#D90000', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237', flagColors: ['#007A5E', '#CE1126', '#FCD116'], flagType: 'vertical' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250', flagColors: ['#00A1DE', '#FAD201', '#20603D'], flagType: 'horizontal' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244', flagColors: ['#CE1126', '#000000', '#FFCC00'], flagType: 'horizontal' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258', flagColors: ['#007168', '#000000', '#FCD116', '#FFFFFF', '#E01E26'], flagType: 'horizontal' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263', flagColors: ['#319E48', '#FFD200', '#DE2010', '#000000', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267', flagColors: ['#75AADB', '#000000', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'NA', name: 'Namibie', flag: '🇳🇦', dialCode: '+264', flagColors: ['#003580', '#FFFFFF', '#009543', '#C8102E', '#FFD100'], flagType: 'complex' },
  { code: 'MU', name: 'Maurice', flag: '🇲🇺', dialCode: '+230', flagColors: ['#EA2839', '#1A206D', '#FFD500', '#00A651'], flagType: 'horizontal' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261', flagColors: ['#FFFFFF', '#FC3D32', '#007E3A'], flagType: 'vertical' },
  { code: 'SD', name: 'Soudan', flag: '🇸🇩', dialCode: '+249', flagColors: ['#D21034', '#FFFFFF', '#000000', '#007229'], flagType: 'horizontal' },
  { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸', dialCode: '+211', flagColors: ['#000000', '#FFFFFF', '#DA121A', '#0F47AF', '#078930', '#FCDD09'], flagType: 'horizontal' },
  
  // Océanie
  { code: 'AU', name: 'Australie', flag: '🇦🇺', dialCode: '+61', flagColors: ['#012169', '#FFFFFF', '#E4002B'], flagType: 'complex' },
  { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿', dialCode: '+64', flagColors: ['#00247D', '#FFFFFF', '#CC142B'], flagType: 'complex' },
  { code: 'FJ', name: 'Fidji', flag: '🇫🇯', dialCode: '+679', flagColors: ['#68BFE5', '#FFFFFF', '#CE1126', '#012169'], flagType: 'complex' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬', dialCode: '+675', flagColors: ['#CE1126', '#000000', '#FCD116', '#FFFFFF'], flagType: 'complex' },
  
  // Russie et CEI
  { code: 'RU', name: 'Russie', flag: '🇷🇺', dialCode: '+7', flagColors: ['#FFFFFF', '#0039A6', '#D52B1E'], flagType: 'horizontal' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7', flagColors: ['#00AFCA', '#FEC50C'], flagType: 'complex' },
  { code: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿', dialCode: '+998', flagColors: ['#1EB53A', '#FFFFFF', '#CE1126', '#0099B5'], flagType: 'horizontal' },
  { code: 'TM', name: 'Turkménistan', flag: '🇹🇲', dialCode: '+993', flagColors: ['#00843D', '#FFFFFF', '#D22730'], flagType: 'complex' },
  { code: 'TJ', name: 'Tadjikistan', flag: '🇹🇯', dialCode: '+992', flagColors: ['#CC0000', '#FFFFFF', '#006600', '#F8C300'], flagType: 'horizontal' },
  { code: 'KG', name: 'Kirghizistan', flag: '🇰🇬', dialCode: '+996', flagColors: ['#E8112D', '#FFEF00'], flagType: 'complex' },
  { code: 'AM', name: 'Arménie', flag: '🇦🇲', dialCode: '+374', flagColors: ['#D90012', '#0033A0', '#F2A800'], flagType: 'horizontal' },
  { code: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿', dialCode: '+994', flagColors: ['#00B5E2', '#E30A17', '#00AF66', '#FFFFFF'], flagType: 'horizontal' },
  { code: 'GE', name: 'Géorgie', flag: '🇬🇪', dialCode: '+995', flagColors: ['#FFFFFF', '#FF0000'], flagType: 'complex' },
];

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find(c => c.dialCode === dialCode);
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

export function formatPhoneNumber(dialCode: string, number: string): string {
  return `${dialCode} ${number}`;
}

export function parsePhoneNumber(fullNumber: string): { dialCode: string; number: string } | null {
  const match = fullNumber.match(/^(\+\d+)\s*(.+)$/);
  if (match) {
    return {
      dialCode: match[1],
      number: match[2]
    };
  }
  return null;
}
