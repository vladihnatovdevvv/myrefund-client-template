import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
    balance: number;
    currency: string;
    is_approved: boolean;
  } | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAdmin: false,
  loading: true,
  profile: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const user = session.user;
      
      // Check admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = roles?.some(r => r.role === 'admin') || false;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      set({
        user,
        isAdmin,
        loading: false,
        profile: profile ? {
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          balance: profile.balance,
          currency: profile.currency,
          is_approved: profile.is_approved,
        } : null,
      });
    } else {
      set({ user: null, isAdmin: false, loading: false, profile: null });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = session.user;
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const isAdmin = roles?.some(r => r.role === 'admin') || false;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        set({
          user,
          isAdmin,
          loading: false,
         profile: profile ? {
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            balance: profile.balance,
            currency: profile.currency,
            is_approved: profile.is_approved,
          } : null,
        });
      } else {
        set({ user: null, isAdmin: false, loading: false, profile: null });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false, profile: null });
  },
}));
