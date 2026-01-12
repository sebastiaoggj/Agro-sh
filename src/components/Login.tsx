import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { Sprout } from 'lucide-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-4">
            <Sprout size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Agro SH</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Acesso ao Sistema</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#059669',
                  brandAccent: '#047857',
                  inputBorder: '#e2e8f0',
                  inputBackground: '#f8fafc',
                  inputText: '#0f172a',
                },
                radii: {
                  borderRadiusButton: '1rem',
                  inputBorderRadius: '1rem',
                },
              },
            },
            className: {
              button: 'font-black uppercase tracking-widest text-xs py-4',
              input: 'font-medium text-sm py-3',
              label: 'font-black uppercase tracking-widest text-[10px] text-slate-400',
            }
          }}
          providers={[]}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'ENTRAR NO SISTEMA',
              },
              sign_up: {
                link_text: 'Não tem uma conta? Cadastre-se',
                button_label: 'CRIAR CONTA',
                email_label: 'E-mail',
                password_label: 'Senha',
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;