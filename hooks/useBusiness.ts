"use client"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/types'

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusiness = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError) setError(fetchError.message)
    else setBusiness(data as Business)
    setLoading(false)
  }, [])

  const updateBusiness = async (updates: Partial<Business>) => {
    if (!business) return
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', business.id)

    if (!updateError) setBusiness({ ...business, ...updates })
    return updateError
  }

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  return { business, loading, error, refetch: fetchBusiness, updateBusiness }
}
