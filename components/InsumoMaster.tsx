
import React, { useState, useMemo } from 'react';
import { 
  Beaker, Search, Plus, Edit2, Trash2, X, Save, 
  ChevronRight, ArrowDownRight, Droplet, Layers, Info,
  ShoppingCart, DollarSign
} from 'lucide-react';
import { MasterInsumo } from '../types';

const CATEGORIES = ['HERBICIDA', 'FUNGICIDA', 'INSETICIDA', 'ACARICIDA', 'ADJUVANTE', 'FERTILIZANTE', 'NUTRIÇÃO FOLIAR', 'OUTROS'];
const UNITS = ['LT', 'KG', 'UN', 'PCT', 'GAL', 'TON'];

interface InsumoMasterProps {
  insumos: MasterInsumo[];
  onUpdate: (data: MasterInsumo[]) => void;
}

const InsumoMaster: React.FC<InsumoMasterProps> = ({ insumos, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterInsumo | null>(null);
  const [formData, setFormData] = useState<Partial<MasterInsumo>>({
    name: '',
    activeIngredient: '',
    unit: 'LT',
    category: 'HERBICIDA',
    defaultPurchaseQty: 0,
    price: 0
  });

  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [insumos, searchTerm]);

  const handleOpenModal = (item: MasterInsumo | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ name: '', activeIngredient: '', unit: 'LT', category: 'HERBICIDA', defaultPurchaseQty: 0, price: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.activeIngredient) {
      alert("Por favor, preencha o nome e o princípio ativo.");
      return;
    }

    if (editingItem) {
      onUpdate(insumos.map(i => i.id === editingItem.id ? { ...i, ...formData } as MasterInsumo : i));
    } else {
      const newItem: MasterInsumo = {
        id: Date.now().toString(),
        name: formData.name.toUpperCase(),
        activeIngredient: formData.activeIngredient.toUpperCase(),
        unit: formData.unit || 'LT',
        category: formData.category || 'OUTROS',
        defaultPurchaseQty: formData.defaultPurchaseQty || 0,
        price: formData.price || 0
      };
      onUpdate([newItem, ...insumos]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este insumo do catálogo mestre?")) {
      onUpdate(insumos.filter(i => i.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Catálogo de Insumos</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Definição global de produtos e substâncias</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} className="border-2 border-white rounded-lg p-0.5" /> NOVO INSUMO
        </button>
      </div>

      {/* Search Row */}
      <div className="bg-[#f8fafc] border border-slate-200 rounded-[3rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[300px] group">
          <input 
            type="text" 
            placeholder="BUSCAR POR NOME OU PRINCÍPIO ATIVO..." 
            className="w-full bg-white border-none rounded-[2.5rem] px-8 py-5 text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest placeholder:text-slate-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
        </div>
      </div>

      {/* Grid of Insumos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredInsumos.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-10 group-hover:scale-110 transition-transform" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Beaker size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-slate-50 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                  {item.unit}
                </span>
                {item.price !== undefined && (
                  <span className="text-emerald-600 font-black text-xs italic">
                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {item.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{item.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <Droplet size={12} className="text-emerald-500" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo: <span className="text-slate-700">{item.activeIngredient}</span></p>
                </div>
                {item.defaultPurchaseQty && item.defaultPurchaseQty > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <ShoppingCart size={12} className="text-orange-500" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compra Padrão: <span className="text-orange-600">{item.defaultPurchaseQty} {item.unit}</span></p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-300" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(item)} className="p-2.5 text-slate-300 hover:text-emerald-500 transition-colors bg-slate-50 rounded-xl hover:bg-emerald-50">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-xl hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">{editingItem ? 'Editar Insumo' : 'Novo Insumo'}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dados técnicos do produto</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nome Comercial</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="EX: GLIFOSATO 480"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Princípio Ativo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="EX: GLIFOSATO POTÁSSICO"
                  value={formData.activeIngredient}
                  onChange={(e) => setFormData({...formData, activeIngredient: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Unidade</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none uppercase"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Preço Médio por Unidade</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500" 
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Quantidade Padrão Pedido</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Sugestão em pedidos"
                  value={formData.defaultPurchaseQty}
                  onChange={(e) => setFormData({...formData, defaultPurchaseQty: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex gap-6 pt-6 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95">
                <Save size={20} /> SALVAR INSUMO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsumoMaster;
