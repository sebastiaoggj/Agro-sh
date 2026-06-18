import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, History, X,
  ArrowDownCircle, ArrowLeftRight, MapPin, 
  ChevronDown, ArrowDownRight, Beaker,
  Clock, ArrowUpRight, ArrowDownLeft, 
  User, ClipboardList, MinusCircle,
  ShieldCheck, AlertTriangle, Trash2, Lock,
  DollarSign, Layers
} from 'lucide-react';
import { Insumo, MasterInsumo, StockHistoryEntry } from '../types';
import { supabase } from '../integrations/supabase/client';

interface StockLot {
  id: string;
  entry_date: string;
  initial_quantity: number;
  remaining_quantity: number;
  unit_price: number;
  source_description: string;
}

interface InventoryProps {
  stockProp: Insumo[];
  masterInsumos: MasterInsumo[];
  farms: { id: string, name: string }[];
  history: StockHistoryEntry[];
  onRefresh: () => void;
  onStockChange?: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ stockProp, masterInsumos, farms, history, onRefresh, onStockChange }) => {
  const [searchProduct, setSearchProduct] = useState('');
  const [farmFilter, setFarmFilter] = useState('Todas as Fazendas');
  
  const [activeActionModal, setActiveActionModal] = useState<'ENTRADA_MANUAL' | 'BAIXA_MANUAL' | 'TRANSFERIR' | 'HISTORICO' | 'ZERAR_ESTOQUE' | null>(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<Insumo | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [lots, setLots] = useState<StockLot[]>([]);

  const [formQty, setFormQty] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState(''); 
  const [formReason, setFormReason] = useState('');
  const [formDestFarmId, setFormDestFarmId] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fixingReserves, setFixingReserves] = useState(false);

  useEffect(() => {
    if (activeActionModal === 'ENTRADA_MANUAL' && selectedMasterId) {
        const insumo = masterInsumos.find(i => i.id === selectedMasterId);
        if (insumo && insumo.price) {
            setFormUnitPrice(insumo.price.toString());
        } else {
            setFormUnitPrice('0');
        }
    }
  }, [selectedMasterId, activeActionModal, masterInsumos]);

  const filteredItems = useMemo(() => {
    return stockProp.filter(item => {
      const matchesProduct = item.name.toLowerCase().includes(searchProduct.toLowerCase());
      const matchesFarm = farmFilter === 'Todas as Fazendas' || item.farm === farmFilter;
      return matchesProduct && matchesFarm;
    });
  }, [stockProp, searchProduct, farmFilter]);

  const totalInventoryValue = useMemo(() => {
    return filteredItems.reduce((total, item) => {
        return total + (item.physicalStock * (item.price || 0));
    }, 0);
  }, [filteredItems]);

  const closeActionModal = () => {
    setActiveActionModal(null);
    setFormQty('');
    setSelectedMasterId('');
    setFormReason('');
    setFormDestFarmId('');
    setFormUnitPrice('');
    setResetPassword('');
    setSelectedItemForHistory(null);
    setIsLotModalOpen(false);
  };

  const handleHistoryClick = (item: Insumo) => {
    setSelectedItemForHistory(item);
    setActiveActionModal('HISTORICO');
  };

  const handleLotDetailClick = async (item: Insumo) => {
    setSelectedItemForHistory(item);
    setLoading(true);
    const farm = farms.find(f => f.name === item.farm);
    if (item.masterId && farm) {
      const { data, error } = await supabase
        .from('stock_lots')
        .select('*')
        .eq('master_insumo_id', item.masterId)
        .eq('farm_id', farm.id)
        .gt('remaining_quantity', 0)
        .order('entry_date', { ascending: true });
      
      if (data) setLots(data);
    }
    setLoading(false);
    setIsLotModalOpen(true);
  };

  const handleFixReserves = async () => {
    if (!confirm("Isso irá recalcular todas as quantidades reservadas baseando-se apenas nas Ordens 'Emitida'. Deseja continuar?")) return;
    
    setFixingReserves(true);
    try {
      const { error } = await supabase.rpc('recalculate_stock_reservations');
      if (error) throw error;
      alert("Reservas recalculadas e corrigidas com sucesso!");
      onRefresh();
    } catch (error) {
      console.error("Erro ao recalcular:", error);
      alert("Erro ao corrigir reservas.");
    } finally {
      setFixingReserves(false);
    }
  };

  const handleResetStockSubmit = async () => {
    if (!resetPassword) {
      alert("Por favor, digite sua senha para confirmar.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Usuário não identificado.");

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: resetPassword
      });

      if (authError) {
        alert("Senha incorreta. Operação cancelada.");
        setLoading(false);
        return;
      }

      const { error: rpcError } = await supabase.rpc('reset_all_stock');

      if (rpcError) throw rpcError;

      alert("Estoque zerado com sucesso!");
      onRefresh();
      closeActionModal();

    } catch (error: any) {
      console.error("Erro ao zerar:", error);
      alert("Erro ao zerar estoque: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async () => {
    const qty = Number(formQty);
    if (!qty || qty <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (activeActionModal === 'ENTRADA_MANUAL') {
        // ... (lógica de entrada manual permanece a mesma)
      } else if (activeActionModal === 'BAIXA_MANUAL') {
        const targetItem = stockProp.find(s => s.id === selectedMasterId);
        if (!targetItem || !targetItem.masterId) {
          alert("Item inválido.");
          setLoading(false);
          return;
        }
        const farm = farms.find(f => f.name === targetItem.farm);
        if (!farm) {
          alert("Fazenda não encontrada.");
          setLoading(false);
          return;
        }

        await supabase.rpc('manual_stock_consumption', {
          p_master_insumo_id: targetItem.masterId,
          p_farm_id: farm.id,
          p_quantity_to_consume: qty
        });

        await supabase.from('inventory').update({
          physical_stock: Math.max(0, targetItem.physicalStock - qty)
        }).eq('id', targetItem.id);

        await supabase.from('stock_history').insert({
          inventory_id: targetItem.id,
          type: 'SAIDA',
          description: `Baixa Manual: ${formReason || 'Ajuste/Perda'}`,
          quantity: -qty,
          user_name: user.email?.split('@')[0] || 'Usuário',
          user_id: user.id
        });

      } else if (activeActionModal === 'TRANSFERIR') {
        // ... (lógica de transferência permanece a mesma)
      }

      onRefresh();
      if (onStockChange && (activeActionModal === 'ENTRADA_MANUAL' || activeActionModal === 'TRANSFERIR')) {
        onStockChange();
      }
      closeActionModal();

    } catch (error: any) {
      console.error("Erro na operação:", error);
      alert("Ocorreu um erro ao salvar as alterações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 print:p-0 max-w-7xl mx-auto">
      {/* ... (cabeçalho e botões permanecem os mesmos) ... */}
      <div className="space-y-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm">
                <div className="p-4 bg-blue-50 text-blue-500 rounded-xl">
                    <Package size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Itens Únicos</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{filteredItems.length}</h4>
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-xl">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Valor Total em Estoque</p>
                    <h4 className="text-2xl font-black text-emerald-600 tracking-tighter">
                        {totalInventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h4>
                </div>
            </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="PESQUISAR NO INVENTÁRIO..." 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest shadow-sm"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
            />
          </div>
          <button 
            onClick={handleFixReserves}
            disabled={fixingReserves}
            className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
            title="Corrigir inconsistências de reservas"
          >
            <ShieldCheck size={18} />
            {fixingReserves ? 'CORRIGINDO...' : 'RECALCULAR RESERVAS'}
          </button>
          <button 
            onClick={() => setActiveActionModal('ZERAR_ESTOQUE')}
            className="px-6 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
            title="Apagar todo o estoque físico"
          >
            <Trash2 size={18} /> ZERAR
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
            <MapPin size={12} className="text-slate-300" /> FILTRAR POR PROPRIEDADE
          </label>
          <div className="relative w-full md:w-96 group">
            <select 
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
            >
              <option>Todas as Fazendas</option>
              {farms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <button 
          onClick={() => setActiveActionModal('ENTRADA_MANUAL')} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
        >
          <ArrowDownCircle size={22} /> Entrada Manual
        </button>
        <button 
          onClick={() => setActiveActionModal('BAIXA_MANUAL')} 
          className="bg-[#f26522] hover:bg-orange-600 text-white py-6 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/10 active:scale-95"
        >
          <MinusCircle size={22} /> Baixa Manual
        </button>
        <button 
          onClick={() => setActiveActionModal('TRANSFERIR')} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 active:scale-95"
        >
          <ArrowLeftRight size={22} /> Transferir Insumo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl print:border-none print:shadow-none">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-8">Produto</th>
                <th className="px-10 py-8 text-center uppercase">Estoque Físico</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Reservados</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Disponível</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Valor Total (R$)</th>
                <th className="px-10 py-8 uppercase tracking-widest">Fazenda</th>
                <th className="px-10 py-8 text-right uppercase tracking-widest print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => {
                const available = Math.max(0, item.physicalStock - item.reservedQty);
                const totalValue = item.physicalStock * (item.price || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => handleLotDetailClick(item)}>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <ArrowDownRight size={14} className="text-emerald-500 shrink-0" />
                        <div>
                            <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.name}</span>
                            <p className="text-slate-400 text-[10px] font-bold tracking-tight uppercase">{item.activeIngredient}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="text-blue-600 font-black text-lg">{item.physicalStock.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="text-orange-500 font-black text-base">{item.reservedQty.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="text-emerald-600 font-black text-lg">
                        {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                        <span className="text-slate-800 font-black text-sm">
                            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">{item.farm}</span>
                    </td>
                    <td className="px-10 py-8 text-right print:hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleHistoryClick(item); }} 
                        className="flex items-center gap-2 ml-auto text-slate-400 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest italic"
                      >
                        <History size={14} /> HISTÓRICO
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Package size={56} className="text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum item em estoque</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ... (modais de histórico e ações permanecem os mesmos) ... */}
      {isLotModalOpen && selectedItemForHistory && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95 max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Detalhes dos Lotes</h3>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{selectedItemForHistory.name} - {selectedItemForHistory.farm}</p>
               </div>
               <button onClick={closeActionModal} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loading ? <p>Carregando...</p> : lots.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                      <th className="px-4 py-4">Data Entrada</th>
                      <th className="px-4 py-4">Origem</th>
                      <th className="px-4 py-4 text-right">Preço Unit.</th>
                      <th className="px-4 py-4 text-right">Qtd. Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lots.map(lot => (
                      <tr key={lot.id}>
                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{new Date(lot.entry_date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-500">{lot.source_description}</td>
                        <td className="px-4 py-4 text-right text-xs font-black text-emerald-600">{lot.unit_price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-blue-600">{lot.remaining_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <Layers size={64} className="text-slate-400 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum lote ativo para este item</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button onClick={closeActionModal} className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;