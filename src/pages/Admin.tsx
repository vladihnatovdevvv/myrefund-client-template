import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, t } from '@/lib/i18n';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DollarSign, Edit2, Trash2, Plus, Shield, ShieldOff, RefreshCw, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-info/20 text-info',
  completed: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
};

const Modal = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const Admin = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'users' | 'transactions'>('users');
  const [users, setUsers] = useState<(Tables<'profiles'> & { isAdmin?: boolean })[]>([]);
  const [transactions, setTransactions] = useState<(Tables<'transactions'> & { userName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // User edit modal
  const [editUser, setEditUser] = useState<Tables<'profiles'> | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Balance modal
  const [editBalance, setEditBalance] = useState<{ userId: string; current: number } | null>(null);
  const [newBalance, setNewBalance] = useState('');

  // Add transaction modal
  const [txModal, setTxModal] = useState(false);
  const [txUserId, setTxUserId] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'refund'>('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txStatus, setTxStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('completed');

  // Status modal
  const [statusModal, setStatusModal] = useState<Tables<'transactions'> | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // Edit transaction modal
  const [editTx, setEditTx] = useState<Tables<'transactions'> | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxType, setEditTxType] = useState('');
  const [editTxStatus, setEditTxStatus] = useState('');

  // Reset password modal
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/dashboard');
      return;
    }
    if (user && isAdmin) fetchData();
  }, [user, isAdmin, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, txRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    const profilesList = usersRes.data || [];
    const rolesList = rolesRes.data || [];
    const usersWithRoles = profilesList.map(p => ({
      ...p,
      isAdmin: rolesList.some(r => r.user_id === p.user_id && r.role === 'admin'),
    }));
    setUsers(usersWithRoles);
    const txWithNames = (txRes.data || []).map(tx => {
      const profile = profilesList.find(p => p.user_id === tx.user_id);
      return { ...tx, userName: profile?.full_name || profile?.email || '—' };
    });
    setTransactions(txWithNames);
    setLoading(false);
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    await supabase.from('profiles').update({
      full_name: editName, phone: editPhone, email: editEmail,
    }).eq('id', editUser.id);
    toast({ title: 'User updated' });
    setEditUser(null);
    fetchData();
  };

  const handleChangeBalance = async () => {
    if (!editBalance) return;
    const normalizedValue = newBalance.replace(',', '.').trim();
    const parsedBalance = Number(normalizedValue);

    if (!normalizedValue || Number.isNaN(parsedBalance) || !Number.isFinite(parsedBalance)) {
      toast({ title: 'Invalid balance value', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ balance: parsedBalance })
      .eq('user_id', editBalance.userId);

    if (error) {
      toast({ title: error.message || 'Failed to update balance', variant: 'destructive' });
      return;
    }

    toast({ title: 'Balance updated' });
    setEditBalance(null);
    fetchData();
  };

  const handleAddTransaction = async () => {
    if (!txUserId || !txAmount) return;
    await supabase.from('transactions').insert({
      user_id: txUserId,
      type: txType,
      amount: parseFloat(txAmount),
      description: txDesc || `${txType}`,
      status: txStatus,
    });
    // Update balance if completed deposit/refund
    if (txStatus === 'completed') {
      const u = users.find(u => u.user_id === txUserId);
      if (u) {
        const delta = (txType === 'deposit' || txType === 'refund') ? parseFloat(txAmount) : -parseFloat(txAmount);
        await supabase.from('profiles').update({ balance: u.balance + delta }).eq('user_id', txUserId);
      }
    }
    toast({ title: 'Transaction added' });
    setTxModal(false);
    setTxUserId(''); setTxAmount(''); setTxDesc('');
    fetchData();
  };

  const handleChangeStatus = async () => {
    if (!statusModal || !newStatus) return;
    await supabase.from('transactions').update({ status: newStatus as any }).eq('id', statusModal.id);
    toast({ title: 'Status updated' });
    setStatusModal(null);
    fetchData();
  };

  const handleEditTransaction = async () => {
    if (!editTx) return;
    await supabase.from('transactions').update({
      amount: parseFloat(editTxAmount),
      description: editTxDesc,
      type: editTxType as any,
      status: editTxStatus as any,
    }).eq('id', editTx.id);
    toast({ title: 'Transaction updated' });
    setEditTx(null);
    fetchData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm(t('admin.confirmDelete', lang))) return;
    await supabase.from('transactions').delete().eq('id', id);
    toast({ title: 'Transaction deleted' });
    fetchData();
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      toast({ title: 'Admin role removed' });
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      toast({ title: 'Admin role granted' });
    }
    fetchData();
  };

  const handleToggleApproval = async (u: Tables<'profiles'>) => {
    if (!u.is_approved && u.balance <= 0) {
      toast({ title: t('admin.approveNeedBalance', lang), variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: !u.is_approved,
        approved_at: !u.is_approved ? new Date().toISOString() : null,
        approved_by: !u.is_approved ? user?.id ?? null : null,
      })
      .eq('id', u.id);

    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: !u.is_approved ? t('admin.accessApproved', lang) : t('admin.accessRevoked', lang) });
    fetchData();
  };

  const handleResetUserPassword = async () => {
    if (!resetPasswordUserId || !adminNewPassword.trim()) return;
    if (adminNewPassword !== adminConfirmPassword) {
      toast({ title: t('auth.passwordsMismatch', lang), variant: 'destructive' });
      return;
    }

    setResettingPassword(true);
    const newPass = adminNewPassword.trim();
    const attempts = [
      { action: 'reset-password', userId: resetPasswordUserId, password: newPass },
      { action: 'set-password', userId: resetPasswordUserId, password: newPass },
      { action: 'reset-user-password', userId: resetPasswordUserId, password: newPass },
      { action: 'reset_password', userId: resetPasswordUserId, password: newPass },
      { action: 'reset-password', targetUserId: resetPasswordUserId, newPassword: newPass },
    ];

    let success = false;
    let finalError = '';

    for (const body of attempts) {
      const { error } = await supabase.functions.invoke('manage-roles', { body });
      if (!error) {
        success = true;
        break;
      }

      let errorText = error.message;
      const functionError = error as { context?: Response };
      if (functionError.context) {
        try {
          const payload = await functionError.context.json();
          if (payload?.error) {
            errorText = payload.error;
          }
        } catch {
          // ignore parsing error and use default message
        }
      }
      finalError = errorText;

      if (errorText && !/unknown action/i.test(errorText)) {
        break;
      }
    }

    if (success) {
      toast({ title: t('admin.passwordResetSuccess', lang) });
      setResetPasswordUserId(null);
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      setShowAdminResetPassword(false);
    } else {
      toast({
        title: `${t('admin.passwordResetFailed', lang)}${finalError ? `: ${finalError}` : ''}`,
        variant: 'destructive',
      });
    }

    setResettingPassword(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <DashboardLayout title={t('admin.panel', lang)}>
      <div className="max-w-6xl space-y-6">
        {/* Tabs + Actions */}
        <div className="flex flex-wrap gap-2">
          {(['users', 'transactions'] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === tb ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              {t(`admin.${tb}`, lang)}
            </button>
          ))}
          <button onClick={() => setTxModal(true)}
            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg bg-success/20 text-success text-sm font-medium hover:bg-success/30 transition-colors">
            <Plus size={16} /> {t('admin.addTransaction', lang)}
          </button>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t('admin.name', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('auth.email', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.phone', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.balance', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.access', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.roles', lang)}</th>
                    <th className="sticky right-0 z-10 bg-card px-4 py-3 font-medium shadow-[-12px_0_18px_-18px_hsl(var(--foreground))]">
                      {t('admin.actions', lang)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .slice()
                    .sort((a, b) => Number(a.is_approved) - Number(b.is_approved))
                    .map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{u.full_name || '—'}</td>
                      <td className="max-w-[220px] px-6 py-4 text-sm text-muted-foreground truncate">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{u.phone || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-primary whitespace-nowrap">${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        {u.is_approved ? (
                          <span className="px-2 py-1 rounded text-xs bg-success/20 text-success font-medium">{t('admin.approved', lang)}</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-warning/20 text-warning font-medium">{t('admin.pending', lang)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.isAdmin && <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary font-medium">Admin</span>}
                      </td>
                      <td className="sticky right-0 bg-card px-4 py-4 shadow-[-12px_0_18px_-18px_hsl(var(--foreground))]">
                        <div className="flex min-w-[132px] flex-wrap justify-end gap-1">
                          <button onClick={() => { setEditUser(u); setEditName(u.full_name); setEditPhone(u.phone || ''); setEditEmail(u.email); }}
                            className="p-2 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors" title={t('admin.editUser', lang)}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setEditBalance({ userId: u.user_id, current: u.balance }); setNewBalance(String(u.balance)); }}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title={t('admin.changeBalance', lang)}>
                            <DollarSign size={14} />
                          </button>
                          <button onClick={() => handleToggleAdmin(u.user_id, !!u.isAdmin)}
                            className={`p-2 rounded-lg transition-colors ${u.isAdmin ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                            title={u.isAdmin ? t('admin.removeAdmin', lang) : t('admin.makeAdmin', lang)}>
                            {u.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                          <button
                            onClick={() => handleToggleApproval(u)}
                            className={`p-2 rounded-lg transition-colors ${u.is_approved ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                            title={u.is_approved ? t('admin.revokeAccess', lang) : t('admin.approveAccess', lang)}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setResetPasswordUserId(u.user_id);
                              setAdminNewPassword('');
                              setAdminConfirmPassword('');
                              setShowAdminResetPassword(false);
                            }}
                            className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                            title={t('admin.resetPassword', lang)}
                          >
                            <KeyRound size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="px-6 py-3 font-medium">{t('dash.date', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.user', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.type', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.amount', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.description', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('dash.status', lang)}</th>
                    <th className="px-6 py-3 font-medium">{t('admin.actions', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 text-sm">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">{tx.userName || '—'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{t(`type.${tx.type}`, lang)}</td>
                      <td className="px-6 py-4 text-sm font-medium">${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-normal break-words max-w-[420px]">{tx.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                          {t(`status.${tx.status}`, lang)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => { setStatusModal(tx); setNewStatus(tx.status); }}
                            className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors" title={t('admin.changeStatus', lang)}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setEditTx(tx); setEditTxAmount(String(tx.amount)); setEditTxDesc(tx.description || ''); setEditTxType(tx.type); setEditTxStatus(tx.status); }}
                            className="p-2 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors" title={t('admin.editTransaction', lang)}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title={t('admin.deleteTransaction', lang)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <Modal onClose={() => setEditUser(null)}>
          <h3 className="text-lg font-semibold">{t('admin.editUser', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.name', lang)}</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('auth.email', lang)}</label>
            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.phone', lang)}</label>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditUser(null)} className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground">{t('admin.cancel', lang)}</button>
            <button onClick={handleEditUser} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium">{t('admin.save', lang)}</button>
          </div>
        </Modal>
      )}

      {/* Balance Modal */}
      {editBalance && (
        <Modal onClose={() => setEditBalance(null)}>
          <h3 className="text-lg font-semibold">{t('admin.changeBalance', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.newBalance', lang)}</label>
            <input
              type="text"
              inputMode="decimal"
              value={newBalance}
              onChange={e => setNewBalance(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditBalance(null)} className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground">{t('admin.cancel', lang)}</button>
            <button onClick={handleChangeBalance} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium">{t('admin.save', lang)}</button>
          </div>
        </Modal>
      )}

      {/* Add Transaction Modal */}
      {txModal && (
        <Modal onClose={() => setTxModal(false)}>
          <h3 className="text-lg font-semibold">{t('admin.addTransaction', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.selectUser', lang)}</label>
            <select value={txUserId} onChange={e => setTxUserId(e.target.value)} className={inputClass}>
              <option value="">{t('admin.selectUser', lang)}</option>
              {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name || u.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.type', lang)}</label>
            <select value={txType} onChange={e => setTxType(e.target.value as any)} className={inputClass}>
              <option value="deposit">{t('type.deposit', lang)}</option>
              <option value="withdrawal">{t('type.withdrawal', lang)}</option>
              <option value="transfer">{t('type.transfer', lang)}</option>
              <option value="refund">{t('type.refund', lang)}</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.amount', lang)}</label>
            <input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.description', lang)}</label>
            <input value={txDesc} onChange={e => setTxDesc(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('dash.status', lang)}</label>
            <select value={txStatus} onChange={e => setTxStatus(e.target.value as any)} className={inputClass}>
              <option value="pending">{t('status.pending', lang)}</option>
              <option value="processing">{t('status.processing', lang)}</option>
              <option value="completed">{t('status.completed', lang)}</option>
              <option value="rejected">{t('status.rejected', lang)}</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setTxModal(false)} className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground">{t('admin.cancel', lang)}</button>
            <button onClick={handleAddTransaction} className="px-5 py-2 rounded-lg bg-success text-success-foreground font-medium">{t('admin.save', lang)}</button>
          </div>
        </Modal>
      )}

      {/* Change Status Modal */}
      {statusModal && (
        <Modal onClose={() => setStatusModal(null)}>
          <h3 className="text-lg font-semibold">{t('admin.changeStatus', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('dash.status', lang)}</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={inputClass}>
              {['pending', 'processing', 'completed', 'rejected'].map(s => (
                <option key={s} value={s}>{t(`status.${s}`, lang)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStatusModal(null)} className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground">{t('admin.cancel', lang)}</button>
            <button onClick={handleChangeStatus} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium">{t('admin.save', lang)}</button>
          </div>
        </Modal>
      )}

      {/* Edit Transaction Modal */}
      {editTx && (
        <Modal onClose={() => setEditTx(null)}>
          <h3 className="text-lg font-semibold">{t('admin.editTransaction', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.type', lang)}</label>
            <select value={editTxType} onChange={e => setEditTxType(e.target.value)} className={inputClass}>
              <option value="deposit">{t('type.deposit', lang)}</option>
              <option value="withdrawal">{t('type.withdrawal', lang)}</option>
              <option value="transfer">{t('type.transfer', lang)}</option>
              <option value="refund">{t('type.refund', lang)}</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.amount', lang)}</label>
            <input type="number" step="0.01" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.description', lang)}</label>
            <input value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('dash.status', lang)}</label>
            <select value={editTxStatus} onChange={e => setEditTxStatus(e.target.value)} className={inputClass}>
              {['pending', 'processing', 'completed', 'rejected'].map(s => (
                <option key={s} value={s}>{t(`status.${s}`, lang)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setEditTx(null)} className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground">{t('admin.cancel', lang)}</button>
            <button onClick={handleEditTransaction} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium">{t('admin.save', lang)}</button>
          </div>
        </Modal>
      )}

      {/* Reset User Password Modal */}
      {resetPasswordUserId && (
        <Modal onClose={() => setResetPasswordUserId(null)}>
          <h3 className="text-lg font-semibold">{t('admin.resetPassword', lang)}</h3>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('admin.newPassword', lang)}</label>
            <div className="relative">
              <input
                type={showAdminResetPassword ? 'text' : 'password'}
                minLength={6}
                value={adminNewPassword}
                onChange={e => setAdminNewPassword(e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowAdminResetPassword(!showAdminResetPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showAdminResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('auth.confirmPassword', lang)}</label>
            <input
              type={showAdminResetPassword ? 'text' : 'password'}
              minLength={6}
              value={adminConfirmPassword}
              onChange={e => setAdminConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setResetPasswordUserId(null);
                setAdminConfirmPassword('');
                setShowAdminResetPassword(false);
              }}
              className="px-5 py-2 rounded-lg bg-secondary text-muted-foreground"
            >
              {t('admin.cancel', lang)}
            </button>
            <button
              onClick={handleResetUserPassword}
              disabled={resettingPassword || adminNewPassword.trim().length < 6 || adminConfirmPassword.trim().length < 6 || adminNewPassword !== adminConfirmPassword}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {resettingPassword ? '...' : t('admin.save', lang)}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default Admin;
