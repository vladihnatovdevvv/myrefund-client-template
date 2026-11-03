import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import type { Tables } from '@/integrations/supabase/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-info/20 text-info',
  completed: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
};

const Transactions = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Tables<'transactions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setTransactions(data || []);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout breadcrumb={[t('tx.title', lang)]}>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">{t('tx.title', lang)}</h1>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">{t('tx.noTransactions', lang)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t('dash.date', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.type', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.description', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.amount', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.status', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm capitalize">{t(`type.${tx.type}`, lang)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-normal break-words max-w-[420px]">{tx.description || '—'}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                          {t(`status.${tx.status}`, lang)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
