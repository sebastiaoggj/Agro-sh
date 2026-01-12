
import React from 'react';
import { 
  FileText, 
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
  Eye,
  AlertCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { OrderStatus } from '../types';

const MOCK_ORDERS = [
  { id: '1', farm: 'ALIANÇA', field: 'TALHÃO NORTE 01', area: 85.0, culture: 'MILHO', status: OrderStatus.IN_PROGRESS, date: '15/03/2026', totalCost: 18450.00 },
  { id: '2', farm: 'SANTO AURÉLIO', field: 'PIVÔ 13', area: 240.0, culture: 'SOJA', status: OrderStatus.SCHEDULED, date: '18/03/2026', totalCost: 52800.00 },
  { id: '3', farm: 'MANGA', field: 'PC 44', area: 120.0, culture: 'ALGODÃO', status: OrderStatus.AWAITING_INSPECTION, date: '14/03/2026', totalCost: 31200.00 },
  { id: '4', farm: 'SANTO AURÉLIO', field: 'TALHÃO SUL', area: 55.0, culture: 'MILHO', status: OrderStatus.REWORK, date: '10/03/2026', totalCost: 11940.00 },
];

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles = {
    [OrderStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [OrderStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border-blue-100',
    [OrderStatus.SCHEDULED]: 'bg-slate-50 text-slate-500 border-slate-100',
    [OrderStatus.AWAITING_INSPECTION]: 'bg-amber-50 text-amber-600 border-amber-100',
    [OrderStatus.REWORK]: 'bg-red-50 text-red-600 border-red-100',
    [OrderStatus.DRAFT]: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  const labels = {
    [OrderStatus.IN_PROGRESS]: 'EM APLICAÇÃO',
    [OrderStatus.SCHEDULED]: 'AGENDADO',
    [OrderStatus.AWAITING_INSPECTION]: 'AGUARDANDO VISTORIA',
    [OrderStatus.REWORK]: 'RETRABALHO',
    [OrderStatus.COMPLETED]: 'CONCLUÍDO',
    [OrderStatus.DRAFT]: 'RASCUNHO',
  };

  const icons = {
    [OrderStatus.IN_PROGRESS]: <PlayCircle size={14} />,
    [OrderStatus.SCHEDULED]: <Clock size={14} />,
    [OrderStatus.AWAITING_INSPECTION]: <Clock size={14} className="opacity-50" />,
    [OrderStatus.REWORK]: <ShieldAlert size={14} />,
    [OrderStatus.COMPLETED]: <CheckCircle2 size={14} />,
    [OrderStatus.DRAFT]: <FileText size={14} />,
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

const Reports: React.FC = () => {
  const totalInvestment = MOCK_ORDERS.reduce((acc, order) => acc + (order.totalCost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
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
          title="Investimento Total" 
          value={`R$ ${totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          unit="Insumos" 
          icon={DollarSign} 
          color="bg-emerald-600" 
        />
        <MetricCard 
          title="Concluídas" 
          value="1.240" 
          unit="Ordens" 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
        <MetricCard 
          title="Em Execução" 
          value="12" 
          unit="Máquinas" 
          icon={PlayCircle} 
          color="bg-blue-500" 
        />
        <MetricCard 
          title="Reprovadas / RNC" 
          value="03" 
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
      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-8">Fazenda / Talhão</th>
                <th className="px-10 py-8"># / Área</th>
                <th className="px-10 py-8">Cultura</th>
                <th className="px-10 py-8">Custo Insumos</th>
                <th className="px-10 py-8">Status Atual</th>
                <th className="px-10 py-8">Data Planejada</th>
                <th className="px-10 py-8 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-300" />
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.farm}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">{order.field}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2">
                          <Hash size={14} className="text-slate-300" />
                          <span className="text-base font-black text-slate-900 tracking-tighter">{order.area.toFixed(1)} <span className="text-[10px] text-slate-400 not-italic uppercase ml-0.5">HA</span></span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{order.culture}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-emerald-600 tracking-tight italic">
                        R$ {order.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {(order.totalCost / order.area).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / HA
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-slate-300" />
                      <span className="text-xs font-black text-slate-700 tracking-widest">{order.date}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-95">
                      <MoreHorizontal size={24} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Pagination */}
        <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">EXIBINDO 5 DE 1.240 ORDENS</span>
           <div className="flex gap-4">
              <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">ANTERIOR</button>
              <button className="px-10 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:border-slate-400 transition-all shadow-sm">PRÓXIMA</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
