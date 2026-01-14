import React, { useState, useMemo } from 'react';
import { 
  Download, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  ShieldAlert, 
  MoreHorizontal, 
  Filter, 
  Search, 
  ChevronDown, 
  Calendar, 
  MapPin, 
  Hash,
  FileText,
  Droplets,
  Printer,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { OrderStatus, ServiceOrder } from '../types';
import OSPrintLayout from './OSPrintLayout';

interface ReportsProps {
  orders: ServiceOrder[];
  onEdit: (order: ServiceOrder) => void;
  onDelete: (id: string) => void;
}

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles = {
    [OrderStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [OrderStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border-blue-100',
    [OrderStatus.SCHEDULED]: 'bg-slate-50 text-slate-500 border-slate-100',
    [OrderStatus.AWAITING_INSPECTION]: 'bg-amber-50 text-amber-600 border-amber-100',
    [OrderStatus.REWORK]: 'bg-red-50 text-red-600 border-red-100',
    [OrderStatus.DRAFT]: 'bg-slate-50 text-slate-400 border-slate-100',
    [OrderStatus.EMITTED]: 'bg-purple-50 text-purple-600 border-purple-100',
    [OrderStatus.AWAITING_PRODUCT]: 'bg-orange-50 text-orange-600 border-orange-100',
    [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-500 border-gray-200',
    [OrderStatus.LATE]: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const labels = {
    [OrderStatus.IN_PROGRESS]: 'EM APLICAÇÃO',
    [OrderStatus.SCHEDULED]: 'AGENDADO',
    [OrderStatus.AWAITING_INSPECTION]: 'VISTORIA',
    [OrderStatus.REWORK]: 'RETRABALHO',
    [OrderStatus.COMPLETED]: 'CONCLUÍDO',
    [OrderStatus.DRAFT]: 'RASCUNHO',
    [OrderStatus.EMITTED]: 'EMITIDA',
    [OrderStatus.AWAITING_PRODUCT]: 'AGUARD. PRODUTO',
    [OrderStatus.CANCELLED]: 'CANCELADO',
    [OrderStatus.LATE]: 'ATRASADA',
  };

  const icons = {
    [OrderStatus.IN_PROGRESS]: <PlayCircle size={14} />,
    [OrderStatus.SCHEDULED]: <Clock size={14} />,
    [OrderStatus.AWAITING_INSPECTION]: <Clock size={14} className="opacity-50" />,
    [OrderStatus.REWORK]: <ShieldAlert size={14} />,
    [OrderStatus.COMPLETED]: <CheckCircle2 size={14} />,
    [OrderStatus.DRAFT]: <FileText size={14} />,
    [OrderStatus.EMITTED]: <FileText size={14} />,
    [OrderStatus.AWAITING_PRODUCT]: <Clock size={14} />,
    [OrderStatus.CANCELLED]: <ShieldAlert size={14} />,
    [OrderStatus.LATE]: <ShieldAlert size={14} />,
  };

  return (
    <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${styles[status] || styles[OrderStatus.DRAFT]}`}>
      {icons[status] || icons[OrderStatus.DRAFT]}
      {labels[status] || status}
    </span>
  );
};

const MetricCard: React.FC<{ title: string, value: string, unit: string, icon: any, color: string }> = ({ title, value, unit, icon: Icon, color }) => (
  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full ${color}`} />
    <div className={`${color} bg-opacity-10 p-5 rounded-[1.5rem] ${color.replace('bg-', 'text-')}`}>
      <Icon size={32} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">
        {value} <span className="text-xs text-slate-300 not-italic ml-1 uppercase">{unit}</span>
      </h4>
    </div>
  </div>
);

const Reports: React.FC<ReportsProps> = ({ orders, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);

  // Métricas calculadas com base nos dados reais
  const totalArea = orders.reduce((acc, order) => acc + (order.totalArea || 0), 0);
  const totalVolume = orders.reduce((acc, order) => acc + (order.totalVolume || 0), 0);
  const completedCount = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
  const inProgressCount = orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length;
  const reworkCount = orders.filter(o => o.status === OrderStatus.REWORK || o.status === OrderStatus.LATE).length;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.culture.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handlePrint = (order: ServiceOrder) => {
    setOrderToPrint(order);
    setActiveMenuId(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleMenuClick = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <>
      {/* Print Layout - Outside of the hidden container */}
      {orderToPrint && <OSPrintLayout order={orderToPrint} />}

      {/* Main Content - Hidden when printing */}
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative print:hidden">
        {/* Backdrop for menu */}
        {activeMenuId && (
          <div className="fixed inset-0 z-30 cursor-default" onClick={() => setActiveMenuId(null)} />
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Relatórios Operacionais</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Histórico consolidado de aplicações e performance de campo</p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={18} /> Filtros Avançados
            </button>
            <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard 
            title="Área Total Planejada" 
            value={totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
            unit="Hectares" 
            icon={Hash} 
            color="bg-emerald-600" 
          />
          <MetricCard 
            title="Volume de Calda" 
            value={(totalVolume / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} 
            unit="Mil Litros" 
            icon={Droplets} 
            color="bg-blue-600" 
          />
          <MetricCard 
            title="Ordens Concluídas" 
            value={completedCount.toString()} 
            unit="Execuções" 
            icon={CheckCircle2} 
            color="bg-emerald-500" 
          />
          <MetricCard 
            title="Atenção / Retrabalho" 
            value={reworkCount.toString()} 
            unit="Casos" 
            icon={ShieldAlert} 
            color="bg-red-500" 
          />
        </div>

        {/* Filters Row */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 flex flex-wrap items-center gap-6 shadow-sm">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR POR ID OU PROPRIEDADE..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative group">
            <select className="bg-white border border-slate-200 rounded-2xl pl-6 pr-14 py-4 text-[10px] font-black text-slate-600 outline-none appearance-none cursor-pointer shadow-sm uppercase tracking-widest">
              <option>Todas as Fazendas</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <div className="relative group">
            <select className="bg-white border border-slate-200 rounded-2xl pl-6 pr-14 py-4 text-[10px] font-black text-slate-600 outline-none appearance-none cursor-pointer shadow-sm uppercase tracking-widest">
              <option>Safra 2025/26</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl min-h-[500px]">
          <div className="overflow-x-visible custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-10 py-8">Fazenda / Talhão</th>
                  <th className="px-10 py-8"># / Área</th>
                  <th className="px-10 py-8">Cultura</th>
                  <th className="px-10 py-8">Volume Calda</th>
                  <th className="px-10 py-8">Status Atual</th>
                  <th className="px-10 py-8">Limite Aplicação</th>
                  <th className="px-10 py-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-slate-300" />
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.farmName}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5 truncate max-w-[200px]">
                            {order.fieldNames.join(', ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-400 uppercase mb-1">#{order.orderNumber}</span>
                          <div className="flex items-center gap-2">
                              <Hash size={14} className="text-slate-300" />
                              <span className="text-base font-black text-slate-900 tracking-tighter">{order.totalArea.toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400 not-italic uppercase ml-0.5">HA</span></span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{order.culture}</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-blue-600 tracking-tight italic">
                            {order.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} L
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {order.flowRate} L/HA
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-slate-300" />
                          <span className="text-xs font-black text-slate-700 tracking-widest">{order.maxApplicationDate ? new Date(order.maxApplicationDate).toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMenuClick(order.id); }}
                          className={`p-3 rounded-2xl transition-all active:scale-95 ${activeMenuId === order.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                          {activeMenuId === order.id ? <X size={20} /> : <MoreHorizontal size={20} />}
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === order.id && (
                          <div className="absolute right-12 top-14 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                             <div className="p-1.5 space-y-0.5">
                               <button 
                                onClick={() => handlePrint(order)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest"
                               >
                                 <Printer size={16} /> Imprimir OS
                               </button>
                               <button 
                                onClick={() => { onEdit(order); setActiveMenuId(null); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest"
                               >
                                 <Edit size={16} /> Editar Dados
                               </button>
                               <div className="h-px bg-slate-100 mx-2 my-1" />
                               <button 
                                onClick={() => { if(confirm('Excluir esta ordem?')) onDelete(order.id); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest"
                               >
                                 <Trash2 size={16} /> Excluir Registro
                               </button>
                             </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">
                      Nenhuma ordem encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer / Pagination */}
          <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               EXIBINDO {filteredOrders.length} DE {orders.length} ORDENS
             </span>
             <div className="flex gap-4">
                <button disabled className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed">ANTERIOR</button>
                <button disabled className="px-10 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed shadow-sm">PRÓXIMA</button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;