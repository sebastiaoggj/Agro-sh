
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Users, Sprout, Tractor, Map as MapIcon, AlertCircle } from 'lucide-react';

const areaData = [
  { name: 'Seg', area: 450 },
  { name: 'Ter', area: 520 },
  { name: 'Qua', area: 380 },
  { name: 'Qui', area: 610 },
  { name: 'Sex', area: 750 },
  { name: 'Sab', area: 890 },
  { name: 'Dom', area: 210 },
];

const machineEfficiency = [
  { name: 'JD 4730', value: 85 },
  { name: 'Air Tractor', value: 92 },
  { name: 'Drone T40', value: 78 },
  { name: 'Pulv. M12', value: 64 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const MetricCard: React.FC<{ title: string, value: string, sub: string, icon: any, color: string, trend?: string }> = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-emerald-500/50 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <span className="text-emerald-600 dark:text-emerald-500 text-xs font-bold flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
          <TrendingUp size={14} /> {trend}
        </span>
      )}
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 flex items-center gap-1">
      {sub.includes('Meta') && <AlertCircle size={12} className="text-amber-500" />}
      {sub}
    </p>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard <span className="text-emerald-600 dark:text-emerald-500 text-lg align-top ml-1 font-medium italic">Operacional</span></h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Visão holística da produtividade e controle de insumos.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer">
            <option>Safra 2024/25</option>
            <option>Safra 2023/24</option>
          </select>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95">
            Exportar BI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Área Consolidada" 
          value="3.120 ha" 
          sub="Meta: 5.000 ha (62%)" 
          icon={MapIcon} 
          color="bg-blue-600"
          trend="+18%"
        />
        <MetricCard 
          title="Consumo Total" 
          value="15.8k L" 
          sub="Eficiência: 4.2 L/ha" 
          icon={Sprout} 
          color="bg-emerald-600"
        />
        <MetricCard 
          title="Disponibilidade Frota" 
          value="94.2%" 
          sub="2 máquinas em oficina" 
          icon={Tractor} 
          color="bg-amber-600"
        />
        <MetricCard 
          title="OS em Aberto" 
          value="07" 
          sub="4 agendadas para hoje" 
          icon={Users} 
          color="bg-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Curva de Aplicação</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Hectares aplicados por dia da semana</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                  itemStyle={{ color: '#10b981' }}
                  wrapperClassName="dark:!bg-slate-900 dark:!border-slate-800 dark:!text-white"
                />
                <Area type="monotone" dataKey="area" stroke="#10b981" fillOpacity={1} fill="url(#colorArea)" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">OEE por Equipamento</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">Eficiência Global de Equipamento</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineEfficiency} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  wrapperClassName="dark:!bg-slate-800 dark:!shadow-none"
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                  {machineEfficiency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
