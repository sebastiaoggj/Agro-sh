import React from 'react';
import { 
  Sprout, MapPin, Calendar, Tractor, User, 
  Droplets, Gauge, Wind, AlertTriangle, 
  Info, Hash, CheckCircle2
} from 'lucide-react';
import { ServiceOrder } from '../types';

interface OSPrintLayoutProps {
  order: ServiceOrder;
}

const OSPrintLayout: React.FC<OSPrintLayoutProps> = ({ order }) => {
  // Cálculos para o layout
  const tankCount = order.tankCapacity > 0 ? (order.totalVolume / order.tankCapacity).toFixed(1) : '0';
  
  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white print:bg-emerald-600 print:text-white">
            <Sprout size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Agro SH</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Gestão de Aplicações Agrícolas</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Ordem de Aplicação</h2>
          <p className="text-lg font-bold text-slate-600">Nº {order.orderNumber}</p>
        </div>
      </div>

      {/* Farm Box */}
      <div className="border-2 border-slate-800 rounded-xl p-4 mb-4 flex justify-between items-center bg-slate-50 print:bg-slate-50">
        <div className="flex items-center gap-4">
          <MapPin size={32} className="text-emerald-600" />
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fazenda / Propriedade</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{order.farmName}</h3>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data de Emissão</p>
           <p className="text-sm font-bold uppercase">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="border border-slate-300 rounded-xl p-0 mb-4 overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Coluna Esquerda */}
          <div className="p-4 border-r border-slate-300 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Talhão(ões)</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.fieldNames.join(', ')}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Área Total</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.totalArea.toLocaleString('pt-BR')} ha</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sprout size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cultura / Variedade</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.culture} - {order.variety}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Janela de Aplicação</span>
                <span className="text-sm font-black uppercase text-slate-900">Até {new Date(order.maxApplicationDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Tractor size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Máquina / Equipamento</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.machineName || 'Não Informado'} ({order.machineType})</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Responsável Operacional</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.operatorId ? 'Operador Designado' : 'A Definir'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Droplets size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Capacidade Tanque</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.tankCapacity} Litros</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gauge size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Pressão / Bico</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.pressure || '-'} / {order.nozzle || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (Colorful Borders) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vazão L/ha</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{order.flowRate}</p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-blue-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wind size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Velocidade</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{order.speed || '-'}<span className="text-xs ml-1 font-bold text-slate-400">Km/h</span></p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-orange-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanques</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{tankCount}</p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-indigo-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calda Total</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{order.totalVolume.toLocaleString('pt-BR')} <span className="text-xs ml-1 font-bold text-slate-400">L</span></p>
        </div>
      </div>

      {/* Dosage Table */}
      <div className="mb-6 border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-emerald-100 p-2 border-b border-emerald-200 flex items-center justify-between px-4">
           <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Receituário Agronômico</span>
           <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Base: Tanque Cheio ({order.tankCapacity} L)</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-widest text-slate-500">
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2 text-center">Dose / ha</th>
              <th className="px-4 py-2 text-right">Qtd. no Tanque</th>
              <th className="px-4 py-2 text-right">Total Operação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 font-black text-slate-900 uppercase">{item.productName}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-600">{item.dosePerHa}</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">{item.qtyPerTank.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-600">{item.qtyTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warnings */}
      <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2 text-red-600">
          <AlertTriangle size={18} strokeWidth={2.5} />
          <h4 className="text-sm font-black uppercase tracking-widest">Atenção Obrigatória</h4>
        </div>
        <p className="text-xs font-bold text-red-800 uppercase leading-relaxed">
          {order.mandatoryPhrase}
        </p>
      </div>

      {/* Observations */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 min-h-[100px]">
        <div className="flex items-center gap-2 mb-2 text-amber-600">
          <Info size={18} strokeWidth={2.5} />
          <h4 className="text-sm font-black uppercase tracking-widest">Observações Importantes</h4>
        </div>
        <p className="text-xs font-bold text-amber-800 uppercase leading-relaxed">
          {order.observations || 'Sem observações adicionais.'}
        </p>
      </div>

      {/* Signature Area */}
      <div className="mt-12 grid grid-cols-2 gap-20">
        <div className="border-t border-slate-400 pt-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Responsável Técnico</p>
        </div>
        <div className="border-t border-slate-400 pt-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operador / Aplicador</p>
        </div>
      </div>
    </div>
  );
};

export default OSPrintLayout;