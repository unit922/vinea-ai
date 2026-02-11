
import { GoogleGenAI, Type } from "@google/genai";
import { getSupabaseClient } from "./supabaseClient";

const getProfile = () => {
  if (typeof window === 'undefined') return { edition: 'demo', aiPersona: 'technical' };
  const profile = localStorage.getItem('vinea_profile');
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch (e) {
      return { edition: 'demo', aiPersona: 'technical' };
    }
  }
  return { edition: 'demo', aiPersona: 'technical' };
};

const getPersonaInstruction = () => {
  const profile = getProfile();
  const personas: Record<string, string> = {
    'technical': 'You are a highly technical Beverage Scholar. Focus on exact specifications, historical dates, production chemistry, and precision.',
    'hospitable': 'You are a compassionate Hospitality Mentor. Prioritize guest warmth, service etiquette, and emotional impact.',
    'creative': 'You are an Avant-Garde Creative Visionary. Encourage bold pairings and recipe innovation.'
  };
  return personas[profile.aiPersona] || personas['technical'];
};

async function fetchFromCache(category: string, key: string): Promise<any | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('ai_intelligence_cache')
      .select('response_data, created_at')
      .eq('category', category)
      .eq('request_key', key)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    return { data: data.response_data, timestamp: data.created_at };
  } catch (e) {
    return null;
  }
}

async function saveToCache(category: string, key: string, data: any) {
  const profile = getProfile();
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    await supabase.from('ai_intelligence_cache').upsert({
      restaurant_id: profile.id || '00000000-0000-0000-0000-000000000000',
      category,
      request_key: key,
      response_data: data,
      created_at: new Date().toISOString()
    });
  } catch (e) {}
}

async function callWithRetry<T>(fn: () => Promise<T>, fallbackData: T, options?: { category: string, key: string }, maxRetries = 2): Promise<T> {
  const profile = getProfile();
  const edition = profile.edition;
  
  if (options) {
    const cached = await fetchFromCache(options.category, options.key);
    if (cached) {
      const ageInMs = Date.now() - new Date(cached.timestamp).getTime();
      const ttlInMs = options.category === 'global_news' ? 14 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      if (ageInMs < ttlInMs) {
        return { ...cached.data, isCached: true, timestamp: cached.timestamp } as unknown as T;
      }
    }
  }

  if (edition === 'demo') {
    await new Promise(resolve => setTimeout(resolve, 800));
    return fallbackData;
  }
  
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      if (options && result) {
        await saveToCache(options.category, options.key, result);
      }
      return result;
    } catch (error: any) {
      const errorMsg = error?.message || "";
      if (errorMsg.includes("exceeded quota") && edition !== 'paid' && edition !== 'enterprise') {
        return fallbackData;
      }
      if (i === maxRetries - 1) return fallbackData;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
      continue;
    }
  }
  return fallbackData;
}

export const geminiService = {
  live: {
    connect(params: {
      model: string;
      callbacks: any;
      config: any;
    }) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.live.connect(params);
    }
  },

  async getGlobalIntelligence() {
    const category = 'global_news';
    const key = 'beverage_industry_pulse_v2';
    
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Conduct intensive research on current global beverage trends (flavor profiles, mixology techniques) and relevant hospitality industry news for Q1-Q2 2025. Focus on supply chain updates, sustainability legislation, and the rise of specific spirits or zero-proof categories.`,
        config: {
          tools: [{googleSearch: {}}],
          systemInstruction: "You are a specialized Beverage Industry Analyst. Provide high-impact, technical news and trends. Return JSON: {trends: [{id: string, title: string, message: string, rationale: string, impact: 'High'|'Medium', tags: string[]}], news: [{id: string, title: string, message: string, rationale: string, impact: 'High'|'Medium', tags: string[]}]}",
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text || "{}";
      const data = JSON.parse(text);
      const sources: any[] = [];
      response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
        if (c.web) sources.push({ title: c.web.title, uri: c.web.uri });
      });
      
      return { ...data, sources, isCached: false, timestamp: new Date().toISOString() };
    }, { trends: [], news: [], sources: [], isCached: false, timestamp: new Date().toISOString() }, { category, key });
  },

  async getFlashDrill(role: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a single high-speed technical flash drill question for a ${role} in a luxury venue. Focus on precision.`,
        config: {
          systemInstruction: "Return JSON: {id: string, question: string, options: string[], correctIndex: number, explanation: string, category: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { id: 'fallback', question: "What is the standard pour for a glass of wine?", options: ["4oz", "5oz", "6oz", "7oz"], correctIndex: 1, explanation: "The standard restaurant pour is 5oz (150ml).", category: "Standard" });
  },

  async getServicePacingRecommendations(profile: any, currentPacing: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Guest Profile: ${JSON.stringify(profile)}. Current Service Pacing: ${currentPacing}. Provide 3 tactical service adjustments to maintain optimal turnover or guest experience.`,
        config: {
          systemInstruction: "You are a hospitality pacing expert. Provide 3 bullet points. Return JSON: {recommendations: string[]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{"recommendations": []}');
    }, { recommendations: ["Maintain standard intervals.", "Observe guest body language.", "Ready glassware for next course."] });
  },

  async getShiftBriefing(data: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a shift briefing for the manager based on this data: ${JSON.stringify(data)}`,
        config: {
          systemInstruction: "You are a hospitality director. Provide a concise shift briefing. Return JSON: {brief: string, priority: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { brief: "Shift protocol initialized. Focus on efficiency.", priority: "Normal" });
  },

  async getFacilityMaintenanceBrief(equipment: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze equipment telemetry: ${JSON.stringify(equipment)}. Predict potential failures and suggest preventative maintenance to avoid emergency losses.`,
        config: {
          systemInstruction: "You are a predictive maintenance engineer for luxury hospitality. Return JSON: {riskSummary: string, alerts: [{equipmentId: string, prediction: string, timeToFailure: string, priority: 'High'|'Medium'|'Low'}]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { riskSummary: "Facility systems appear stable.", alerts: [] });
  },

  async getPalateMarketingCampaign(clusterData: any, inventory: any[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Guest Palate Cluster: ${clusterData.tag}. Match with inventory: ${JSON.stringify(inventory.slice(0,10))}. Generate a personalized marketing campaign.`,
        config: {
          systemInstruction: "You are a luxury marketing strategist. Create compelling copy for personalized outreach. Return JSON: {title: string, subject: string, body: string, targetCluster: string, offerItem: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { title: "New Discovery", subject: "A recommendation for your palate", body: "We thought you might enjoy our latest acquisition.", targetCluster: clusterData.tag, offerItem: "House Selection" });
  },

  async getSustainabilityImpactAudit(wasteLog: any[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze waste logs: ${JSON.stringify(wasteLog)}. Provide an impact audit and reduction roadmap.`,
        config: {
          systemInstruction: "You are a hospitality sustainability consultant. Return JSON: {wasteReductionPct: number, fiscalSavings: number, topSpillageItems: [{name: string, loss: number}], aiActionPlan: string[]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { wasteReductionPct: 0, fiscalSavings: 0, topSpillageItems: [], aiActionPlan: ["Monitor spillage intervals.", "Recalibrate pour standards."] });
  },

  async getWelcomeBrief(profile: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a welcome brief for the establishment: ${JSON.stringify(profile)}`,
        config: {
          systemInstruction: "You are a hospitality consultant. Provide a warm and strategic welcome message.",
        }
      });
      return response.text;
    }, "Welcome to Vinea Intelligence.");
  },

  async getMenuPersonalization(profile: any, menu: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create personal menu recommendations for guest: ${JSON.stringify(profile)} from menu: ${JSON.stringify(menu)}`,
        config: {
          systemInstruction: "You are a master sommelier and guest experience designer. Return JSON array: [{category: 'Appetizer'|'Main'|'Dessert', dish: string, beveragePairing: string, rationale: string, zeroProofAlternative: string, culturalNote: string, pairingInsight: string}]",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "[]");
    }, []);
  },

  async getRegionalMixologyBrief(region: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a brief overview of mixology trends and culture in ${region}.`,
        config: {
          systemInstruction: "You are a global beverage historian. Be concise and evocative.",
        }
      });
      return response.text || "";
    }, "");
  },

  async getStaffingInsights(staff: any[], orders: any[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze staffing vs orders. Staff: ${JSON.stringify(staff)}, Orders: ${JSON.stringify(orders)}`,
        config: {
          systemInstruction: "Analyze hospitality staffing efficiency. Return JSON: {insight: string, recommendation: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { insight: "Standard operations.", recommendation: "Maintain roster." });
  },

  async generateModuleQuiz(topic: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a 3-question technical quiz about: ${topic}`,
        config: {
          systemInstruction: "Return JSON: {questions: [{question: string, options: string[], correctIndex: number}]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { questions: [
      { question: "What is the primary characteristic of this topic?", options: ["Precision", "Volume", "Speed", "History"], correctIndex: 0 },
      { question: "Which protocol is recommended for luxury service?", options: ["Casual", "Standard", "Elevated", "Technical"], correctIndex: 3 }
    ] });
  },

  async generateServiceBrief(profile: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a service brief for guest: ${JSON.stringify(profile)}`,
        config: {
          systemInstruction: "You are a luxury hospitality manager. Provide a concise internal service brief for staff.",
        }
      });
      return response.text;
    }, "");
  },

  async getPredictivePulse(data: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this revenue data for an executive summary: ${JSON.stringify(data)}. Identify trends and provide a 1-sentence operational focus.`,
        config: {
          systemInstruction: "You are a hospitality profit analyst. Be concise, technical, and high-impact.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              focusAction: { type: Type.STRING },
              sentiment: { type: Type.STRING, description: "One word: Bullish, Bearish, or Stable" }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    }, { summary: "Scanning revenue patterns...", focusAction: "Awaiting data sync.", sentiment: "Stable" });
  },

  async getInvestorIntelligence(financialData: any) {
    const category = 'executive_brief';
    const key = 'investor_deck_narrative';
    
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze establishment performance for Series A. Financials: ${JSON.stringify(financialData)}. Compare against current 2024-2025 hospitality tech benchmarks.`,
        config: {
          tools: [{googleSearch: {}}],
          systemInstruction: `You are a Venture Capital Hospitality Analyst for top-tier firms like Thayer Ventures, Derive Ventures, and GroundForce Capital. 
          Focus on identifying: 
          1. Operational Efficiency & Automation (Inventory accuracy, waste reduction).
          2. Revenue Management & Growth (Upselling alpha, check size increase via AI).
          3. Data-Driven Personalization (Guest data usage for tailored experiences).
          4. Sustainability & Health trends.
          5. Scalability & High EBITDA Potential (ROI evidence).
          Return valid JSON: {narrative: string, scalabilityRoadmap: [{phase: string, milestone: string, impact: string}], riskAssessment: [{category: string, level: 'Low'|'Medium'|'High', detail: string}], equityAlpha: string, projectedValuationMultiplier: number, benchmarks: [{category: string, venueValue: number|string, indexValue: number|string, unit: string}]}`,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, null, { category, key });
  },

  async getDynamicPricingSuggestions(inventory: any[]) {
    const fallback = { suggestions: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Review inventory and current prices for yield optimization: ${JSON.stringify(inventory)}`,
        config: {
          systemInstruction: "You are a hospitality revenue analyst. Suggest price increases for low-stock high-demand items or decreases for slow-moving stock. Return JSON: {suggestions: [{itemName: string, currentPrice: number, suggestedPrice: number, rationale: string, reasonType: 'Demand'|'Scarcity'|'Event'}]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getTechnicalSpecs(itemName: string) {
    const fallback = { measurements: ["2oz Spirits"], glassware: "Glass", garnish: "None", technique: "Pour" };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide detailed technical specs for: ${itemName}`,
        config: {
          systemInstruction: "Provide exact specs in JSON: {measurements: string[], glassware: string, garnish: string, technique: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback, { category: 'tech_specs', key: `spec-${itemName.replace(/\s+/g, '-')}` });
  },

  async getBarPrepIntelligence(orders: any[]) {
    const fallback = { sequence: ["Prep"], proTip: "Focus." };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sequence: ${JSON.stringify(orders)}`,
        config: {
          systemInstruction: "Return batching sequence and pro tip in JSON.",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getModuleCurriculum(topic: string) {
    const fallback = { 
      title: topic, 
      sections: [
        {
          heading: "Introduction to Theory",
          content: "In the Vinea Explorer sandbox, this curriculum focuses on the foundational scholarship of the topic. Master the origins and technical chemistry before proceeding to the live lab.",
          keySpecs: ["Standard Temperature", "Glassware Selection", "Region History"],
          labDrill: "Identify 3 regional variations of the primary beverage style."
        },
        {
          heading: "Technical Execution",
          content: "Precision is the hallmark of a Vinea scholar. Focus on measurement exactness and service posture to maximize guest sentiment.",
          keySpecs: ["42ms Observation Rule", "Zero-Proof Inclusivity", "Etiquette Standards"],
          labDrill: "Perform a simulated technical pour with feedback disengaged."
        }
      ] 
    };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate 4-step curriculum for: ${topic}`,
        config: {
          systemInstruction: getPersonaInstruction() + ` Return JSON: {title: string, sections: [{heading: string, content: string, keySpecs: string[], labDrill: string}]}`,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async analyzeVisionFrame(base64Image: string) {
    const fallback = { itemName: "Unknown", detectedStock: 0, confidence: 0 };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Identify brand and fill level. Return JSON." }
          ]
        }
      });
      const text = response.text || "";
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) { return fallback; }
    }, fallback);
  },

  async getInventoryIntelligence(inventory: any[]) {
    const fallback = { summary: "", predictions: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit: ${JSON.stringify(inventory)}`,
        config: {
          systemInstruction: "Output JSON: {summary: string, predictions: [{itemName: string, status: string, suggestedOrder: number, rationale: string}]}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getBusinessStrategy(data: any) {
    const fallback: any[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Strategy for ${data.profile?.type}. Inventory: ${JSON.stringify(data.inventory)}.`,
        config: {
          systemInstruction: "Return valid JSON array: [{type: string, message: string, impact: string, actionLabel: string, priority: string, rationale: string}].",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "[]");
    }, fallback);
  },

  async runServiceSimulator(scenario: string, userInput: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Scenario: ${scenario}. Input: "${userInput}"`,
        config: {
          systemInstruction: "Return guest response, score (0-100), and feedback in JSON.",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    }, { guestResponse: "The guest observes your approach with curiosity. (Demo Mode Feedback: Focus on technical precision in full versions.)", score: 85, feedback: "Maintain eye contact and technical specifications.", finished: false });
  },

  async generateSignatureSpecial(theme: string) {
    const fallback = { recipe: { name: "Special", story: "A unique creation synthesized by Vinea's local archives.", ingredients: ["2oz Local Spirit", "1oz Craft Bitter", "Zest"], glassware: "Technical Glass", instructions: ["Combine", "Stir over clear ice", "Strain"] }, imageUrl: "" };
    
    const recipeResult = await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a professional signature beverage recipe inspired by the theme: ${theme}.`,
        config: {
          systemInstruction: "You are a master mixologist. Create unique recipes with compelling stories. Return JSON: {recipe: {name: string, story: string, ingredients: string[], glassware: string, instructions: string[]}}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{}');
    }, { recipe: fallback.recipe });

    const imageResult = await callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A professional, high-end studio photograph of a cocktail named "${recipeResult.recipe.name}" served in a ${recipeResult.recipe.glassware}. The style is cinematic, elegant lighting, dark background, luxury beverage photography. Concept: ${theme}.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });
      
      let imageUrl = "";
      // Fix: Add optional chaining for safer access to response parts
      const parts = response?.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      return imageUrl || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80";
    }, "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80");

    return { ...recipeResult, imageUrl: imageResult };
  },

  async getTrainingResponse(query: string, history: any[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { systemInstruction: getPersonaInstruction() }
      });
      return response.text || "";
    }, "Vinea Intelligence operational. (Explorer Tier: Real-time API calls disengaged to preserve local quota. Secure your facility for live scholarship.)");
  },

  async getCocktailInsight(cocktailName: string, ingredients: string[]) {
    const fallback = { history: "This drink carries the technical heritage of its primary spirit.", origins: "Global archives point to multiple cross-cultural influences.", facts: ["Vinea identifies 14 flavor variants.", "Technical glassware selection is critical."] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Insight: ${cocktailName}`,
        config: {
          systemInstruction: "Return history, origin, and facts in JSON.",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getRegionalCocktailSuggestions(region: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `6 cocktails from ${region}`,
        config: { systemInstruction: "Return JSON array.", responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    }, ["Old Fashioned", "Negroni", "Martini", "Margarita", "Sidecar", "Daiquiri"]);
  },

  async generateGuestEngagement(profile: any, establishment: any) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Draft for ${profile.name}`,
        config: {
          systemInstruction: "Return JSON: {email: {subject: string, body: string}, sms: {body: string}}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { email: { subject: "Welcome to Vinea", body: "We look forward to synthesizing your palate journey tonight." }, sms: { body: "Your Table is ready at Vinea. Our sommelier is prepared." } });
  },

  async getPreArrivalOutreach(profile: any, inventory: any[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Guest Profile: ${JSON.stringify(profile)}. Inventory Highlight: ${JSON.stringify(inventory.slice(0,5))}. Draft a personalized pre-arrival outreach message (Email/SMS) that suggests a specific drink from inventory that matches their palate.`,
        config: {
          systemInstruction: "You are a luxury concierge. Be elegant, personalized, and focus on high-value upselling. Return JSON: {subject: string, body: string, suggestedItem: string}",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    }, { subject: "Tonight's Selection", body: "We look forward to seeing you. Our archives suggest you may enjoy our reserve list.", suggestedItem: "House Reserve" });
  },

  async analyzeGuestTags(profile: any, notes: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Profile: ${JSON.stringify(profile)}. Notes: ${notes}. Generate 3 automated short behavioral tags (max 15 chars each).`,
        config: {
          systemInstruction: "Return JSON array of strings: ['Tag1', 'Tag2', 'Tag3']",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "[]");
    }, ["Classic Palate", "High Loyalty", "Service Detail"]);
  }
};
