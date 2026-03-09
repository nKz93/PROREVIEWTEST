"use client"
import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    q: 'Comment fonctionne le filtre des avis négatifs ?',
    a: 'Lorsqu\'un client clique sur le lien reçu par SMS, il doit d\'abord noter son expérience de 1 à 5 étoiles. Si la note est de 4 ou 5, il est redirigé vers Google pour laisser son avis. Si la note est de 1, 2 ou 3, il est redirigé vers un formulaire privé que seul vous pouvez voir. Légalement, vous ne pouvez pas forcer qui peut laisser un avis, mais vous pouvez orienter les clients.',
  },
  {
    q: 'Est-ce que c\'est conforme aux conditions d\'utilisation de Google ?',
    a: 'ProReview respecte les règles de Google. Nous ne supprimons pas d\'avis, nous encourageons simplement les clients satisfaits à partager leur expérience. Les clients mécontents ont la possibilité de s\'exprimer via notre formulaire. C\'est une pratique courante et légale.',
  },
  {
    q: 'Combien de temps pour voir des résultats ?',
    a: 'La plupart de nos clients voient les premiers avis arriver dans les 24-48h suivant l\'activation. En moyenne, nos clients obtiennent +30 avis par mois dès le premier mois.',
  },
  {
    q: 'Puis-je personnaliser les SMS et emails envoyés ?',
    a: 'Oui, vous pouvez personnaliser entièrement vos templates de SMS et d\'email. Vous pouvez utiliser des variables comme {name} pour le nom du client, {business} pour votre nom de commerce, et {link} pour le lien de la demande d\'avis.',
  },
  {
    q: 'Quelle est la différence entre SMS et email ?',
    a: 'Le SMS a un taux d\'ouverture de 95% contre 20% pour l\'email. Il est plus efficace mais a un coût par envoi. L\'email est moins cher mais moins efficace. Nous recommandons le SMS pour les avis. Le plan Pro permet d\'envoyer les deux.',
  },
  {
    q: 'Est-ce que je peux annuler à tout moment ?',
    a: 'Oui, absolument. Il n\'y a aucun engagement. Vous pouvez résilier votre abonnement à tout moment depuis votre espace de facturation. Vous conserverez l\'accès jusqu\'à la fin de la période payée.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-24 px-4 bg-gray-50/50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white rounded-2xl border border-gray-100 px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
