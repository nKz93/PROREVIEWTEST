"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Business } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()
        setBusiness(data as Business)
      }
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) setBusiness(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, business, loading }
}
