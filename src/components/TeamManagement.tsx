import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Key, Check, X, 
  RefreshCw, Lock, Unlock, UserCog
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator';
  can_manage_users: boolean;
  can_manage_inputs: boolean;
  can_manage_machines: boolean;
  created_at: string;
}

const TeamManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newPasswordReset, setNewPasswordReset] = useState('');
  
  const [perms, setPerms] = useState({
    users: false,
    inputs: false,
    machines: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at');
    
    if (error) console.error(error);
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  const handleTogglePermission = async (userId: string, field: string, currentValue: boolean) => {
    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, [field]: !currentValue } : u));

    const { error } = await supabase
      .from('user_profiles')
      .update({ [field]: !currentValue })
      .eq('id', userId);

    if (error) {
      alert("Erro ao atualizar permissão.");
      fetchUsers(); // Revert
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      alert("Preencha todos os campos.");
      return;
    }

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://qlvhiinpbniiqgyayrwf.supabase.co/functions/v1/manage-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserName,
          permissions: {
            can_manage_users: perms.users,
            can_manage_inputs: perms.inputs,
            can_manage_machines: perms.machines
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      alert("Usuário criado com sucesso!");
      setIsModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setPerms({ users: false, inputs: false, machines: false });
      fetchUsers();

    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPasswordReset || !selectedUser) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://qlvhiinpbniiqgyayrwf.supabase.co/functions/v1/manage-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reset_password',
          password: newPasswordReset,
          permissions: { userId: selectedUser.id } // Usando campo permissions para passar ID
        })
      });

      if (!response.ok) throw new Error('Falha ao resetar senha');

      alert("Senha alterada com sucesso.");
      setIsResetModalOpen(false);
      setNewPasswordReset('');
      setSelectedUser(null);

    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Gestão de Equipe</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Controle de acesso e perfis de usuários</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95"
        >
          <UserPlus size={18} strokeWidth={3} /> NOVO USUÁRIO
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">Carregando equipe...</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${user.role === 'admin' ? 'bg-purple-600 shadow-purple-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}>
                  {user.role === 'admin' ? <Shield size={32} /> : <Users size={32} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user.full_name || 'Sem Nome'}</h3>
                  <p className="text-slate-400 text-xs font-bold">{user.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {user.role === 'admin' ? 'Administrador Master' : 'Operador'}
                  </span>
                </div>
              </div>

              {/* Toggles de Permissão */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-end flex-1">
                <div 
                  onClick={() => handleTogglePermission(user.id, 'can_manage_inputs', user.can_manage_inputs)}
                  className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${user.can_manage_inputs ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${user.can_manage_inputs ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Insumos</span>
                </div>

                <div 
                  onClick={() => handleTogglePermission(user.id, 'can_manage_machines', user.can_manage_machines)}
                  className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${user.can_manage_machines ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${user.can_manage_machines ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Máquinas</span>
                </div>

                <div 
                  onClick={() => handleTogglePermission(user.id, 'can_manage_users', user.can_manage_users)}
                  className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 ${user.can_manage_users ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${user.can_manage_users ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Equipe</span>
                </div>
              </div>

              <div className="border-l border-slate-100 pl-8 ml-4">
                <button 
                  onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                  title="Redefinir Senha"
                >
                  <Key size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase italic">Novo Membro</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="text-slate-300 hover:text-slate-900" /></button>
            </div>
            
            <div className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
              <input type="email" placeholder="E-mail de Acesso" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              <input type="password" placeholder="Senha Inicial" className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
              
              <div className="pt-4 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissões Iniciais</p>
                <div className="flex gap-3">
                  <button onClick={() => setPerms({...perms, inputs: !perms.inputs})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${perms.inputs ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>Insumos</button>
                  <button onClick={() => setPerms({...perms, machines: !perms.machines})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${perms.machines ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>Máquinas</button>
                  <button onClick={() => setPerms({...perms, users: !perms.users})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${perms.users ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>Equipe</button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateUser} 
              disabled={actionLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              {actionLoading ? 'Processando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Reset Senha */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-6">
            <div className="text-center">
               <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Key size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase italic">Redefinir Senha</h3>
               <p className="text-xs font-bold text-slate-400 mt-1">Para: {selectedUser.full_name}</p>
            </div>
            
            <input 
              type="text" 
              placeholder="Nova Senha" 
              className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 text-center" 
              value={newPasswordReset} 
              onChange={e => setNewPasswordReset(e.target.value)} 
            />

            <div className="flex gap-4">
              <button onClick={() => setIsResetModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-900">Cancelar</button>
              <button 
                onClick={handleResetPassword} 
                disabled={actionLoading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {actionLoading ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;