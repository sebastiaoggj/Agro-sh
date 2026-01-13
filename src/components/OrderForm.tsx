import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trash2, Plus, Info, Save, X, 
  Calculator, Beaker, ClipboardCheck, 
  Calendar, MapPin, Tractor, User, 
  Droplets, Wind, Gauge, ArrowRight,
  Settings, ChevronDown, Minus,
  AlertCircle, ChevronLeft, CheckCircle2,
  Printer, Share2, FileText, LayoutDashboard,
  Sparkles, Check, Search as SearchIcon
} from 'lucide-react';
import { OSItem, Field, Machine, Insumo, OrderStatus, ServiceOrder } from '../types';

const MACHINE_TYPES = ['Pulverizador Terrestre', 'Avião Agrícola', 'Drone de Pulverização'];
const APPLICATION_TYPES = ['HERBICIDA', 'FUNGICIDA', 'INSETICIDA', 'ADJUVANTE', 'NUTRIÇÃO FOLIAR'];

interface OrderFormProps {
  initialData?: ServiceOrder | null;
  existingOrders?: ServiceOrder[];
  onSave: (order: ServiceOrder) => void;
  onCancel: () => void;
  // Props de dados dinâmicos
  farms: { id: string, name: string }[];
  fields: Field[];
  machines: Machine[];
  operators: { id: string, name: string }[];
  insumos: Insumo[];
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
  insumos
}) => {
  const [step, setStep] = useState<'FORM' | 'SUMMARY' | 'SUCCESS'>('FORM');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    farmId: initialData?.farmId || '',
    fieldIds: initialData?.fieldIds || (initialData?.fieldNames ? [] : []), 
    orderNumber: initialData?.orderNumber || '',
    culture: initialData?.culture || '',
    variety: initialData?.variety || '',
    recommendationDate: initialData?.recommendationDate || new Date().toISOString().split('T')[0],
    maxApplicationDate: initialData?.maxApplicationDate || '',
    machineType: initialData?.machineType || '',
    operatorId: initialData?.operatorId || '',
    machineId: initialData?.machineId || '',
    tankCapacity: initialData?.tankCapacity || 0,
    flowRate: initialData?.flowRate || 100,
    nozzle: initialData?.nozzle || '',
    pressure: initialData?.pressure || '',
    speed: initialData?.speed || '',
    status: initialData?.status || OrderStatus.EMITTED,
    applicationType: initialData?.applicationType || '',
    mandatoryPhrase: initialData?.mandatoryPhrase || 'É obrigatório o uso de EPI\'S - Luva, Máscara, Roupa impermeável e Óculos de proteção para manipular os produtos',
    observations: initialData?.observations || ''
  });

  const [items, setItems] = useState<OSItem[]>(initialData?.items || []);

  const selectedFarm = useMemo(() => farms.find(f => f.id === formData.farmId), [formData.farmId, farms]);
  
  const availableFields = useMemo(() => 
    fields.filter(f => f.farmId === formData.farmId), 
  [formData.farmId, fields]);

  const selectedFields = useMemo(() => 
    fields.filter(f => formData.fieldIds.includes(f.id)), 
  [formData.fieldIds, fields]);

  const stats = useMemo(() => {
    const area = selectedFields.reduce((sum, f) => sum + f.area, 0);
    const flow = Number(formData.flowRate) || 0;
    const tankCap = Number(formData.tankCapacity) || 0;
    const totalVolume = area * flow;
    const haPerTank = flow > 0 ? tankCap / flow : 0;
    return { area, totalVolume, haPerTank };
  }, [selectedFields, formData.flowRate, formData.tankCapacity]);

  const selectedMachine = useMemo(() => machines.find(m => m.id === formData.machineId), [formData.machineId, machines]);
  const selectedOperator = useMemo(() => operators.find(o => o.id === formData.operatorId), [formData.operatorId, operators]);

  useEffect(() => {
    if (selectedMachine && !initialData) {
      setFormData(prev => ({ ...prev, tankCapacity: selectedMachine.tankCapacity }));
    }
  }, [formData.machineId, initialData, selectedMachine]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFieldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateSequence = () => {
    const currentYear = new Date().getFullYear().toString();
    const sameYearOrders = existingOrders.filter(o => o.orderNumber.startsWith(currentYear));
    
    let nextNum = 1;
    if (sameYearOrders.length > 0) {
      const sequences = sameYearOrders.map(o => {
        const seq = o.orderNumber.replace(currentYear, '');
        return parseInt(seq, 10);
      }).filter(n => !isNaN(n));
      
      if (sequences.length > 0) {
        nextNum = Math.max(...sequences) + 1;
      }
    }
    
    const formattedSeq = nextNum.toString().padStart(2, '0');
    setFormData(prev => ({ ...prev, orderNumber: `${currentYear}${formattedSeq}` }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'farmId') {
      setFormData(prev => ({ ...prev, farmId: value, fieldIds: [] }));
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
    setItems([...items, { insumoId: '', productName: '', dosePerHa: 0, qtyPerTank: 0, qtyTotal: 0 }]);
  };

  const removeProduct = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, insumoId: string, dose: number) => {
    const insumo = insumos.find(i => i.id === insumoId);
    if (!insumo) return;
    const area = stats.area;
    const haPerTank = stats.haPerTank;
    const newItems = [...items];
    newItems[index] = {
      insumoId,
      productName: insumo.name,
      dosePerHa: dose,
      qtyPerTank: dose * haPerTank,
      qtyTotal: dose * area
    };
    setItems(newItems);
  };

  useEffect(() => {
    const newItems = items.map(item => {
      if (!item.insumoId) return item;
      return {
        ...item,
        qtyPerTank: item.dosePerHa * stats.haPerTank,
        qtyTotal: item.dosePerHa * stats.area
      };
    });
    setItems(newItems);
  }, [stats.haPerTank, stats.area]);

  const handleNext = () => {
    if (!formData.farmId || formData.fieldIds.length === 0) {
      alert("Por favor, selecione a fazenda e ao menos um talhão.");
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep('SUMMARY');
  };

  const handleConfirm = () => {
    const finalOrder: ServiceOrder = {
      ...formData,
      id: formData.id || Date.now().toString(),
      farmName: selectedFarm?.name || '',
      fieldNames: selectedFields.map(f => f.name),
      totalArea: stats.area,
      totalVolume: stats.totalVolume,
      machineName: selectedMachine?.name || '',
      items: items
    };
    onSave(finalOrder);
    setStep('SUCCESS');
  };

  // Filtrar insumos da fazenda selecionada (opcional, ou mostrar todos)
  const availableInsumos = useMemo(() => {
    if (!formData.farmId) return insumos;
    // Tenta filtrar por fazenda se o insumo tiver essa info, senao mostra todos ou filtra pelo nome da fazenda se estiver normalizado
    const farmName = farms.find(f => f.id === formData.farmId)?.name;
    if (!farmName) return insumos;
    return insumos.filter(i => i.farm === farmName || i.availableQty > 0);
  }, [insumos, formData.farmId, farms]);

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-500 px-4">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 md:p-24 text-center shadow-xl space-y-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
          <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30 rotate-3 group hover:rotate-6 transition-transform">
            <CheckCircle2 size={56} strokeWidth={2.5} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              {initialData ? 'Atualizado!' : 'Emitido com Sucesso!'}
            </h2>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] max-w-md mx-auto leading-relaxed">
              A ordem <span className="text-emerald-600 font-black">#{formData.orderNumber}</span> já está disponível no painel operacional.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <button onClick={() => window.print()} className="w-full sm:w-auto min-w-[240px] bg-slate-900 hover:bg-black text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
              <Printer size={22} /> IMPRIMIR OS
            </button>
            <button onClick={onCancel} className="w-full sm:w-auto min-w-[240px] border-2 border-slate-200 hover:bg-slate-50 text-slate-700 py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95">
              <LayoutDashboard size={22} /> VOLTAR AO PAINEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SUMMARY') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Revisão de Operação</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Valide os parâmetros antes de confirmar a execução</p>
            </div>
            <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-slate-900 font-black text-lg uppercase tracking-widest italic">#{formData.orderNumber}</span>
            </div>
          </div>

          <div className="p-10 space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Propriedade', val: selectedFarm?.name },
                { label: 'Alocação', val: selectedFields.map(f => f.name).join(', '), color: 'text-emerald-600' },
                { label: 'Cultura', val: `${formData.culture} - ${formData.variety}` },
                { label: 'Área Planejada', val: `${stats.area.toFixed(2)} ha`, color: 'text-blue-600' }
              ].map((info, idx) => (
                <div key={idx} className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{info.label}</span>
                  <p className={`text-sm font-black uppercase tracking-tight ${info.color || 'text-slate-900'}`}>{info.val || '-'}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 space-y-8 border border-slate-100">
              <div className="flex items-center gap-4 text-blue-600 border-b border-slate-200 pb-5">
                <Settings size={22} strokeWidth={2.5} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Especificações Técnicas</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                {[
                  { label: 'Responsável', val: selectedOperator?.name },
                  { label: 'Equipamento', val: selectedMachine?.name },
                  { label: 'Vazão/ha', val: `${formData.flowRate} L/ha`, color: 'text-blue-600' },
                  { label: 'Tanque Estimado', val: `${stats.totalVolume.toLocaleString()} L`, color: 'text-emerald-600' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{item.label}</span>
                    <p className={`text-xs font-black uppercase ${item.color || 'text-slate-800'}`}>{item.val || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-emerald-600">
                <Beaker size={22} strokeWidth={2.5} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Receituário de Insumos</h3>
              </div>
              <div className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                      <th className="px-8 py-5">Insumo</th>
                      <th className="px-8 py-5 text-center">Dosagem ha</th>
                      <th className="px-8 py-5 text-center">Carga p/ Tanque</th>
                      <th className="px-8 py-5 text-right">Volume Consolidado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900 uppercase">{item.productName}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-bold text-slate-500">{item.dosePerHa} L/Kg</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-black text-slate-800">{item.qtyPerTank.toFixed(2)} L/Kg</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-black text-emerald-600">{item.qtyTotal.toFixed(2)} L/Kg</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-6 pt-10 border-t border-slate-100">
              <button onClick={() => setStep('FORM')} className="px-10 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                <ChevronLeft size={18} /> EDITAR PARÂMETROS
              </button>
              <button onClick={handleConfirm} className="px-14 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-4 transition-all active:scale-95 group">
                {initialData ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E EMITIR'}
                <CheckCircle2 size={22} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                        : `${formData.fieldIds.length} TALHÕES SELECIONADOS`}
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
                        <div className="px-6 py-10 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Nenhum talhão encontrado</p>
                        </div>
                      )}
                    </div>
                    {formData.fieldIds.length > 0 && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
                        <button onClick={() => setIsFieldDropdownOpen(false)} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">Concluir Seleção</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {formData.fieldIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFields.map(f => (
                    <div key={f.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      <span className="text-[9px] font-black text-emerald-700 uppercase">{f.name}</span>
                      <button onClick={() => toggleField(f.id)} className="text-emerald-400 hover:text-emerald-600">
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                <button 
                  type="button"
                  onClick={handleGenerateSequence}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white border border-slate-200 text-emerald-500 rounded-xl shadow-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 group-focus-within:border-emerald-500"
                  title="Gerar Sequência Automática"
                >
                  <Sparkles size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cultura Alvo</label>
              <select name="culture" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.culture} onChange={handleInputChange}>
                <option value="">EX: SOJA, MILHO, ALGODÃO</option>
                <option value="Soja">Soja</option>
                <option value="Milho">Milho</option>
                <option value="Algodão">Algodão</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Variedade / Híbrido</label>
              <input type="text" name="variety" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="EX: BMX POTÊNCIA" value={formData.variety} onChange={handleInputChange} />
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-end bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Capacidade (L)</label>
              <input type="number" name="tankCapacity" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none" placeholder="0" value={formData.tankCapacity || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vazão (L/ha)</label>
              <input type="number" name="flowRate" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none" placeholder="0" value={formData.flowRate || ''} onChange={handleInputChange} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center min-h-[72px] shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">ha/Tanque</span>
              <span className="text-sm font-black text-emerald-600 italic">{stats.haPerTank.toFixed(2)} ha</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center min-h-[72px] shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Carga de Calda</span>
              <span className="text-sm font-black text-blue-600 italic">{stats.totalVolume.toLocaleString()} L</span>
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
              {items.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum produto adicionado à calda</p>
                </div>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-8 relative group animate-in slide-in-from-top-4 duration-300 shadow-sm hover:shadow-md transition-shadow">
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
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" value={item.dosePerHa || ''} onChange={(e) => updateItem(idx, item.insumoId, Number(e.target.value))} />
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Carga/Tanque</span>
                      <span className="text-xs font-black text-slate-700">{item.qtyPerTank > 0 ? item.qtyPerTank.toFixed(2) : '-'}</span>
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
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