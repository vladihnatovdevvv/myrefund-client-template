import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setHasRecoverySession(!!data.session);
      setChecking(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: t('auth.passwordsMismatch', lang), variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: t('auth.resetLinkFailed', lang), variant: 'destructive' });
    } else {
      toast({ title: t('auth.passwordUpdated', lang) });
      navigate('/login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {checking ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !hasRecoverySession ? (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold">{t('auth.invalidResetLink', lang)}</h1>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              {t('auth.backToLogin', lang)}
            </button>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold mb-1">{t('auth.resetPasswordTitle', lang)}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.resetPasswordDesc', lang)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.newPassword', lang)}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.confirmNewPassword', lang)}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                {loading ? '...' : t('auth.resetPasswordTitle', lang)}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
