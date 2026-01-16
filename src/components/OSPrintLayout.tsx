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
    <div className="hidden print:block w-full bg-white text-slate-900 p-2 print:p-0 font-sans text-[10px] leading-tight">
      {/* Header - Compacto */}
      <div className="flex justify-between items-center mb-2 border-b-2 border-slate-800 pb-2 break-inside-avoid">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-[#0047AB] rounded flex flex-col items-center justify-center p-0.5 print-color-adjust-exact">
            <div className="flex items-center gap-0.5">
              <span className="text-[#0047AB] font-black text-lg leading-none">S</span>
              <div className="w-1 h-2 bg-[#0047AB]"></div>
              <span className="text-[#0047AB] font-black text-lg leading-none">H</span>
            </div>
            <span className="text-[#0047AB] font-bold text-[5px] uppercase tracking-wider transform scale-x-110">Agro</span>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none">SH Oliveira</h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Gestão Agrícola</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-base font-black uppercase tracking-widest text-slate-900">Ordem de Aplicação</h2>
          <p className="text-sm font-bold text-slate-600">Nº {order.orderNumber || '---'}</p>
        </div>
      </div>

      {/* Farm Box - Compacto */}
      <div className="border border-slate-800 rounded-lg p-2 mb-2 flex justify-between items-center bg-slate-50 print:bg-slate-50 print-color-adjust-exact break-inside-avoid">
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-emerald-600" />
          <div>
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Fazenda / Propriedade</p>
            <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">{order.farmName || 'Não Informado'}</h3>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Emissão</p>
           <p className="text-xs font-bold uppercase">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Details Grid - Compacto */}
      <div className="border border-slate-300 rounded-lg mb-2 break-inside-avoid">
        <div className="grid grid-cols-2">
          {/* Coluna Esquerda */}
          <div className="p-2 border-r border-slate-300 space-y-1.5">
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Talhões:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{(order.fieldNames || []).join(', ') || '-'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Área Total:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{(order.totalArea || 0).toLocaleString('pt-BR')} ha</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sprout size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Cultura:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{order.culture || '-'} {order.variety ? `(${order.variety})` : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Prazo:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{order.maxApplicationDate ? new Date(order.maxApplicationDate).toLocaleDateString('pt-BR') : '-'}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <Tractor size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Máquina:</span>
                <span className="text-[9px] font-black uppercase text-slate-900 truncate max-w-[150px]">{order.machineName || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Operador:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{order.operatorId ? 'Designado' : 'A Definir'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Tanque:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{order.tankCapacity} L</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge size={12} className="text-slate-400" />
              <div className="flex-1 flex justify-between">
                <span className="text-[8px] font-bold text-slate-500 uppercase">Config:</span>
                <span className="text-[9px] font-black uppercase text-slate-900">{order.pressure || '-'} / {order.nozzle || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row - Compacto */}
      <div className="grid grid-cols-4 gap-2 mb-2 break-inside-avoid">
        <div className="border border-slate-200 border-l-2 border-l-emerald-500 rounded p-1.5 shadow-sm">
          <div className="flex items-center gap-1 mb-0.5">
            <Droplets size={10} className="text-slate-400" />
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Vazão L/ha</span>
          </div>
          <p className="text-sm font-black text-slate-900">{order.flowRate || 0}</p>
        </div>
        <div className="border border-slate-200 border-l-2 border-l-blue-500 rounded p-1.5 shadow-sm">
          <div className="flex items-center gap-1 mb-0.5">
            <Wind size={10} className="text-slate-400" />
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Velocidade</span>
          </div>
          <p className="text-sm font-black text-slate-900">{order.speed || '-'}</p>
        </div>
        <div className="border border-slate-200 border-l-2 border-l-orange-500 rounded p-1.5 shadow-sm">
          <div className="flex items-center gap-1 mb-0.5">
            <Hash size={10} className="text-slate-400" />
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Tanques</span>
          </div>
          <p className="text-sm font-black text-slate-900">{numberOfTanksFull}</p>
        </div>
        <div className="border border-slate-200 border-l-2 border-l-indigo-500 rounded p-1.5 shadow-sm">
          <div className="flex items-center gap-1 mb-0.5">
            <Droplets size={10} className="text-slate-400" />
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Calda Total</span>
          </div>
          <p className="text-sm font-black text-slate-900">{totalVolume.toLocaleString('pt-BR')} <span className="text-[8px] ml-0.5 text-slate-400">L</span></p>
        </div>
      </div>

      {/* Dosage Table - Full Tank - Compacto */}
      <div className="mb-2 border border-slate-800 rounded-lg overflow-hidden break-inside-avoid">
        <div className="bg-emerald-100 py-1 px-2 border-b border-emerald-200 print-color-adjust-exact">
           <span className="text-[8px] font-black uppercase tracking-widest text-emerald-900">Receituário: Tanque Cheio ({order.tankCapacity} L)</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[8px] uppercase font-black tracking-widest text-slate-500 print-color-adjust-exact">
              <th className="px-2 py-1">Produto</th>
              <th className="px-2 py-1 text-center">Dose/ha</th>
              <th className="px-2 py-1 text-right">Qtd. Tanque</th>
              <th className="px-2 py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[9px]">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1 font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.productName || 'Item Sem Nome'}</td>
                <td className="px-2 py-1 text-center font-medium text-slate-600">{item.dosePerHa}</td>
                <td className="px-2 py-1 text-right font-bold text-slate-900">{(item.qtyPerTank || 0).toFixed(2)}</td>
                <td className="px-2 py-1 text-right font-medium text-slate-600">{(item.qtyTotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partial Tank Table - If Exists - Compacto */}
      {hasPartialTank && (
        <div className="mb-2 border border-amber-300 rounded-lg overflow-hidden break-inside-avoid">
          <div className="bg-amber-100 py-1 px-2 border-b border-amber-200 flex items-center justify-between print-color-adjust-exact">
             <div className="flex items-center gap-1">
               <AlertCircle size={10} className="text-amber-700" />
               <span className="text-[8px] font-black uppercase tracking-widest text-amber-900">Último Tanque (Parcial)</span>
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest text-amber-900">Vol: {partialTankVolume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50/50 border-b border-amber-100 text-[8px] uppercase font-black tracking-widest text-amber-800 print-color-adjust-exact">
                <th className="px-2 py-1">Produto</th>
                <th className="px-2 py-1 text-right">Qtd. Mistura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-[9px]">
              {items.map((item, idx) => {
                 const capacity = order.tankCapacity || 1;
                 const partialQty = (item.qtyPerTank / capacity) * partialTankVolume;
                 return (
                  <tr key={idx}>
                    <td className="px-2 py-1 font-bold text-slate-800 uppercase truncate max-w-[200px]">{item.productName || 'Item Sem Nome'}</td>
                    <td className="px-2 py-1 text-right font-black text-amber-700">{partialQty.toFixed(2)}</td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Warnings & Observations - Compacto */}
      <div className="grid grid-cols-1 gap-2 mb-4 break-inside-avoid">
        <div className="border border-red-200 bg-red-50 rounded-lg p-2 print-color-adjust-exact">
          <div className="flex items-center gap-1 mb-1 text-red-600">
            <AlertTriangle size={12} strokeWidth={2.5} />
            <h4 className="text-[8px] font-black uppercase tracking-widest">Atenção Obrigatória</h4>
          </div>
          <p className="text-[8px] font-bold text-red-800 uppercase leading-tight">
            {order.mandatoryPhrase || 'Sem avisos de segurança.'}
          </p>
        </div>

        {order.observations && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-2 print-color-adjust-exact">
            <div className="flex items-center gap-1 mb-1 text-amber-600">
              <Info size={12} strokeWidth={2.5} />
              <h4 className="text-[8px] font-black uppercase tracking-widest">Observações</h4>
            </div>
            <p className="text-[8px] font-bold text-amber-800 uppercase leading-tight">
              {order.observations}
            </p>
          </div>
        )}
      </div>

      {/* Signature Area - Compacto */}
      <div className="mt-6 grid grid-cols-2 gap-10 break-inside-avoid">
        <div className="border-t border-slate-400 pt-1 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Responsável Técnico</p>
        </div>
        <div className="border-t border-slate-400 pt-1 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Operador / Aplicador</p>
        </div>
      </div>
    </div>
  );
};

export default OSPrintLayout;