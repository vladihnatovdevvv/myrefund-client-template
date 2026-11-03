import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  LayoutDashboard, User, Download, Upload, ArrowLeftRight,
  LogOut, Shield, Menu, X, ChevronRight
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'profile', path: '/profile', icon: User },
  { key: 'deposits', path: '/deposits', icon: Download },
  { key: 'withdrawal', path: '/withdrawal', icon: Upload },
  { key: 'transactions', path: '/transactions', icon: ArrowLeftRight },
];

interface Props {
  children: ReactNode;
  breadcrumb?: string[];
  title?: string;
}

export const DashboardLayout = ({ children, breadcrumb, title }: Props) => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userName = profile?.full_name || profile?.email || 'User';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <span className="text-primary font-bold text-xl tracking-wide">MYREFUND</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.key}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon size={18} />
                {t(`nav.${item.key}`, lang)}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => { navigate('/admin'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Shield size={18} />
              {t('nav.admin', lang)}
            </button>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <div className="px-4 py-2">
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            {t('nav.logout', lang)}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu size={20} />
          </button>
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">Home</button>
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  <ChevronRight size={14} />
                  <span className={i === breadcrumb.length - 1 ? 'text-foreground' : ''}>{crumb}</span>
                </span>
              ))}
            </div>
          )}
          {title && !breadcrumb && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          COPYRIGHT © 2026 MyRefund, All rights Reserved — Product Of MyRefund LTD
        </footer>
      </div>
    </div>
  );
};
