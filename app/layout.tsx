import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProReview - Collectez des avis Google 5 étoiles automatiquement',
  description: 'ProReview aide les commerçants à collecter des avis Google 5 étoiles automatiquement via SMS et email. Les avis négatifs sont interceptés et traités en privé.',
  keywords: 'avis google, collecte avis, sms marketing, reputation en ligne, avis clients',
  openGraph: {
    title: 'ProReview - Avis Google 5⭐ en automatique',
    description: 'Transformez vos clients satisfaits en ambassadeurs Google',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
