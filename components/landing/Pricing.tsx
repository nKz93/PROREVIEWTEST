"use client"
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Parfait pour démarrer',
    features: ['100 SMS/mois', '1 établissement', 'QR codes', 'Dashboard analytics', 'Import CSV', 'Support email'],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Pro',
    price: 59,
    description: 'Le plus populaire',
    features: ['500 SMS/mois', '3 établissements', 'QR codes personnalisés', 'Campagnes groupées', 'Analytics avancés', 'Support prioritaire', 'Export des données'],
    cta: 'Choisir Pro',
    popular: true,
  },
  {
    name: 'Business',
    price: 99,
    description: 'Pour les grandes enseignes',
    features: ['2000 SMS/mois', 'Établissements illimités', 'API complète', 'Account manager dédié', 'Onboarding personnalisé', 'SLA 99.9%', 'Facturation personnalisée'],
    cta: 'Nous contacter',
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4 bg-gray-50">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Des tarifs <span className="gradient-text">simples et transparents</span>
          </h2>
          <p className="text-lg text-gray-500">Sans engagement. Annulez quand vous voulez.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={plan.popular ? 'md:-mt-4 md:scale-105' : ''}
            >
              <Card className={`relative overflow-hidden ${plan.popular ? 'border-2 border-blue-500 shadow-2xl' : 'shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.popular && <Badge variant="gradient">Populaire</Badge>}
                  </div>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
                    <span className="text-gray-400">/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? 'gradient' : 'outline'}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link href="/auth/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
