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

  const closeAllModals = () => {
    setActiveActionModal(null);
    setIsLotModalOpen(false);
    setSelectedItemForHistory(null);
    // Reset forms
    setFormQty('');
    setSelectedMasterId('');
    setFormReason('');
    setFormDestFarmId('');
    setFormUnitPrice('');
    setResetPassword('');
  };

  const handleHistoryClick = (item: Insumo) => {
    setSelectedItemForHistory(item);
    setActiveActionModal('HISTORICO');
  };

  const fetchLotsForItem = async (item: Insumo) => {
    setLoading(true);
    setLots([]);
    const farm = farms.find(f => f.name === item.farm);
    if (item.masterId && farm) {
      try {
        const { data, error } = await supabase
          .from('stock_lots')
          .select('*')
          .eq('master_insumo_id', item.masterId)
          .eq('farm_id', farm.id)
          .gt('remaining_quantity', 0)
          .order('entry_date', { ascending: true });
        
        if (error) throw error;
        if (data) setLots(data);
      } catch (error) {
        console.error("Erro ao buscar lotes:", error);
        setLots([]);
      }
    }
    setLoading(false);
  };

  const handleLotDetailClick = (item: Insumo) => {
    setSelectedItemForHistory(item);
    setIsLotModalOpen(true);
    fetchLotsForItem(item);
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
      closeAllModals();

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
        if (!selectedMasterId || !formDestFarmId) {
          alert("Selecione o produto e a fazenda.");
          setLoading(false);
          return;
        }
        
        const unitPrice = Number(formUnitPrice) || 0;
        if (unitPrice < 0) {
            alert("O preço unitário não pode ser negativo.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.rpc('add_stock_manual', {
          p_master_insumo_id: selectedMasterId,
          p_farm_id: formDestFarmId,
          p_quantity: qty,
          p_unit_price: unitPrice,
          p_reason: formReason,
          p_user_id: user.id,
          p_user_name: user.email?.split('@')[0] || 'Usuário'
        });

        if (error) throw error;

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

        const { error } = await supabase.rpc('manual_stock_consumption', {
          p_master_insumo_id: targetItem.masterId,
          p_farm_id: farm.id,
          p_quantity_to_consume: qty,
          p_reason: formReason || 'Ajuste/Perda',
          p_user_id: user.id,
          p_user_name: user.email?.split('@')[0] || 'Usuário'
        });

        if (error) throw error;

      } else if (activeActionModal === 'TRANSFERIR') {
        const originItem = stockProp.find(s => s.id === selectedMasterId);
        if (!originItem || !formDestFarmId) {
          alert("Selecione origem e destino.");
          setLoading(false);
          return;
        }

        const originFarm = farms.find(f => f.name === originItem.farm);
        if (!originFarm || originFarm.id === formDestFarmId) {
          alert("Destino deve ser diferente da origem.");
          setLoading(false);
          return;
        }

        if (qty > originItem.availableQty) {
          alert("Quantidade insuficiente em estoque disponível (Físico - Reservado).");
          setLoading(false);
          return;
        }

        if (!originItem.masterId) throw new Error("ID mestre não encontrado.");
        
        // 1. Consume from origin
        await supabase.rpc('manual_stock_consumption', {
          p_master_insumo_id: originItem.masterId,
          p_farm_id: originFarm.id,
          p_quantity_to_consume: qty,
          p_reason: `Transferência para outra fazenda`,
          p_user_id: user.id,
          p_user_name: user.email?.split('@')[0] || 'Logística'
        });

        // 2. Create new lot and add to destination
        const unitPrice = originItem.price || 0; // Use average price for the new lot

        await supabase.rpc('add_stock_manual', {
          p_master_insumo_id: originItem.masterId,
          p_farm_id: formDestFarmId,
          p_quantity: qty,
          p_unit_price: unitPrice,
          p_reason: `Recebido por transferência de ${originItem.farm}`,
          p_user_id: user.id,
          p_user_name: user.email?.split('@')[0] || 'Logística'
        });
      }

      onRefresh();
      if (onStockChange) {
        onStockChange();
      }
      closeAllModals();

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
                      <div className="inline-flex items-center gap-2 group-hover:bg-slate-100 p-2 rounded-lg transition-colors">
                        <span className="text-slate-800 font-black text-sm">
                            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <Layers size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
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

      {/* History Modal */}
      {activeActionModal === 'HISTORICO' && selectedItemForHistory && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95 max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Histórico de Movimentações</h3>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{selectedItemForHistory.name} - {selectedItemForHistory.farm}</p>
               </div>
               <button onClick={closeAllModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {history.filter(h => h.insumoId === selectedItemForHistory.id).length > 0 ? (
                <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {history.filter(h => h.insumoId === selectedItemForHistory.id).map((entry) => (
                    <div key={entry.id} className="relative group">
                      <div className={`absolute -left-8 top-1.5 w-7 h-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                        entry.type === 'ENTRADA' ? 'bg-emerald-500 text-white' : 
                        entry.type === 'SAIDA' ? 'bg-orange-500 text-white' : 
                        entry.type === 'TRANSFERENCIA' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                      }`}>
                        {entry.type === 'ENTRADA' ? <ArrowDownLeft size={12} strokeWidth={3} /> : 
                         entry.type === 'SAIDA' ? <ArrowUpRight size={12} strokeWidth={3} /> : 
                         entry.type === 'TRANSFERENCIA' ? <ArrowLeftRight size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.date}</span>
                           <span className={`text-sm font-black italic ${entry.quantity > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                             {entry.quantity > 0 ? '+' : ''}{entry.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {selectedItemForHistory.unit}
                           </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-800 uppercase leading-none mb-2">{entry.description}</h5>
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <User size={10} className="text-slate-300" />
                          <span>Responsável: <span className="text-slate-600">{entry.user}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                   <ClipboardList size={64} className="text-slate-400 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem registros recentes</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button onClick={closeAllModals} className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10">Fechar Histórico</button>
            </div>
          </div>
        </div>
      )}

      {/* Lot Detail Modal */}
      {isLotModalOpen && selectedItemForHistory && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95 max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Detalhes dos Lotes</h3>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{selectedItemForHistory.name} - {selectedItemForHistory.farm}</p>
               </div>
               <button onClick={closeAllModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
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
               <button onClick={closeAllModals} className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Action Modal (Entrada/Baixa/Transferencia/Zerar) */}
      {activeActionModal && activeActionModal !== 'HISTORICO' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {activeActionModal === 'ENTRADA_MANUAL' ? 'Entrada Manual' : 
                   activeActionModal === 'BAIXA_MANUAL' ? 'Baixa Manual' : 
                   activeActionModal === 'TRANSFERIR' ? 'Transferência' : 'Zerar Estoque'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {activeActionModal === 'ZERAR_ESTOQUE' ? 'Ação crítica: requer confirmação de senha' : 
                   activeActionModal === 'TRANSFERIR' ? 'Movimentação logística de ativos' : 'Ajuste de inventário operacional'}
                </p>
              </div>
              <button onClick={closeAllModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            {activeActionModal === 'ZERAR_ESTOQUE' ? (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center space-y-2">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="text-red-800 font-black uppercase text-sm">Atenção Extrema</h4>
                  <p className="text-red-600 text-xs font-bold leading-relaxed">
                    Você está prestes a definir a quantidade de <strong>TODOS</strong> os itens do estoque físico como ZERO. Esta ação é irreversível e gerará registros de saída no histórico.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Senha de Confirmação</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-300"
                      placeholder="DIGITE SUA SENHA ATUAL"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {activeActionModal === 'ENTRADA_MANUAL' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Selecionar do Catálogo</label>
                      <div className="relative">
                        <Beaker className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none uppercase"
                          value={selectedMasterId}
                          onChange={(e) => setSelectedMasterId(e.target.value)}
                        >
                          <option value="">Buscar Insumo Mestre...</option>
                          {masterInsumos.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fazenda de Destino</label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 appearance-none uppercase"
                          value={formDestFarmId}
                          onChange={(e) => setFormDestFarmId(e.target.value)}
                        >
                          <option value="">Selecionar Fazenda...</option>
                          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Valor Unitário (R$)</label>
                      <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm" 
                          placeholder="0.00"
                          value={formUnitPrice} 
                          onChange={(e) => setFormUnitPrice(e.target.value)} 
                      />
                    </div>
                  </>
                )}

                {activeActionModal === 'BAIXA_MANUAL' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Item em Estoque</label>
                    <div className="relative">
                      <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 appearance-none uppercase"
                        value={selectedMasterId}
                        onChange={(e) => setSelectedMasterId(e.target.value)}
                      >
                        <option value="">Selecionar para dar Baixa...</option>
                        {stockProp.map(i => <option key={i.id} value={i.id}>{i.name} - {i.farm} (Físico: {i.physicalStock} {i.unit})</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {activeActionModal === 'TRANSFERIR' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Item de Origem</label>
                      <div className="relative">
                        <ArrowUpRight className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none uppercase"
                          value={selectedMasterId}
                          onChange={(e) => setSelectedMasterId(e.target.value)}
                        >
                          <option value="">Selecionar Origem...</option>
                          {stockProp.map(i => <option key={i.id} value={i.id}>{i.name} ({i.farm}) - Físico: {i.physicalStock} {i.unit}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fazenda de Destino</label>
                      <div className="relative">
                        <ArrowDownLeft className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none uppercase"
                          value={formDestFarmId}
                          onChange={(e) => setFormDestFarmId(e.target.value)}
                        >
                          <option value="">Selecionar Destino...</option>
                          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Quantidade</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm" 
                      placeholder="0.00"
                      value={formQty} 
                      onChange={(e) => setFormQty(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Unidade</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-slate-400 font-black uppercase text-sm">
                      {selectedMasterId 
                        ? (activeActionModal === 'ENTRADA_MANUAL' 
                            ? masterInsumos.find(m => m.id === selectedMasterId)?.unit 
                            : stockProp.find(s => s.id === selectedMasterId)?.unit) 
                        : '---'}
                    </div>
                  </div>
                </div>

                {(activeActionModal !== 'TRANSFERIR') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Justificativa / Motivo</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs h-24 resize-none" 
                      placeholder="EX: CORREÇÃO DE INVENTÁRIO, PERDA OPERACIONAL, BRINDE, ETC..."
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button onClick={closeAllModals} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors" disabled={loading}>Cancelar</button>
              <button 
                onClick={activeActionModal === 'ZERAR_ESTOQUE' ? handleResetStockSubmit : handleActionSubmit} 
                className={`flex-1 ${
                  activeActionModal === 'ENTRADA_MANUAL' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 
                  activeActionModal === 'ZERAR_ESTOQUE' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' :
                  activeActionModal === 'BAIXA_MANUAL' ? 'bg-[#f26522] hover:bg-orange-600 shadow-orange-500/20' : 
                  'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                } text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
                disabled={loading}
              >
                {activeActionModal === 'ENTRADA_MANUAL' ? <ArrowDownCircle size={18} /> : 
                 activeActionModal === 'ZERAR_ESTOQUE' ? <Trash2 size={18} /> :
                 activeActionModal === 'BAIXA_MANUAL' ? <MinusCircle size={18} /> : <ArrowLeftRight size={18} />}
                {loading ? 'PROCESSANDO...' : (activeActionModal === 'ZERAR_ESTOQUE' ? 'CONFIRMAR ZERAMENTO' : 'CONFIRMAR OPERAÇÃO')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;