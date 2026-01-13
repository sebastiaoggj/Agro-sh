import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, Package, Truck, 
  Map as MapIcon, Calendar, Sprout, ShoppingCart, 
  Beaker, LogOut, RefreshCw, BarChart3
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
import Login from './components/Login';

import { ServiceOrder, Insumo, PurchaseOrder, MasterInsumo, StockHistoryEntry, PurchaseOrderStatus } from './types';

// Componente Logo
const SHLogo: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => (
  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/20">
    <Sprout size={24} />
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Estados Globais (Dados do Banco)
  const [masterInsumos, setMasterInsumos] = useState<MasterInsumo[]>([]);
  const [inventory, setInventory] = useState<Insumo[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [farms, setFarms] = useState<{ id: string, name: string }[]>([]); 
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  // Histórico agora vindo do DB
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);

  // 1. Gerenciar Sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Carregar Dados do Banco
  const fetchAllData = async () => {
    if (!session) return;
    
    try {
      // Buscar Master Insumos
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

      // Buscar Todas as Fazendas
      const { data: farmsData } = await supabase.from('farms').select('id, name').order('name');
      if (farmsData) {
        setFarms(farmsData);
      }

      // Buscar Estoque
      const { data: invData } = await supabase
        .from('inventory')
        .select(`*, master_insumo:master_insumos(name, active_ingredient, unit, category, price), farm:farms(name)`);

      if (invData) {
        const formattedInventory: Insumo[] = invData.map((item: any) => ({
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
        }));
        setInventory(formattedInventory);
      }

      // Buscar Histórico de Estoque
      const { data: histData } = await supabase
        .from('stock_history')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Buscar Pedidos de Compra
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (poData) {
        const formattedPOs: PurchaseOrder[] = poData.map((item: any) => ({
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
        }));
        setPurchaseOrders(formattedPOs);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAllData();
    }
  }, [session]);

  // Handlers para Pedidos de Compra
  const handleSavePurchaseOrder = async (po: PurchaseOrder) => {
    if (!session?.user) return;
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
        user_id: session.user.id
      };

      const { error } = await supabase.from('purchase_orders').insert(payload);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido.");
    }
  };

  const handleUpdatePOStatus = async (id: string, status: string, extraData: any = {}) => {
    if (!session?.user) return;
    try {
      if (status === PurchaseOrderStatus.RECEIVED) {
        // ... (Lógica de recebimento existente)
        const { data: po } = await supabase.from('purchase_orders').select('*').eq('id', id).single();
        if (!po) throw new Error("Pedido não encontrado");

        let masterInsumoId = po.master_insumo_id;
        let farmId = po.farm_id;
        let inventoryId = null;

        if (masterInsumoId && farmId) {
          const { data: existingInv } = await supabase
            .from('inventory')
            .select('*')
            .eq('master_insumo_id', masterInsumoId)
            .eq('farm_id', farmId)
            .single();

          if (existingInv) {
            inventoryId = existingInv.id;
            await supabase.from('inventory').update({
              physical_stock: Number(existingInv.physical_stock) + Number(po.quantity)
            }).eq('id', existingInv.id);
          } else {
            const { data: newInv, error } = await supabase.from('inventory').insert({
              master_insumo_id: masterInsumoId,
              farm_id: farmId,
              physical_stock: po.quantity,
              reserved_qty: 0,
              min_stock: 0,
              user_id: session.user.id
            }).select().single();
            if (error) throw error;
            inventoryId = newInv.id;
          }

          // Registrar no Histórico
          if (inventoryId) {
             await supabase.from('stock_history').insert({
               inventory_id: inventoryId,
               type: 'ENTRADA',
               description: `Recebimento Pedido #${po.order_number}`,
               quantity: po.quantity,
               user_name: session.user.email?.split('@')[0],
               user_id: session.user.id
             });
          }

        } else {
          console.warn("Faltam dados para entrada automática.");
        }
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update({ status, ...extraData })
        .eq('id', id);
      
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar pedido.");
    }
  };

  const handleDeletePO = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      alert("Erro ao excluir pedido.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  }

  if (!session) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return (
          <OSKanban 
            orders={orders} 
            onUpdateStatus={() => {}} 
            onEditOrder={(o) => { setEditingOrder(o); setActiveTab('orders'); }}
            onCreateOrder={() => { setEditingOrder(null); setActiveTab('orders'); }}
          />
        );
      case 'calendar':
        return <div className="p-12 h-full"><CalendarView orders={orders} /></div>;
      case 'stats':
        return <div className="p-12 h-full"><StatsView orders={orders} inventory={inventory} /></div>;
      case 'inventory': 
        return (
          <div className="p-12 h-full">
            <Inventory 
              stockProp={inventory} 
              onRefresh={handleRefresh}
              masterInsumos={masterInsumos}
              farms={farms} 
              history={stockHistory}
            />
          </div>
        );
      case 'master_insumos':
        return (
          <div className="p-12 h-full">
            <InsumoMaster 
              insumos={masterInsumos} 
              onRefresh={handleRefresh} 
            />
          </div>
        );
      case 'purchases': 
        return (
          <div className="p-12 h-full">
            <PurchaseOrders 
              orders={purchaseOrders}
              farms={farms} 
              masterInsumos={masterInsumos}
              onApprove={(id) => handleUpdatePOStatus(id, PurchaseOrderStatus.APPROVED)}
              onReceive={(id, supplier, nf) => handleUpdatePOStatus(id, PurchaseOrderStatus.RECEIVED, { supplier, invoice_number: nf })}
              onSave={handleSavePurchaseOrder}
              onDelete={handleDeletePO}
              onRepeat={() => {}}
            />
          </div>
        );
      case 'orders': 
        return (
          <div className="p-12 h-full">
            <OrderForm 
              initialData={editingOrder} 
              existingOrders={orders}
              onSave={(order) => { setOrders([...orders, order]); setActiveTab('dashboard'); }} 
              onCancel={() => { setEditingOrder(null); setActiveTab('dashboard'); }} 
            />
          </div>
        );
      case 'fleet': return <div className="p-12 h-full"><FleetManagement /></div>;
      case 'areas': return <div className="p-12 h-full"><AreasFields /></div>;
      case 'reports': return <div className="p-12 h-full"><Reports orders={orders} /></div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-4">
          <SHLogo isSidebarOpen={isSidebarOpen} />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl text-slate-900 leading-none italic uppercase">Agro SH</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Página Inicial', icon: LayoutDashboard },
            { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
            { id: 'calendar', label: 'Calendário', icon: Calendar },
            { id: 'reports', label: 'Relatórios', icon: ClipboardList },
            { id: 'inventory', label: 'Estoque', icon: Package },
            { id: 'purchases', label: 'Pedidos', icon: ShoppingCart },
            { id: 'master_insumos', label: 'Insumos', icon: Beaker },
            { id: 'fleet', label: 'Frota', icon: Truck },
            { id: 'areas', label: 'Áreas', icon: MapIcon },
          ].map(item => (
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
           <button 
             onClick={handleRefresh}
             className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
           >
             <RefreshCw size={20} />
             {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">Atualizar Dados</span>}
           </button>
           <button 
             onClick={handleSignOut}
             className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
           >
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