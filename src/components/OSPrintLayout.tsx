import React from 'react';
import { 
  Sprout, MapPin, Calendar, Tractor, User, 
  Droplets, Gauge, Wind, AlertTriangle, 
  Info, Hash, AlertCircle
} from 'lucide-react';
import { ServiceOrder } from '../types';

interface OSPrintLayoutProps {
  order: ServiceOrder;
}

const OSPrintLayout: React.FC<OSPrintLayoutProps> = ({ order }) => {
  if (!order) return null;

  // Cálculos seguros para o layout
  const totalVolume = order.totalVolume || 0;
  const tankCapacity = order.tankCapacity || 1; // Evita divisão por zero
  
  // Recalcula para exibição
  const numberOfTanksExact = totalVolume / tankCapacity;
  const numberOfTanksFull = Math.floor(numberOfTanksExact);
  const hasPartialTank = numberOfTanksExact > numberOfTanksFull;
  const partialTankVolume = hasPartialTank ? totalVolume - (numberOfTanksFull * tankCapacity) : 0;
  
  // Lista de itens segura
  const items = order.items || [];

  return (
    <div className="hidden print:block w-full h-auto bg-white text-slate-900 p-8 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4 break-inside-avoid">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white border-2 border-[#0047AB] rounded-lg flex flex-col items-center justify-center p-1 print-color-adjust-exact">
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[#0047AB] font-black text-3xl leading-none">S</span>
              <div className="w-2 h-1 bg-[#0047AB]"></div>
              <span className="text-[#0047AB] font-black text-3xl leading-none">H</span>
            </div>
            <span className="text-[#0047AB] font-bold text-[8px] uppercase tracking-wider transform scale-x-110 mt-0.5">Agropecuária</span>
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">SH Oliveira</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Sistema de Gestão</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Ordem de Aplicação</h2>
          <p className="text-lg font-bold text-slate-600">Nº {order.orderNumber || '---'}</p>
        </div>
      </div>

      {/* Farm Box */}
      <div className="border-2 border-slate-800 rounded-xl p-4 mb-6 flex justify-between items-center bg-slate-50 print:bg-slate-50 print-color-adjust-exact break-inside-avoid">
        <div className="flex items-center gap-4">
          <MapPin size={32} className="text-emerald-600" />
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fazenda / Propriedade</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{order.farmName || 'Não Informado'}</h3>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data de Emissão</p>
           <p className="text-sm font-bold uppercase">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="border border-slate-300 rounded-xl p-0 mb-6 break-inside-avoid">
        <div className="grid grid-cols-2">
          {/* Coluna Esquerda */}
          <div className="p-4 border-r border-slate-300 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Talhão(ões)</span>
                <span className="text-sm font-black uppercase text-slate-900">{(order.fieldNames || []).join(', ') || '-'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Área Total</span>
                <span className="text-sm font-black uppercase text-slate-900">{(order.totalArea || 0).toLocaleString('pt-BR')} ha</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sprout size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cultura / Variedade</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.culture || '-'} - {order.variety || '-'}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Janela de Aplicação</span>
                <span className="text-sm font-black uppercase text-slate-900">Até {order.maxApplicationDate ? new Date(order.maxApplicationDate).toLocaleDateString('pt-BR') : '-'}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Tractor size={16} className="text-slate-400 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Máquina / Equipamento</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.machineName || 'Não Informado'} ({order.machineType || '-'})</span>
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
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Configuração</span>
                <span className="text-sm font-black uppercase text-slate-900">{order.pressure || '-'} / {order.nozzle || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (Colorful Borders) */}
      <div className="grid grid-cols-4 gap-4 mb-6 break-inside-avoid">
        <div className="border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vazão L/ha</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{order.flowRate || 0}</p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-blue-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wind size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Velocidade</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{order.speed || '-'}</p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-orange-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tanques Cheios</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{numberOfTanksFull}</p>
        </div>
        <div className="border border-slate-200 border-l-4 border-l-indigo-500 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calda Total</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalVolume.toLocaleString('pt-BR')} <span className="text-xs ml-1 font-bold text-slate-400">L</span></p>
        </div>
      </div>

      {/* Dosage Table - Full Tank */}
      <div className="mb-6 border border-slate-800 rounded-xl overflow-hidden break-inside-avoid-page">
        <div className="bg-emerald-100 p-2 border-b border-emerald-200 flex items-center justify-between px-4 print-color-adjust-exact">
           <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Receituário: Tanque Cheio ({order.tankCapacity} L)</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-widest text-slate-500 print-color-adjust-exact">
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2 text-center">Dose / ha</th>
              <th className="px-4 py-2 text-right">Qtd. no Tanque</th>
              <th className="px-4 py-2 text-right">Total Operação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 font-black text-slate-900 uppercase">{item.productName || 'Item Sem Nome'}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-600">{item.dosePerHa || 0}</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">{(item.qtyPerTank || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-600">{(item.qtyTotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partial Tank Table - If Exists */}
      {hasPartialTank && (
        <div className="mb-6 border border-amber-300 rounded-xl overflow-hidden break-inside-avoid-page">
          <div className="bg-amber-100 p-2 border-b border-amber-200 flex items-center justify-between px-4 print-color-adjust-exact">
             <div className="flex items-center gap-2">
               <AlertCircle size={16} className="text-amber-600" />
               <span className="text-xs font-black uppercase tracking-widest text-amber-800">Instrução para Último Tanque (Parcial)</span>
             </div>
             <span className="text-xs font-black uppercase tracking-widest text-amber-800">Volume de Calda: {partialTankVolume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50/50 border-b border-amber-100 text-[10px] uppercase font-black tracking-widest text-amber-700 print-color-adjust-exact">
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2 text-right">Quantidade para Mistura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-sm">
              {items.map((item, idx) => {
                 // Proteção contra divisão por zero se tankCapacity for 0 ou invalido
                 const capacity = order.tankCapacity || 1;
                 const partialQty = (item.qtyPerTank / capacity) * partialTankVolume;
                 return (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-bold text-slate-800 uppercase">{item.productName || 'Item Sem Nome'}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-700">{partialQty.toFixed(2)}</td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Warnings */}
      <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4 break-inside-avoid print-color-adjust-exact">
        <div className="flex items-center gap-2 mb-2 text-red-600">
          <AlertTriangle size={18} strokeWidth={2.5} />
          <h4 className="text-sm font-black uppercase tracking-widest">Atenção Obrigatória</h4>
        </div>
        <p className="text-xs font-bold text-red-800 uppercase leading-relaxed">
          {order.mandatoryPhrase || 'Sem avisos de segurança.'}
        </p>
      </div>

      {/* Observations */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 min-h-[100px] break-inside-avoid print-color-adjust-exact">
        <div className="flex items-center gap-2 mb-2 text-amber-600">
          <Info size={18} strokeWidth={2.5} />
          <h4 className="text-sm font-black uppercase tracking-widest">Observações Importantes</h4>
        </div>
        <p className="text-xs font-bold text-amber-800 uppercase leading-relaxed">
          {order.observations || 'Sem observações adicionais.'}
        </p>
      </div>

      {/* Signature Area */}
      <div className="mt-12 grid grid-cols-2 gap-20 break-inside-avoid">
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