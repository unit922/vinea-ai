
export enum AppView {
  DASHBOARD = 'dashboard',
  INVENTORY = 'inventory',
  TRAINING = 'training',
  CONCIERGE = 'concierge',
  STAFFING = 'staffing',
  SETTINGS = 'settings',
  GUEST_PROFILE = 'guest-profile',
  BAR_STATION = 'bar-station',
  ESTABLISHMENT_ADMIN = 'establishment-admin',
  NETWORK_ADMIN = 'network-admin'
}

export type OrderSource = 'Staff' | 'Visitor';
export type ItemStatus = 'Pending' | 'Prepping' | 'Ready' | 'Served' | 'Void';

export type PaymentMethod = 'PayPal' | 'Paddle' | 'Stripe' | 'Bank' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Apple Pay' | 'Crypto';
export type BillingCycle = 'Monthly' | 'Annual';

export interface IntelligenceItem {
  id: string;
  type: 'trend' | 'news';
  title: string;
  message: string;
  rationale: string;
  impact: 'Low' | 'Medium' | 'High';
  tags: string[];
}

export interface IntelligenceFeed {
  trends: IntelligenceItem[];
  news: IntelligenceItem[];
  sources: { title: string; uri: string }[];
  timestamp: string;
  isCached: boolean;
}

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  tokens: number;
  visionAudits: number;
  users: number;
  features: string[];
  color: string;
}

export interface ExecutiveKPI {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  benchmark: string;
  description: string;
}

export interface InvestorInsight {
  narrative: string;
  scalabilityRoadmap: { phase: string; milestone: string; impact: string }[];
  riskAssessment: { category: string; level: 'Low' | 'Medium' | 'High'; detail: string }[];
  equityAlpha: string;
  projectedValuationMultiplier: number;
  benchmarks: { category: string; venueValue: number | string; indexValue: number | string; unit: string }[];
}

export interface EquipmentStatus {
  id: string;
  name: string;
  type: 'HVAC' | 'Refrigeration' | 'Kitchen' | 'Bar';
  healthScore: number;
  status: 'Optimal' | 'Warning' | 'Critical';
  lastService: string;
  telemetry: { temp?: number; vibration?: string; load?: number };
}

export interface MarketingCampaign {
  id: string;
  title: string;
  targetCluster: string;
  reach: number;
  subject: string;
  body: string;
  offerItem: string;
  status: 'Draft' | 'Sent';
}

export interface SustainabilityReport {
  wasteReductionPct: number;
  fiscalSavings: number;
  topSpillageItems: { name: string; loss: number }[];
  aiActionPlan: string[];
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  method: PaymentMethod;
}

export interface RetailTransaction {
  id: string;
  timestamp: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  gratuity: number;
  total: number;
  paymentMethod: PaymentMethod;
  guestName?: string;
  sommelierNote?: string;
}

export interface DynamicPriceSuggestion {
  itemName: string;
  currentPrice: number;
  suggestedPrice: number;
  rationale: string;
  reasonType: 'Demand' | 'Scarcity' | 'Event';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Wine' | 'Spirit' | 'Mixer' | 'Beer' | 'Garnish' | 'Snack';
  stock: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  price: number;
  originalPrice: number;
  predictedDemand?: number;
  description?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  prepType: 'Mix' | 'Pour' | 'Complex';
  style?: string;
  status: ItemStatus;
  priceAtOrder: number;
}

export interface ServiceOrder {
  id: string;
  timestamp: string;
  tableNumber: string;
  serverName: string;
  items: OrderItem[];
  status: 'Pending' | 'Prepping' | 'Ready' | 'Delivered';
  priority: 'Normal' | 'High' | 'VIP';
  source: OrderSource;
}

export interface StaffShift {
  id: string;
  name: string;
  email?: string;
  role: 'Sommelier' | 'Mixologist' | 'Server' | 'Manager';
  startTime: string;
  endTime: string;
  performanceScore: number;
  assignedModules?: { moduleId: string, completed: boolean }[];
  currentTask?: string;
  accessStatus: 'Active' | 'Revoked' | 'Pending';
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Dirty' | 'Reserved';
  assignedStaffId?: string;
  occupantName?: string;
  zoneId?: string;
  x: number;
  y: number;
}

export interface AIRecommendationSource {
  title: string;
  uri: string;
}

export interface AIRecommendation {
  type: string;
  message: string;
  impact: string;
  actionLabel: string;
  priority: string;
  rationale?: string;
  sources?: AIRecommendationSource[];
}

export interface TrainingSession {
  id: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  completed: boolean;
  category: string;
}

export interface OptimizationLog {
  id: string;
  timestamp: string;
  itemName: string;
  action: string;
  rationale: string;
}

export interface GuestProfile {
  name: string;
  location: string;
  favoriteBeverages: string;
  dietaryRestrictions: string;
  pastOrders: string;
  pairingStyle: 'Classic' | 'Adventurous' | 'Zero-Proof';
}

export interface PersonalizationRecommendation {
  category: 'Appetizer' | 'Main' | 'Dessert';
  dish: string;
  beveragePairing: string;
  rationale: string;
  zeroProofAlternative?: string;
  culturalNote?: string;
  pairingInsight: string;
}

export interface Cocktail {
  idDrink: string;
  strDrink: string;
  strDrinkThumb: string;
  strInstructions: string;
  strGlass: string;
  ingredients: { name: string; measure: string }[];
}

export interface GuestJourney {
  id: string;
  arrivalTime: string;
  status: 'Confirmed' | 'Engagement Sent' | 'Arrived' | 'Seated' | 'Completed';
  tableNumber: string;
  profile: GuestProfile;
  specialOccasion?: string;
  pacingMode?: 'Leisurely' | 'Standard' | 'Brisk';
}

export type EstablishmentStatus = 'Active' | 'Suspended' | 'Trial_Expired';

export interface EstablishmentRegistry {
  id: string;
  name: string;
  tier: string;
  userLimit: number;
  status: EstablishmentStatus;
  lastPulse: string;
  usageMetric: number;
  billingStatus: string;
  mrr: number;
}

export interface FlashDrill {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}
