"use client"
import { useBusiness } from './useBusiness'
import { PLAN_LIMITS } from '@/lib/constants'
import type { PlanLimits } from '@/types'

export function useSubscription() {
  const { business, loading } = useBusiness()

  const plan = business?.plan || 'free'
  const limits: PlanLimits = PLAN_LIMITS[plan]

  const canSendMoreSMS = () => {
    if (!business) return false
    return (business.monthly_sms_used || 0) < (business.monthly_sms_limit || 50)
  }

  const remainingSMS = () => {
    if (!business) return 0
    return Math.max(0, (business.monthly_sms_limit || 50) - (business.monthly_sms_used || 0))
  }

  const isFeatureAvailable = (feature: keyof PlanLimits) => {
    return Boolean(limits[feature])
  }

  return {
    plan,
    limits,
    loading,
    canSendMoreSMS: canSendMoreSMS(),
    remainingSMS: remainingSMS(),
    isFeatureAvailable,
  }
}
