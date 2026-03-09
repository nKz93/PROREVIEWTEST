"use client"
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="gradient-text">ProReview</span>
          </Link>

          {/* Liens desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Tarifs
            </a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              FAQ
            </a>
          </div>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/auth/register">Essai gratuit</Link>
            </Button>
          </div>

          {/* Menu mobile */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu mobile ouvert */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 space-y-2"
          >
            <a href="#features" className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Fonctionnalités</a>
            <a href="#pricing" className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">Tarifs</a>
            <a href="#faq" className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">FAQ</a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/auth/login">Connexion</Link>
              </Button>
              <Button variant="gradient" className="flex-1" asChild>
                <Link href="/auth/register">Essai gratuit</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
