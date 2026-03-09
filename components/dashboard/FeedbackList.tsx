"use client"
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Check, CheckCheck } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { PrivateFeedback } from '@/types';

interface FeedbackListProps {
  feedbacks: PrivateFeedback[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkResolved: (id: string) => void;
}

export function FeedbackList({ feedbacks, loading, onMarkRead, onMarkResolved }: FeedbackListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'unresolved'>('all');

  const filtered = feedbacks.filter(f => {
    if (filter === 'unread') return !f.is_read;
    if (filter === 'unresolved') return !f.is_resolved;
    return true;
  });

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'unread', 'unresolved'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className={filter === f ? 'gradient-bg text-white border-0' : ''}>
            {f === 'all' ? 'Tous' : f === 'unread' ? 'Non lus' : 'Non resolus'}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun feedback</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(feedback => (
            <Card key={feedback.id} className={`shadow-sm transition-all ${!feedback.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {Array(5).fill(null).map((_, i) => (
                          <span key={i} className={`text-sm ${i < feedback.score ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-xs">{feedback.category}</Badge>
                      {!feedback.is_read && <Badge variant="default" className="text-xs gradient-bg border-0">Nouveau</Badge>}
                      {feedback.is_resolved && <Badge variant="success" className="text-xs">Resolu</Badge>}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{feedback.message}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{feedback.customer?.name ?? 'Client'}</span>
                      <span>·</span>
                      <span>{formatRelativeDate(feedback.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!feedback.is_read && (
                      <Button variant="outline" size="sm" onClick={() => onMarkRead(feedback.id)} className="text-xs">
                        <Check className="w-3 h-3 mr-1" />Lu
                      </Button>
                    )}
                    {!feedback.is_resolved && (
                      <Button variant="outline" size="sm" onClick={() => onMarkResolved(feedback.id)} className="text-xs">
                        <CheckCheck className="w-3 h-3 mr-1" />Resolu
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
