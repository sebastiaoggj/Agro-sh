import React, { useState, useMemo } from 'react';
import { 
  Package, Search, History, X,
  ArrowDownCircle, ArrowLeftRight, MapPin, 
  ChevronDown, ArrowDownRight, Beaker,
  Clock, ArrowUpRight, ArrowDownLeft, 
  User, ClipboardList, MinusCircle
} from 'lucide-react';
import { Insumo, MasterInsumo, StockHistoryEntry } from '../types';
import { supabase } from '../integrations/supabase/client';

interface InventoryProps {
  stockProp: Insumo[];
  masterInsumos: MasterInsumo[];
  farms: { id: string, name: string }[];
  history: StockHistoryEntry[];
  onRefresh: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ stockProp, masterInsumos, farms, history, onRefresh }) => {
  const [searchProduct, setSearchProduct] = useState('');
  const [farmFilter, setFarmFilter] = useState('Todas as Fazendas');
  
  const [activeActionModal, setActiveActionModal] = useState<'ENTRADA_MANUAL' | 'BAIXA_MANUAL' | 'TRANSFERIR' | 'HISTORICO' | null>(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<Insumo | null>(null);

  // Form States
  const [formQty, setFormQty] = useState('');
  const [selectedMasterId, setSelectedMasterId] = useState(''); // Para Entrada/Baixa: ID do Master ou Inventory
  const [formReason, setFormReason] = useState('');
  const [formDestFarmId, setFormDestFarmId] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredItems = useMemo(() => {
    return stockProp.filter(item => {
      const matchesProduct = item.name.toLowerCase().includes(searchProduct.toLowerCase());
      const matchesFarm = farmFilter === 'Todas as Fazendas' || item.farm === farmFilter;
      return matchesProduct && matchesFarm;
    });
  }, [stockProp, searchProduct, farmFilter]);

  const closeActionModal = () => {
    setActiveActionModal(null);
    setFormQty('');
    setSelectedMasterId('');
    setFormReason('');
    setFormDestFarmId('');
    setSelectedItemForHistory(null);
  };

  const handleHistoryClick = (item: Insumo) => {
    setSelectedItemForHistory(item);
    setActiveActionModal('HISTORICO');
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
        // selectedMasterId é o ID do master_insumos
        if (!selectedMasterId || !formDestFarmId) {
          alert("Selecione o produto e a fazenda.");
          setLoading(false);
          return;
        }

        // Verificar se já existe no inventário
        const { data: existingItem } = await supabase
          .from('inventory')
          .select('*')
          .eq('master_insumo_id', selectedMasterId)
          .eq('farm_id', formDestFarmId)
          .single();
        
        let inventoryId = existingItem?.id;

        if (existingItem) {
          await supabase.from('inventory').update({
            physical_stock: Number(existingItem.physical_stock) + qty
          }).eq('id', inventoryId);
        } else {
          const { data: newItem, error } = await supabase.from('inventory').insert({
            master_insumo_id: selectedMasterId,
            farm_id: formDestFarmId,
            physical_stock: qty,
            reserved_qty: 0,
            min_stock: 0,
            user_id: user.id
          }).select().single();
          
          if (error) throw error;
          inventoryId = newItem.id;
        }

        // Registrar Histórico
        await supabase.from('stock_history').insert({
          inventory_id: inventoryId,
          type: 'ENTRADA',
          description: `Entrada Manual: ${formReason || 'Ajuste de inventário'}`,
          quantity: qty,
          user_name: user.email?.split('@')[0] || 'Usuário',
          user_id: user.id
        });

      } else if (activeActionModal === 'BAIXA_MANUAL') {
        // selectedMasterId aqui é o ID do INVENTÁRIO (item selecionado da lista)
        const targetItem = stockProp.find(s => s.id === selectedMasterId);
        if (!targetItem) {
          alert("Selecione o item do estoque.");
          setLoading(false);
          return;
        }

        if (qty > targetItem.availableQty) {
          alert("Quantidade superior ao disponível.");
          setLoading(false);
          return;
        }

        await supabase.from('inventory').update({
          physical_stock: targetItem.physicalStock - qty
        }).eq('id', targetItem.id);

        await supabase.from('stock_history').insert({
          inventory_id: targetItem.id,
          type: 'SAIDA',
          description: `Baixa Manual: ${formReason || 'Ajuste/Perda'}`,
          quantity: -qty, // Negativo para saída
          user_name: user.email?.split('@')[0] || 'Usuário',
          user_id: user.id
        });

      } else if (activeActionModal === 'TRANSFERIR') {
        // selectedMasterId é ID do INVENTÁRIO de origem
        const originItem = stockProp.find(s => s.id === selectedMasterId);
        if (!originItem || !formDestFarmId) {
          alert("Selecione origem e destino.");
          setLoading(false);
          return;
        }

        // Buscar ID da fazenda de origem pelo nome (o item do estoque tem nome da fazenda)
        // Idealmente teríamos o farm_id no objeto Insumo, mas vamos buscar pelo nome na lista de farms
        const originFarm = farms.find(f => f.name === originItem.farm);
        if (originFarm?.id === formDestFarmId) {
          alert("Destino deve ser diferente da origem.");
          setLoading(false);
          return;
        }

        if (qty > originItem.availableQty) {
          alert("Quantidade insuficiente.");
          setLoading(false);
          return;
        }

        // 1. Reduzir Origem
        await supabase.from('inventory').update({
          physical_stock: originItem.physicalStock - qty
        }).eq('id', originItem.id);

        await supabase.from('stock_history').insert({
          inventory_id: originItem.id,
          type: 'SAIDA',
          description: `Transferência para outra fazenda`,
          quantity: -qty,
          user_name: user.email?.split('@')[0] || 'Logística',
          user_id: user.id
        });

        // 2. Adicionar Destino
        // Precisamos do master_insumo_id. O objeto Insumo tem masterId.
        if (!originItem.masterId) {
          throw new Error("ID mestre não encontrado para o item.");
        }

        const { data: destExisting } = await supabase
          .from('inventory')
          .select('*')
          .eq('master_insumo_id', originItem.masterId)
          .eq('farm_id', formDestFarmId)
          .single();

        let destInvId = destExisting?.id;

        if (destExisting) {
          await supabase.from('inventory').update({
            physical_stock: Number(destExisting.physical_stock) + qty
          }).eq('id', destInvId);
        } else {
          const { data: newDest, error } = await supabase.from('inventory').insert({
            master_insumo_id: originItem.masterId,
            farm_id: formDestFarmId,
            physical_stock: qty,
            reserved_qty: 0,
            min_stock: 0,
            user_id: user.id
          }).select().single();
          if (error) throw error;
          destInvId = newDest.id;
        }

        await supabase.from('stock_history').insert({
          inventory_id: destInvId,
          type: 'ENTRADA',
          description: `Recebido por transferência de ${originItem.farm}`,
          quantity: qty,
          user_name: user.email?.split('@')[0] || 'Logística',
          user_id: user.id
        });
      }

      onRefresh(); // Atualiza tudo
      closeActionModal();

    } catch (error) {
      console.error("Erro na operação:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 print:p-0 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="space-y-6 print:hidden">
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

      {/* Action Buttons */}
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

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl print:border-none print:shadow-none">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-8">Produto</th>
                <th className="px-10 py-8">Ativo</th>
                <th className="px-10 py-8 text-center uppercase">Estoque Físico</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Reservados</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Qtd. Disponível</th>
                <th className="px-10 py-8 uppercase tracking-widest">Fazenda</th>
                <th className="px-10 py-8 text-center uppercase tracking-widest">Unidade</th>
                <th className="px-10 py-8 uppercase tracking-widest">Classe</th>
                <th className="px-10 py-8 text-right uppercase tracking-widest print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <ArrowDownRight size={14} className="text-emerald-500 shrink-0" />
                      <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-slate-500 text-[11px] font-bold tracking-tight uppercase">{item.activeIngredient}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-blue-600 font-black text-lg">{item.physicalStock.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-orange-500 font-black text-base">{item.reservedQty.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-emerald-600 font-black text-lg">{(item.physicalStock - item.reservedQty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">{item.farm}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-slate-500 text-[10px] font-black">{item.unit}</span>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                  </td>
                  <td className="px-10 py-8 text-right print:hidden">
                    <button 
                      onClick={() => handleHistoryClick(item)} 
                      className="flex items-center gap-2 ml-auto text-slate-400 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest italic"
                    >
                      <History size={14} /> HISTÓRICO
                    </button>
                  </td>
                </tr>
              ))}
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
               <button onClick={closeActionModal} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
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
               <button onClick={closeActionModal} className="px-12 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10">Fechar Histórico</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Action Modal (Entrada/Baixa/Transferencia) */}
      {(activeActionModal === 'ENTRADA_MANUAL' || activeActionModal === 'BAIXA_MANUAL' || activeActionModal === 'TRANSFERIR') && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                  {activeActionModal === 'ENTRADA_MANUAL' ? 'Entrada Manual' : 
                   activeActionModal === 'BAIXA_MANUAL' ? 'Baixa Manual' : 'Transferência entre Fazendas'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {activeActionModal === 'TRANSFERIR' ? 'Movimentação logística de ativos' : 'Ajuste de inventário operacional'}
                </p>
              </div>
              <button onClick={closeActionModal} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
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
                      {stockProp.map(i => <option key={i.id} value={i.id}>{i.name} - {i.farm} ({i.availableQty} {i.unit})</option>)}
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
                        {stockProp.map(i => <option key={i.id} value={i.id}>{i.name} ({i.farm}) - Disp: {i.availableQty} {i.unit}</option>)}
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

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button onClick={closeActionModal} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors" disabled={loading}>Cancelar</button>
              <button 
                onClick={handleActionSubmit} 
                className={`flex-1 ${
                  activeActionModal === 'ENTRADA_MANUAL' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 
                  activeActionModal === 'BAIXA_MANUAL' ? 'bg-[#f26522] hover:bg-orange-600 shadow-orange-500/20' : 
                  'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                } text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
                disabled={loading}
              >
                {activeActionModal === 'ENTRADA_MANUAL' ? <ArrowDownCircle size={18} /> : 
                 activeActionModal === 'BAIXA_MANUAL' ? <MinusCircle size={18} /> : <ArrowLeftRight size={18} />}
                {loading ? 'SALVANDO...' : 'CONFIRMAR OPERAÇÃO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;