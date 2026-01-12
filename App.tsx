
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Truck, 
  Map as MapIcon, 
  BarChart3, 
  Calendar,
  Settings,
  PlusCircle,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sprout,
  ShoppingCart,
  Beaker
} from 'lucide-react';
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
import { ServiceOrder, OrderStatus, Insumo, PurchaseOrder, PurchaseOrderStatus, MasterInsumo, StockHistoryEntry } from './types';

const FARMS_LIST = ['SANTO AURELIO', 'ALIANCA', 'SAO GERONIMO', 'BOQUEIRAO', 'MANGA'];

const INITIAL_MASTER_INSUMOS: MasterInsumo[] = [
  { id: '1', name: 'GLIFOSATO 480', activeIngredient: 'GLIFOSATO', unit: 'LT', category: 'HERBICIDA', defaultPurchaseQty: 1000, price: 45.50 },
  { id: '2', name: 'FOX XPRO', activeIngredient: 'PROTIOCONAZOL', unit: 'LT', category: 'FUNGICIDA', defaultPurchaseQty: 120, price: 210.00 },
  { id: '3', name: 'AUREO', activeIngredient: 'OLEO METILADO', unit: 'LT', category: 'ADJUVANTE', defaultPurchaseQty: 200, price: 18.20 },
  { id: '4', name: 'CURYOM', activeIngredient: 'LUFENURON', unit: 'LT', category: 'INSETICIDA', defaultPurchaseQty: 50, price: 340.00 },
];

const INITIAL_STOCK: Insumo[] = [
  { id: 'p1', name: 'GLIFOSATO 480', activeIngredient: 'GLIFOSATO', physicalStock: 5000, reservedQty: 0, availableQty: 5000, stock: 5000, farm: 'SANTO AURELIO', unit: 'LT', category: 'HERBICIDA', minStock: 500, price: 45.50 },
  { id: 'p2', name: 'FOX XPRO', activeIngredient: 'PROTIOCONAZOL', physicalStock: 120, reservedQty: 0, availableQty: 120, stock: 120, farm: 'ALIANCA', unit: 'LT', category: 'FUNGICIDA', minStock: 20, price: 210.00 },
  { id: 'p3', name: 'AUREO', activeIngredient: 'OLEO METILADO', physicalStock: 400, reservedQty: 0, availableQty: 400, stock: 400, farm: 'SANTO AURELIO', unit: 'LT', category: 'ADJUVANTE', minStock: 50, price: 18.20 },
  { id: 'p4', name: 'CURYOM', activeIngredient: 'LUFENURON', physicalStock: 300, reservedQty: 0, availableQty: 300, stock: 300, farm: 'BOQUEIRAO', unit: 'LT', category: 'INSETICIDA', minStock: 30, price: 340.00 }
];

const INITIAL_HISTORY: StockHistoryEntry[] = [
  { id: 'h1', insumoId: 'p1', date: '10/01/2026 08:00', type: 'ENTRADA', description: 'Estoque Inicial', quantity: 5000, user: 'Sistema' },
  { id: 'h2', insumoId: 'p2', date: '10/01/2026 08:00', type: 'ENTRADA', description: 'Estoque Inicial', quantity: 120, user: 'Sistema' },
];

const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNumber: '2026-PO001',
    supplier: 'AGROQUÍMICA BRASIL',
    productName: 'GLIFOSATO 480',
    farmName: 'SANTO AURELIO',
    quantity: 120,
    unit: 'LT',
    totalValue: 5460.00,
    orderDate: '10/01/2026',
    expectedDelivery: '25/01/2026',
    status: PurchaseOrderStatus.PENDING
  }
];

const SHLogo: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => (
  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/20">
    <Sprout size={24} />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estados Globais
  const [inventory, setInventory] = useState<Insumo[]>(INITIAL_STOCK);
  const [masterInsumos, setMasterInsumos] = useState<MasterInsumo[]>(INITIAL_MASTER_INSUMOS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASES);
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>(INITIAL_HISTORY);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const addHistoryRecord = (record: Omit<StockHistoryEntry, 'id'>) => {
    const newRecord = { ...record, id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
    setStockHistory(prev => [newRecord, ...prev]);
  };

  const syncPurchaseWithInventory = (order: PurchaseOrder) => {
    let finalInsumoId = '';

    setInventory(currentInv => {
      const itemIndex = currentInv.findIndex(item => 
        item.name.trim().toUpperCase() === order.productName.trim().toUpperCase() &&
        item.farm.trim().toUpperCase() === order.farmName.trim().toUpperCase()
      );

      if (itemIndex > -1) {
        const updatedInv = [...currentInv];
        const existingItem = updatedInv[itemIndex];
        finalInsumoId = existingItem.id;
        updatedInv[itemIndex] = {
          ...existingItem,
          physicalStock: existingItem.physicalStock + order.quantity,
          availableQty: existingItem.availableQty + order.quantity,
          stock: existingItem.stock + order.quantity
        };
        return updatedInv;
      } else {
        const masterData = masterInsumos.find(mi => mi.name.trim().toUpperCase() === order.productName.trim().toUpperCase());
        const newId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        finalInsumoId = newId;
        
        const newItem: Insumo = {
          id: newId,
          name: order.productName.toUpperCase(),
          activeIngredient: masterData?.activeIngredient || 'N/A',
          physicalStock: order.quantity,
          reservedQty: 0,
          availableQty: order.quantity,
          stock: order.quantity,
          farm: order.farmName,
          unit: masterData?.unit || order.unit,
          category: masterData?.category || 'OUTROS',
          minStock: 10,
          price: masterData?.price || 0
        };
        return [newItem, ...currentInv];
      }
    });

    // Adiciona ao histórico
    addHistoryRecord({
      insumoId: finalInsumoId,
      date: new Date().toLocaleString('pt-BR'),
      type: 'ENTRADA',
      description: `Compra recebida: ${order.supplier} (NF: ${order.invoiceNumber})`,
      quantity: order.quantity,
      user: 'Logística'
    });
  };

  const handleUpdateStatus = (id: string, newStatus: OrderStatus, leftovers?: Record<string, number>) => {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder) return;

    const oldStatus = targetOrder.status;

    if ((oldStatus === OrderStatus.EMITTED || oldStatus === OrderStatus.AWAITING_PRODUCT) && newStatus === OrderStatus.IN_PROGRESS) {
      setInventory(prevStock => prevStock.map(stockItem => {
        const osItem = targetOrder.items.find(i => i.insumoId === stockItem.id);
        if (osItem) {
          const qty = osItem.qtyTotal;
          addHistoryRecord({
            insumoId: stockItem.id,
            date: new Date().toLocaleString('pt-BR'),
            type: 'SAIDA',
            description: `Saída para OS #${targetOrder.orderNumber}`,
            quantity: -qty,
            user: 'Operacional'
          });
          return {
            ...stockItem,
            physicalStock: Math.max(0, stockItem.physicalStock - qty),
            reservedQty: Math.max(0, stockItem.reservedQty - qty),
            availableQty: Math.max(0, (stockItem.physicalStock - qty) - (stockItem.reservedQty - qty)),
            stock: Math.max(0, stockItem.stock - qty)
          };
        }
        return stockItem;
      }));
    }

    if (newStatus === OrderStatus.COMPLETED && leftovers) {
      setInventory(prevStock => prevStock.map(stockItem => {
        const leftoverAmount = leftovers[stockItem.id];
        if (leftoverAmount && leftoverAmount > 0) {
          addHistoryRecord({
            insumoId: stockItem.id,
            date: new Date().toLocaleString('pt-BR'),
            type: 'ENTRADA',
            description: `Estorno de sobra OS #${targetOrder.orderNumber}`,
            quantity: leftoverAmount,
            user: 'Operacional'
          });
          return {
            ...stockItem,
            physicalStock: stockItem.physicalStock + leftoverAmount,
            availableQty: stockItem.availableQty + leftoverAmount,
            stock: stockItem.stock + leftoverAmount
          };
        }
        return stockItem;
      }));
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const handleSaveOS = (os: ServiceOrder) => {
    const isNew = !orders.find(o => o.id === os.id);
    
    if (isNew && (os.status === OrderStatus.EMITTED || os.status === OrderStatus.AWAITING_PRODUCT)) {
      setInventory(prevStock => prevStock.map(stockItem => {
        const osItem = os.items.find(i => i.insumoId === stockItem.id);
        if (osItem) {
          return {
            ...stockItem,
            reservedQty: stockItem.reservedQty + osItem.qtyTotal
          };
        }
        return stockItem;
      }));
      setOrders(prev => [...prev, os]);
    } 
    else {
      setOrders(prev => isNew ? [...prev, os] : prev.map(old => old.id === os.id ? os : old));
    }
    
    setActiveTab('dashboard');
    setEditingOrder(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return (
          <OSKanban 
            orders={orders} 
            onUpdateStatus={handleUpdateStatus} 
            onEditOrder={(o) => { setEditingOrder(o); setActiveTab('orders'); }}
            onCreateOrder={() => { setEditingOrder(null); setActiveTab('orders'); }}
          />
        );
      case 'calendar':
        return (
          <div className="p-12 h-full">
            <CalendarView orders={orders} />
          </div>
        );
      case 'inventory': 
        return (
          <div className="p-12 h-full">
            <Inventory 
              stockProp={inventory} 
              onStockUpdate={setInventory} 
              masterInsumos={masterInsumos}
              history={stockHistory}
              onAddHistory={addHistoryRecord}
            />
          </div>
        );
      case 'master_insumos':
        return (
          <div className="p-12 h-full">
            <InsumoMaster 
              insumos={masterInsumos} 
              onUpdate={setMasterInsumos} 
            />
          </div>
        );
      case 'purchases': 
        return (
          <div className="p-12 h-full">
            <PurchaseOrders 
              orders={purchaseOrders}
              farms={FARMS_LIST}
              masterInsumos={masterInsumos}
              onApprove={(id) => {
                setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: PurchaseOrderStatus.APPROVED } : p));
              }}
              onReceive={(id, supplier, nf) => {
                const target = purchaseOrders.find(p => p.id === id);
                if (target) {
                  const updatedOrder = { ...target, supplier, invoiceNumber: nf, status: PurchaseOrderStatus.RECEIVED };
                  syncPurchaseWithInventory(updatedOrder);
                  setPurchaseOrders(prev => prev.map(p => p.id === id ? updatedOrder : p));
                }
              }}
              onSave={(newPo) => setPurchaseOrders(prev => [newPo, ...prev])}
              onDelete={(id) => setPurchaseOrders(prev => prev.filter(p => p.id !== id))}
              onRepeat={(po) => setPurchaseOrders(prev => [{ ...po, id: Date.now().toString(), status: PurchaseOrderStatus.PENDING, orderDate: new Date().toLocaleDateString('pt-BR') }, ...prev])}
            />
          </div>
        );
      case 'orders': 
        return (
          <div className="p-12 h-full">
            <OrderForm 
              initialData={editingOrder} 
              existingOrders={orders}
              onSave={handleSaveOS} 
              onCancel={() => { setEditingOrder(null); setActiveTab('dashboard'); }} 
            />
          </div>
        );
      case 'fleet': return <div className="p-12 h-full"><FleetManagement /></div>;
      case 'areas': return <div className="p-12 h-full"><AreasFields /></div>;
      case 'reports': return <div className="p-12 h-full"><Reports /></div>;
      default: return null;
    }
  };

  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#050810] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100">
      <aside className={`bg-white dark:bg-[#0a0f1c] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-4">
          <SHLogo isSidebarOpen={isSidebarOpen} />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl text-slate-900 leading-none italic uppercase">Agro SH</span>
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Página Inicial', icon: LayoutDashboard },
            { id: 'calendar', label: 'Calendário', icon: Calendar },
            { id: 'reports', label: 'Relatórios', icon: ClipboardList },
            { id: 'master_insumos', label: 'Insumos', icon: Beaker },
            { id: 'inventory', label: 'Estoque', icon: Package },
            { id: 'purchases', label: 'Pedidos', icon: ShoppingCart },
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
