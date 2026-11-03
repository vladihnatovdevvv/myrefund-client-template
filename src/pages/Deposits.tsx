import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const currencies = ['Great British Pound-GBP', 'US Dollar-USD', 'Euro-EUR', 'Ukrainian Hryvnia-UAH'];
const coins = ['Bitcoin-BTC', 'Ethereum-ETH', 'USDT-TRC20', 'USDT-ERC20'];
const networks = ['TRC20', 'ERC20', 'BEP20', 'Mainnet'];

const Deposits = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0: Account Details
  const [currency, setCurrency] = useState(currencies[0]);
  const [amount, setAmount] = useState('');
  // Step 1: Coin Details
  const [coin, setCoin] = useState(coins[0]);
  const [network, setNetwork] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Auth is handled by ProtectedRoute
  }, []);

  const handleSubmit = async () => {
    if (!user || !amount) return;
    setSubmitting(true);
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit' as const,
      amount: parseFloat(amount),
      description: `Deposit ${currency} via ${coin}`,
      status: 'pending' as const,
    });
    toast({ title: 'Deposit request submitted' });
    setSubmitting(false);
    navigate('/transactions');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  const steps = [
    { title: t('deposit.accountDetails', lang), subtitle: t('deposit.enterAccount', lang) },
    { title: t('deposit.coinDetails', lang), subtitle: t('deposit.selectCoin', lang) },
  ];

  return (
    <DashboardLayout breadcrumb={['Form', t('deposit.form', lang)]}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('deposit.form', lang)}</h1>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="rounded-xl bg-card border border-border p-8">
          <h2 className="text-lg font-semibold mb-1">{steps[step].title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('deposit.currency', lang)}</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('deposit.amount', lang)}</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('deposit.coin', lang)}</label>
                <select value={coin} onChange={e => setCoin(e.target.value)} className={inputClass}>
                  {coins.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('deposit.network', lang)}</label>
                <select value={network} onChange={e => setNetwork(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {networks.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-3 rounded-lg bg-secondary text-muted-foreground font-medium hover:text-foreground transition-colors disabled:opacity-30"
            >
              {t('deposit.previous', lang)}
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                {t('deposit.next', lang)}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? '...' : t('deposit.submit', lang)}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Deposits;
