
import { RestaurantProfile } from '../lib/types';

export type BrandedTerm = 
  | 'synthesizing' 
  | 'neural_link' 
  | 'intelligence_node' 
  | 'facility' 
  | 'scholar_node' 
  | 'sentinel' 
  | 'manifesto' 
  | 'quantum_security'
  | 'yield_alpha'
  | 'palate_dna'
  | 'brief_agent'
  | 'neural_yield'
  | 'exp_sentinel'
  | 'market_sentinel'
  | 'inventory'
  | 'dashboard'
  | 'retention_ai'
  | 'financial_hub'
  | 'predictive_supply'
  | 'sustainability'
  | 'sentiment_pulse'
  | 'guest_journey'
  | 'operations'
  | 'venue_admin'
  | 'settings'
  | 'predictive_logistics'
  | 'yield_alpha_suggestions'
  | 'registry_node'
  | 'cloud_silo'
  | 'vision_audit_node' 
  | 'pacing_mode' 
  | 'facility_assets'
  | 'dispatch'
  | 'integration_hub'
  | 'trend_intelligence';

const ELITE_TERMS: Record<BrandedTerm, string> = {
  synthesizing: "Synthesizing Response",
  neural_link: "Neural Link Active",
  intelligence_node: "Intelligence Node",
  facility: "Facility Launcher",
  scholar_node: "Scholar Node",
  sentinel: "Service Sentinel",
  manifesto: "The Manifesto",
  quantum_security: "Quantum Cryptography Active",
  yield_alpha: "Yield Alpha Predictions",
  palate_dna: "Palate DNA Mapping",
  brief_agent: "Brief the Agent",
  neural_yield: "Neural Yield",
  exp_sentinel: "Exp Sentinel",
  market_sentinel: "Market Sentinel",
  inventory: "AI Inventory",
  dashboard: "Intelligence Dashboard",
  retention_ai: "Retention AI",
  financial_hub: "Financial Hub",
  predictive_supply: "Predictive Supply",
  sustainability: "Sustainability",
  sentiment_pulse: "Sentiment Pulse",
  guest_journey: "The Guest Journey",
  operations: "Neural Operations",
  venue_admin: "Facility Admin",
  settings: "System Settings",
  predictive_logistics: "Predictive Logistics Node",
  yield_alpha_suggestions: "Yield Alpha Suggestions",
  registry_node: "Registry Node",
  cloud_silo: "Cloud Silo",
  vision_audit_node: "Vision Audit Node",
  pacing_mode: "Neural Pacing",
  facility_assets: "Facility Assets",
  dispatch: "Omnichannel Dispatch",
  integration_hub: "Integration Hub",
  trend_intelligence: "Trend Intelligence"
};

const LIGHT_TERMS: Record<BrandedTerm, string> = {
  synthesizing: "Thinking...",
  neural_link: "AI System Ready",
  intelligence_node: "AI Assistant",
  facility: "Open Dashboard",
  scholar_node: "Staff Training",
  sentinel: "Staff Helper",
  manifesto: "Learn More",
  quantum_security: "Secure Encryption Active",
  yield_alpha: "Sales Forecasts",
  palate_dna: "Guest Favorites",
  brief_agent: "Talk to AI",
  neural_yield: "Sales Coach",
  exp_sentinel: "Guest Feedback",
  market_sentinel: "Market View",
  inventory: "Inventory",
  dashboard: "Main Dashboard",
  retention_ai: "Guest Loyalty",
  financial_hub: "Money & Profit",
  predictive_supply: "Stock Orders",
  sustainability: "Eco-Metrics",
  sentiment_pulse: "Guest Mood",
  guest_journey: "Guest Booking",
  operations: "Staff Tasks",
  venue_admin: "Venue Admin",
  settings: "Settings",
  predictive_logistics: "Stock Predictions",
  yield_alpha_suggestions: "Price Suggestions",
  registry_node: "Item",
  cloud_silo: "Secure Cloud",
  vision_audit_node: "Quick Audit",
  pacing_mode: "Serving Speed",
  facility_assets: "Equipment",
  dispatch: "Guest Outreach Desk",
  integration_hub: "Connected Software Systems",
  trend_intelligence: "Industry Trends Hub"
};

export const getBrandedTerm = (key: BrandedTerm, profile?: RestaurantProfile): string => {
  const mode = profile?.aesthetic || 'elite';
  const lang = profile?.language || 'en';
  const baseTerm = mode === 'light' ? LIGHT_TERMS[key] : ELITE_TERMS[key];
  
  if (lang === 'en') return baseTerm;

  // Translation mapping for Spanish, Dutch, Portuguese
  const translations: Record<Language, Record<string, string>> = {
    en: {},
    es: {
      "Intelligence Node": "Nodo de Inteligência",
      "Neural Link Active": "Enlace Neural Activo",
      "Staff Training": "Capacitación de Personal",
      "AI Inventory": "Inventario IA",
      "Intelligence Dashboard": "Panel de Inteligencia",
      "Guest Journeys": "Viajes de Huéspedes",
      "The Guest Journey": "El Viaje del Huésped",
      "System Settings": "Ajustes del Sistema",
      "Facility Admin": "Admin de Instalación",
      "Staff Tasks": "Tareas del Personal",
      "Open Dashboard": "Abrir Panel",
      "Thinking...": "Pensando...",
      "AI System Ready": "Sistema IA Listo",
      "AI Assistant": "Asistente IA",
      "Service Sentinel": "Centinela de Servicio",
      "Retention AI": "IA de Retención",
      "Financial Hub": "Centro Financiero",
      "Predictive Supply": "Suministro Predictivo",
      "Sustainability": "Sostenibilidad",
      "Sentiment Pulse": "Pulso de Sentimiento",
      "Neural Operations": "Operaciones Neurales",
      "Facility Launcher": "Lanzador de Instalación",
      "Scholar Node": "Nodo Académico",
      "Neural Yield": "Rendimiento Neural",
      "Market Sentinel": "Centinela de Mercado",
      "Exp Sentinel": "Centinela de Experiencia",
      "Facility Assets": "Activos de Instalación"
    },
    nl: {
      "Intelligence Node": "Intelligentie Node",
      "Neural Link Active": "Neurale Koppeling Actief",
      "Staff Training": "Personeelstraining",
      "AI Inventory": "AI Voorraad",
      "Intelligence Dashboard": "Intelligentie Dashboard",
      "Guest Journeys": "Gastenreizen",
      "The Guest Journey": "De Gastenreis",
      "System Settings": "Systeeminstellingen",
      "Facility Admin": "Facilitair Beheer",
      "Staff Tasks": "Personeelstaken",
      "Open Dashboard": "Open Dashboard",
      "Thinking...": "Aan het denken...",
      "AI System Ready": "AI Systeem Gereed",
      "AI Assistant": "AI-assistent",
      "Service Sentinel": "Service Schildwacht",
      "Retention AI": "Retentie AI",
      "Financial Hub": "Financieel Knooppunt",
      "Predictive Supply": "Voorspellende Voorraad",
      "Sustainability": "Duurzaamheid",
      "Sentiment Pulse": "Sentimentmeters",
      "Neural Operations": "Neurale Operaties",
      "Facility Launcher": "Facilitair Startscherm",
      "Scholar Node": "Geleerde Node",
      "Neural Yield": "Neurale Opbrengst",
      "Market Sentinel": "Markt Monitor",
      "Exp Sentinel": "Ervaring Monitor",
      "Facility Assets": "Facilitaire Middelen"
    },
    pt: {
      "Intelligence Node": "Nó de Inteligência",
      "Neural Link Active": "Link Neural Ativo",
      "Staff Training": "Treinamento de Equipe",
      "AI Inventory": "Inventário IA",
      "Intelligence Dashboard": "Painel de Inteligência",
      "Guest Journeys": "Jornadas de Hóspedes",
      "The Guest Journey": "A Jornada do Hóspede",
      "System Settings": "Configurações do Sistema",
      "Facility Admin": "Admin da Instalação",
      "Staff Tasks": "Tarefas da Equipe",
      "Open Dashboard": "Abrir Painel",
      "Thinking...": "Pensando...",
      "AI System Ready": "Sistema IA Pronto",
      "AI Assistant": "Assistente IA",
      "Service Sentinel": "Sentinela de Serviço",
      "Retention AI": "IA de Retenção",
      "Financial Hub": "Centro Financeiro",
      "Predictive Supply": "Suprimento Preditivo",
      "Sustainability": "Sustentabilidade",
      "Sentiment Pulse": "Pulso de Sentimento",
      "Neural Operations": "Operações Neurais",
      "Facility Launcher": "Lançador da Instalação",
      "Scholar Node": "Nó Acadêmico",
      "Neural Yield": "Rendimento Neural",
      "Market Sentinel": "Sentinela de Mercado",
      "Exp Sentinel": "Sentinela de Experiência",
      "Facility Assets": "Ativos da Instalação"
    }
  };

  return translations[lang]?.[baseTerm] || baseTerm;
};

type Language = 'en' | 'es' | 'nl' | 'pt';

export const getAestheticExplanation = (term: string): string => {
  const explanations: Record<string, string> = {
    "Synthesizing": "The AI is processing your request and creating a tailored response.",
    "Neural": "Connected to our advanced processing network.",
    "Lattice": "The shared database of hospitality knowledge.",
    "Yield Alpha": "Our algorithm for maximizing your profit margins.",
    "Palate DNA": "A map of flavor preferences unique to your guests."
  };
  return explanations[term] || "";
};

export interface PublicBrand {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  primaryColor: string; // Tailwind color class stem (e.g. indigo vs amber)
  accentColor: string;
  bgGradient: string;
  theme: 'vinetelligence' | 'vinea';
}

export const getPublicBrand = (): PublicBrand => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const storedApp = typeof window !== 'undefined' ? localStorage.getItem('platform_selected_app') : '';
  
  // 1. Production hostnames ALWAYS take absolute priority to prevent multi-tenant app crossover
  if (hostname.includes('vinetelligence.live')) {
    return {
      name: "Vinetelligence",
      shortName: "Vinetelligence",
      tagline: "AI-Powered Operating System for Beverage Operations",
      description: "Vinetelligence: A comprehensive AI-powered system for restaurant and beverage operations. Specialized in beverage intelligence, predictive inventory, and neural training protocols.",
      primaryColor: "indigo",
      accentColor: "indigo",
      bgGradient: "from-indigo-950/20 to-slate-900/10",
      theme: 'vinetelligence'
    };
  }

  if (hostname.includes('vinea.live')) {
    return {
      name: "Vinea AI",
      shortName: "Vinea",
      tagline: "Fine Wine & Hospitality Service Intelligence",
      description: "Vinea AI: Modern Hospitality Operating System. Unified guest operations, live cellar inventory synchronizations, and neural service guidelines.",
      primaryColor: "amber",
      accentColor: "amber",
      bgGradient: "from-amber-950/20 to-stone-900/10",
      theme: 'vinea'
    };
  }

  // 2. Dev / Sandbox Fallback using storedApp
  const isVinea = hostname.includes('vinea') || storedApp === 'vinea';

  if (isVinea) {
    return {
      name: "Vinea AI",
      shortName: "Vinea",
      tagline: "Fine Wine & Hospitality Service Intelligence",
      description: "Vinea AI: Modern Hospitality Operating System. Unified guest operations, live cellar inventory synchronizations, and neural service guidelines.",
      primaryColor: "amber",
      accentColor: "amber",
      bgGradient: "from-amber-950/20 to-stone-900/10",
      theme: 'vinea'
    };
  }

  return {
    name: "Vinetelligence",
    shortName: "Vinetelligence",
    tagline: "AI-Powered Operating System for Beverage Operations",
    description: "Vinetelligence: A comprehensive AI-powered system for restaurant and beverage operations. Specialized in beverage intelligence, predictive inventory, and neural training protocols.",
    primaryColor: "indigo",
    accentColor: "indigo",
    bgGradient: "from-indigo-950/20 to-slate-900/10",
    theme: 'vinetelligence'
  };
};

