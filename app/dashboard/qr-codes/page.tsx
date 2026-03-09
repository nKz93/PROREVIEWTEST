"use client"
import { useUser } from '@/hooks/useUser'
import { QRCodeGenerator } from '@/components/dashboard/QRCodeGenerator'
import { Loader2, QrCode } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/constants'

export default function QRCodesPage() {
  const { business, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const hasQRAccess = business && PLAN_LIMITS[business.plan]?.hasQRCodes

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
        <p className="text-gray-500 mt-1">Générez des QR codes à afficher dans votre établissement</p>
      </div>

      {!business ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Chargement...</p>
        </div>
      ) : !hasQRAccess ? (
        <div className="text-center py-16">
          <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">QR Codes</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Les QR codes sont disponibles à partir du plan <strong>Pro</strong>.
            Affichez-les en caisse pour collecter des avis sans effort.
          </p>
          <a
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Passer au plan Pro →
          </a>
        </div>
      ) : (
        <QRCodeGenerator business={business} />
      )}
    </div>
  )
}
