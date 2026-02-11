'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { useKeycloak } from '@/lib/useKeycloak';

export default function LoginPage() {
  const router = useRouter();
  const { enabled: keycloakEnabled, authenticated, login: keycloakLogin, authenticateWithBackend, loading: keycloakLoading } = useKeycloak();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Keycloak authentication if user is authenticated
  useEffect(() => {
    if (authenticated && keycloakEnabled) {
      handleKeycloakAuth();
    }
  }, [authenticated, keycloakEnabled]);

  const handleKeycloakAuth = async () => {
    try {
      const data = await authenticateWithBackend();
      if (data && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('userChanged'));
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Keycloak authentication error:', error);
      setError('Erreur lors de l\'authentification Keycloak');
    }
  };

  const handleKeycloakLogin = async () => {
    setError('');
    await keycloakLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      // Store user info in localStorage for quick access
      localStorage.setItem('user', JSON.stringify(data.user));

      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new Event('userChanged'));

      // Le cookie est maintenant defini par le serveur (HttpOnly)
      // Rediriger vers le dashboard
      router.push('/dashboard');
      // On garde loading=true pendant la redirection
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion au serveur');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
              <div className="w-10 h-10 bg-blue-400 rounded-full -ml-4"></div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Connexion</h1>
            <p className="text-slate-600">Bienvenue sur DYN</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
                  placeholder="votre_nom_utilisateur"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
                  placeholder="........"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                Mot de passe oublie ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Keycloak SSO Option */}
          {keycloakEnabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OU</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleKeycloakLogin}
                disabled={keycloakLoading || loading}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5 0L9.93 1.82L12.75 5.5L11.18 7.32L8.36 3.64L6.79 5.45L9.61 9.14L8.04 10.95L5.21 7.27L3.64 9.09L6.46 12.77L4.89 14.59L2.07 10.91L0.5 12.73L3.32 16.41L1.75 18.23L4.57 21.91L6.14 20.09L3.32 16.41L4.89 14.59L7.71 18.27L9.29 16.45L6.46 12.77L8.04 10.95L10.86 14.64L12.43 12.82L9.61 9.14L11.18 7.32L14 11L15.57 9.18L12.75 5.5L14.32 3.68L17.14 7.36L18.71 5.55L15.89 1.86L17.46 0.05L20.29 3.73L21.86 1.91L19.04 -1.77L20.61 -3.59L23.43 0.09L25 -1.73L22.18 -5.41L23.75 -7.23L20.93 -10.91L19.36 -9.09L22.18 -5.41L20.61 -3.59L17.79 -7.27L16.21 -5.45L19.04 -1.77L17.46 0.05L14.64 -3.64L13.07 -1.82L15.89 1.86L14.32 3.68L11.5 0Z"/>
                </svg>
                {keycloakLoading ? 'Chargement...' : 'Se connecter avec Keycloak'}
              </button>
            </>
          )}

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Creer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
