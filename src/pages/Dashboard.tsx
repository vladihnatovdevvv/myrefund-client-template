import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TrendingUp, BarChart3, LineChart, PieChart, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-info/20 text-info',
  completed: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
};

const balanceCards = [
  { key: 'crypto', icon: TrendingUp, color: 'text-primary' },
  { key: 'forex', icon: BarChart3, color: 'text-info' },
  { key: 'cfd', icon: LineChart, color: 'text-success' },
  { key: 'stocks', icon: PieChart, color: 'text-warning' },
];


const Dashboard = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Tables<'transactions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
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

  const balance = profile?.balance || 0;
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const dayNum = new Date().getDate();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Balance cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {balanceCards.map(card => (
            <div key={card.key} className="rounded-xl bg-card border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <card.icon size={20} className={card.color} />
                <span className="text-sm text-muted-foreground">{t(`dash.${card.key}`, lang)}</span>
              </div>
              <p className="text-2xl font-bold">00.00</p>
            </div>
          ))}
        </div>

        {/* Main balance */}
        <div className="rounded-xl bg-card border border-border p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('dash.totalBalance', lang)}</p>
              <p className="text-xs text-muted-foreground">{t('dash.currentBalance', lang)}</p>
              <h1 className="text-4xl font-bold text-primary mt-2">
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>
              <p className="text-xs text-muted-foreground mt-2">{t('dash.canWithdraw', lang)}</p>
            </div>
          </div>
        </div>

        {/* TradingView Ticker Tape */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div
            ref={(el) => {
              if (el && !el.querySelector('script')) {
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
                script.async = true;
                script.innerHTML = JSON.stringify({
                  symbols: [
                    { proName: "FX:EURUSD", title: "EUR/USD" },
                    { proName: "FX:GBPUSD", title: "GBP/USD" },
                    { proName: "FX:USDJPY", title: "USD/JPY" },
                    { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
                    { proName: "BITSTAMP:ETHUSD", title: "ETH/USD" },
                    { proName: "FOREXCOM:XAUUSD", title: "Gold" },
                    { proName: "TVC:DXY", title: "Dollar Index" }
                  ],
                  showSymbolLogo: true,
                  isTransparent: true,
                  displayMode: "adaptive",
                  colorTheme: "dark",
                  locale: "en"
                });
                el.appendChild(script);
              }
            }}
            className="tradingview-widget-container"
          />
        </div>

        {/* Recovery Progress + Transactions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recovery steps */}
          <div className="lg:col-span-2 rounded-xl bg-card border border-border p-6">
            <h2 className="text-lg font-semibold mb-6">{t('nav.transactions', lang)}</h2>

            {/* Transactions table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">{t('dash.company', lang)}</th>
                    <th className="pb-3 font-medium">{t('dash.date', lang)}</th>
                    <th className="pb-3 font-medium">{t('dash.status', lang)}</th>
                    <th className="pb-3 font-medium">{t('dash.amount', lang)}</th>
                    <th className="pb-3 font-medium">{t('dash.progress', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">{t('dash.noTransactions', lang)}</td></tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-border last:border-0">
                        <td className="py-3 text-sm">{tx.description || '—'}</td>
                        <td className="py-3 text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                            {t(`status.${tx.status}`, lang)}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-medium">${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3">
                          <div className="w-24 h-2 bg-secondary rounded-full">
                            <div className={`h-full rounded-full ${
                              tx.status === 'completed' ? 'bg-success w-full' :
                              tx.status === 'processing' ? 'bg-info w-3/5' :
                              tx.status === 'rejected' ? 'bg-destructive w-full' :
                              'bg-warning w-1/4'
                            }`} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column - Calendar + Contact */}
          <div className="space-y-6">
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{dayOfWeek}</p>
              <p className="text-4xl font-bold mt-1">{dayNum}</p>
            </div>

            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="font-semibold mb-2">{t('dash.readyToTalk', lang)}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t('dash.contactSupport', lang)}</p>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Clock size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p>Monday-Friday</p>
                    <p>10:00 AM to 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={14} className="mt-0.5 shrink-0" />
                  <p>Support@myrefund.com.co</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <p>71-75 Shelton Street, Covent Garden, London, United Kingdom, WC2H 9JQ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        href="https://t.me/TraderWatchers_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={18} />
        <span className="text-sm font-semibold">Support</span>
      </a>
    </DashboardLayout>
  );
};

export default Dashboard;
