import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tractor, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MapPin, 
  Droplets,
  Calendar,
  X,
  Save,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface Machine {
  id: string;
  name: string;
  farmIds: string[]; // IDs das fazendas vinculadas
  farmNames: string[];
  capacity: number;
}

interface Operator {
  id: string;
  name: string;
  farmIds: string[];
  farmNames: string[];
  createdAt: string;
}

const FleetManagement: React.FC = () => {
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [farmFilter, setFarmFilter] = useState('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'machine' | 'operator' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ farmIds: [] });

  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Buscar Fazendas para o Select
      const { data: farmsData } = await supabase.from('farms').select('id, name');
      if (farmsData) setFarms(farmsData);

      // 2. Buscar Máquinas
      const { data: machinesData } = await supabase.from('machines').select('*');
      if (machinesData) {
        // Mapear IDs para Nomes de fazenda
        const formattedMachines = machinesData.map((m: any) => ({
          id: m.id,
          name: m.name,
          capacity: m.capacity,
          farmIds: m.farm_ids || [],
          farmNames: (m.farm_ids || []).map((fid: string) => farmsData?.find(f => f.id === fid)?.name || 'N/A')
        }));
        setMachines(formattedMachines);
      }

      // 3. Buscar Operadores
      const { data: opsData } = await supabase.from('operators').select('*');
      if (opsData) {
        const formattedOps = opsData.map((o: any) => ({
          id: o.id,
          name: o.name,
          createdAt: new Date(o.created_at).toLocaleDateString('pt-BR'),
          farmIds: o.farm_ids || [],
          farmNames: (o.farm_ids || []).map((fid: string) => farmsData?.find(f => f.id === fid)?.name || 'N/A')
        }));
        setOperators(formattedOps);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Filtros
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFarm = farmFilter === 'all' || m.farmIds.includes(farmFilter);
      return matchesSearch && matchesFarm;
    });
  }, [machines, searchTerm, farmFilter]);

  const filteredOperators = useMemo(() => {
    return operators.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFarm = farmFilter === 'all' || o.farmIds.includes(farmFilter);
      return matchesSearch && matchesFarm;
    });
  }, [operators, searchTerm, farmFilter]);

  const handleOpenModal = (type: 'machine' | 'operator', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    // Se for edição, garante que farmIds exista, senão inicia array vazio
    setFormData(item ? { ...item, farmIds: item.farmIds || [] } : { farmIds: [], name: '', capacity: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (modalType === 'machine') {
        const payload = {
          name: formData.name,
          capacity: formData.capacity,
          farm_ids: formData.farmIds,
          user_id: user.id
        };

        if (editingItem) {
          await supabase.from('machines').update(payload).eq('id', editingItem.id);
        } else {
          await supabase.from('machines').insert(payload);
        }
      } else {
        const payload = {
          name: formData.name,
          farm_ids: formData.farmIds,
          user_id: user.id
        };

        if (editingItem) {
          await supabase.from('operators').update(payload).eq('id', editingItem.id);
        } else {
          await supabase.from('operators').insert(payload);
        }
      }

      await fetchData(); // Recarregar lista
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFarm = (farmId: string) => {
    const currentIds = [...(formData.farmIds || [])];
    if (currentIds.includes(farmId)) {
      setFormData({ ...formData, farmIds: currentIds.filter(id => id !== farmId) });
    } else {
      setFormData({ ...formData, farmIds: [...currentIds, farmId] });
    }
  };

  const handleDelete = async (id: string, type: 'machine' | 'operator') => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    try {
      const table = type === 'machine' ? 'machines' : 'operators';
      await supabase.from(table).delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Tractor size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gerenciar Frota e Equipe</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Adicione, edite e gerencie suas máquinas e operadores.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filtrar por Fazenda</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                value={farmFilter}
                onChange={(e) => setFarmFilter(e.target.value)}
              >
                <option value="all">Todas as Fazendas</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Buscar por Nome</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar máquina ou operador..." 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Machines Table */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
            Máquinas <span className="text-emerald-500">Cadastradas</span>
          </h2>
          <button 
            onClick={() => handleOpenModal('machine')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus size={16} className="border-2 border-white rounded-full p-0.5" />
            NOVA MÁQUINA
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">Fazenda(s)</th>
                <th className="px-8 py-4">Máquina</th>
                <th className="px-8 py-4">Capacidade (L)</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredMachines.length > 0 ? (
                filteredMachines.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase max-w-[200px] flex-wrap">
                        <MapPin size={12} className="text-emerald-500 shrink-0" />
                        {m.farmNames.length > 0 ? m.farmNames.join(', ') : 'Global'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                          <Tractor size={16} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Droplets size={16} className="text-blue-500" />
                        <span className="font-black">{m.capacity} L</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal('machine', m)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.id, 'machine')} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                    Nenhuma máquina cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
            Operadores <span className="text-blue-500">Cadastrados</span>
          </h2>
          <button 
            onClick={() => handleOpenModal('operator')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus size={16} className="border-2 border-white rounded-full p-0.5" />
            NOVO OPERADOR
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">Fazenda(s)</th>
                <th className="px-8 py-4">Nome do Operador</th>
                <th className="px-8 py-4">Data da Criação</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOperators.length > 0 ? (
                filteredOperators.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase max-w-[200px] flex-wrap">
                        <MapPin size={12} className="text-blue-500 shrink-0" />
                        {o.farmNames.length > 0 ? o.farmNames.join(', ') : 'Global'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                          <Users size={16} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                        <Calendar size={16} />
                        <span className="font-medium">{o.createdAt}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal('operator', o)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(o.id, 'operator')} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                    Nenhum operador cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {editingItem ? 'Editar' : 'Nova'} {modalType === 'machine' ? 'Máquina' : 'Operador'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Preencha os dados abaixo.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Nome {modalType === 'machine' ? 'da Máquina' : 'do Operador'} *
                </label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={modalType === 'machine' ? "Ex: Pulverizador Jacto" : "Ex: João Silva"}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fazendas (opcional)</label>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {farms.length > 0 ? farms.map(farm => (
                    <label key={farm.id} className="flex items-center gap-3 cursor-pointer group p-1">
                      <div 
                        onClick={() => handleToggleFarm(farm.id)}
                        className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${formData.farmIds?.includes(farm.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {formData.farmIds?.includes(farm.id) && <Plus size={14} className="rotate-45" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">{farm.name}</span>
                    </label>
                  )) : (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">Nenhuma fazenda cadastrada</p>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 italic mt-1 font-medium">Se nenhuma fazenda for selecionada, estará disponível para todas.</p>
              </div>

              {modalType === 'machine' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Capacidade do Tanque (L) *</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: 2000"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                    <Droplets className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className={`flex-1 ${modalType === 'machine' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50`}
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;