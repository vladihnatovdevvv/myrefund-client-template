import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, initialize } = useAuth();
  const [tab, setTab] = useState<'account' | 'security' | 'notifications'>('account');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('USA');
  const [language, setLanguage] = useState('United States');
  const [timezone, setTimezone] = useState('(GMT-12:00) International Date Line West');
  const [currency, setCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhone(profile.phone || '');
      setCurrency(profile.currency || 'USD');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: `${firstName} ${lastName}`.trim(),
      phone: phone || null,
      currency,
    }).eq('user_id', user.id);
    await initialize();
    toast({ title: 'Profile updated' });
    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <DashboardLayout breadcrumb={['Pages', t('profile.settings', lang)]}>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">{t('profile.settings', lang)}</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card rounded-lg border border-border p-1 w-fit">
          {(['account', 'security', 'notifications'] as const).map(tb => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === tb ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`profile.${tb}`, lang)}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div className="rounded-xl bg-card border border-border p-8">
            <h2 className="text-lg font-semibold mb-6">{t('profile.details', lang)}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.firstName', lang)}</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.lastName', lang)}</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.phone', lang)}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.address', lang)}</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.state', lang)}</label>
                <input value={state} onChange={e => setState(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.zip', lang)}</label>
                <input value={zip} onChange={e => setZip(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.country', lang)}</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="UA">Ukraine</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.language', lang)}</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className={inputClass}>
                  <option>United States</option>
                  <option>English</option>
                  <option>Russian</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.timezone', lang)}</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputClass}>
                  <option>(GMT-12:00) International Date Line West</option>
                  <option>(GMT+0:00) London</option>
                  <option>(GMT+2:00) Kyiv</option>
                  <option>(GMT+3:00) Moscow</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('profile.currency', lang)}</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="UAH">UAH</option>
                </select>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? '...' : t('profile.saveChanges', lang)}
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="rounded-xl bg-card border border-border p-8">
            <h2 className="text-lg font-semibold mb-4">{t('profile.security', lang)}</h2>
            <p className="text-muted-foreground text-sm">Password management coming soon.</p>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="rounded-xl bg-card border border-border p-8">
            <h2 className="text-lg font-semibold mb-4">{t('profile.notifications', lang)}</h2>
            <p className="text-muted-foreground text-sm">Notification settings coming soon.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
