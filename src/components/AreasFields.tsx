import React, { useState } from 'react';
import { 
  Sprout, 
  Map as MapIcon, 
  Tractor, 
  Plus, 
  ChevronDown, 
  Trash2,
  Edit2,
  MapPin,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface AreaSectionProps {
  title: string;
  icon: any;
  color: string;
  buttonLabel: string;
  countLabel: string;
  items: any[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  renderItem: (item: any) => React.ReactNode;
}

const AreaSection: React.FC<AreaSectionProps> = ({ 
  title, icon: Icon, color, buttonLabel, countLabel, items, onAdd, onEdit, onDelete, renderItem 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm transition-all duration-300">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={color} size={20} strokeWidth={2.5} />
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] ${color}`}>{title}</h3>
          </div>
        </div>
        
        <button 
          onClick={onAdd}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 text-[11px] uppercase tracking-widest"
        >
          <Plus size={20} className="border-2 border-white rounded-full p-0.5" strokeWidth={3} />
          {buttonLabel}
        </button>
      </div>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{countLabel}</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="bg-white animate-in slide-in-from-top-2 duration-300">
          <div className="p-2 space-y-1">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between p-6 hover:bg-slate-50 rounded-2xl group transition-all border-b border-slate-50 last:border-0">
                  {renderItem(item)}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(item)}
                      className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(item)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest italic">
                Nenhum item cadastrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AreasFieldsProps {
  farms: any[];
  fields: any[];
  crops: any[];
  onUpdate: () => void;
}

const AreasFields: React.FC<AreasFieldsProps> = ({ farms, fields, crops, onUpdate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [modalType, setModalType] = useState<'crop' | 'farm' | 'field' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (type: 'crop' | 'farm' | 'field', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || {});
    setModalOpen(true);
  };

  const handleOpenDelete = (type: 'crop' | 'farm' | 'field', item: any) => {
    setModalType(type);
    setItemToDelete(item);
    setConfirmDeleteOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const userId = user.id;

      if (modalType === 'crop') {
        const payload = {
          name: formData.name,
          variety: formData.variety,
          color: 'text-emerald-500',
          user_id: userId
        };

        if (editingItem) {
          await supabase.from('crops').update(payload).eq('id', editingItem.id);
        } else {
          await supabase.from('crops').insert(payload);
        }
      } 
      else if (modalType === 'farm') {
        const payload = {
          name: formData.name,
          location: formData.location,
          total_area: formData.area, 
          user_id: userId
        };

        if (editingItem) {
          await supabase.from('farms').update(payload).eq('id', editingItem.id);
        } else {
          await supabase.from('farms').insert(payload);
        }
      } 
      else if (modalType === 'field') {
        const payload = {
          name: formData.name,
          farm_id: formData.farmId,
          area: formData.area,
          user_id: userId
        };

        if (editingItem) {
          await supabase.from('fields').update(payload).eq('id', editingItem.id);
        } else {
          await supabase.from('fields').insert(payload);
        }
      }

      onUpdate(); // Atualizar dados via prop do pai
      setModalOpen(false);
      setFormData({});
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete || !modalType) return;
    setLoading(true);

    try {
      if (modalType === 'crop') {
        await supabase.from('crops').delete().eq('id', itemToDelete.id);
      } else if (modalType === 'farm') {
        await supabase.from('farms').delete().eq('id', itemToDelete.id);
      } else if (modalType === 'field') {
        await supabase.from('fields').delete().eq('id', itemToDelete.id);
      }

      onUpdate();
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
          Cadastro de Áreas
        </h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">
          Gerencie suas fazendas, talhões e culturas com precisão.
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-10">
        <AreaSection 
          title="Cadastro de Culturas" 
          icon={Sprout} 
          color="text-orange-500"
          buttonLabel="NOVA CULTURA"
          countLabel={`Culturas Cadastradas (${crops.length})`}
          items={crops}
          onAdd={() => handleOpenModal('crop')}
          onEdit={(item) => handleOpenModal('crop', item)}
          onDelete={(item) => handleOpenDelete('crop', item)}
          renderItem={(crop) => (
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl bg-slate-50 ${crop.color}`}>
                <Sprout size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{crop.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Genética: {crop.variety}</p>
              </div>
            </div>
          )}
        />

        <AreaSection 
          title="Cadastro de Fazendas" 
          icon={MapIcon} 
          color="text-blue-500"
          buttonLabel="NOVA FAZENDA"
          countLabel={`Fazendas Cadastradas (${farms.length})`}
          items={farms}
          onAdd={() => handleOpenModal('farm')}
          onEdit={(item) => handleOpenModal('farm', item)}
          onDelete={(item) => handleOpenDelete('farm', item)}
          renderItem={(farm) => (
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-500">
                <MapPin size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{farm.name}</p>
                <div className="flex gap-4 text-[9px] uppercase font-black tracking-widest text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {farm.location}</span>
                  <span className="text-blue-600 font-black flex items-center gap-1">| {farm.area} ha</span>
                </div>
              </div>
            </div>
          )}
        />

        <AreaSection 
          title="Cadastro de Talhões" 
          icon={Tractor} 
          color="text-emerald-500"
          buttonLabel="NOVO TALHÃO"
          countLabel={`Talhões Cadastrados (${fields.length})`}
          items={fields}
          onAdd={() => handleOpenModal('field')}
          onEdit={(item) => handleOpenModal('field', item)}
          onDelete={(item) => handleOpenDelete('field', item)}
          renderItem={(field) => (
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500">
                <Tractor size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{field.name}</p>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  <span className="font-bold">{field.farmName}</span>
                  <span className="text-emerald-600 font-black italic">| {field.area} ha</span>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Forms Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                  {editingItem ? 'Editar' : 'Novo'} {modalType === 'crop' ? 'Cultura' : modalType === 'farm' ? 'Fazenda' : 'Talhão'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Informe os dados cadastrais</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-white border border-slate-200 rounded-2xl shadow-sm">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              {modalType === 'crop' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nome da Cultura</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Soja, Milho, Algodão"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Variedade / Genética</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: M 6410 IPRO"
                      value={formData.variety || ''}
                      onChange={(e) => setFormData({...formData, variety: e.target.value})}
                    />
                  </div>
                </>
              )}

              {modalType === 'farm' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Nome da Propriedade</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Nome oficial da fazenda"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Localização</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Sorriso - MT"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Área Total (ha)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="0"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    />
                  </div>
                </>
              )}

              {modalType === 'field' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Fazenda Alocada</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                      value={formData.farmId || ''}
                      onChange={(e) => setFormData({...formData, farmId: e.target.value})}
                    >
                      <option value="">Selecione a Fazenda...</option>
                      {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Identificação do Talhão</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: T1, Gleba Norte..."
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Área Útil (ha)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="0"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-8 bg-slate-50 flex gap-6 border-t border-slate-100">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase text-xs tracking-widest disabled:opacity-50"
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'SALVANDO...' : 'SALVAR DADOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2 border border-red-100">
                <AlertTriangle size={48} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Confirmar Exclusão?</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3 leading-relaxed px-4">
                  Você está prestes a excluir <span className="font-bold text-slate-900">"{itemToDelete?.name}"</span>. 
                  {modalType === 'farm' && " ATENÇÃO: Todos os talhões vinculados serão removidos."}
                </p>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex flex-col gap-4 border-t border-slate-100">
              <button 
                onClick={executeDelete}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'EXCLUINDO...' : 'SIM, EXCLUIR ITEM'}
              </button>
              <button 
                onClick={() => setConfirmDeleteOpen(false)}
                className="w-full py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 rounded-2xl transition-all"
                disabled={loading}
              >
                NÃO, MANTER CADASTRO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreasFields;