'use client';

import { useEffect, useState, useCallback } from 'react';
import Keycloak from 'keycloak-js';
import { getKeycloakConfig, isKeycloakEnabled } from './keycloak-config';

let keycloakInstance: Keycloak | null = null;

export function useKeycloak() {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enabled = isKeycloakEnabled();
    setEnabled(enabled);

    if (!enabled) {
      setLoading(false);
      return;
    }

    const config = getKeycloakConfig();
    if (!config) {
      setLoading(false);
      return;
    }

    // Initialize Keycloak only once
    if (!keycloakInstance) {
      keycloakInstance = new Keycloak({
        url: config.url,
        realm: config.realm,
        clientId: config.clientId,
      });

      keycloakInstance
        .init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
        })
        .then((auth) => {
          setKeycloak(keycloakInstance);
          setAuthenticated(auth);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Keycloak initialization failed:', error);
          setLoading(false);
        });
    } else {
      setKeycloak(keycloakInstance);
      setAuthenticated(keycloakInstance.authenticated || false);
      setLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    if (!keycloak) return;

    try {
      await keycloak.login({
        redirectUri: window.location.origin + '/dashboard',
      });
    } catch (error) {
      console.error('Keycloak login failed:', error);
    }
  }, [keycloak]);

  const logout = useCallback(async () => {
    if (!keycloak) return;

    try {
      await keycloak.logout({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Keycloak logout failed:', error);
    }
  }, [keycloak]);

  const authenticateWithBackend = useCallback(async () => {
    if (!keycloak || !authenticated) return null;

    try {
      const response = await fetch('/api/auth/keycloak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: keycloak.token,
          idToken: keycloak.idToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      return null;
    }
  }, [keycloak, authenticated]);

  return {
    keycloak,
    authenticated,
    loading,
    enabled,
    login,
    logout,
    authenticateWithBackend,
  };
}
