import React, { useState } from 'react';
import { 
  Play, 
  Edit3, 
  XCircle, 
  CheckCircle2, 
  Tractor, 
  Hash, 
  Layers, 
  Sprout, 
  Droplets,
  AlertTriangle,
  Plus,
  Box,
  Search,
  X,
  ArrowUpCircle,
  Save,
  Beaker,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  PackageCheck,
  Undo2,
  ShoppingCart,
  CalendarPlus,
  PlusCircle,
  Clock
} from 'lucide-react';
import { ServiceOrder, OrderStatus, OperationType } from '../types';

interface OSCardProps {
  order: ServiceOrder;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onFinalizeClick: (order: ServiceOrder) => void;
  onEditClick: (order: ServiceOrder) => void;
  onCancelClick: (order: ServiceOrder) => void;
  onMakePurchaseClick: (order: ServiceOrder) => void;
  onPartialClick: (order: ServiceOrder) => void;
  onAdditionClick: (order: ServiceOrder) => void;
}

const OSCard: React.FC<OSCardProps> = ({ 
  order, 
  onStatusChange, 
  onFinalizeClick, 
  onEditClick, 
  onCancelClick, 
  onMakePurchaseClick,
  onPartialClick,
  onAdditionClick
}) => {
  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.EMITTED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case OrderStatus.AWAITING_PRODUCT: return 'bg-amber-50 text-amber-600 border-amber-100';
      case OrderStatus.IN_PROGRESS: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case OrderStatus.LATE: return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getTypeIcon = (type: OperationType) => {
    switch (type) {
      case 'PLANTIO': return <Sprout size={18} strokeWidth={2.5} />;
      case 'ADUBACAO': return <Layers size={18} strokeWidth={2.5} />;
      default: return <Droplets size={18} strokeWidth={2.5} />;
    }
  };

  const getTypeName = (type: OperationType) => {
    switch (type) {
      case 'PLANTIO': return 'PLANTIO';
      case 'ADUBACAO': return 'ADUBAÇÃO';
      default: return 'PULVERIZAÇÃO'; // Fallback
    }
  };

  // Safe check for type since DB might have nulls for old records
  const opType = order.operationType || 'PULVERIZACAO';
  const executed = order.executedArea || 0;
  const progress = (executed / (order.totalArea || 1)) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-5 group relative overflow-hidden text-slate-900">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-10 group-hover:scale-110 transition-transform" />
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic">{order.orderNumber}</h4>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{order.farmName}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadgeStyle(order.status)} shadow-sm`}>
          {order.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tractor size={16} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{order.machineType || 'Máquina'}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">Aplicar até</span>
            </div>
            <p className="text-xs font-black text-slate-900">{order.maxApplicationDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <Sprout size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{order.culture}</span>
          </div>
        </div>
        <div className="space-y-4 pl-4 border-l border-slate-100">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-slate-400">
               <Layers size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Talhões:</span>
             </div>
             <div className="flex flex-wrap gap-1">
               {order.fieldNames && order.fieldNames.map((f, i) => (
                 <span key={i} className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-100">{f}</span>
               ))}
             </div>
          </div>
          <div className="space-y-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área Total</span>
             <div className="flex items-center gap-1.5">
                <Hash size={14} className="text-slate-300" />
                <span className="text-lg font-black text-slate-900 tracking-tighter">{order.totalArea?.toFixed(2)} ha</span>
             </div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Real */}
      {order.status === OrderStatus.IN_PROGRESS && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-emerald-600">Realizado: {executed.toFixed(1)} ha</span>
            <span className="text-slate-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl border ${opType === 'PLANTIO' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : opType === 'ADUBACAO' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
          {getTypeIcon(opType)}
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] italic">{getTypeName(opType)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        {/* Caso 1: Emitida */}
        {order.status === OrderStatus.EMITTED && (
           <button onClick={() => onStatusChange(order.id, OrderStatus.IN_PROGRESS)} className="col-span-3 bg-[#f26522] hover:bg-orange-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black transition-all shadow-lg active:scale-95">
             <Play size={16} fill="currentColor" /> Iniciar Aplicação
           </button>
        )}

        {/* Caso 2: Aguardando Produto */}
        {order.status === OrderStatus.AWAITING_PRODUCT && (
           <button onClick={() => onMakePurchaseClick(order)} className="col-span-3 bg-amber-400 hover:bg-amber-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black transition-all shadow-lg active:scale-95 shadow-amber-500/20">
             <ShoppingCart size={16} /> Comprar Insumos
           </button>
        )}

        {/* Botões Secundários */}
        {(order.status === OrderStatus.EMITTED || order.status === OrderStatus.AWAITING_PRODUCT) && (
          <div className="col-span-3 grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => onEditClick(order)} className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black transition-all active:scale-95 shadow-sm">
              <Edit3 size={14} /> Editar
            </button>
            <button onClick={() => onCancelClick(order)} className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black transition-all active:scale-95 shadow-sm">
              <XCircle size={14} /> Cancelar
            </button>
          </div>
        )}

        {/* Caso 3: Em Aplicação (Novos Botões) */}
        {order.status === OrderStatus.IN_PROGRESS && (
          <>
            <button onClick={() => onPartialClick(order)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[9px] font-black transition-all active:scale-95" title="Apontar Parcial">
              <CalendarPlus size={18} /> PARCIAL
            </button>
            <button onClick={() => onAdditionClick(order)} className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[9px] font-black transition-all active:scale-95" title="Aditivo de Material">
              <PlusCircle size={18} /> ADITIVO
            </button>
            <button onClick={() => onFinalizeClick(order)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[9px] font-black transition-all active:scale-95 shadow-md shadow-emerald-500/20" title="Finalizar Ordem">
              <CheckCircle2 size={18} /> FINALIZAR
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<any> = ({ title, count, totalArea, orders, onStatusChange, onFinalizeClick, onEditOrder, onCancelOrder, onMakePurchaseClick, onPartialClick, onAdditionClick }) => (
  <div className="flex flex-col h-full min-w-[380px] max-w-[440px] bg-slate-50/50 rounded-[2.5rem] p-4 border border-slate-100 text-slate-900">
    <div className="flex items-center justify-between mb-6 px-6 py-4 bg-white/50 backdrop-blur rounded-3xl border border-white/50 shadow-sm">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest italic">{title}</h3>
        <span className="bg-slate-200 text-slate-600 w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-inner">{count}</span>
      </div>
      <div className="text-right">
        <p className="text-xl font-black text-slate-900 tracking-tighter">{totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">ha</span></p>
      </div>
    </div>
    <div className="flex-1 space-y-6 overflow-y-auto px-2 custom-scrollbar pb-10">
      {orders.map((order: ServiceOrder) => (
        <OSCard 
          key={order.id} 
          order={order} 
          onStatusChange={onStatusChange} 
          onFinalizeClick={onFinalizeClick} 
          onEditClick={onEditOrder} 
          onCancelClick={onCancelOrder}
          onMakePurchaseClick={onMakePurchaseClick}
          onPartialClick={onPartialClick}
          onAdditionClick={onAdditionClick}
        />
      ))}
      {orders.length === 0 && <div className="bg-white/40 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center justify-center gap-5"><Layers size={56} className="text-slate-200" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Painel Vazio</p></div>}
    </div>
  </div>
);

interface OSKanbanProps {
  orders: ServiceOrder[];
  onUpdateStatus: (id: string, newStatus: OrderStatus, leftovers?: Record<string, number>) => void;
  onEditOrder: (order: ServiceOrder) => void;
  onCreateOrder: () => void;
  onDeleteOrder: (id: string) => void;
  onMakePurchaseClick: (order: ServiceOrder) => void;
  onRegisterPartial: (orderId: string, date: string, area: number, description: string) => void;
  onRegisterAddition: (orderId: string, items: {insumoId: string, qty: number}[], description: string) => void;
}

const OSKanban: React.FC<OSKanbanProps> = ({ orders, onUpdateStatus, onEditOrder, onCreateOrder, onDeleteOrder, onMakePurchaseClick, onRegisterPartial, onRegisterAddition }) => {
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [additionModalOpen, setAdditionModalOpen] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [hasLeftovers, setHasLeftovers] = useState<boolean | null>(null);
  const [leftoverInputs, setLeftoverInputs] = useState<Record<string, number>>({});

  // States para Parcial
  const [partialData, setPartialData] = useState({ date: new Date().toISOString().split('T')[0], area: '', description: '' });
  
  // States para Aditivo
  const [additionData, setAdditionData] = useState({ 
    description: '', 
    items: [] as {insumoId: string, qty: number, name: string, unit: string}[] 
  });
  const [selectedAddItem, setSelectedAddItem] = useState('');
  const [addQty, setAddQty] = useState('');

  // --- Handlers ---

  const handleFinalizeClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setFinalizeModalOpen(true);
    setHasLeftovers(null);
    setLeftoverInputs({});
  };

  const handlePartialClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setPartialData({ date: new Date().toISOString().split('T')[0], area: '', description: '' });
    setPartialModalOpen(true);
  };

  const handleAdditionClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setAdditionData({ description: '', items: [] });
    setAdditionModalOpen(true);
  };

  const closeModals = () => {
    setFinalizeModalOpen(false);
    setPartialModalOpen(false);
    setAdditionModalOpen(false);
    setSelectedOrder(null);
  };

  const confirmPartial = () => {
    if (selectedOrder && partialData.area) {
      onRegisterPartial(selectedOrder.id, partialData.date, Number(partialData.area), partialData.description);
      closeModals();
    }
  };

  const addAdditionItem = () => {
    if (!selectedOrder || !selectedAddItem || !addQty) return;
    const itemRef = selectedOrder.items.find(i => i.insumoId === selectedAddItem);
    if (itemRef) {
      setAdditionData(prev => ({
        ...prev,
        items: [...prev.items, { insumoId: selectedAddItem, qty: Number(addQty), name: itemRef.productName, unit: 'UN' }] // Unit simplificado, idealmente viria do item
      }));
      setSelectedAddItem('');
      setAddQty('');
    }
  };

  const removeAdditionItem = (idx: number) => {
    setAdditionData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const confirmAddition = () => {
    if (selectedOrder && additionData.items.length > 0) {
      onRegisterAddition(selectedOrder.id, additionData.items, additionData.description);
      closeModals();
    }
  };

  const handleLeftoverChange = (insumoId: string, val: string) => {
    setLeftoverInputs(prev => ({ ...prev, [insumoId]: parseFloat(val) || 0 }));
  };

  const confirmFinalization = () => {
    if (selectedOrder) {
      onUpdateStatus(selectedOrder.id, OrderStatus.COMPLETED, hasLeftovers ? leftoverInputs : undefined);
      closeModals();
    }
  };

  const columns = [
    { title: 'Emitidas', status: OrderStatus.EMITTED },
    { title: 'Aguardando Produto', status: OrderStatus.AWAITING_PRODUCT },
    { title: 'Em Aplicação', status: OrderStatus.IN_PROGRESS },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden pt-12 text-slate-900">
      <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12 px-12">
        <div className="flex items-center gap-12">
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Painel Principal</h1>
          <div className="bg-white border border-slate-200 px-8 py-4 rounded-[2rem] flex items-center gap-8 shadow-sm">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">DATA ATUAL</span>
               <span className="text-base font-black text-emerald-600 italic mt-1">{new Date().toLocaleDateString('pt-BR')}</span>
             </div>
             <div className="w-px h-10 bg-slate-100" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ORDENS ATIVAS</span>
               <span className="text-base font-black text-slate-800 mt-1">{orders.length}</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onCreateOrder}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} className="border-2 border-white rounded-lg p-0.5" /> NOVA ORDEM
          </button>
          <div className="relative flex-1 md:w-80 group">
            <input type="text" placeholder="PESQUISAR ORDEM..." className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-14 py-4.5 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase shadow-sm" />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar px-12">
        <div className="flex gap-10 h-full min-w-max pb-4">
          {columns.map(col => (
            <KanbanColumn 
              key={col.status} 
              title={col.title} 
              count={orders.filter(o => o.status === col.status).length} 
              totalArea={orders.filter(o => o.status === col.status).reduce((acc, curr) => acc + (curr.totalArea || 0), 0)} 
              orders={orders.filter(o => o.status === col.status)} 
              onStatusChange={onUpdateStatus} 
              onFinalizeClick={handleFinalizeClick} 
              onEditOrder={onEditOrder} 
              onCancelOrder={(order: ServiceOrder) => onDeleteOrder(order.id)}
              onMakePurchaseClick={onMakePurchaseClick}
              onPartialClick={handlePartialClick}
              onAdditionClick={handleAdditionClick}
            />
          ))}
        </div>
      </div>

      {/* Modal: Finalizar */}
      {finalizeModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 border border-white max-h-[90vh] flex flex-col text-slate-900">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Finalizar Operação</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ordem #{selectedOrder.orderNumber}</p>
               </div>
               <button onClick={closeModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-2">
              <div className="space-y-6">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block text-center">Houve excedente de insumo no tanque?</label>
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setHasLeftovers(true)} className={`p-6 rounded-3xl border-2 font-black text-xs uppercase tracking-widest transition-all ${hasLeftovers === true ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Sim, houve sobra</button>
                  <button onClick={() => setHasLeftovers(false)} className={`p-6 rounded-3xl border-2 font-black text-xs uppercase tracking-widest transition-all ${hasLeftovers === false ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Não, carga completa</button>
                </div>
              </div>

              {hasLeftovers && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4 text-emerald-600 border-b border-slate-100 pb-4">
                    <Undo2 size={22} strokeWidth={2.5} />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] italic">Detalhamento de Sobras</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedOrder.items && selectedOrder.items.map((item) => (
                      <div key={item.insumoId} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <Beaker size={20} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase">{item.productName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              TOTAL UTILIZADO: <span className="text-slate-900 font-black">{item.qtyTotal.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="relative w-40">
                          <input 
                            type="number" 
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center"
                            value={leftoverInputs[item.insumoId] || ''}
                            onChange={(e) => handleLeftoverChange(item.insumoId, e.target.value)}
                          />
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase whitespace-nowrap">QTDE SOBRANTE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-6 pt-6 shrink-0 border-t border-slate-50">
              <button onClick={closeModals} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900">Cancelar</button>
              <button 
                onClick={confirmFinalization} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                disabled={hasLeftovers === null}
              >
                ENCERRAR E ESTORNAR <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Apontamento Parcial */}
      {partialModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 border border-white">
            <div className="flex justify-between items-center">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Apontamento Parcial</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registre o avanço diário</p>
               </div>
               <button onClick={closeModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Data da Execução</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-500" 
                  value={partialData.date}
                  onChange={(e) => setPartialData({...partialData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Área Realizada (ha)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black outline-none focus:ring-2 focus:ring-blue-500"
                    value={partialData.area}
                    onChange={(e) => setPartialData({...partialData, area: e.target.value})}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">HA</div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 ml-1">
                  Restante: {(selectedOrder.totalArea - (selectedOrder.executedArea || 0)).toFixed(2)} ha
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Observações (Opcional)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="Detalhes da operação..."
                  value={partialData.description}
                  onChange={(e) => setPartialData({...partialData, description: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={confirmPartial} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
            >
              <Save size={18} /> Confirmar Parcial
            </button>
          </div>
        </div>
      )}

      {/* Modal: Aditivo de Material */}
      {additionModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 border border-white">
            <div className="flex justify-between items-center">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Aditivo de Material</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Adicionar insumo extra (consumo não planejado)</p>
               </div>
               <button onClick={closeModals} className="text-slate-300 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>

            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-[9px] font-black uppercase text-amber-600 tracking-widest ml-1">Produto da Ordem</label>
                  <select 
                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    value={selectedAddItem}
                    onChange={(e) => setSelectedAddItem(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {selectedOrder.items.map(i => (
                      <option key={i.insumoId} value={i.insumoId}>{i.productName}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-[9px] font-black uppercase text-amber-600 tracking-widest ml-1">Qtde Extra</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                  />
                </div>
                <button 
                  onClick={addAdditionItem}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>

              {additionData.items.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Itens Adicionados</p>
                  {additionData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-amber-600">+{item.qty}</span>
                        <button onClick={() => removeAdditionItem(idx)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Motivo do Aditivo</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500 resize-none h-20"
                placeholder="Ex: Vazamento, erro de calibração, repasse..."
                value={additionData.description}
                onChange={(e) => setAdditionData({...additionData, description: e.target.value})}
              />
            </div>

            <button 
              onClick={confirmAddition} 
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              disabled={additionData.items.length === 0}
            >
              <PackageCheck size={18} /> Confirmar Aditivo (Baixa Estoque)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OSKanban;