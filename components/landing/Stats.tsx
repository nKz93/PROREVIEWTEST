"use client"
import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, end])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

const stats = [
  { value: 12000, suffix: '+', label: 'Avis Google collectés', description: 'et ce nombre grandit chaque jour' },
  { value: 98, suffix: '%', label: 'Taux de satisfaction', description: 'de nos clients commerçants' },
  { value: 500, suffix: '+', label: 'Commerces actifs', description: 'à travers toute la France' },
  { value: 4.9, suffix: '⭐', label: 'Note moyenne obtenue', description: 'sur Google My Business' },
]

export default function Stats() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
