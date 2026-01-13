import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Zap, 
  Map as MapIcon, Sprout, Tractor, Package,
  AlertCircle
} from 'lucide-react';
import { ServiceOrder, Insumo, OrderStatus } from '../types';

interface StatsViewProps {
  orders: ServiceOrder[];
  inventory: Insumo[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const KPICard: React.FC<{ title: string, value: string, sub: string, icon: any, color: string, trend?: { val: string, positive: boolean } }> = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-500`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend.val}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{sub}</p>
  </div>
);

const StatsView: React.FC<StatsViewProps> = ({ orders, inventory }) => {
  
  // 1. Cálculos de KPI
  const kpis = useMemo(() => {
    const totalArea = orders.reduce((acc, o) => acc + o.totalArea, 0);
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const executedArea = completedOrders.reduce((acc, o) => acc + o.totalArea, 0);
    
    // Eficiência: Média de área por ordem (simples proxy para eficiência)
    const avgAreaPerOrder = orders.length > 0 ? totalArea / orders.length : 0;
    
    // Estoque: Volume total físico
    const totalStockVolume = inventory.reduce((acc, i) => acc + i.physicalStock, 0);
    
    // Retrabalho: Ordens com status REWORK ou LATE
    const reworkCount = orders.filter(o => o.status === OrderStatus.REWORK || o.status === OrderStatus.LATE).length;
    const reworkRate = orders.length > 0 ? (reworkCount / orders.length) * 100 : 0;

    return {
      totalArea,
      executedArea,
      completionRate: totalArea > 0 ? (executedArea / totalArea) * 100 : 0,
      avgAreaPerOrder,
      totalStockVolume,
      reworkRate,
      reworkCount
    };
  }, [orders, inventory]);

  // 2. Gráfico de Evolução (Área por Data de Recomendação)
  const productivityData = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      // Usando data de recomendação como base temporal. Idealmente seria data de execução.
      const dateStr = order.recommendationDate ? new Date(order.recommendationDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/D';
      acc[dateStr] = (acc[dateStr] || 0) + order.totalArea;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([day, area]) => ({ day, area }))
      // Ordenar simples por string dia/mês (funciona para mesmo ano)
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [orders]);

  // 3. Distribuição de Status
  const statusDistribution = useMemo(() => {
    const counts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.length > 12 ? name.substring(0, 10) + '...' : name, 
      value 
    }));
  }, [orders]);

  // 4. Performance por Máquina
  const machinePerformance = useMemo(() => {
    const grouped = orders.reduce((acc: Record<string, number>, order) => {
      const machine = order.machineName || 'N/A';
      acc[machine] = (acc[machine] || 0) + order.totalArea;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, ha]) => ({ name, ha: Number(ha) }))
      .sort((a, b) => b.ha - a.ha); // Maior área primeiro
  }, [orders]);

  // 5. Mix de Culturas
  const cultureData = useMemo(() => {
    const grouped = orders.reduce((acc: Record<string, number>, order) => {
      const cult = order.culture || 'N/A';
      acc[cult] = (acc[cult] || 0) + order.totalArea;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, area]) => ({ name, area: Number(area) }))
      .sort((a, b) => b.area - a.area);
  }, [orders]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Painel de Estatísticas</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Visão 360º da Produtividade e Eficiência da Safra.</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none uppercase shadow-sm">
            <option>Safra Atual</option>
          </select>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
            Baixar BI
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Área Planejada" 
          value={`${kpis.totalArea.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha`} 
          sub={`Executado: ${kpis.completionRate.toFixed(1)}%`} 
          icon={MapIcon} 
          color="bg-blue-500"
        />
        <KPICard 
          title="Média por Ordem" 
          value={`${kpis.avgAreaPerOrder.toFixed(1)} ha`} 
          sub="Área média operacional" 
          icon={Zap} 
          color="bg-amber-500"
        />
        <KPICard 
          title="Volume em Estoque" 
          value={`${(kpis.totalStockVolume / 1000).toFixed(1)}k`} 
          sub="Unidades Totais (L/Kg)" 
          icon={Package} 
          color="bg-emerald-500"
        />
        <KPICard 
          title="Taxa de Retrabalho" 
          value={`${kpis.reworkRate.toFixed(1)}%`} 
          sub={`${kpis.reworkCount} ordens críticas`} 
          icon={AlertCircle} 
          color="bg-red-500"
          trend={{ val: kpis.reworkRate > 5 ? "Alta" : "Normal", positive: kpis.reworkRate < 5 }}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Evolução de Planejamento</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Área (ha) por Data de Recomendação</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {productivityData.length > 0 ? (
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="area" stroke="#10b981" fillOpacity={1} fill="url(#colorArea)" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest italic">
                  Sem dados suficientes
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Status de Ordens</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Distribuição por etapa atual</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {statusDistribution.length > 0 ? (
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest italic">
                  Sem dados
                </div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Machine Performance */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Tractor size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Desempenho Frota</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Área planejada por equipamento (ha)</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {machinePerformance.length > 0 ? (
                <BarChart data={machinePerformance} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="ha" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              ) : (
                 <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest italic">
                  Sem dados de frota
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Culture Distribution */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <Sprout size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Mix de Culturas</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hectares por cultura</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {cultureData.length > 0 ? (
                <BarChart data={cultureData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="area" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest italic">
                  Sem dados de cultura
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;