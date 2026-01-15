import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Package, Truck, 
  Map as MapIcon, Calendar, Sprout, ShoppingCart, 
  Beaker, LogOut, RefreshCw, BarChart3, Users
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './integrations/supabase/client';

import OSKanban from './components/OSKanban';
import OrderForm from './components/OrderForm';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import AreasFields from './components/AreasFields';
import FleetManagement from './components/FleetManagement';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import PurchaseOrders from './components/PurchaseOrders';
import InsumoMaster from './components/InsumoMaster';
import TeamManagement from './components/TeamManagement';

import { ServiceOrder, Insumo, PurchaseOrder, MasterInsumo, StockHistoryEntry, PurchaseOrderStatus, Field, Machine, OrderStatus } from './types';

// Interface do Perfil de Usuário
interface UserProfile {
  id: string;
  role: 'admin' | 'operator';
  can_manage_users: boolean;
  can_manage_inputs: boolean;
  can_manage_machines: boolean;
  full_name: string;
}

const SHLogo: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => (
  <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-slate-200 overflow-hidden p-1 group hover:border-blue-200 transition-colors">
    <div className="flex items-center gap-0.5 mt-1">
      <span className="text-[#0047AB] font-black text-2xl leading-none tracking-tighter">S</span>
      <div className="w-1.5 h-1 bg-[#0047AB] rounded-[1px] mt-0.5"></div>
      <span className="text-[#0047AB] font-black text-2xl leading-none tracking-tighter">H</span>
    </div>
    <span className="text-[#0047AB] font-bold text-[5px] uppercase tracking-wider transform scale-x-110 -mt-0.5">Agropecuária</span>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // UUID válido para operações offline (Nil UUID)
  const [offlineUserId] = useState('00000000-0000-0000-0000-000000000000');
  
  // Estados Globais
  const [masterInsumos, setMasterInsumos] = useState<MasterInsumo[]>([]);
  const [inventory, setInventory] = useState<Insumo[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [farms, setFarms] = useState<{ id: string, name: string }[]>([]); 
  const [fields, setFields] = useState<Field[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<{id: string, name: string}[]>([]);
  const [crops, setCrops] = useState<{id: string, name: string, variety: string}[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // AUTO LOGIN LOGIC
  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          setSession(existingSession);
          await fetchUserProfile(existingSession.user.id);
        } else {
          // Tenta fazer login automático
          const email = 'admin@agro.com';
          const password = 'admin123';

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (!signInError && signInData.session) {
            setSession(signInData.session);
            await fetchUserProfile(signInData.session.user.id);
          } else {
            console.warn("Entrando em modo offline.");
            createDummySession();
          }
        }
      } catch (e) {
        console.error("Erro no login:", e);
        createDummySession();
      } finally {
        setAuthProcessing(false);
        setLoading(false);
      }
    };

    performAutoLogin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createDummySession = () => {
    // Cria um perfil fictício para permitir o uso da interface
    setUserProfile({
      id: offlineUserId,
      role: 'admin',
      full_name: 'SISTEMA',
      can_manage_inputs: true,
      can_manage_machines: true,
      can_manage_users: true
    });
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        setUserProfile({
          id: userId,
          role: 'admin',
          full_name: 'ADMIN',
          can_manage_inputs: true,
          can_manage_machines: true,
          can_manage_users: true
        });
      }
    } catch (e) {
      console.error("Erro ao buscar perfil", e);
      createDummySession();
    }
  };

  const fetchAllData = async () => {
    try {
      const { data: masterData } = await supabase.from('master_insumos').select('*');
      if (masterData) {
        setMasterInsumos(masterData.map(item => ({
          id: item.id,
          name: item.name,
          activeIngredient: item.active_ingredient,
          unit: item.unit,
          category: item.category,
          price: item.price,
          defaultPurchaseQty: item.default_purchase_qty
        })));
      }
      
      const { data: cropsData } = await supabase.from('crops').select('*').order('name');
      if (cropsData) setCrops(cropsData.map(c => ({ id: c.id, name: c.name, variety: c.variety })));

      const { data: farmsData } = await supabase.from('farms').select('*').order('name');
      if (farmsData) setFarms(farmsData.map(f => ({ ...f, area: f.total_area })));

      const { data: fieldsData } = await supabase.from('fields').select(`*, farm:farms(name)`);
      if (fieldsData) setFields(fieldsData.map((f: any) => ({ ...f, farmId: f.farm_id, farmName: f.farm?.name })));

      const { data: machinesData } = await supabase.from('machines').select('*');
      if (machinesData) setMachines(machinesData.map(m => ({ id: m.id, name: m.name, type: 'Pulverizador Terrestre', tankCapacity: m.capacity })));

      const { data: opData } = await supabase.from('operators').select('*');
      if (opData) setOperators(opData.map(o => ({ id: o.id, name: o.name })));

      const { data: invData } = await supabase.from('inventory').select(`*, master_insumo:master_insumos(name, active_ingredient, unit, category, price), farm:farms(name)`);
      if (invData) {
        setInventory(invData.map((item: any) => ({
          id: item.id,
          masterId: item.master_insumo_id,
          name: item.master_insumo?.name || 'Item Removido',
          activeIngredient: item.master_insumo?.active_ingredient || '-',
          unit: item.master_insumo?.unit || 'UN',
          category: item.master_insumo?.category || 'OUTROS',
          price: item.master_insumo?.price || 0,
          farm: item.farm?.name || 'Desconhecida',
          physicalStock: Number(item.physical_stock),
          reservedQty: Number(item.reserved_qty),
          availableQty: Number(item.physical_stock) - Number(item.reserved_qty),
          stock: Number(item.physical_stock),
          minStock: Number(item.min_stock)
        })));
      }

      const { data: osData } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false });
      if (osData) {
        setOrders(osData.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          farmId: o.farm_id,
          farmName: o.farm_name || '',
          fieldIds: o.field_ids || [],
          fieldNames: o.field_names || [],
          culture: o.culture,
          variety: o.variety,
          recommendationDate: o.recommendation_date,
          maxApplicationDate: o.max_application_date,
          machineType: o.machine_type,
          machineId: o.machine_id,
          machineName: o.machine_name || '',
          operatorId: o.operator_id,
          tankCapacity: o.tank_capacity,
          flowRate: o.flow_rate,
          totalArea: o.total_area,
          totalVolume: o.total_volume,
          status: o.status as OrderStatus,
          items: o.items || [], 
          nozzle: o.nozzle || '',
          pressure: o.pressure || '',
          speed: o.speed || '',
          applicationType: o.application_type || '',
          mandatoryPhrase: o.mandatory_phrase || '',
          observations: o.observations || ''
        })));
      }

      const { data: histData } = await supabase.from('stock_history').select('*').order('created_at', { ascending: false });
      if (histData) {
        setStockHistory(histData.map((h: any) => ({
          id: h.id,
          insumoId: h.inventory_id,
          date: new Date(h.created_at).toLocaleString('pt-BR'),
          type: h.type,
          description: h.description,
          quantity: h.quantity,
          user: h.user_name || 'Sistema'
        })));
      }

      const { data: poData } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
      if (poData) {
        setPurchaseOrders(poData.map((item: any) => ({
          id: item.id,
          orderNumber: item.order_number,
          supplier: item.supplier,
          productName: item.product_name,
          masterInsumoId: item.master_insumo_id,
          farmName: item.farm_name,
          farmId: item.farm_id,
          quantity: item.quantity,
          unit: item.unit,
          totalValue: item.total_value,
          orderDate: item.order_date,
          expectedDelivery: item.expected_delivery,
          status: item.status as PurchaseOrderStatus,
          invoiceNumber: item.invoice_number
        })));
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    // Carrega dados independentemente do estado da sessão
    fetchAllData();
  }, [session]);

  const triggerAutoRelease = async () => { /* Lógica existente */ };

  const handleSaveServiceOrder = async (order: ServiceOrder): Promise<boolean> => {
    const userId = session?.user?.id || offlineUserId;
    try {
      const validItems = order.items.filter(i => i.insumoId && i.insumoId !== '');
      let finalStatus = order.status;

      const toNullable = (val: string | undefined) => (!val || val.trim() === '') ? null : val;

      const payload = {
        order_number: order.orderNumber,
        farm_id: order.farmId,
        farm_name: order.farmName,
        field_ids: order.fieldIds,
        field_names: order.fieldNames,
        culture: order.culture,
        variety: order.variety,
        recommendation_date: toNullable(order.recommendationDate),
        max_application_date: toNullable(order.maxApplicationDate),
        machine_type: order.machineType,
        machine_id: toNullable(order.machineId),
        machine_name: order.machineName,
        operator_id: toNullable(order.operatorId),
        tank_capacity: order.tankCapacity,
        flow_rate: order.flowRate,
        nozzle: order.nozzle,
        pressure: order.pressure,
        speed: order.speed,
        application_type: order.applicationType,
        mandatory_phrase: order.mandatoryPhrase,
        observations: order.observations,
        total_area: order.totalArea,
        total_volume: order.totalVolume,
        status: finalStatus,
        items: validItems, 
        user_id: userId
      };

      if (editingOrder && editingOrder.id === order.id) {
         const { error } = await supabase.from('service_orders').update(payload).eq('id', order.id);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('service_orders').insert(payload);
         if (error) throw error;
      }

      setTimeout(() => { fetchAllData(); }, 500);
      setEditingOrder(null);
      return true;

    } catch (error: any) {
      console.error("Erro ao salvar OS:", error);
      alert(`Erro ao salvar: ${error.message}`);
      return false;
    }
  };

  const handleUpdateOSStatus = async (id: string, newStatus: OrderStatus, leftovers: any = {}) => {
    try {
      const { error } = await supabase.from('service_orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setTimeout(() => { fetchAllData(); }, 500);
    } catch (error: any) {
      console.error("Erro status:", error);
      alert("Erro ao atualizar status.");
    }
  };

  const handleDeleteOS = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return;
    try {
      const { error } = await supabase.from('service_orders').delete().eq('id', id);
      if (error) throw error;
      setTimeout(() => { fetchAllData(); }, 500);
    } catch (error) {
      alert("Erro ao excluir ordem.");
    }
  };

  const handleSavePurchaseOrder = async (po: PurchaseOrder) => {
    const userId = session?.user?.id || offlineUserId;
    try {
      const payload = {
        order_number: po.orderNumber,
        supplier: po.supplier,
        product_name: po.productName,
        master_insumo_id: po.masterInsumoId,
        farm_name: po.farmName,
        farm_id: po.farmId,
        quantity: po.quantity,
        unit: po.unit,
        total_value: po.totalValue,
        order_date: po.orderDate ? new Date(po.orderDate.split('/').reverse().join('-')).toISOString() : new Date().toISOString(),
        expected_delivery: po.expectedDelivery,
        status: po.status,
        user_id: userId
      };
      const { error } = await supabase.from('purchase_orders').insert(payload);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      alert("Erro ao salvar pedido.");
    }
  };

  const handleUpdatePOStatus = async (id: string, status: string, extraData: any = {}) => {
    try {
       // 1. Lógica de Recebimento de Estoque
       if (status === PurchaseOrderStatus.RECEIVED) {
          const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('id', id)
            .single();

          if (poError || !po) throw new Error("Pedido não encontrado");

          if (po.status === PurchaseOrderStatus.RECEIVED) {
             alert("Este pedido já foi recebido anteriormente.");
             return;
          }

          // Busca item no inventário (Chave: Insumo + Fazenda)
          const { data: existingInv } = await supabase
            .from('inventory')
            .select('*')
            .eq('master_insumo_id', po.master_insumo_id)
            .eq('farm_id', po.farm_id)
            .single();

          let inventoryId = existingInv?.id;

          if (existingInv) {
             // Atualiza existente
             await supabase.from('inventory').update({
                physical_stock: Number(existingInv.physical_stock) + Number(po.quantity)
             }).eq('id', existingInv.id);
          } else {
             // Cria novo registro
             const { data: newInv, error: invError } = await supabase.from('inventory').insert({
                master_insumo_id: po.master_insumo_id,
                farm_id: po.farm_id,
                physical_stock: Number(po.quantity),
                reserved_qty: 0,
                min_stock: 0,
                user_id: session?.user?.id || offlineUserId
             }).select().single();
             
             if (invError) throw invError;
             inventoryId = newInv.id;
          }

          // Grava Histórico
          await supabase.from('stock_history').insert({
             inventory_id: inventoryId,
             type: 'ENTRADA',
             description: `Recebimento Pedido #${po.order_number} (NF: ${extraData.invoice_number || 'N/A'})`,
             quantity: Number(po.quantity),
             user_name: userProfile?.full_name || 'Sistema',
             user_id: session?.user?.id || offlineUserId
          });
       }

       // 2. Atualiza status do pedido
       const { error } = await supabase.from('purchase_orders').update({ status, ...extraData }).eq('id', id);
       if (error) throw error;
       
       fetchAllData();
       
       if (status === PurchaseOrderStatus.RECEIVED) {
         alert("Recebimento confirmado e estoque atualizado!");
       }
    } catch(e: any) { 
       console.error(e);
       alert("Erro ao atualizar: " + e.message); 
    }
  };

  const handleDeletePO = async (id: string) => {
    if(!confirm("Excluir?")) return;
    try {
        await supabase.from('purchase_orders').delete().eq('id', id);
        fetchAllData();
    } catch(e) { alert("Erro."); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleRefresh = () => { fetchAllData(); };

  // Garante que effectiveProfile nunca seja null para evitar crashes
  const effectiveProfile = userProfile || {
    id: offlineUserId,
    role: 'admin',
    can_manage_users: true,
    can_manage_inputs: true,
    can_manage_machines: true,
    full_name: 'SISTEMA'
  };

  if (authProcessing || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-100 gap-6">
        <div className="w-24 h-24 bg-white rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-slate-200 border border-slate-100 p-2 animate-pulse">
            <div className="flex items-center gap-0.5">
              <span className="text-[#0047AB] font-black text-4xl leading-none">S</span>
              <div className="w-1.5 h-1.5 bg-[#0047AB] rounded-sm mt-1"></div>
              <span className="text-[#0047AB] font-black text-4xl leading-none">H</span>
            </div>
            <span className="text-[#0047AB] font-bold text-[8px] uppercase tracking-wider transform scale-x-110 mt-1">Agropecuária</span>
        </div>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">SH Oliveira</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 animate-pulse">Sistema de Gestão</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard': 
          return <OSKanban orders={orders} onUpdateStatus={handleUpdateOSStatus} onDeleteOrder={handleDeleteOS} onEditOrder={(o) => { setEditingOrder(o); setActiveTab('orders'); }} onCreateOrder={() => { setEditingOrder(null); setActiveTab('orders'); }} onMakePurchaseClick={() => setActiveTab('purchases')} />;
        case 'calendar': return <div className="p-12 h-full"><CalendarView orders={orders} /></div>;
        case 'stats': return <div className="p-12 h-full"><StatsView orders={orders} inventory={inventory} /></div>;
        case 'inventory': return <div className="p-12 h-full"><Inventory stockProp={inventory} onRefresh={handleRefresh} onStockChange={triggerAutoRelease} masterInsumos={masterInsumos} farms={farms} history={stockHistory} /></div>;
        
        case 'master_insumos':
          return effectiveProfile?.can_manage_inputs ? (
            <div className="p-12 h-full"><InsumoMaster insumos={masterInsumos} onRefresh={handleRefresh} /></div>
          ) : <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase">Acesso Negado</div>;
        
        case 'purchases': return <div className="p-12 h-full"><PurchaseOrders orders={purchaseOrders} farms={farms} masterInsumos={masterInsumos} onApprove={(id) => handleUpdatePOStatus(id, PurchaseOrderStatus.APPROVED)} onReceive={(id, s, n) => handleUpdatePOStatus(id, PurchaseOrderStatus.RECEIVED, {supplier: s, invoice_number: n})} onSave={handleSavePurchaseOrder} onDelete={handleDeletePO} onRepeat={() => {}} /></div>;
        case 'orders': return <div className="p-12 h-full"><OrderForm initialData={editingOrder} existingOrders={orders} onSave={handleSaveServiceOrder} onCancel={() => { setEditingOrder(null); setActiveTab('dashboard'); }} farms={farms} fields={fields} machines={machines} operators={operators} insumos={inventory} crops={crops} /></div>;
        
        case 'fleet': 
          return effectiveProfile?.can_manage_machines ? (
            <div className="p-12 h-full"><FleetManagement /></div>
          ) : <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase">Acesso Negado</div>;
        
        case 'areas': 
          return effectiveProfile?.can_manage_machines ? (
            <div className="p-12 h-full"><AreasFields farms={farms} fields={fields} crops={crops} onUpdate={fetchAllData} /></div>
          ) : <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase">Acesso Negado</div>;
        
        case 'reports': return <div className="p-12 h-full"><Reports orders={orders} inventory={inventory} onEdit={(o) => { setEditingOrder(o); setActiveTab('orders'); }} onDelete={handleDeleteOS} /></div>;
        
        case 'team':
          return effectiveProfile?.can_manage_users ? (
            <div className="p-12 h-full"><TeamManagement /></div>
          ) : <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase">Acesso Negado</div>;

        default: return null;
      }
    } catch (e) {
      console.error("Render error:", e);
      return <div className="p-12 text-red-500 font-bold">Erro ao renderizar módulo.</div>;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Página Inicial', icon: LayoutDashboard },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: ClipboardList },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'purchases', label: 'Pedidos', icon: ShoppingCart },
    ...(effectiveProfile?.can_manage_inputs ? [{ id: 'master_insumos', label: 'Insumos', icon: Beaker }] : []),
    ...(effectiveProfile?.can_manage_machines ? [
      { id: 'fleet', label: 'Frota', icon: Truck },
      { id: 'areas', label: 'Áreas', icon: MapIcon }
    ] : []),
    ...(effectiveProfile?.can_manage_users ? [{ id: 'team', label: 'Equipe', icon: Users }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'} print:hidden`}>
        <div className="p-8 flex items-center gap-4">
          <SHLogo isSidebarOpen={isSidebarOpen} />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-lg text-slate-900 leading-none italic uppercase">SH Oliveira</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistema de Gestão</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                Olá, {effectiveProfile.full_name?.split(' ')[0] || 'Usuário'}
              </span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-slate-100 text-[#10b981] font-black shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
           <button onClick={handleRefresh} className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
             <RefreshCw size={20} />
             {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">Atualizar</span>}
           </button>
           <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
             <LogOut size={20} />
             {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">Sair</span>}
           </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className={`flex-1 ${activeTab === 'dashboard' ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#f8fafc] h-full`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;