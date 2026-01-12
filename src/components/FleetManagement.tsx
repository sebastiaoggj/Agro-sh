
import React, { useState, useMemo } from 'react';
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
  // Dados mockados de fazendas (deveriam vir de um contexto global ou banco)
  const FARMS = [
    { id: 'f1', name: 'JATOBA/BURITI' },
    { id: 'f2', name: 'SAO GERONIMO' },
    { id: 'f3', name: 'SANTO AURELIO' },
    { id: 'f4', name: 'ALIANCA' },
    { id: 'f5', name: 'BOQUEIRAO' },
    { id: 'f6', name: 'MANGA' }
  ];

  const [machines, setMachines] = useState<Machine[]>([
    { id: 'm1', name: '4730 JA.', farmIds: ['f1'], farmNames: ['JATOBA/BURITI'], capacity: 3000 },
    { id: 'm2', name: 'AVIAO PROPRIO', farmIds: ['f2', 'f6', 'f3', 'f4'], farmNames: ['SAO GERONIMO', 'MANGA', 'SANTO AURELIO', 'ALIANCA'], capacity: 600 },
    { id: 'm3', name: 'BOMBA COSTAL', farmIds: ['f6', 'f3', 'f2', 'f4'], farmNames: ['MANGA', 'SANTO AURELIO', 'SAO GERONIMO', 'ALIANCA'], capacity: 20 },
    { id: 'm4', name: 'DRONE', farmIds: ['f6', 'f3', 'f2', 'f5'], farmNames: ['MANGA', 'SANTO AURELIO', 'SAO GERONIMO', 'BOQUEIRAO'], capacity: 40 },
  ]);

  const [operators, setOperators] = useState<Operator[]>([
    { id: 'o1', name: 'ANDRE S.A.', farmIds: ['f3'], farmNames: ['SANTO AURELIO'], createdAt: '11/12/2025' },
    { id: 'o2', name: 'ARTHUR AL.', farmIds: ['f4'], farmNames: ['ALIANCA'], createdAt: '16/12/2025' },
    { id: 'o3', name: 'BRANCO BO.', farmIds: ['f5'], farmNames: ['BOQUEIRAO'], createdAt: '16/12/2025' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [farmFilter, setFarmFilter] = useState('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'machine' | 'operator' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ farmIds: [] });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

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
    setFormData(item || { farmIds: [], name: '', capacity: '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    const selectedFarmNames = FARMS.filter(f => formData.farmIds.includes(f.id)).map(f => f.name);
    
    if (modalType === 'machine') {
      if (editingItem) {
        setMachines(machines.map(m => m.id === editingItem.id ? { ...m, ...formData, farmNames: selectedFarmNames } : m));
      } else {
        setMachines([...machines, { ...formData, id: Date.now().toString(), farmNames: selectedFarmNames }]);
      }
    } else {
      if (editingItem) {
        setOperators(operators.map(o => o.id === editingItem.id ? { ...o, ...formData, farmNames: selectedFarmNames } : o));
      } else {
        setOperators([...operators, { ...formData, id: Date.now().toString(), createdAt: new Date().toLocaleDateString('pt-BR'), farmNames: selectedFarmNames }]);
      }
    }
    setModalOpen(false);
  };

  const handleToggleFarm = (farmId: string) => {
    const currentIds = [...(formData.farmIds || [])];
    if (currentIds.includes(farmId)) {
      setFormData({ ...formData, farmIds: currentIds.filter(id => id !== farmId) });
    } else {
      setFormData({ ...formData, farmIds: [...currentIds, farmId] });
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
                {FARMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
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
              {filteredMachines.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase max-w-[200px] flex-wrap">
                      <MapPin size={12} className="text-emerald-500 shrink-0" />
                      {m.farmNames.join(', ') || 'Global'}
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
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              {filteredOperators.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase max-w-[200px] flex-wrap">
                      <MapPin size={12} className="text-blue-500 shrink-0" />
                      {o.farmNames.join(', ') || 'Global'}
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
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  {FARMS.map(farm => (
                    <label key={farm.id} className="flex items-center gap-3 cursor-pointer group p-1">
                      <div 
                        onClick={() => handleToggleFarm(farm.id)}
                        className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${formData.farmIds?.includes(farm.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {formData.farmIds?.includes(farm.id) && <Plus size={14} className="rotate-45" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">{farm.name}</span>
                    </label>
                  ))}
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
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className={`flex-1 ${modalType === 'machine' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
              >
                <Save size={20} />
                SALVAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
