"use client"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/types'

export function useCustomers(businessId: string | undefined) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    setCustomers((data || []) as Customer[])
    setLoading(false)
  }, [businessId])

  const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'tags' | 'source'>) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...customer, source: 'manual' })
      .select()
      .single()
    if (!error && data) setCustomers(prev => [data as Customer, ...prev])
    return { data, error }
  }

  const deleteCustomer = async (customerId: string) => {
    const supabase = createClient()
    await supabase.from('customers').delete().eq('id', customerId)
    setCustomers(prev => prev.filter(c => c.id !== customerId))
  }

  const importCSV = async (rows: Array<{ name: string; phone?: string; email?: string }>) => {
    if (!businessId) return
    const supabase = createClient()
    const toInsert = rows.map(row => ({
      business_id: businessId,
      name: row.name,
      phone: row.phone || null,
      email: row.email || null,
      source: 'csv' as const,
    }))
    const { data } = await supabase.from('customers').insert(toInsert).select()
    if (data) setCustomers(prev => [...(data as Customer[]), ...prev])
    return data
  }

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return { customers, loading, refetch: fetchCustomers, addCustomer, deleteCustomer, importCSV }
}
