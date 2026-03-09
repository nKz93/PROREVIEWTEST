import Link from 'next/link'
import { Star, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo + description */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              ProReview
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              La solution #1 pour collecter des avis Google 5 étoiles automatiquement.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-white font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Essai gratuit</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Ressources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2024 ProReview. Tous droits réservés.</p>
          <p className="text-sm">Fait avec ❤️ en France 🇫🇷</p>
        </div>
      </div>
    </footer>
  )
}
