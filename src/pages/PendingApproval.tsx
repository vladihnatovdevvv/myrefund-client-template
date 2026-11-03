import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, profile } = useAuth();
  const { lang } = useI18n();

  useEffect(() => {
    if (isAdmin || profile?.is_approved) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, profile?.is_approved, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 text-center space-y-5">
        <h1 className="text-2xl font-semibold">{t('auth.registrationPendingTitle', lang)}</h1>
        <p className="text-muted-foreground">{t('auth.registrationPendingDesc', lang)}</p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          {t('nav.logout', lang)}
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
