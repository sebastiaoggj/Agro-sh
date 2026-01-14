import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Sprout, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alterado para um domínio padrão (.com) para passar na validação do Supabase
  const DOMAIN_SUFFIX = '@agro.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');
    const email = `${cleanUsername}${DOMAIN_SUFFIX}`;

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username.toUpperCase(),
            }
          }
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
          setError("Cadastro realizado! Se o login não for automático, verifique se a confirmação de e-mail está desativada no seu Supabase.");
        } else if (data.user) {
          alert("Usuário registrado com sucesso!");
          // O onAuthStateChange no App.tsx vai detectar o login automaticamente
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Invalid login")) {
        setError("Usuário ou senha incorretos.");
      } else if (err.message.includes("already registered")) {
        setError("Este usuário já existe. Tente fazer login.");
      } else if (err.message.includes("Password should be")) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.message.includes("valid email")) {
        setError("Formato de usuário inválido. Use apenas letras e números.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-3xl" />

      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 mb-6 rotate-3">
            <Sprout size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Agro SH</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Acesso Restrito ao Sistema</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
          <button 
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Criar Conta
          </button>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Usuário</label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all lowercase"
                placeholder="ex: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-2xl border border-red-100 text-center animate-in shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase text-xs tracking-widest disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Acessar Painel' : 'Registrar Usuário'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
            Agro SH ERP &copy; 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;