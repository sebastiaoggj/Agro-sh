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

import { ServiceOrder, Insumo, PurchaseOrder, MasterInsumo, StockHistoryEntry, PurchaseOrderStatus, Field, Machine, OrderStatus, OSItem } from './types';

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
  const [fields, setFields] = useState<Field[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [operators, setOperators] = useState<{id: string, name: string}[]>([]);
  const [crops, setCrops] = useState<{id: string, name: string, variety: string}[]>([]); // Novo estado para Culturas
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

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
      if (cropsData) {
        setCrops(cropsData.map(c => ({
          id: c.id,
          name: c.name,
          variety: c.variety
        })));
      }

      const { data: farmsData } = await supabase.from('farms').select('id, name').order('name');
      if (farmsData) {
        setFarms(farmsData);
      }

      const { data: fieldsData } = await supabase.from('fields').select('*');
      if (fieldsData) {
        setFields(fieldsData.map(f => ({
          id: f.id,
          farmId: f.farm_id,
          name: f.name,
          area: f.area
        })));
      }

      const { data: machinesData } = await supabase.from('machines').select('*');
      if (machinesData) {
        setMachines(machinesData.map(m => ({
          id: m.id,
          name: m.name,
          type: 'Pulverizador Terrestre', 
          tankCapacity: m.capacity
        })));
      }

      const { data: opData } = await supabase.from('operators').select('*');
      if (opData) {
        setOperators(opData.map(o => ({
          id: o.id,
          name: o.name
        })));
      }

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

      const { data: osData } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false });
      if (osData) {
        const formattedOrders: ServiceOrder[] = osData.map((o: any) => ({
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
        }));
        setOrders(formattedOrders);
      }

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

  // Função Auxiliar: Verificar se tem estoque para todos os itens da OS
  const checkStockAvailability = (items: OSItem[], currentInventory: Insumo[]) => {
    if (!items || items.length === 0) return true;
    
    for (const item of items) {
      if (!item.insumoId) continue;
      const stockItem = currentInventory.find(inv => inv.id === item.insumoId);
      
      // Se não existir ou se a quantidade disponível (Físico - Reservado) for menor que a necessária
      if (!stockItem || stockItem.availableQty < item.qtyTotal) {
        return false;
      }
    }
    return true;
  };

  // Função Automática: Liberar Ordens Aguardando Produto
  const triggerAutoRelease = async () => {
    const { data: awaitingOrders } = await supabase
      .from('service_orders')
      .select('*')
      .eq('status', OrderStatus.AWAITING_PRODUCT);

    if (!awaitingOrders || awaitingOrders.length === 0) return;

    const { data: freshInvData } = await supabase.from('inventory').select('*');
    if (!freshInvData) return;

    const freshInventoryMap = new Map(freshInvData.map((inv: any) => [
      inv.id, 
      Number(inv.physical_stock) - Number(inv.reserved_qty) 
    ]));

    let updatedCount = 0;

    for (const order of awaitingOrders) {
      const items = order.items as OSItem[];
      let canRelease = true;

      for (const item of items) {
        if (item.insumoId) {
          const available = freshInventoryMap.get(item.insumoId) || 0;
          if (available < item.qtyTotal) {
            canRelease = false;
            break; 
          }
        }
      }

      if (canRelease) {
        await supabase.from('service_orders').update({ status: OrderStatus.EMITTED }).eq('id', order.id);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await supabase.rpc('recalculate_stock_reservations'); 
      alert(`${updatedCount} ordens que aguardavam produto foram liberadas automaticamente!`);
      fetchAllData();
    }
  };

  // Handler Salvar OS
  const handleSaveServiceOrder = async (order: ServiceOrder): Promise<boolean> => {
    if (!session?.user) return false;
    try {
      const validItems = order.items.filter(i => i.insumoId && i.insumoId !== '');
      
      const hasStock = checkStockAvailability(validItems, inventory);
      
      let finalStatus = order.status;
      if (!order.id || order.status === OrderStatus.EMITTED || order.status === OrderStatus.DRAFT || order.status === OrderStatus.AWAITING_PRODUCT) {
         finalStatus = hasStock ? OrderStatus.EMITTED : OrderStatus.AWAITING_PRODUCT;
      }

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
        user_id: session.user.id
      };

      if (editingOrder && editingOrder.id === order.id) {
         const { error } = await supabase.from('service_orders').update(payload).eq('id', order.id);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('service_orders').insert(payload);
         if (error) throw error;
      }

      setTimeout(() => {
         fetchAllData();
      }, 500);

      setEditingOrder(null);
      
      if (finalStatus === OrderStatus.AWAITING_PRODUCT) {
        alert("Ordem criada com status 'Aguardando Produto' por falta de estoque suficiente.");
      }

      return true;

    } catch (error: any) {
      console.error("Erro ao salvar OS:", error);
      const msg = error.message || error.details || "Erro desconhecido";
      alert(`Erro ao salvar ordem de serviço: ${msg}`);
      return false;
    }
  };

  // Handlers de Status, Delete, PO etc mantidos iguais (só atualizando o context se necessário)
  const handleUpdateOSStatus = async (id: string, newStatus: OrderStatus, leftovers: Record<string, number> = {}) => {
    try {
      if (newStatus === OrderStatus.IN_PROGRESS) {
        const { error } = await supabase.rpc('start_service_order', {
          p_order_id: id,
          p_user_id: session?.user.id,
          p_user_name: session?.user.email?.split('@')[0] || 'Sistema'
        });
        
        if (error) throw error;
        fetchAllData();
        return;
      }

      const { data: currentOrder } = await supabase.from('service_orders').select('*').eq('id', id).single();
      if (!currentOrder) return;
      const items = currentOrder.items as any[];
      
      if (newStatus === OrderStatus.COMPLETED && currentOrder.status === OrderStatus.IN_PROGRESS) {
         if (items) {
           for (const item of items) {
             const leftoverQty = leftovers[item.insumoId] || 0;
             if (leftoverQty > 0) {
               const { data: invItem } = await supabase.from('inventory').select('physical_stock').eq('id', item.insumoId).single();
               if (invItem) {
                 await supabase.from('inventory').update({
                   physical_stock: Number(invItem.physical_stock) + Number(leftoverQty)
                 }).eq('id', item.insumoId);
                 
                 await supabase.from('stock_history').insert({
                   inventory_id: item.insumoId,
                   type: 'ENTRADA',
                   description: `Retorno de Sobra OS #${currentOrder.order_number}`,
                   quantity: leftoverQty,
                   user_name: session?.user.email?.split('@')[0] || 'Sistema',
                   user_id: session?.user.id
                 });
               }
             }
           }
         }
      }
      else if (newStatus === OrderStatus.CANCELLED) {
         if (items) {
           if (currentOrder.status === OrderStatus.IN_PROGRESS) {
             for (const item of items) {
                const { data: invItem } = await supabase.from('inventory').select('physical_stock').eq('id', item.insumoId).single();
                if (invItem) {
                  await supabase.from('inventory').update({
                    physical_stock: Number(invItem.physical_stock) + Number(item.qtyTotal)
                  }).eq('id', item.insumoId);

                  await supabase.from('stock_history').insert({
                    inventory_id: item.insumoId,
                    type: 'ENTRADA',
                    description: `Estorno OS Cancelada #${currentOrder.order_number}`,
                    quantity: item.qtyTotal,
                    user_name: session?.user.email?.split('@')[0] || 'Sistema',
                    user_id: session?.user.id
                  });
                }
             }
           } 
         }
      }

      const { error } = await supabase.from('service_orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      setTimeout(() => {
         fetchAllData();
      }, 500);

    } catch (error: any) {
      console.error("Erro ao atualizar status da OS:", error);
      alert("Erro ao atualizar status: " + (error.message || "Erro desconhecido"));
    }
  };

  const handleDeleteOS = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) return;
    try {
      const { data: orderToDelete } = await supabase.from('service_orders').select('*').eq('id', id).single();
      
      if (orderToDelete && orderToDelete.items) {
         const items = orderToDelete.items as any[];
         if (orderToDelete.status === OrderStatus.IN_PROGRESS) {
            for (const item of items) {
               if (item.insumoId) {
                  const { data: invItem } = await supabase.from('inventory').select('physical_stock').eq('id', item.insumoId).single();
                  if (invItem) {
                    await supabase.from('inventory').update({
                      physical_stock: Number(invItem.physical_stock) + Number(item.qtyTotal)
                    }).eq('id', item.insumoId);
                  }
               }
            }
         }
      }

      const { error } = await supabase.from('service_orders').delete().eq('id', id);
      if (error) throw error;

      setTimeout(async () => {
         await supabase.rpc('recalculate_stock_reservations');
         fetchAllData();
      }, 500);

    } catch (error) {
      console.error("Erro ao excluir OS:", error);
      alert("Erro ao excluir ordem.");
    }
  };

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
        const { data: po } = await supabase.from('purchase_orders').select('*').eq('id', id).single();
        if (!po) throw new Error("Pedido não encontrado");

        let masterInsumoId = po.master_insumo_id;
        let farmId = po.farm_id;

        if (!masterInsumoId) {
          const { data: mi } = await supabase.from('master_insumos').select('id').eq('name', po.product_name).single();
          if (mi) masterInsumoId = mi.id;
        }
        if (!farmId) {
          const { data: fm } = await supabase.from('farms').select('id').eq('name', po.farm_name).single();
          if (fm) farmId = fm.id;
        }

        if (masterInsumoId && farmId) {
          const { data: existingInv } = await supabase
            .from('inventory')
            .select('*')
            .eq('master_insumo_id', masterInsumoId)
            .eq('farm_id', farmId)
            .maybeSingle();

          let inventoryId = null;

          if (existingInv) {
            const { error: updateError } = await supabase.from('inventory').update({
              physical_stock: Number(existingInv.physical_stock) + Number(po.quantity)
            }).eq('id', existingInv.id);
            if (updateError) throw updateError;
            inventoryId = existingInv.id;
          } else {
            const { data: newInv, error: insertError } = await supabase.from('inventory').insert({
              master_insumo_id: masterInsumoId,
              farm_id: farmId,
              physical_stock: po.quantity,
              reserved_qty: 0,
              min_stock: 0,
              user_id: session.user.id
            }).select().single();
            if (insertError) throw insertError;
            inventoryId = newInv.id;
          }

          if (inventoryId) {
             const nfInfo = extraData.invoice_number ? ` | NF: ${extraData.invoice_number}` : '';
             await supabase.from('stock_history').insert({
               inventory_id: inventoryId,
               type: 'ENTRADA',
               description: `Recebimento Pedido #${po.order_number}${nfInfo}`,
               quantity: po.quantity,
               user_name: session.user.email?.split('@')[0],
               user_id: session.user.id
             });
          }
          alert("Estoque atualizado com sucesso!");
          
          await triggerAutoRelease();

        } else {
          console.warn("Faltam dados para entrada automática.");
        }
      }

      const { error } = await supabase.from('purchase_orders').update({ status, ...extraData }).eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao processar atualização.");
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
            onUpdateStatus={handleUpdateOSStatus} 
            onDeleteOrder={handleDeleteOS}
            onEditOrder={(o) => { setEditingOrder(o); setActiveTab('orders'); }}
            onCreateOrder={() => { setEditingOrder(null); setActiveTab('orders'); }}
            onMakePurchaseClick={() => setActiveTab('purchases')}
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
              onStockChange={triggerAutoRelease}
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
              onSave={handleSaveServiceOrder} 
              onCancel={() => { setEditingOrder(null); setActiveTab('dashboard'); }} 
              farms={farms}
              fields={fields}
              machines={machines}
              operators={operators}
              insumos={inventory}
              crops={crops} // Passando culturas para o formulário
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