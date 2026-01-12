
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, Search, Filter, Plus, X, ChevronDown, 
  ArrowDownRight, History, Calendar, DollarSign, Package,
  CheckCircle2, Trash2, Save, MapPin, PackageCheck, Clock,
  Beaker, Truck, FileText
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, MasterInsumo } from '../types';

interface PurchaseOrdersProps {
  orders: PurchaseOrder[];
  farms: string[];
  masterInsumos: MasterInsumo[];
  onApprove: (id: string) => void;
  onReceive: (id: string, supplier: string, nf: string) => void;
  onSave: (order: PurchaseOrder) => void;
  onDelete: (id: string) => void;
  onRepeat: (order: PurchaseOrder) => void;
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ 
  orders, 
  farms, 
  masterInsumos,
  onApprove, 
  onReceive, 
  onSave, 
  onDelete, 
  onRepeat 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrderToReceive, setSelectedOrderToReceive] = useState<PurchaseOrder | null>(null);
  
  const [receiptData, setReceiptData] = useState({
    supplier: '',
    invoiceNumber: ''
  });

  const [formData, setFormData] = useState<Partial<PurchaseOrder & { unitPrice: number, selectedInsumoId: string }>>({
    status: PurchaseOrderStatus.PENDING,
    unit: 'LT',
    farmName: '',
    quantity: 0,
    unitPrice: 0,
    totalValue: 0,
    selectedInsumoId: ''
  });

  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const price = Number(formData.unitPrice) || 0;
    const total = qty * price;
    if (total !== formData.totalValue) {
      setFormData(prev => ({ ...prev, totalValue: total }));
    }
  }, [formData.quantity, formData.unitPrice]);

  const handleProductSelect = (insumoId: string) => {
    const selected = masterInsumos.find(i => i.id === insumoId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        selectedInsumoId: insumoId,
        productName: selected.name,
        unit: selected.unit,
        quantity: selected.defaultPurchaseQty || 0,
        unitPrice: selected.price || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedInsumoId: '',
        productName: '',
        unit: 'LT',
        quantity: 0,
        unitPrice: 0
      }));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === PurchaseOrderStatus.PENDING || o.status === PurchaseOrderStatus.APPROVED).length;
    const receivedCount = orders.filter(o => o.status === PurchaseOrderStatus.RECEIVED).length;
    const totalInvested = orders.reduce((acc, curr) => acc + curr.totalValue, 0);
    return { pending, receivedCount, totalInvested };
  }, [orders]);

  const getStatusStyle = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING: return 'bg-orange-50 text-orange-600 border-orange-100';
      case PurchaseOrderStatus.APPROVED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case PurchaseOrderStatus.RECEIVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleSaveClick = () => {
    if (!formData.farmName || !formData.productName) {
      alert("Por favor, preencha o produto e a fazenda de destino.");
      return;
    }
    const newOrder: PurchaseOrder = {
      id: Date.now().toString(),
      orderNumber: `2026-PO${(orders.length + 1).toString().padStart(3, '0')}`,
      supplier: 'CATÁLOGO INTERNO',
      productName: (formData.productName || 'N/A').toUpperCase(),
      farmName: formData.farmName || '',
      quantity: Number(formData.quantity) || 0,
      unit: formData.unit || 'LT',
      totalValue: Number(formData.totalValue) || 0,
      orderDate: new Date().toLocaleDateString('pt-BR'),
      expectedDelivery: formData.expectedDelivery || '-',
      status: PurchaseOrderStatus.PENDING,
    };
    onSave(newOrder);
    setIsModalOpen(false);
    setFormData({ status: PurchaseOrderStatus.PENDING, unit: 'LT', farmName: '', quantity: 0, unitPrice: 0, totalValue: 0, selectedInsumoId: '' });
  };

  const openReceiveModal = (order: PurchaseOrder) => {
    setSelectedOrderToReceive(order);
    setReceiptData({
      supplier: order.supplier,
      invoiceNumber: ''
    });
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = () => {
    if (!receiptData.supplier || !receiptData.invoiceNumber) {
      alert("Por favor, preencha o fornecedor e o número da NF.");
      return;
    }
    if (selectedOrderToReceive) {
      onReceive(selectedOrderToReceive.id, receiptData.supplier, receiptData.invoiceNumber);
      setIsReceiveModalOpen(false);
      setSelectedOrderToReceive(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Pedidos de Compra</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Gestão centralizada de aquisições de insumos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#f26522] hover:bg-orange-600 text-white px-10 py-5 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/10 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} className="border-2 border-white rounded-lg p-0.5" /> NOVO PEDIDO
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="p-5 bg-orange-50 text-orange-500 rounded-[1.5rem]">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Aguardando</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{stats.pending} <span className="text-xs text-slate-300 not-italic ml-1">PEDIDOS</span></h4>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="p-5 bg-emerald-50 text-emerald-500 rounded-[1.5rem]">
            <Package size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Recebidos</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{stats.receivedCount} <span className="text-xs text-slate-300 not-italic ml-1">ITENS</span></h4>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm">
          <div className="p-5 bg-blue-50 text-blue-500 rounded-[1.5rem]">
            <DollarSign size={32} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Valor Total</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#f8fafc] border border-slate-200 rounded-[3rem] p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[300px] group">
          <input 
            type="text" 
            placeholder="BUSCAR POR PRODUTO OU NÚMERO..." 
            className="w-full bg-white border-none rounded-[2.5rem] px-8 py-5 text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest placeholder:text-slate-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={18} className="text-slate-400" /> FILTROS
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-10">PRODUTO / FAZENDA</th>
                <th className="px-10 py-10 text-center">QUANTIDADE</th>
                <th className="px-10 py-10 text-center">VALOR TOTAL</th>
                <th className="px-10 py-10 text-center">STATUS</th>
                <th className="px-10 py-10 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-4">
                      <ArrowDownRight size={14} className="text-emerald-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-base uppercase tracking-tight leading-none">{order.productName}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">{order.farmName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <span className="text-slate-900 font-black text-xl tracking-tight">{order.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">{order.unit}</span></span>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 font-black text-[10px] italic leading-none mb-1">R$</span>
                      <span className="text-emerald-600 font-black text-xl italic leading-none">{order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <span className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)} shadow-sm`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {order.status === PurchaseOrderStatus.PENDING && (
                         <button onClick={() => onApprove(order.id)} className="p-3 text-slate-300 hover:text-blue-500 transition-all" title="Aprovar Pedido">
                           <CheckCircle2 size={24} strokeWidth={1.5} />
                         </button>
                       )}
                       {order.status === PurchaseOrderStatus.APPROVED && (
                         <button onClick={() => openReceiveModal(order)} className="p-3 text-slate-300 hover:text-emerald-500 transition-all" title="Receber no Estoque">
                           <PackageCheck size={24} strokeWidth={1.5} />
                         </button>
                       )}
                       <button onClick={() => onDelete(order.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all" title="Excluir">
                         <Trash2 size={24} strokeWidth={1.5} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Novo Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95 max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Novo Pedido de Compra</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Requisição vinculada ao catálogo interno</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Produto do Catálogo</label>
                  <div className="relative">
                    <Beaker className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none uppercase"
                      value={formData.selectedInsumoId || ''}
                      onChange={(e) => handleProductSelect(e.target.value)}
                    >
                      <option value="">Selecione um Insumo...</option>
                      {masterInsumos.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fazenda de Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none uppercase" 
                      value={formData.farmName || ''} 
                      onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                    >
                      <option value="">Selecione a Fazenda...</option>
                      {farms.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Quantidade</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm" 
                    value={formData.quantity || ''} 
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} 
                  />
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">Preenchido Automaticamente</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Unidade</label>
                  <input 
                    type="text" 
                    disabled 
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-slate-400 font-black uppercase text-sm" 
                    value={formData.unit || 'LT'} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Valor Unitário</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm" 
                    value={formData.unitPrice || ''} 
                    onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total Estimado</p>
                  <h4 className="text-4xl font-black text-emerald-600 italic tracking-tighter">
                    R$ {formData.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase italic">Ordem Gerada Automaticamente</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6 shrink-0 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900">Cancelar</button>
              <button onClick={handleSaveClick} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-all">CRIAR PEDIDO</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Confirmação de Recebimento */}
      {isReceiveModalOpen && selectedOrderToReceive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Confirmar Recebimento</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Entrada de Insumo no Estoque Físico</p>
               </div>
               <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center gap-4">
               <div className="p-3 bg-white border border-slate-100 rounded-xl text-emerald-600">
                  <Package size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto / Quantidade</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{selectedOrderToReceive.productName} - {selectedOrderToReceive.quantity} {selectedOrderToReceive.unit}</p>
               </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fornecedor</label>
                <div className="relative">
                  <Truck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 uppercase" 
                    placeholder="NOME DO FORNECEDOR"
                    value={receiptData.supplier}
                    onChange={(e) => setReceiptData({...receiptData, supplier: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Número da Nota Fiscal (NF)</label>
                <div className="relative">
                  <FileText className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 uppercase" 
                    placeholder="EX: 000.123.456"
                    value={receiptData.invoiceNumber}
                    onChange={(e) => setReceiptData({...receiptData, invoiceNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-6 shrink-0 border-t border-slate-100">
              <button onClick={() => setIsReceiveModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900">Cancelar</button>
              <button onClick={handleConfirmReceive} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-all uppercase tracking-widest text-[11px]">Confirmar Recebimento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
