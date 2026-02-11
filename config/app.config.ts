// Configuration de l'application
export const config = {
  app: {
    name: 'DYN',
    version: '0.1.0',
    description: 'Plateforme complete de gestion CRM',
  },
  
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
  },
  
  auth: {
    tokenKey: 'auth_token',
    userKey: 'user',
    sessionDuration: 24 * 60 * 60 * 1000, // 24 heures en ms
  },
  
  storage: {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },
  
  toast: {
    duration: 3000,
    position: 'top-right' as const,
  },
} as const;
