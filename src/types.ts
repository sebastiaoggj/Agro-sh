export enum OrderStatus {
  DRAFT = 'Rascunho',
  EMITTED = 'Emitida',
  AWAITING_PRODUCT = 'Aguardando Produto',
  SCHEDULED = 'Agendado',
  IN_PROGRESS = 'Em Aplicação',
  AWAITING_INSPECTION = 'Aguardando Vistoria',
  COMPLETED = 'Concluído',
  REWORK = 'Retrabalho',
  CANCELLED = 'Cancelado',
  LATE = 'Atrasada'
}

export type OperationType = 'PULVERIZACAO' | 'PLANTIO' | 'ADUBACAO';

export enum PurchaseOrderStatus {
  PENDING = 'Aguardando',
  APPROVED = 'Aprovado',
  SHIPPED = 'Em Trânsito',
  RECEIVED = 'Recebido',
  CANCELLED = 'Cancelado'
}

export type UnitType = 'L' | 'KG' | 'UN' | 'LT' | 'PCT' | 'GAL';

export interface Farm {
  id: string;
  name: string;
}

export interface Harvest {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  area: number; // hectares
}

export interface MasterInsumo {
  id: string;
  name: string;
  activeIngredient: string;
  unit: string;
  category: string;
  defaultPurchaseQty?: number;
  price?: number; // Preço unitário médio
}

export interface Insumo extends MasterInsumo {
  stock: number;
  physicalStock: number;
  reservedQty: number;
  availableQty: number;
  farm: string;
  minStock: number;
  // Campos auxiliares para vincular corretamente
  masterId?: string;
}

export interface StockHistoryEntry {
  id: string;
  insumoId: string;
  date: string;
  type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'RESERVA';
  description: string;
  quantity: number;
  user: string;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  tankCapacity: number;
}

export interface OSItem {
  insumoId: string;
  productName: string;
  dosePerHa: number;
  qtyPerTank: number;
  qtyTotal: number;
  leftover?: number;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  farmId: string;
  farmName: string;
  fieldIds: string[];
  fieldNames: string[];
  culture: string;
  variety: string;
  recommendationDate: string;
  maxApplicationDate: string;
  
  // Novo campo
  operationType: OperationType;

  machineType: string;
  machineId: string;
  machineName: string;
  operatorId: string;
  
  // Capacidade pode ser L (Tanque) ou KG (Caixa de Semente/Adubo)
  tankCapacity: number; 
  // Vazão pode ser L/ha, Kg/ha ou Sementes/m
  flowRate: number; 
  
  nozzle: string;   // Para Plantio vira "Disco/Anel"
  pressure: string; // Para Plantio vira "Espaçamento"
  speed: string;
  
  applicationType: string;
  mandatoryPhrase: string;
  items: OSItem[];
  status: OrderStatus;
  totalArea: number;
  totalVolume: number; // Agora pode representar Total KG
  observations?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  productName: string;
  masterInsumoId?: string;
  farmName: string;
  farmId?: string;
  quantity: number;
  unit: string;
  totalValue: number;
  orderDate: string;
  expectedDelivery: string;
  status: PurchaseOrderStatus;
  invoiceNumber?: string;
}