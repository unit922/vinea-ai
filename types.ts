
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
  NETWORK_ADMIN = 'network-admin',
  GLOBAL_LEDGER = 'global-ledger',
  FINANCIAL_HUB = 'financial-hub',
  VISION_AUDITOR = 'vision-auditor',
  FACILITY_ASSETS = 'facility-assets',
  RETENTION = 'retention',
  OWNER_ANALYTICS = 'owner-analytics',
  INVESTOR = 'investor',
  PROMO = 'promo'
}

export type OrderSource = 'Staff' | 'Visitor';
export type ItemStatus = 'Pending' | 'Prepping' | 'Ready' | 'Served' | 'Void';

export type PaymentMethod = 'PayPal' | 'Paddle' | 'Stripe' | 'Bank' | 'Credit & Debit Card' | 'Bank Card' | 'Cash' | 'Apple Pay' | 'Crypto';
export type BillingCycle = 'Monthly' | 'Annual';

export interface SustainabilityMetrics {
  carbonScore: number; // 0-100
  waterIntensity: 'Low' | 'Medium' | 'High';
  isBiodynamic: boolean;
  isFairTrade: boolean;
}

export interface ExternalCatalyst {
  type: 'Weather' | 'Event' | 'Holiday';
  label: string;
  impactScore: number; // -1 to 1
  description: string;
}

export interface VisionAuditResult {
  brandName: string;
  vintage: string;
  region: string;
  estimatedPrice: number;
  confidence: number;
  tastingNotes: string;
  sustainability: SustainabilityMetrics;
}

export interface FloorZone {
  id: string;
  name: string;
  tables: string[];
  color: string;
}

export interface StaffAssignment {
  staffId: string;
  zoneId: string;
  timestamp: string;
  priority: 'Primary' | 'Support';
}

export interface FinancialReport {
  id: string;
  timestamp: string;
  type: 'Executive' | 'Yield' | 'Audit' | 'Sustainability';
  title: string;
  narrative: string;
  metrics: { label: string; value: string; trend: 'up' | 'down' | 'stable' }[];
  aiAdvice: string[];
}

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
  restaurantName?: string;
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
  guestFeedback?: string;
  guestRating?: number;
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
  category: 'Wine' | 'Spirit' | 'Mixer' | 'Beer' | 'Garnish' | 'Snack' | 'Lunch' | 'Dinner' | 'Cocktail';
  stock: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  price: number;
  originalPrice: number;
  predictedDemand?: number;
  description?: string;
  sustainabilityScore?: number;
  volumePerUnit?: number; // in ml
  servingPrice?: number; // Price for a single standard pour/serving
  consumed?: number; // Cumulative amount consumed
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  prepType: 'Mix' | 'Pour' | 'Complex';
  style?: string;
  modifier?: 'Shot' | 'Double' | 'Rocks' | 'Mix' | 'Neat' | 'On the Rocks' | 'Measurement Mix' | 'Standard';
  status: ItemStatus;
  priceAtOrder: number;
  seat?: number | null;
}

export interface ServiceOrder {
  id: string;
  timestamp: string;
  preppedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  tableNumber: string;
  serverName: string;
  items: OrderItem[];
  status: 'Pending' | 'Prepping' | 'Ready' | 'Delivered';
  priority: 'Normal' | 'High' | 'VIP';
  source: OrderSource;
  total?: number;
  isVisitor?: boolean;
  isDraft?: boolean;
}

export interface StaffShift {
  id: string;
  name: string;
  email?: string;
  role: 'Sommelier' | 'Mixologist' | 'Server' | 'Manager' | 'Developer' | 'Investor' | 'Owner' | 'Admin';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  performanceScore: number;
  assignedModules?: { moduleId: string, completed: boolean }[];
  currentTask?: string;
  accessStatus: 'Active' | 'Revoked' | 'Pending';
  burnoutIndex?: number; // 0-100
  availabilityStatus?: 'Available' | 'On Break' | 'Busy' | 'Off Duty';
}

export interface StaffRosterItem {
  id: string;
  restaurant_id: string;
  email: string;
  role: string;
  status: 'Pending' | 'Registered';
  created_at?: string;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Dirty' | 'Reserved';
  assignedStaffId?: string;
  occupantName?: string;
  occupantCount?: number;
  zoneId?: string;
  paymentStartedAt?: string;
  settledAt?: string;
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
  videoUrl?: string;
  videoId?: string;
}

export interface OptimizationLog {
  id: string;
  timestamp: string;
  itemName: string;
  action: string;
  rationale: string;
}

export interface IntelligenceLedgerEntry {
  id: string;
  timestamp: string;
  itemName: string;
  currentMinStock: number;
  suggestedMinStock: number;
  rationale: string;
  status: 'Pending' | 'Applied' | 'Dismissed';
}

export interface GuestProfile {
  name: string;
  email?: string;
  phone?: string;
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
  category?: string;
}

export interface AIPairingSuggestion {
  foodItem: string;
  foodCategory: 'Snack' | 'Lunch' | 'Dinner';
  beveragePairing: string;
  beverageCategory: 'Wine' | 'Spirit' | 'Beer' | 'Mixer';
  rationale: string;
  pairingInsight: string;
}

export interface GuestJourney {
  id: string;
  arrivalTime: string;
  seatedAt?: string;
  status: 'Confirmed' | 'Engagement Sent' | 'Arrived' | 'Seated' | 'Completed';
  tableNumber: string;
  partySize: number;
  profile: GuestProfile;
  specialOccasion?: string;
  pacingMode?: 'Leisurely' | 'Standard' | 'Brisk';
  facialId?: string;
  feedback?: string;
  rating?: number;
  satisfactionScore?: number;
  currentStage?: string;
}

export type EstablishmentStatus = 'Active' | 'Suspended' | 'Trial_Expired';

export interface EstablishmentRegistry {
  id: string;
  name: string;
  slug?: string;
  tier: string;
  userLimit: number;
  status: EstablishmentStatus;
  lastPulse: string;
  usageMetric: number;
  billingStatus: string;
  mrr: number;
  ownerEmail?: string;
}

export interface POSIntegrationConfig {
  type: 'Middleware' | 'DirectCloud' | 'LegacyFallback' | 'None';
  provider?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  sftpHost?: string;
  sftpUser?: string;
  sftpPass?: string;
  lastSync?: string;
  status: 'Connected' | 'Disconnected' | 'Error' | 'Pending';
}

export interface RestaurantProfile {
  id: string;
  name: string;
  slug?: string;
  type: string;
  customType?: string;
  focus: string;
  description: string;
  edition: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  aiPersona: string;
  aiTraits?: {
    technical: number;
    creative: number;
    verbosity: number;
  };
  somaticInstructions?: string;
  demoMode?: 'operator' | 'guest';
  manualPortalUrl?: string;
  manualMenuUrl?: string;
  manualPromoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  geminiApiKey?: string;
  aiMemory?: string;
  tier?: string;
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt?: string;
  posConfig?: POSIntegrationConfig;
}

export interface FlashDrill {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface GuestFeedback {
  id: string;
  journeyId?: string;
  guestName?: string;
  staffId?: string;
  rating: number;
  comment: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  timestamp: string;
  aiSummary?: string;
}

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  joinDate: string;
  lastVisit: string;
  preferences: string[];
}

export interface AIInsight {
  id: string;
  type: 'Retention' | 'Revenue' | 'Efficiency' | 'Sustainability';
  title: string;
  message: string;
  impactScore: number;
  actionable: boolean;
  timestamp: string;
}
