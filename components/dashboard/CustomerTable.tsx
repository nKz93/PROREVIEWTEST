"use client"
import { useState } from 'react';
import { Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Customer } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onDelete: (id: string) => void;
  businessId: string;
}

export function CustomerTable({ customers, loading, onDelete, businessId }: CustomerTableProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendRequest = async (customer: Customer) => {
    setSendingId(customer.id);
    try {
      const code = Math.random().toString(36).substring(2, 14).toUpperCase();
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customer.phone,
          customerId: customer.id,
          businessId,
          customerName: customer.name,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'SMS envoye !', description: `Demande envoyee a ${customer.name}` });
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d'envoyer le SMS', variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-16 text-center">
          <p className="text-gray-500 font-medium">Aucun client</p>
          <p className="text-gray-400 text-sm mt-1">Ajoutez vos clients pour commencer a collecter des avis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Nom</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Contact</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date visite</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Source</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{customer.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{customer.phone ?? '-'}</div>
                  <div className="text-xs text-gray-400">{customer.email ?? ''}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(customer.visit_date)}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="text-xs capitalize">{customer.source}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendRequest(customer)}
                      disabled={sendingId === customer.id || !customer.phone}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {sendingId === customer.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(customer.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
