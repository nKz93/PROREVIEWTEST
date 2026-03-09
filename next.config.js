/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Empêche l'inclusion dans une iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le MIME-sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS (HSTS) — 1 an
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy — désactiver les APIs non nécessaires
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval requis par Next.js dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      // Appliquer les headers de sécurité à toutes les routes
      source: '/(.*)',
      headers: securityHeaders,
    },
    {
      // CORS pour l'API publique v1 — accepter n'importe quelle origine (API tierce)
      source: '/api/v1/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
        { key: 'Access-Control-Max-Age', value: '86400' },
      ],
    },
    {
      // Widget public — peut être iframé depuis n'importe quel site
      source: '/w/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: "frame-ancestors *" },
      ],
    },
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ['twilio'],
  },
}

module.exports = nextConfig
