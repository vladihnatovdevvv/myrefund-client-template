import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { BarChart3 } from 'lucide-react';

const coins = ['Bitcoin-BTC', 'Ethereum-ETH', 'USDT-TRC20', 'USDT-ERC20'];
const currencyList = ['USD', 'EUR', 'GBP', 'UAH'];
const bankCountryList = [
  'USA',
  'UK',
  'Ukraine',
  'Moldova',
  'Russia',
  'Turkey',
  // EU countries
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
];

const Withdrawal = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<'crypto' | 'bank' | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Crypto fields
  const [coin, setCoin] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');

  // Bank fields
  const [bankCurrency, setBankCurrency] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  // Auth is handled by ProtectedRoute

  const handleCryptoSubmit = async () => {
    if (!user || !cryptoAmount) return;

    const description = [
      'Withdrawal request (Crypto)',
      `Coin: ${coin || '—'}`,
      `Network: ${cryptoNetwork || '—'}`,
      `Wallet: ${walletAddress || '—'}`,
      `Amount: ${cryptoAmount || '—'} ${bankCurrency || 'USD'}`,
    ].join(' | ');

    setSubmitting(true);
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal' as const,
      amount: parseFloat(cryptoAmount),
      description,
      status: 'pending' as const,
    });
    toast({ title: 'Withdrawal request submitted' });
    setSubmitting(false);
    navigate('/transactions');
  };

  const handleBankSubmit = async () => {
    if (!user || !bankAmount) return;

    const description = [
      'Withdrawal request (Bank)',
      `Currency: ${bankCurrency || '—'}`,
      `Country/City: ${country || '—'} / ${city || '—'}`,
      `Bank: ${bankName || '—'}`,
      `Bank Address: ${bankAddress || '—'}`,
      `Account Number: ${accountNumber || '—'}`,
      `Card Number: ${cardNumber || '—'}`,
      `Account Holder: ${accountHolder || '—'}`,
      `SWIFT: ${swiftCode || '—'}`,
      `Amount: ${bankAmount || '—'} ${bankCurrency || 'USD'}`,
    ].join(' | ');

    setSubmitting(true);
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal' as const,
      amount: parseFloat(bankAmount),
      description,
      status: 'pending' as const,
    });
    toast({ title: 'Withdrawal request submitted' });
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

  // Type selection
  if (!mode) {
    return (
      <DashboardLayout breadcrumb={['Form', t('nav.withdrawal', lang)]}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('withdraw.selectType', lang)}</h1>
          <div className="grid md:grid-cols-2 gap-4">
            <button onClick={() => setMode('crypto')} className="rounded-xl bg-card border border-border p-8 hover:border-primary transition-colors text-left">
              <h3 className="text-lg font-semibold mb-2">{t('withdraw.crypto', lang)}</h3>
              <p className="text-sm text-muted-foreground">Bitcoin, Ethereum, USDT</p>
            </button>
            <button onClick={() => setMode('bank')} className="rounded-xl bg-card border border-border p-8 hover:border-primary transition-colors text-left">
              <h3 className="text-lg font-semibold mb-2">{t('withdraw.bank', lang)}</h3>
              <p className="text-sm text-muted-foreground">SWIFT, SEPA</p>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Crypto withdrawal
  if (mode === 'crypto') {
    const cryptoSteps = [
      { title: t('withdraw.accountDetails', lang), subtitle: t('withdraw.enterAccount', lang) },
      { title: t('withdraw.addressDetails', lang), subtitle: t('withdraw.enterAddress', lang) },
    ];

    return (
      <DashboardLayout breadcrumb={['Form', t('withdraw.cryptoForm', lang)]}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">{t('withdraw.cryptoForm', lang)}</h1>

          {/* TradingView placeholder */}
          <div className="rounded-xl bg-card border border-border p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-2">Markets By TradingView</p>
            <div className="h-24 bg-secondary rounded-lg flex items-center justify-center">
              <BarChart3 size={32} className="text-muted-foreground opacity-20" />
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {cryptoSteps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>

          <div className="rounded-xl bg-card border border-border p-8">
            <h2 className="text-lg font-semibold mb-1">{cryptoSteps[step].title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{cryptoSteps[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.coin', lang)}</label>
                  <select value={coin} onChange={e => setCoin(e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    {coins.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.amount', lang)}</label>
                  <input type="number" step="0.01" value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)} placeholder="USD ($)" className={inputClass} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.walletAddress', lang)}</label>
                  <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.network', lang)}</label>
                  <select value={cryptoNetwork} onChange={e => setCryptoNetwork(e.target.value)} className={inputClass}>
                    <option value="">Select...</option>
                    <option>TRC20</option>
                    <option>ERC20</option>
                    <option>BEP20</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-between mt-8">
              <button
                onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)}
                className="px-6 py-3 rounded-lg bg-secondary text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                {t('withdraw.previous', lang)}
              </button>
              {step < cryptoSteps.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                  {t('withdraw.next', lang)}
                </button>
              ) : (
                <button onClick={handleCryptoSubmit} disabled={submitting} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submitting ? '...' : t('withdraw.submitWithdrawal', lang)}
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Bank withdrawal
  const bankSteps = [
    { title: t('withdraw.accountDetails', lang), subtitle: t('withdraw.enterAccount', lang) },
    { title: t('withdraw.bankDetails', lang), subtitle: t('withdraw.enterBank', lang) },
    { title: t('withdraw.addressDetails', lang), subtitle: t('withdraw.enterAddress', lang) },
  ];

  return (
    <DashboardLayout breadcrumb={['Form', t('withdraw.bankForm', lang)]}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{t('withdraw.bankForm', lang)}</h1>

        {/* TradingView placeholder */}
        <div className="rounded-xl bg-card border border-border p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2">Markets By TradingView</p>
          <div className="h-24 bg-secondary rounded-lg flex items-center justify-center">
            <BarChart3 size={32} className="text-muted-foreground opacity-20" />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {bankSteps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="rounded-xl bg-card border border-border p-8">
          <h2 className="text-lg font-semibold mb-1">{bankSteps[step].title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{bankSteps[step].subtitle}</p>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('deposit.currency', lang)}</label>
                <select value={bankCurrency} onChange={e => setBankCurrency(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {currencyList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.amount', lang)}</label>
                <input type="number" step="0.01" value={bankAmount} onChange={e => setBankAmount(e.target.value)} placeholder="USD ($)" className={inputClass} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.country', lang)}</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {bankCountryList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.city', lang)}</label>
                <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.bankName', lang)}</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.bankAddress', lang)}</label>
                <input value={bankAddress} onChange={e => setBankAddress(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.accountNumber', lang)}</label>
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Card Number</label>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.accountHolder', lang)}</label>
                <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.swiftCode', lang)}</label>
                <input value={swiftCode} onChange={e => setSwiftCode(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('withdraw.bankAddress', lang)}</label>
                <input value={bankAddress} onChange={e => setBankAddress(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between mt-8">
            <button
              onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)}
              className="px-6 py-3 rounded-lg bg-secondary text-muted-foreground font-medium hover:text-foreground transition-colors"
            >
              {t('withdraw.previous', lang)}
            </button>
            {step < bankSteps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                {t('withdraw.next', lang)}
              </button>
            ) : (
              <button onClick={handleBankSubmit} disabled={submitting} className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? '...' : t('withdraw.submitWithdrawal', lang)}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Withdrawal;
