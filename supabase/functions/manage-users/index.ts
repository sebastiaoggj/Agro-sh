// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria cliente com permissão de Admin (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Pega o token do usuário que chamou a função para verificar se ele é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Sem autorização')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !requestUser) throw new Error('Usuário inválido')

    // Verifica no banco se esse usuário é realmente admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, can_manage_users')
      .eq('id', requestUser.id)
      .single()

    if (!profile || profile.role !== 'admin' || !profile.can_manage_users) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, email, password, fullName, permissions } = await req.json()

    if (action === 'create') {
      // 1. Criar Usuário no Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })

      if (createError) throw createError

      // 2. Atualizar permissões no perfil (o trigger já criou o perfil básico, agora atualizamos)
      if (newUser.user) {
        // Pequeno delay para garantir que o trigger rodou
        await new Promise(r => setTimeout(r, 1000));
        
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            full_name: fullName,
            role: 'operator', // Padrão, admin muda se quiser depois na UI
            can_manage_users: permissions.can_manage_users,
            can_manage_inputs: permissions.can_manage_inputs,
            can_manage_machines: permissions.can_manage_machines
          })
          .eq('id', newUser.user.id)

        if (updateError) throw updateError
      }

      return new Response(JSON.stringify({ message: 'Usuário criado com sucesso', user: newUser.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    else if (action === 'reset_password') {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            permissions.userId, // Reutilizando o objeto permissions para passar o ID
            { password: password }
        );
        
        if (error) throw error;

        return new Response(JSON.stringify({ message: 'Senha alterada com sucesso' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})