'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, BarChart3, Users, Zap, Shield } from 'lucide-react';

export default function Home() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLogged(!!user);
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: 'Analytiques Avancees',
      description: 'Tableaux de bord complets avec rapports detailles en temps reel',
    },
    {
      icon: Users,
      title: 'Gestion des Contacts',
      description: 'Organisez et gerez tous vos clients et prospects facilement',
    },
    {
      icon: Zap,
      title: 'Automatisation',
      description: 'Automatisez vos workflows et gagnez du temps au quotidien',
    },
    {
      icon: Shield,
      title: 'Securite Premium',
      description: 'Donnees protegees avec chiffrement militaire 256-bit',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '29',
      description: 'Parfait pour les petites equipes',
      features: ['Jusqu a 5 utilisateurs', '10 000 contacts', 'Support email', 'Rapports basiques'],
    },
    {
      name: 'Professional',
      price: '79',
      description: 'Pour les entreprises en croissance',
      features: ['Jusqu a 50 utilisateurs', 'Contacts illimites', 'Support prioritaire', 'Analytiques avancees', 'API access'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Solution personnalisee',
      features: ['Utilisateurs illimites', 'Contacts illimites', 'Support 24/7', 'Integrations custom', 'Dédicated account'],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Gerez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">CRM</span> en toute simplicite
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Plateforme CRM tout-en-un pour gerer vos clients, prospects et projets. Augmentez votre productivite de 40%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLogged ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition"
              >
                Aller au Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  Se connecter <ArrowRight size={20} />
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-lg transition"
                >
                  S inscrire gratuitement
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-400">10K+</p>
              <p className="text-slate-400">Utilisateurs actifs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">99.9%</p>
              <p className="text-slate-400">Uptime garantis</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-400">24/7</p>
              <p className="text-slate-400">Support client</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Fonctionnalites principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-white/40 transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Tarification simple et transparente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 transition ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 border border-transparent scale-105'
                  : 'bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40'
              }`}
            >
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-300 text-sm mb-4">{plan.description}</p>
              <div className="mb-6">
                {typeof plan.price === 'string' && !isNaN(Number(plan.price)) ? (
                  <>
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-300 text-sm">/mois</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                )}
              </div>
              <button
                className={`w-full py-2 rounded-lg font-semibold mb-6 transition ${
                  plan.popular
                    ? 'bg-white text-blue-600 hover:bg-slate-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Commencer
              </button>
              <ul className="space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className={`flex items-center gap-2 ${plan.popular ? 'text-white' : 'text-slate-300'}`}>
                    <Check size={18} className="text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Pret a transformer votre CRM?</h2>
        <p className="text-xl text-slate-300 mb-8">
          Rejoignez des milliers d entreprises qui font confiance a DYN
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-12 rounded-lg transition"
        >
          Commencer gratuitement
        </Link>
      </section>
    </div>
  );
}
