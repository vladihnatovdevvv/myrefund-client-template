import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n, t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Eye, EyeOff } from 'lucide-react';
import loginIllustration from '@/assets/login-illustration.png';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: t('auth.signInError', lang), variant: 'destructive' });
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const targetEmail = forgotEmail.trim() || email.trim();
    if (!targetEmail) {
      toast({ title: t('auth.emailRequired', lang), variant: 'destructive' });
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: t('auth.resetLinkFailed', lang), variant: 'destructive' });
    } else {
      toast({ title: t('auth.resetLinkSent', lang) });
      setForgotOpen(false);
      setForgotEmail('');
    }

    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="text-primary font-bold text-xl tracking-wide">MYREFUND</div>
        </div>
        <img src={loginIllustration} alt="Login" className="max-w-md w-full" />
      </div>

      {/* Right side - form */}
      <div className="flex-1 lg:max-w-xl flex flex-col bg-card">
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-2">{t('auth.welcome', lang)}</h2>
            <p className="text-muted-foreground mb-8">{t('auth.signInDesc', lang)}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('auth.email', lang)}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-muted-foreground">{t('auth.password', lang)}</label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotOpen(true);
                    }}
                  >
                    {t('auth.forgotPassword', lang)}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="··········"
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? '...' : t('auth.signIn', lang)}
              </button>
            </form>

            <div className="mt-6 text-center">
  <Link
    to="/register"
    className="inline-block w-full text-center bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
  >
    {t('auth.newPlatform', lang)} {t('auth.createAccount', lang)}
  </Link>
</div>
          </div>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setForgotOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{t('auth.forgotPassword', lang)}</h3>
            <p className="text-sm text-muted-foreground">{t('auth.forgotPasswordDesc', lang)}</p>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('auth.email', lang)}</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground"
              >
                {t('admin.cancel', lang)}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
              >
                {forgotLoading ? '...' : t('auth.sendResetLink', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
