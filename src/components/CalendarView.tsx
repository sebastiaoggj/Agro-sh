import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Tractor, 
  MapPin, 
  Hash,
  AlertTriangle,
  Layers,
  Search as SearchIcon,
  Filter,
  Droplets,
  Plus
} from 'lucide-react';
import { ServiceOrder, OrderStatus } from '../types';

interface CalendarViewProps {
  orders: ServiceOrder[];
}

const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const CalendarView: React.FC<CalendarViewProps> = ({ orders: globalOrders }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Preencher dias do mês anterior
    const firstDayIndex = firstDay.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, currentMonth: false });
    }
    
    // Preencher dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }
    
    // Preencher dias do próximo mês
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const filteredOrders = useMemo(() => {
    return globalOrders.filter(o => 
      // Filtra ordens concluídas
      o.status !== OrderStatus.COMPLETED && 
      (
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.culture.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [globalOrders, searchTerm]);

  const getOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredOrders.filter(o => {
      const osDate = o.maxApplicationDate;
      return osDate === dateStr;
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.IN_PROGRESS: return 'bg-emerald-500';
      case OrderStatus.AWAITING_PRODUCT: return 'bg-amber-500';
      // Removido COMPLETED pois não será exibido
      case OrderStatus.REWORK: return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Calendário Operacional</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">Cronograma consolidado de aplicações e janelas máximas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-[2rem] shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 hover:text-emerald-500 transition-all active:scale-95">
              <ChevronLeft size={20} strokeWidth={3} />
            </button>
            <span className="px-6 text-xs font-black text-slate-900 uppercase tracking-[0.2em] min-w-[180px] text-center italic">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 hover:text-emerald-500 transition-all active:scale-95">
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>

          <div className="relative flex-1 md:w-64 group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="PESQUISAR..." 
              className="w-full bg-white border border-slate-200 rounded-[2rem] pl-14 pr-6 py-4 text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-widest shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-xl">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="px-4 py-6 text-center">
              <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] italic">{day}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {daysInMonth.map((dayObj, idx) => {
            const dayOrders = getOrdersForDate(dayObj.date);
            const isToday = new Date().toDateString() === dayObj.date.toDateString();
            
            return (
              <div 
                key={idx} 
                className={`min-h-[160px] p-4 flex flex-col gap-3 transition-all hover:bg-slate-50/50 ${!dayObj.currentMonth ? 'bg-slate-50/30' : 'bg-white'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-xl transition-all ${
                    isToday ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 
                    !dayObj.currentMonth ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    {dayObj.date.getDate()}
                  </span>
                  {dayOrders.length > 0 && (
                    <div className="bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded-lg border border-slate-800 shadow-sm animate-in zoom-in-95">
                      {dayOrders.length} OS
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {dayOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-sm hover:border-emerald-500 hover:bg-white transition-all cursor-pointer group animate-in slide-in-from-top-2"
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[9px] font-black text-slate-900 leading-none italic">#{order.orderNumber}</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate mb-2">{order.farmName}</p>
                      <div className="flex items-center gap-2">
                        <Tractor size={10} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter truncate">{order.culture}</span>
                      </div>
                    </div>
                  ))}
                  {dayOrders.length === 0 && dayObj.currentMonth && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus size={16} className="text-slate-100" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-wrap gap-10 items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Em Aplicação</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Aguardando Prod.</span>
        </div>
        {/* Removido legenda de Concluída pois não aparece mais */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Agendado</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Retrabalho</span>
        </div>
        
        <div className="ml-auto flex items-center gap-6">
           <div className="flex items-center gap-3 text-emerald-600">
              <Hash size={16} />
              <span className="text-xs font-black uppercase tracking-widest italic">{filteredOrders.length} Ordens Ativas</span>
           </div>
           <div className="flex items-center gap-3 text-blue-600">
              <Layers size={16} />
              <span className="text-xs font-black uppercase tracking-widest italic">{filteredOrders.reduce((acc, o) => acc + o.totalArea, 0).toLocaleString()} ha Planejados</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;