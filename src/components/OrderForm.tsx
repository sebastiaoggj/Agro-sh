import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trash2, Plus, Info, Save, X, 
  Calculator, Beaker, ClipboardCheck, 
  Calendar, MapPin, Tractor, User, 
  Droplets, Wind, Gauge, ArrowRight,
  Settings, ChevronDown, Minus,
  AlertCircle, ChevronLeft, CheckCircle2,
  Printer, Share2, FileText, LayoutDashboard,
  Sparkles, Check, Search as SearchIcon,
  Loader2, FlaskConical, AlertTriangle,
  PackageX
} from 'lucide-react';
import { OSItem, Field, Machine, Insumo, OrderStatus, ServiceOrder } from '../types';
import OSPrintLayout from './OSPrintLayout';

const MACHINE_TYPES = ['Pulverizador Terrestre', 'Avião Agrícola', 'Drone de Pulverização'];

interface OrderFormProps {
  initialData?: ServiceOrder | null;
  existingOrders?: ServiceOrder[];
  onSave: (order: ServiceOrder) => Promise<boolean>; 
  onCancel: () => void;
  farms: { id: string, name: string }[];
  fields: Field[];
  machines: Machine[];
  operators: { id: string, name: string }[];
  insumos: Insumo[];
  crops: { id: string, name: string, variety: string }[];
}

interface ExtendedOSItem extends OSItem {
  unit?: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ 
  initialData, 
  existingOrders = [], 
  onSave, 
  onCancel,
  farms,
  fields,
  machines,
  operators,
  insumos,
  crops
}) => {
  const [step, setStep] = useState<'FORM' | 'SUMMARY' | 'SUCCESS'>('FORM');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<ServiceOrder | null>(null);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    farmId: initialData?.farmId || '',
    fieldIds: initialData?.fieldIds || (initialData?.fieldNames ? [] : []), 
    // Geração automática do número da ordem
    orderNumber: initialData?.orderNumber || (() => {
      const year = new Date().getFullYear();
      const count = (existingOrders?.length || 0) + 1;
      return `${year}${count.toString().padStart(3, '0')}`;
    })(),
    culture: initialData?.culture || '',
    variety: initialData?.variety || '',
    recommendationDate: initialData?.recommendationDate || new Date().toISOString().split('T')[0],
    maxApplicationDate: initialData?.maxApplicationDate || '',
    machineType: initialData?.machineType || '',
    operatorId: initialData?.operatorId || '',
    machineId: initialData?.machineId || '',
    tankCapacity: initialData?.tankCapacity || 0,
    flowRate: initialData?.flowRate || 0,
    nozzle: initialData?.nozzle || '',
    pressure: initialData?.pressure || '',
    speed: initialData?.speed || '',
    status: initialData?.status || OrderStatus.EMITTED,
    applicationType: initialData?.applicationType || 'HERBICIDA',
    mandatoryPhrase: initialData?.mandatoryPhrase || 'É obrigatório o uso de EPI\'S - Luva, Máscara, Roupa impermeável e Óculos de proteção para manipular os produtos',
    observations: initialData?.observations || ''
  });

  const [items, setItems] = useState<ExtendedOSItem[]>(
    initialData?.items.map(i => {
      const originalInsumo = insumos.find(ins => ins.id === i.insumoId);
      return { ...i, unit: originalInsumo?.unit || 'L/Kg' };
    }) || []
  );

  const uniqueCultures = useMemo(() => {
    const names = new Set(crops.map(c => c.name));
    return Array.from(names);
  }, [crops]);

  const availableVarieties = useMemo(() => {
    return crops.filter(c => c.name === formData.culture);
  }, [crops, formData.culture]);

  const selectedFarm = useMemo(() => farms.find(f => f.id === formData.farmId), [formData.farmId, farms]);
  
  const availableFields = useMemo(() => 
    fields.filter(f => f.farmId === formData.farmId), 
  [formData.farmId, fields]);

  const selectedFields = useMemo(() => 
    fields.filter(f => formData.fieldIds.includes(f.id)), 
  [formData.fieldIds, fields]);

  const selectedMachine = useMemo(() => machines.find(m => m.id === formData.machineId), [formData.machineId, machines]);
  const selectedOperator = useMemo(() => operators.find(o => o.id === formData.operatorId), [formData.operatorId, operators]);

  // --- LÓGICA DE CÁLCULO ---
  const stats = useMemo(() => {
    const area = selectedFields.reduce((sum, f) => sum + f.area, 0);
    const flow = Number(formData.flowRate) || 0;
    const tankCap = Number(formData.tankCapacity) || 0;
    
    const totalVolume = area * flow;
    const haPerTank = flow > 0 ? tankCap / flow : 0;

    const numberOfTanksExact = tankCap > 0 ? totalVolume / tankCap : 0;
    const numberOfTanksFull = Math.floor(numberOfTanksExact);
    const hasPartialTank = numberOfTanksExact > numberOfTanksFull;
    const totalRefills = Math.ceil(numberOfTanksExact);
    
    const partialTankVolume = hasPartialTank ? totalVolume - (numberOfTanksFull * tankCap) : 0;

    return { area, totalVolume, haPerTank, numberOfTanksFull, hasPartialTank, partialTankVolume, totalRefills };
  }, [selectedFields, formData.flowRate, formData.tankCapacity]);

  useEffect(() => {
    if (selectedMachine && !initialData) {
      setFormData(prev => ({ ...prev, tankCapacity: selectedMachine.tankCapacity }));
    }
  }, [formData.machineId, initialData, selectedMachine]);

  useEffect(() => {
    const newItems = items.map(item => {
      if (!item.insumoId) return item;
      const dose = item.dosePerHa;
      const qtyPerTank = dose * stats.haPerTank;
      const qtyTotal = dose * stats.area;
      return { ...item, qtyPerTank, qtyTotal };
    });
    
    const hasChanges = newItems.some((newItem, idx) => {
      const oldItem = items[idx];
      return Math.abs(newItem.qtyPerTank - oldItem.qtyPerTank) > 0.0001 || 
             Math.abs(newItem.qtyTotal - oldItem.qtyTotal) > 0.0001;
    });

    if (hasChanges) {
      setItems(newItems);
    }
  }, [stats.haPerTank, stats.area, items]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'farmId') {
      setFormData(prev => ({ ...prev, farmId: value, fieldIds: [] }));
    } else if (name === 'culture') {
      setFormData(prev => ({ ...prev, culture: value, variety: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleField = (fieldId: string) => {
    setFormData(prev => {
      const isSelected = prev.fieldIds.includes(fieldId);
      if (isSelected) {
        return { ...prev, fieldIds: prev.fieldIds.filter(id => id !== fieldId) };
      } else {
        return { ...prev, fieldIds: [...prev.fieldIds, fieldId] };
      }
    });
  };

  const addProduct = () => {
    setItems([...items, { insumoId: '', productName: '', dosePerHa: 0, qtyPerTank: 0, qtyTotal: 0, unit: 'L/Kg' }]);
  };

  const removeProduct = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, insumoId: string, dose: number) => {
    const insumo = insumos.find(i => i.id === insumoId);
    if (!insumo) return;
    
    const qtyPerTank = dose * stats.haPerTank;
    const qtyTotal = dose * stats.area;

    const newItems = [...items];
    newItems[index] = {
      insumoId,
      productName: insumo.name,
      dosePerHa: dose,
      qtyPerTank: qtyPerTank,
      qtyTotal: qtyTotal,
      unit: insumo.unit
    };
    setItems(newItems);
  };

  // Check stock availability
  const checkStockAvailability = () => {
    const missingItems: string[] = [];
    
    items.forEach(item => {
      if (!item.insumoId) return;
      const stockItem = insumos.find(i => i.id === item.insumoId);
      if (!stockItem) return;

      // Lógica de saldo: Considera o estoque disponível atual.
      // Se for edição de ordem já emitida, o ideal seria "devolver" virtualmente o saldo para recalcular,
      // mas para segurança, usamos o disponível atual + o consumo desta ordem se ela já estiver emitida.
      let currentOrderUsage = 0;
      if (initialData && initialData.status === OrderStatus.EMITTED) {
         const initialItem = initialData.items.find(i => i.insumoId === item.insumoId);
         if (initialItem) currentOrderUsage = initialItem.qtyTotal;
      }

      const realAvailable = stockItem.availableQty + currentOrderUsage;

      if (item.qtyTotal > realAvailable) {
        missingItems.push(`${item.productName} (Falta ${(item.qtyTotal - realAvailable).toFixed(2)} ${item.unit})`);
      }
    });

    return missingItems;
  };

  const handleNext = () => {
    if (!formData.farmId || formData.fieldIds.length === 0) {
      alert("Por favor, selecione a fazenda e ao menos um talhão.");
      return;
    }
    if (!formData.flowRate || formData.flowRate <= 0) {
      alert("Por favor, informe a Vazão (L/ha) para calcular a calda.");
      return;
    }

    // Verificar estoque antes de ir para o resumo
    const missing = checkStockAvailability();
    if (missing.length > 0) {
      setStockWarning(`Estoque insuficiente para: ${missing.join(', ')}. A ordem será gerada como "Aguardando Produto".`);
    } else {
      setStockWarning(null);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('SUMMARY');
  };

  const handleConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    const validItems = items.filter(i => i.insumoId && i.insumoId !== '');
    const missing = checkStockAvailability();
    
    // Se houver itens faltando, força o status para AGUARDANDO PRODUTO
    let finalStatus = formData.status;
    
    if (missing.length > 0) {
      finalStatus = OrderStatus.AWAITING_PRODUCT;
    } else if (finalStatus === OrderStatus.AWAITING_PRODUCT) {
      // Se estava aguardando mas agora tem saldo, sugerimos Emitir (padrão do form)
      finalStatus = OrderStatus.EMITTED;
    }

    const finalOrder: ServiceOrder = {
      ...formData,
      status: finalStatus,
      id: formData.id || Date.now().toString(),
      farmName: selectedFarm?.name || '',
      fieldNames: selectedFields.map(f => f.name),
      totalArea: stats.area,
      totalVolume: stats.totalVolume,
      machineName: selectedMachine?.name || '',
      items: validItems
    };

    const success = await onSave(finalOrder);
    setIsSaving(false);
    
    if (success) {
      setSavedOrder(finalOrder);
      setStep('SUCCESS');
    }
  };

  const availableInsumos = useMemo(() => {
    if (!formData.farmId) return insumos;
    const farmName = farms.find(f => f.id === formData.farmId)?.name;
    if (!farmName) return insumos;
    return insumos.filter(i => i.farm === farmName || i.availableQty > 0);
  }, [insumos, formData.farmId, farms]);

  const handlePrint = () => window.print();

  // --- RENDER ---
  if (step === 'SUCCESS') {
    return (
      <>
        {savedOrder && <OSPrintLayout order={savedOrder} />}
        <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-500 px-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-12 md:p-24 text-center shadow-xl space-y-12 relative overflow-hidden">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
            
            {savedOrder?.status === OrderStatus.AWAITING_PRODUCT ? (
              <div className="w-28 h-28 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-amber-500/30">
                <PackageX size={56} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30 rotate-3 group hover:rotate-6 transition-transform">
                <CheckCircle2 size={56} strokeWidth={2.5} />
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                {savedOrder?.status === OrderStatus.AWAITING_PRODUCT ? 'Aguardando Estoque' : 'Ordem Emitida!'}
              </h2>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] max-w-md mx-auto leading-relaxed">
                {savedOrder?.status === OrderStatus.AWAITING_PRODUCT 
                  ? `A ordem #${formData.orderNumber} foi salva, mas aguarda a compra/entrada de insumos para ser liberada.`
                  : `A ordem #${formData.orderNumber} já está disponível no painel e o estoque foi reservado.`
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <button onClick={handlePrint} className="w-full sm:w-auto min-w-[240px] bg-slate-900 hover:bg-black text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                <Printer size={22} /> IMPRIMIR OS
              </button>
              <button onClick={onCancel} className="w-full sm:w-auto min-w-[240px] border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
                <LayoutDashboard size={22} /> VOLTAR AO PAINEL
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (step === 'SUMMARY') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-500">
        
        {stockWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-800 uppercase tracking-tight">Atenção: Saldo Insuficiente</h3>
              <p className="text-xs font-bold text-amber-700 mt-1 uppercase tracking-wide leading-relaxed">
                {stockWarning}
              </p>
              <p className="text-[10px] font-black text-amber-600/70 mt-2 uppercase tracking-widest">
                Esta ordem não reservará estoque até que os produtos entrem no sistema.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Revisão e Cálculos</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Confira o preparo da calda e volumes</p>
            </div>
            <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-slate-900 font-black text-lg uppercase tracking-widest italic">#{formData.orderNumber}</span>
            </div>
          </div>

          <div className="p-10 space-y-12">
            
            {/* Bloco de Resumo de Tanques */}
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                 <FlaskConical size={24} className="text-blue-500" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Planejamento de Cargas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tanques Cheios</p>
                   <p className="text-3xl font-black text-slate-900 mt-1">{stats.numberOfTanksFull}</p>
                   <p className="text-xs font-bold text-slate-500 mt-1">de {formData.tankCapacity} L</p>
                </div>
                
                {stats.hasPartialTank ? (
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                     <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Último Tanque (Parcial)</p>
                     <p className="text-3xl font-black text-amber-700 mt-1">{stats.partialTankVolume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-sm">Litros</span></p>
                     <p className="text-xs font-bold text-amber-600 mt-1">Sobra de Área</p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-center">
                     <p className="text-xs font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
                       <Check size={16} /> Cargas Exatas
                     </p>
                  </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Volume Total Calda</p>
                   <p className="text-3xl font-black text-blue-600 mt-1">{stats.totalVolume.toLocaleString('pt-BR')} <span className="text-sm">L</span></p>
                   <p className="text-xs font-bold text-slate-500 mt-1">Para {stats.area.toFixed(2)} ha</p>
                </div>
              </div>
            </div>

            {/* Tabela de Produtos */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-600">
                <Beaker size={22} strokeWidth={2.5} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Receituário: Tanque Cheio</h3>
              </div>
              <div className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                      <th className="px-8 py-5">Produto</th>
                      <th className="px-8 py-5 text-center">Dose / ha</th>
                      <th className="px-8 py-5 text-center bg-blue-50/50 text-blue-700">Carga Tanque Cheio</th>
                      <th className="px-8 py-5 text-right">Total Operação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.filter(i => i.insumoId).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900 uppercase">{item.productName}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-bold text-slate-500">{item.dosePerHa} {item.unit}</span>
                        </td>
                        <td className="px-8 py-6 text-center bg-blue-50/30">
                          <span className="text-sm font-black text-blue-700">{item.qtyPerTank.toFixed(2)} {item.unit}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-black text-emerald-600">{item.qtyTotal.toFixed(2)} {item.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela Parcial (Se houver) */}
            {stats.hasPartialTank && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-amber-600">
                  <AlertCircle size={22} strokeWidth={2.5} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Preparo do Último Tanque (Parcial)</h3>
                </div>
                <div className="border border-amber-200 bg-amber-50/30 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="px-8 py-4 bg-amber-100/50 border-b border-amber-200">
                    <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">
                      Volume de Calda: {stats.partialTankVolume.toLocaleString('pt-BR')} Litros
                    </p>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-amber-700 text-[10px] uppercase font-black tracking-widest border-b border-amber-100">
                        <th className="px-8 py-5">Produto</th>
                        <th className="px-8 py-5 text-right">Quantidade para Mistura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {items.filter(i => i.insumoId).map((item, idx) => {
                        const partialQty = (item.qtyPerTank / formData.tankCapacity) * stats.partialTankVolume;
                        return (
                          <tr key={idx}>
                            <td className="px-8 py-4 font-bold text-slate-700 uppercase">{item.productName}</td>
                            <td className="px-8 py-4 text-right font-black text-amber-700">{partialQty.toFixed(2)} {item.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-slate-100">
              <button onClick={() => setStep('FORM')} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-3" disabled={isSaving}>
                <ChevronLeft size={18} /> AJUSTAR DADOS
              </button>
              <button 
                onClick={handleConfirm} 
                className={`px-14 py-5 ${stockWarning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed`} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>SALVANDO <Loader2 size={22} className="animate-spin" /></>
                ) : (
                  <>
                    {stockWarning ? 'SALVAR COMO AGUARDANDO' : 'CONFIRMAR E EMITIR'}
                    {stockWarning ? <PackageX size={22} /> : <CheckCircle2 size={22} className="group-hover:rotate-12 transition-transform" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- FORM STEP ---
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
              {initialData ? 'Edição de OS' : 'Emissão de Nova OS'}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Detalhamento operacional para controle de aplicação</p>
          </div>
          <button onClick={onCancel} className="p-4 text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 rounded-2xl shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-10">
          {/* Seção 1: Dados Gerais e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Propriedade</label>
              <select name="farmId" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer" value={formData.farmId} onChange={handleInputChange}>
                <option value="">SELECIONE A FAZENDA</option>
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2" ref={dropdownRef}>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Talhão de Alocação</label>
              <div className="relative">
                <div 
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer flex justify-between items-center ${!formData.farmId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => formData.farmId && setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                >
                  <span className={formData.fieldIds.length === 0 ? 'text-slate-400' : 'text-slate-900 uppercase'}>
                    {formData.fieldIds.length === 0 
                      ? 'BUSCAR TALHÃO...' 
                      : formData.fieldIds.length === 1 
                        ? selectedFields[0]?.name 
                        : `${formData.fieldIds.length} TALHÕES`}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isFieldDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isFieldDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                      <SearchIcon size={14} className="text-slate-400" />
                      <input type="text" placeholder="Filtrar talhão..." className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none w-full" />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {availableFields.map(f => (
                        <div 
                          key={f.id} 
                          className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 ${formData.fieldIds.includes(f.id) ? 'bg-emerald-50' : ''}`}
                          onClick={() => toggleField(f.id)}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase">{f.name}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.area} HA</span>
                          </div>
                          {formData.fieldIds.includes(f.id) && (
                            <Check size={16} className="text-emerald-500" strokeWidth={3} />
                          )}
                        </div>
                      ))}
                      {availableFields.length === 0 && (
                         <div className="px-6 py-10 text-center text-[10px] font-black uppercase text-slate-300">Nenhum talhão</div>
                      )}
                    </div>
                    {formData.fieldIds.length > 0 && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
                        <button onClick={() => setIsFieldDropdownOpen(false)} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">Concluir</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identificador da Ordem</label>
              <div className="relative group">
                <input 
                  type="text" 
                  name="orderNumber" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all pr-16" 
                  placeholder="EX: 2026001" 
                  value={formData.orderNumber} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cultura Cadastrada</label>
              <select 
                name="culture" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                value={formData.culture} 
                onChange={handleInputChange}
              >
                <option value="">SELECIONE A CULTURA</option>
                {uniqueCultures.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Variedade Disponível</label>
              <select 
                name="variety" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50" 
                value={formData.variety} 
                onChange={handleInputChange}
                disabled={!formData.culture}
              >
                <option value="">SELECIONE A VARIEDADE</option>
                {availableVarieties.map(c => <option key={c.id} value={c.variety}>{c.variety}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Recomendação</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="date" name="recommendationDate" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.recommendationDate} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Janela Máxima de Aplicação</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="date" name="maxApplicationDate" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.maxApplicationDate} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Modalidade</label>
              <select name="machineType" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.machineType} onChange={handleInputChange}>
                <option value="">TIPO DE EQUIPAMENTO</option>
                {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Responsável</label>
              <select name="operatorId" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.operatorId} onChange={handleInputChange}>
                <option value="">SELECIONE O OPERADOR</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identificação da Máquina</label>
              <select name="machineId" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50" value={formData.machineId} onChange={handleInputChange} disabled={!formData.machineType}>
                <option value="">MODELO ALOCADO</option>
                {/* Filtrar máquinas que correspondem ao tipo selecionado, ou mostrar todas se não houver tipo definido no DB ainda */}
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Seção de Tecnologia de Aplicação */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
            <div className="flex items-center gap-4 text-blue-600 border-b border-slate-200 pb-4">
              <Settings size={22} strokeWidth={2.5} />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Tecnologia de Aplicação</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Capacidade (L)</label>
                <input type="number" name="tankCapacity" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.tankCapacity || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vazão Alvo (L/ha)</label>
                <input type="number" name="flowRate" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.flowRate || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bico / Ponta</label>
                <input type="text" name="nozzle" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="EX: AIXR 11002" value={formData.nozzle} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pressão (Bar/PSI)</label>
                <input type="text" name="pressure" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="EX: 3 BAR" value={formData.pressure} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Velocidade (Km/h)</label>
                <input type="text" name="speed" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="EX: 18 KM/H" value={formData.speed} onChange={handleInputChange} />
              </div>
            </div>

            {/* Alerta de Validação Técnica */}
            {(formData.flowRate > 0 && formData.speed && formData.pressure) && (
              <div className="flex items-center gap-3 text-[10px] text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-100 animate-in fade-in">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black uppercase tracking-wide">Validação de Segurança</span>
                  <span className="font-medium mt-0.5">
                    Certifique-se de que a pressão de <strong>{formData.pressure}</strong> é adequada para a vazão de <strong>{formData.flowRate} L/ha</strong> à velocidade de <strong>{formData.speed} km/h</strong> com o bico selecionado.
                  </span>
                </div>
              </div>
            )}

            {/* Resultados Automáticos (Read Only) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
               <div className="bg-blue-100/50 border border-blue-200 rounded-2xl p-4 flex flex-col justify-center">
                 <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Autonomia (ha/Tanque)</span>
                 <span className="text-xl font-black text-blue-700 italic">{stats.haPerTank.toFixed(2)} ha</span>
                 <p className="text-[9px] text-blue-400 mt-1">Cálculo: Cap. {formData.tankCapacity}L / Vazão {formData.flowRate}L/ha</p>
               </div>
               <div className="bg-emerald-100/50 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-center">
                 <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Volume Total da Calda</span>
                 <span className="text-xl font-black text-emerald-700 italic">{stats.totalVolume.toLocaleString('pt-BR')} Litros</span>
                 <p className="text-[9px] text-emerald-500 mt-1">Para área total de {stats.area.toFixed(2)} ha</p>
               </div>
               
               {/* Novo Card de Planejamento de Tanques */}
               <div className="bg-orange-100/50 border border-orange-200 rounded-2xl p-4 flex flex-col justify-center">
                 <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest">Reabastecimentos</span>
                 <span className="text-lg font-black text-orange-700 italic leading-tight">
                   {stats.numberOfTanksFull} Cheios
                   {stats.hasPartialTank && <span className="text-orange-600/80 text-sm"> + 1 Parcial</span>}
                 </span>
                 <p className="text-[9px] text-orange-500 mt-1 font-bold">
                   {stats.hasPartialTank 
                     ? `(${stats.numberOfTanksFull}x ${formData.tankCapacity}L + 1x ${stats.partialTankVolume.toFixed(0)}L)` 
                     : `Carga exata de ${formData.tankCapacity}L`}
                 </p>
               </div>
            </div>
          </div>

          <div className="space-y-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-emerald-600">
                <Droplets size={22} strokeWidth={2.5} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Composição da Calda</h3>
              </div>
              <button onClick={addProduct} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black flex items-center gap-3 transition-all shadow-xl active:scale-95">
                <Plus size={18} strokeWidth={3} /> ADICIONAR INSUMO
              </button>
            </div>

            <div className="space-y-6">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-8 relative group shadow-sm hover:shadow-md transition-shadow">
                  <button onClick={() => removeProduct(idx)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-xl">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-8 items-end">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Produto Composto</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" value={item.insumoId} onChange={(e) => updateItem(idx, e.target.value, item.dosePerHa)}>
                        <option value="">BUSCAR NO ALMOXARIFADO...</option>
                        {availableInsumos.map(ins => <option key={ins.id} value={ins.id}>{ins.name} ({ins.farm})</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dose / ha</label>
                      <div className="relative">
                         <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" value={item.dosePerHa || ''} onChange={(e) => updateItem(idx, item.insumoId, Number(e.target.value))} />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{item.unit || 'L/Kg'}</span>
                      </div>
                    </div>
                    
                    {/* Campos de Resultado Travados */}
                    <div className="md:col-span-1 flex flex-col items-center bg-slate-100 p-4 rounded-xl border border-slate-200 opacity-80 cursor-not-allowed">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Carga/Tanque</span>
                      <span className="text-xs font-black text-slate-700">{item.qtyPerTank > 0 ? item.qtyPerTank.toFixed(2) : '-'}</span>
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100 opacity-80 cursor-not-allowed">
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total OS</span>
                      <span className="text-xs font-black text-emerald-700">{item.qtyTotal > 0 ? item.qtyTotal.toFixed(2) : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" /> Segurança Obrigatória
              </label>
              <textarea name="mandatoryPhrase" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none" value={formData.mandatoryPhrase} onChange={handleInputChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <FileText size={16} /> Detalhes Adicionais
              </label>
              <textarea name="observations" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none" placeholder="RECOMENDAÇÕES ESPECÍFICAS DE CAMPO..." value={formData.observations} onChange={handleInputChange} />
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
            <button onClick={onCancel} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-red-500 transition-all">
              CANCELAR
            </button>
            <button onClick={handleNext} className="px-14 py-5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl flex items-center gap-4 transition-all active:scale-95 group">
              PRÓXIMA ETAPA
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;