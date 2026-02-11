// Configuration Keycloak côté client
export interface KeycloakConfig {
  enabled: boolean;
  url: string;
  realm: string;
  clientId: string;
}

export const getKeycloakConfig = (): KeycloakConfig => {
  return {
    enabled: process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === 'true',
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || '',
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '',
  };
};

export const isKeycloakEnabled = (): boolean => {
  const config = getKeycloakConfig();
  return config.enabled && !!config.url && !!config.realm && !!config.clientId;
};
