import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Plus, Edit2, Trash2, X, Save, 
  Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Harvest } from '../types';

interface HarvestManagementProps {
  onUpdate?: () => void;
}

const HarvestManagement: React.FC<HarvestManagementProps> = ({ onUpdate }) => {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Harvest | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  useEffect(() => {
    fetchHarvests();
  }, []);

  const fetchHarvests = async () => {
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setHarvests(data.map(h => ({
          id: h.id,
          name: h.name,
          startDate: h.start_date,
          endDate: h.end_date,
          isActive: h.is_active
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar safras:", error);
    }
  };

  const handleOpenModal = (item: Harvest | null = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        isActive: item.isActive
      });
    } else {
      // Suggest dates based on current year
      const currentYear = new Date().getFullYear();
      setFormData({
        name: `Safra ${currentYear}/${currentYear + 1}`,
        startDate: `${currentYear}-09-01`,
        endDate: `${currentYear + 1}-03-31`,
        isActive: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      const payload = {
        name: formData.name,
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_active: formData.isActive,
        user_id: userId
      };

      if (editingItem) {
        await supabase.from('harvests').update(payload).eq('id', editingItem.id);
      } else {
        await supabase.from('harvests').insert(payload);
      }

      await fetchHarvests();
      if (onUpdate) onUpdate();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar safra.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta safra?")) return;
    try {
      await supabase.from('harvests').delete().eq('id', id);
      fetchHarvests();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Gestão de Safras</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Definição de períodos agrícolas para relatórios</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> NOVA SAFRA
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {harvests.map(harvest => {
          const now = new Date();
          const start = new Date(harvest.startDate);
          const end = new Date(harvest.endDate);
          const isCurrent = now >= start && now <= end;

          return (
            <div key={harvest.id} className={`relative bg-white border rounded-[2.5rem] p-8 shadow-sm transition-all hover:shadow-md group ${isCurrent ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-200'}`}>
              
              {harvest.isActive && (
                <div className="absolute top-6 right-6 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ativa
                </div>
              )}

              <div className="mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isCurrent ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400'}`}>
                  <CalendarRange size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{harvest.name}</h3>
                {isCurrent && <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Safra Vigente</p>}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                  <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Início</span>
                  <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Calendar size={12} /> {new Date(harvest.startDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                  <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Fim</span>
                  <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Calendar size={12} /> {new Date(harvest.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(harvest)} className="flex-1 py-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all flex items-center justify-center">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(harvest.id)} className="flex-1 py-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all flex items-center justify-center">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        
        {harvests.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300">
            <CalendarRange size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma safra cadastrada</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-900 uppercase italic">{editingItem ? 'Editar Safra' : 'Nova Safra'}</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="text-slate-300 hover:text-slate-900" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome da Safra</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  placeholder="EX: SAFRA 2025/26"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data Fim</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-300 bg-white'}`}>
                  {formData.isActive && <CheckCircle2 size={16} />}
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-wide">Marcar como Safra Padrão</p>
                  <p className="text-[9px] font-bold text-emerald-600/70">Será selecionada automaticamente nos relatórios</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Safra'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestManagement;