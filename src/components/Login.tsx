import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Lock, Loader2, ArrowRight, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sufixo padrão para IDs simplificados
  const DOMAIN_SUFFIX = '@agro.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Se tiver @, assume que é e-mail completo. Se não, adiciona sufixo.
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');
    const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}${DOMAIN_SUFFIX}`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Invalid login")) {
        setError("E-mail/ID ou senha incorretos.");
      } else {
        setError("Erro ao autenticar. Verifique suas credenciais.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      
      {/* Imagem de Fundo com Desfoque */}
      <div 
        className="absolute inset-0 z-0 transform scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1532509176319-943cc979c3d9?q=80&w=2670&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(5px) brightness(0.65)' // Desfoque e leve escurecimento para contraste
        }}
      />

      <div className="bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-white border-2 border-[#0047AB] rounded-2xl flex flex-col items-center justify-center p-2 mb-6 shadow-xl shadow-blue-900/10">
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[#0047AB] font-black text-4xl leading-none">S</span>
              <div className="w-2 h-1.5 bg-[#0047AB] rounded-sm mt-1"></div>
              <span className="text-[#0047AB] font-black text-4xl leading-none">H</span>
            </div>
            <span className="text-[#0047AB] font-bold text-[8px] uppercase tracking-wider transform scale-x-110 mt-1">Agropecuária</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">SH Oliveira</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Acesso Corporativo Restrito</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">E-mail ou ID de Acesso</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Ex: joao@empresa.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                autoCapitalize="none"
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
                Entrar no Sistema
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
            SH Oliveira &copy; 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;