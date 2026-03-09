import Link from 'next/link'
import { Star, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Star className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page introuvable</h2>
        <p className="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <Button variant="gradient" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  )
}
