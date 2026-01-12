
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  Map as MapIcon, Sprout, Tractor, Package,
  AlertCircle, CheckCircle2, Clock
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const productivityData = [
  { day: '06/01', area: 320, efficiency: 85 },
  { day: '07/01', area: 450, efficiency: 92 },
  { day: '08/01', area: 280, efficiency: 78 },
  { day: '09/01', area: 610, efficiency: 95 },
  { day: '10/01', area: 750, efficiency: 88 },
  { day: '11/01', area: 890, efficiency: 91 },
  { day: '12/01', area: 420, efficiency: 82 },
];

const statusDistribution = [
  { name: 'Concluídas', value: 45 },
  { name: 'Em Aplicação', value: 12 },
  { name: 'Emitidas', value: 25 },
  { name: 'Aguardando Prod.', value: 18 },
];

const machinePerformance = [
  { name: 'JD 4730', ha: 1250 },
  { name: 'Imperador', ha: 980 },
  { name: 'Agras T40', ha: 450 },
  { name: 'Stara 3.0', ha: 870 },
];

const cultureData = [
  { name: 'Soja', area: 5400 },
  { name: 'Milho', area: 3200 },
  { name: 'Algodão', area: 1800 },
];

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

const StatsView: React.FC = () => {
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
            <option>Safra 2025/26</option>
            <option>Safra 2024/25</option>
          </select>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
            Baixar BI
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Área Total Aplicada" 
          value="3.720 ha" 
          sub="Meta Safra: 10.000 ha (37%)" 
          icon={MapIcon} 
          color="bg-blue-500"
          trend={{ val: "12%", positive: true }}
        />
        <KPICard 
          title="Eficiência Média" 
          value="87.4%" 
          sub="ha/h vs planejado" 
          icon={Zap} 
          color="bg-amber-500"
          trend={{ val: "3.2%", positive: true }}
        />
        <KPICard 
          title="Insumos em Estoque" 
          value="12.4k L" 
          sub="Autonomia para 14 dias" 
          icon={Package} 
          color="bg-emerald-500"
        />
        <KPICard 
          title="Índice de Retrabalho" 
          value="1.2%" 
          sub="03 RNCs este mês" 
          icon={AlertCircle} 
          color="bg-red-500"
          trend={{ val: "0.5%", positive: false }}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Evolução Diária</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hectares aplicados nos últimos 7 dias</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Status de Ordens</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Distribuição por etapa de execução</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-2">
            {statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}%</span>
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
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Área total aplicada por equipamento (ha)</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machinePerformance} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="ha" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
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
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hectares contratados por cultura</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cultureData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="area" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
