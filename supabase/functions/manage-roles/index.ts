import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get calling user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if calling user is admin
    const { data: callerRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = callerRoles?.some(r => r.role === 'admin');

    const body = await req.json();
    const action = body?.action;
    const userId = body?.userId ?? body?.targetUserId;
    const role = body?.role;
    const password = typeof body?.password === 'string'
      ? body.password.trim()
      : typeof body?.newPassword === 'string'
        ? body.newPassword.trim()
        : undefined;

    if (action === 'make-first-admin') {
      // Only allow if no admins exist
      const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
      if (count && count > 0) {
        return new Response(JSON.stringify({ error: 'Admin already exists' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'admin' });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'assign-role') {
      await supabase.from('user_roles').upsert({ user_id: userId, role: role || 'admin' }, { onConflict: 'user_id,role' });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove-role') {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role || 'admin');
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset-password' || action === 'reset-user-password' || action === 'set-password') {
      if (!userId || typeof password !== 'string' || password.length < 6) {
        return new Response(JSON.stringify({ error: 'Invalid userId or password' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: resetError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (resetError) {
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
