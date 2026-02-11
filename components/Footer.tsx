'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950/50 border-t border-white/10 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-white font-bold text-lg">DYN</span>
            </div>
            <p className="text-slate-400 text-sm">
              Plateforme de gestion CRM complète et intuitive pour votre entreprise.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produit</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Tarification
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Sécurité
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Carrières
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Partenaires
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:contact@dyn.com" className="hover:text-white transition">
                  contact@dyn.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+33123456789" className="hover:text-white transition">
                  +33 1 23 45 67 89
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>123 Rue de Paris<br />75000 Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-8"></div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © {currentYear} DYN CRM. Tous droits réservés.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="#" className="hover:text-white transition">
              Confidentialité
            </Link>
            <Link href="#" className="hover:text-white transition">
              Conditions d&apos;utilisation
            </Link>
            <Link href="#" className="hover:text-white transition">
              Cookies
            </Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition">
              <Facebook size={18} />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              <Linkedin size={18} />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              <Github size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
