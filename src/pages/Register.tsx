import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Eye, EyeOff } from 'lucide-react';
import registerIllustration from '@/assets/register-illustration.png';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t('auth.passwordsMismatch', lang), variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('auth.registrationPendingTitle', lang) });
      navigate('/pending-approval');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="text-primary font-bold text-xl tracking-wide">MYREFUND</div>
        </div>
        <img src={registerIllustration} alt="Register" className="max-w-md w-full" />
      </div>

      <div className="flex-1 lg:max-w-xl flex flex-col bg-card">
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-2">{t('auth.adventureTitle', lang)}</h2>
            <p className="text-muted-foreground mb-8">{t('auth.adventureDesc', lang)}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.fullName', lang)}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.email', lang)}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.password', lang)}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="··········"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.confirmPassword', lang)}</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="··········"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {t('auth.agreeTerms', lang)}{' '}
                  <span className="text-primary cursor-pointer">{t('auth.privacyTerms', lang)}</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreed}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? '...' : t('auth.signUp', lang)}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              {t('auth.alreadyAccount', lang)}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('auth.signInInstead', lang)}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
