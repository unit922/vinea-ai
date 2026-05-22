
import { GoogleGenAI, Type } from "@google/genai";
import { getSupabaseClient } from "./supabaseClient";
import { ServiceOrder, RetailTransaction, InventoryItem, AIPairingSuggestion } from "../lib/types";

const getProfile = () => {
  if (typeof window === 'undefined') return { edition: 'demo', aiPersona: 'technical' };
  const profileKey = localStorage.getItem('intelligence_profile') ? 'intelligence_profile' : (localStorage.getItem('vinetelligence_profile') ? 'vinetelligence_profile' : 'vinea_profile');
  const profile = localStorage.getItem(profileKey);
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch {
      return { edition: 'demo', aiPersona: 'technical' };
    }
  }
  return { edition: 'demo', aiPersona: 'technical' };
};

const getPersonaInstruction = (userRole?: string) => {
  const profile = getProfile();
  const personas: Record<string, string> = {
    'technical': 'You are a Master Sommelier and Beverage Scientist. Your tone is authoritative, precise, and sophisticated. Use technical terminology (e.g., "terroir", "organoleptic", "esterification") where appropriate. Focus on exact specifications, historical provenance, and the chemistry of production.',
    'hospitable': 'You are a world-class Hospitality Director. Your tone is warm, encouraging, and impeccably polite. Focus on the emotional journey of the guest, the nuances of body language, and the art of anticipatory service.',
    'creative': 'You are a visionary Liquid Architect. Your tone is inspiring, bold, and experimental. Encourage breaking traditional rules, exploring unusual botanical pairings, and pushing the boundaries of sensory experience.'
  };
  
  let instruction = personas[profile.aiPersona] || personas['technical'];
  
  instruction += `\n\nCORE IDENTITY:
  - You are the integrated intelligence layer of the Global Network.
  - Your purpose is to bridge the gap between technical scholarship and world-class hospitality.
  - You operate as a "Nebula" of collective intelligence, drawing from global vintages and operational data.`;

  instruction += `\n\nCOACHING PROTOCOLS:
  - Act as a high-level mentor and technical coach, not just an information retrieval system.
  - Maintain a professional, sophisticated, and encouraging demeanor.
  - Provide "Masterclass" level insights, focusing on the "why" behind techniques and pairings.
  - Use analogies related to luxury, art, chemistry, or global hospitality standards.
  - Encourage critical thinking by occasionally asking the staff member how they would apply a concept in a high-pressure service scenario.
  - Prioritize practical, actionable advice that can be implemented immediately at the bar or on the floor.
  - Do not speculate on legal advice or health claims.
  - Always provide a clear Rationale for your suggestions to ensure pedagogical value.`;
  
  instruction += `\n\nESTABLISHMENT CONTEXT:
  - Venue: ${profile.name || 'Hospitality Node'} (${profile.type || 'Luxury Venue'})
  - Focus: ${profile.focus || 'General Beverage Excellence'}
  - Philosophy: ${profile.description || 'Precision and scholarship.'}`;

  if (userRole) {
    instruction += `\n- Coaching Target: You are currently mentoring a ${userRole}. Adjust your technical depth to challenge them while remaining actionable.`;
  }

  return instruction;
};

// Data Governance: Strip sensitive info
const sanitizeInput = (text: string) => {
  return text.replace(/[0-9]{10,}/g, '[REDACTED_PHONE]')
             .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
};

export const getApiKey = () => {
  // Check sessionStorage for pre-loaded server API key first for frictionless sandbox operation
  try {
    const serverKey = sessionStorage.getItem('vinetelligence_server_api_key');
    if (serverKey) return serverKey;
  } catch (e) {
    console.error("Failed to read sessionStorage for API key", e);
  }

  // Check localStorage first for manual override
  try {
    const profileKey = localStorage.getItem('vinetelligence_profile') 
      ? 'vinetelligence_profile' 
      : (localStorage.getItem('intelligence_profile') 
          ? 'intelligence_profile' 
          : (localStorage.getItem('oenovia_profile') 
              ? 'oenovia_profile' 
              : 'vinea_profile'));
    const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    if (profile.geminiApiKey) return profile.geminiApiKey;
  } catch (e) {
    console.error("Failed to parse profile for API key", e);
  }

  let key = "";
  if (typeof process !== 'undefined') {
    key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  }
  
  if (!key) {
    key = (import.meta.env?.VITE_GEMINI_API_KEY as string) || (import.meta.env?.VITE_API_KEY as string) || "";
  }

  if (!key || key === "undefined" || key === "null") {
    console.warn("Intelligence: Gemini API Key is missing or invalid in environment.");
  }
  
  return key;
};

async function fetchFromCache(category: string, key: string): Promise<{ data: unknown; timestamp: string } | null> {
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
  } catch {
    return null;
  }
}

async function saveToCache(category: string, key: string, data: unknown) {
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
  } catch (e) {
    console.error("Intelligence: Cache save failed", e);
  }
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

  const isPaidTier = edition !== 'demo' || profile.demoMode === 'operator' || profile.tier?.toLowerCase() === 'operator';
  
  // Allow Operator tier in demo mode to access real AI logic for training/insights
  if (edition === 'demo' && !options && !isPaidTier) {
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
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const errorMsg = error?.message || "";
      
      // Stop retrying if it's a permission/auth issue - these won't fix themselves with retries
      if (errorMsg.includes("permission denied") || errorMsg.includes("API key not valid") || errorMsg.includes("403") || errorMsg.includes("401")) {
        console.error("System Architecture: Permission Denied for AI Model. Credentials or model access restricted.", error);
        // Throw a specialized error that the UI can catch
        const customError = new Error(`Protocol Permission Denied: ${errorMsg}`);
        (customError as any).isPermissionError = true; // eslint-disable-line @typescript-eslint/no-explicit-any
        throw customError;
      }

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
      callbacks: {
        onopen?: () => void;
        onmessage?: (message: unknown) => void;
        onerror?: (error: unknown) => void;
        onclose?: () => void;
      };
      config: {
        responseModalities: string[];
        speechConfig?: {
          voiceConfig?: {
            prebuiltVoiceConfig?: {
              voiceName: string;
            };
          };
        };
        systemInstruction?: string;
      };
    }) {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (ai as any).live.connect(params);
    }
  },

  // Fix: Removed 'responseMimeType' as it is not supported for 'gemini-2.5-flash-image'
  // Added JSON cleaning logic to handle potential Markdown wrapping in the model response
  async getIntelligencePitch(base64Image: string, mimeType: string) {
    const fallback = { brandName: "Unknown", pitch: "Intelligence operational. (Protocol limitation in Demo Tier)", tastingNotes: [], pairing: "N/A", trivia: "N/A" };
    return callWithRetry(async () => {
      const apiKey = getApiKey();
      if (!apiKey) return fallback;
      
      const ai = new GoogleGenAI({ apiKey });
      const modelName = 'gemini-flash-latest'; // Recommended for text/vision reasoning
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: "Assume you are a Master Sommelier with a 'Modern' tone. Analyze this beverage label. Generate an Intelligence Pitch for a guest at a high-end table. The tone should be evocative, technical yet accessible, and deeply storytelling. Include: 1. A poetic yet concise 2-sentence 'narrative hook' about its heritage. 2. Three sophisticated technical tasting notes. 3. A perfect food pairing rationale. 4. A rare 'sommelier secret' trivia fact about this producer." }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              pitch: { type: Type.STRING },
              tastingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
              pairing: { type: Type.STRING },
              trivia: { type: Type.STRING }
            },
            required: ["brandName", "pitch", "tastingNotes", "pairing", "trivia"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getTrainingRecommendations(staff: StaffShift, context: string) {
    const fallback: { moduleId: string, rationale: string }[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{
          parts: [{ text: `Analyze this staff member's profile and the current operational context:
        Staff: ${JSON.stringify(staff)}
        Context: ${context}
        
        Suggest 3 specific training modules from the Academy that would most benefit this operator right now. Provide a rationale for each.` }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                moduleId: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["moduleId", "rationale"]
            }
          }
        }
      });
      
      const text = response.text || "[]";
      return JSON.parse(text);
    }, fallback);
  },

  async getAcademyROI(staffData: StaffShift[], feedbackData: GuestFeedback[]) {
    const fallback = { correlationScore: 0, topSkill: "N/A", revenueImpact: "N/A", improvementArea: "N/A", summary: "Data synthesis pending." };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{
          parts: [{ text: `Analyze the correlation between staff training completion and guest sentiment:
        Staff Training Data: ${JSON.stringify(staffData)}
        Guest Feedback Data: ${JSON.stringify(feedbackData)}
        
        Synthesize an 'ROI Report'. Include: 1. Correlation score (0-100). 2. Top performing trained skill. 3. Revenue impact estimate (qualitative). 4. One specific area for improvement.` }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correlationScore: { type: Type.NUMBER },
              topSkill: { type: Type.STRING },
              revenueImpact: { type: Type.STRING },
              improvementArea: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["correlationScore", "topSkill", "revenueImpact", "improvementArea", "summary"]
          }
        }
      });
      
      const text = response.text || JSON.stringify(fallback);
      return JSON.parse(text);
    }, fallback);
  },

  async performVisionAudit(base64Image: string, mimeType: string) {
    const fallback = { brandName: "Unknown", vintage: "N/A", region: "N/A", estimatedPrice: 0, confidence: 0, tastingNotes: "", sustainability: { carbonScore: 0, waterIntensity: "Medium", isBiodynamic: false, isFairTrade: false } };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: "Analyze this image which contains a beverage label (wine, spirit, or beer). Focus specifically on the label frame and identify the product. Extract brand name, vintage, region, estimated market price, and technical tasting notes. Also synthesize a sustainability score (0-100) based on known production methods of this brand." }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              vintage: { type: Type.STRING },
              region: { type: Type.STRING },
              estimatedPrice: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              tastingNotes: { type: Type.STRING },
              sustainability: {
                type: Type.OBJECT,
                properties: {
                  carbonScore: { type: Type.NUMBER },
                  waterIntensity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  isBiodynamic: { type: Type.BOOLEAN },
                  isFairTrade: { type: Type.BOOLEAN }
                },
                required: ["carbonScore", "waterIntensity", "isBiodynamic", "isFairTrade"]
              }
            },
            required: ["brandName", "vintage", "region", "estimatedPrice", "confidence", "tastingNotes", "sustainability"]
          }
        }
      });
      
      const text = response.text || JSON.stringify(fallback);
      
      try {
        const parsed = JSON.parse(text);

        // Ensure estimatedPrice is a number to prevent React child error
        if (parsed.estimatedPrice && typeof parsed.estimatedPrice === 'object') {
          parsed.estimatedPrice = parsed.estimatedPrice.value || 0;
        } else if (typeof parsed.estimatedPrice === 'string') {
          parsed.estimatedPrice = parseFloat(parsed.estimatedPrice.replace(/[^0-9.]/g, '')) || 0;
        } else if (parsed.estimatedPrice === undefined) {
          parsed.estimatedPrice = 0;
        }

        // Ensure all required fields exist for the UI
        return {
          brandName: parsed.brandName || "Unknown Brand",
          vintage: parsed.vintage || "N/V",
          region: parsed.region || "Unknown Region",
          estimatedPrice: parsed.estimatedPrice,
          confidence: parsed.confidence || 0,
          tastingNotes: parsed.tastingNotes || "No tasting notes available.",
          sustainability: {
            carbonScore: parsed.sustainability?.carbonScore || 50,
            waterIntensity: parsed.sustainability?.waterIntensity || "Medium",
            isBiodynamic: !!parsed.sustainability?.isBiodynamic,
            isFairTrade: !!parsed.sustainability?.isFairTrade
          }
        };
      } catch (e) {
        console.error("Intelligence: Vision parsing failed", e);
        throw new Error("Failed to parse beverage data. Please ensure the label is clearly visible.");
      }
    }, fallback);
  },
  async logAIFeedback(type: string, query: string, response: string, rating: number, comments?: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      await supabase.from('ai_feedback_logs').insert({
        category: type,
        query,
        response,
        rating,
        comments,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Intelligence: Failed to log AI feedback to Supabase", e);
    }
  },

  async parseBulkInventory(text: string) {
    const fallback = { items: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Parse this unstructured beverage inventory list into structured JSON. Input: "${sanitizeInput(text)}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { 
                      type: Type.STRING, 
                      enum: ['Wine', 'Spirit', 'Mixer', 'Beer', 'Garnish', 'Snack', 'Lunch', 'Dinner', 'Cocktail'] 
                    },
                    stock: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    minStock: { type: Type.NUMBER },
                    price: { type: Type.NUMBER }
                  },
                  required: ["name", "category", "stock", "unit", "price"]
                }
              },
              metadata: {
                type: Type.OBJECT,
                properties: {
                  dataQualityScore: { type: Type.NUMBER },
                  warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            required: ["items"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getInventoryIntelligence(inventory: { id: string; name: string; stock: number; unit: string; price: number }[], transactions: RetailTransaction[] = []) {
    const fallback = { summary: "", predictions: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Inventory: ${JSON.stringify(inventory)}\n\nRecent Transactions: ${JSON.stringify(transactions.slice(-50))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    status: { type: Type.STRING },
                    suggestedOrder: { type: Type.NUMBER },
                    rationale: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    technicalRationale: { type: Type.STRING }
                  },
                  required: ["itemName", "status", "suggestedOrder", "rationale", "confidence", "technicalRationale"]
                }
              }
            },
            required: ["summary", "predictions"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getTrainingResponse(query: string, history: {role: string, text: string}[], userRole?: string) {
    const contents = history.map(m => ({
      role: m.role === 'intelligence' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: sanitizeInput(query) }] });

    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config: {
          systemInstruction: getPersonaInstruction(userRole),
          tools: [{ googleSearch: {} }]
        }
      });
      
      // Grounding Check for Transparency
      const sources: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
        if (c.web) sources.push(c.web.uri);
      });

      let text = response.text || "";
      if (sources.length > 0) {
         text += `\n\n--- Technical Grounding ---\nVerified via sources: ${sources.join(', ')}`;
      }
      return text;
    }, "Intelligence operational. (Protocol limitation in Demo Tier)");
  },

  async getDynamicPricingSuggestions(items: { id: string; name: string; stock: number; unit: string; price: number }[]) {
    const fallback = { suggestions: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze these inventory items and suggest dynamic pricing: ${JSON.stringify(items)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemName: { type: Type.STRING },
                    currentPrice: { type: Type.NUMBER },
                    suggestedPrice: { type: Type.NUMBER },
                    rationale: { type: Type.STRING },
                    reasonType: { type: Type.STRING }
                  },
                  required: ["itemName", "currentPrice", "suggestedPrice", "rationale", "reasonType"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async generateSignatureSpecial(theme: string) {
    const fallback = { recipe: { name: "Signature Special", story: "A concept in synthesis.", ingredients: [], glassware: "Standard", instructions: [] }, imageUrl: "" };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      
      // Step 1: Generate Recipe
      const recipeResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Create a unique, world-class cocktail recipe based on this theme: ${theme}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipe: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  story: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  glassware: { type: Type.STRING },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "story", "ingredients", "glassware", "instructions"]
              }
            },
            required: ["recipe"]
          }
        }
      });
      const recipeData = JSON.parse(recipeResponse.text || "{}");
      
      // Step 2: Generate Image using gemini-2.5-flash-image
      const imagePrompt = `High-end professional food photography of a cocktail named "${recipeData.recipe?.name}". Story: ${recipeData.recipe?.story}. Glassware: ${recipeData.recipe?.glassware}. Dark, moody luxury lounge background.`;
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: imagePrompt
      });
      
      let imageUrl = '';
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      return { ...recipeData, imageUrl };
    }, fallback);
  },

  async getWelcomeBrief(profile: Record<string, unknown>) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Generate a brief welcome message for a new establishment: ${JSON.stringify(profile)}`,
        config: {
          systemInstruction: "Be welcoming and professional. Mention the specific venue type and philosophy."
        }
      });
      return response.text || "Welcome to the Intelligence Node.";
    }, "Welcome to the Intelligence Node.");
  },

  async getMenuPersonalization(profile: Record<string, unknown>, currentMenu: Record<string, unknown>) {
    const fallback: unknown[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Guest Profile: ${JSON.stringify(profile)}\nMenu: ${JSON.stringify(currentMenu)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                dish: { type: Type.STRING },
                beveragePairing: { type: Type.STRING },
                rationale: { type: Type.STRING },
                pairingInsight: { type: Type.STRING }
              },
              required: ["category", "dish", "beveragePairing", "rationale", "pairingInsight"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    }, fallback);
  },

  async analyzeGuestTags(profile: Record<string, unknown>, input: string) {
    const fallback: string[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Profile: ${JSON.stringify(profile)}\nInput: ${input}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    }, fallback);
  },

  async getRegionalCocktailSuggestions(region: string) {
    const fallback: string[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `List 6 popular cocktail names from the region: ${region}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    }, fallback);
  },

  async getRegionalMixologyBrief(region: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Provide a short, elegant brief about the mixology culture in: ${region}`
      });
      return response.text || "Regional data synthesis pending.";
    }, "Regional data synthesis pending.");
  },

  async getAIPairingSuggestions(foodItems: InventoryItem[], beverageInventory: InventoryItem[]): Promise<AIPairingSuggestion[]> {
    const fallback: AIPairingSuggestion[] = [];
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Food Items: ${JSON.stringify(foodItems)}\nBeverage Inventory: ${JSON.stringify(beverageInventory)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                foodItem: { type: Type.STRING },
                foodCategory: { type: Type.STRING },
                beveragePairing: { type: Type.STRING },
                beverageCategory: { type: Type.STRING },
                rationale: { type: Type.STRING },
                pairingInsight: { type: Type.STRING }
              },
              required: ["foodItem", "foodCategory", "beveragePairing", "beverageCategory", "rationale", "pairingInsight"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    }, fallback);
  },

  async getCocktailInsight(name: string, ingredients: string[]) {
    const fallback = { history: "", origins: "", facts: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Provide insights for the cocktail: ${name}. Ingredients: ${ingredients.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              history: { type: Type.STRING },
              origins: { type: Type.STRING },
              facts: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["history", "origins", "facts"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getCompetitorAnalysis(competitorData: any[], userInventory: InventoryItem[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const fallback = { competitors: [], overallStrategy: "", marketTrends: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze these competitors and our inventory to generate a market strategy:
        Competitors: ${JSON.stringify(competitorData)}
        Our Inventory: ${JSON.stringify(userInventory.slice(0, 50))}
        
        Generate:
        1. Performance analysis for each competitor.
        2. Current regional market trends in hospitality/beverage.
        3. A comprehensive counter-strategy leveraging our inventory strengths.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    strength: { type: Type.STRING },
                    weakness: { type: Type.STRING },
                    strategy: { type: Type.STRING }
                  },
                  required: ["name", "strength", "weakness", "strategy"]
                }
              },
              marketTrends: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              overallStrategy: { type: Type.STRING }
            },
            required: ["competitors", "marketTrends", "overallStrategy"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getServiceEfficiencyInsights(orders: ServiceOrder[], transactions: RetailTransaction[]) {
    const apiKey = getApiKey();
    if (!apiKey) return { narrative: "Vinetelligence Intelligence requires a valid API Key for service analysis." };

    const ai = new GoogleGenAI({ apiKey });

    // Calculate metrics
    const serviceTimes = orders.filter(o => o.deliveredAt).map(o => {
      const start = new Date(o.timestamp).getTime();
      const end = new Date(o.deliveredAt!).getTime();
      return (end - start) / 60000;
    });

    const avgServiceTime = serviceTimes.length > 0 ? (serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length).toFixed(1) : "N/A";
    const slowOrders = orders.filter(o => {
      if (!o.deliveredAt) return false;
      const start = new Date(o.timestamp).getTime();
      const end = new Date(o.deliveredAt!).getTime();
      return (end - start) / 60000 > 15;
    }).length;

    const prompt = `
      ${getPersonaInstruction('Manager')}
      
      SERVICE PERFORMANCE AUDIT:
      - Total Orders Analyzed: ${orders.length}
      - Completed Transactions: ${transactions.length}
      - Average Service Time (Order to Delivery): ${avgServiceTime} minutes
      - Critical Delays (>15m): ${slowOrders}
      
      TASK:
      Analyze these operational metrics. Identify potential bottlenecks (e.g., bar prep time vs delivery time). 
      Provide 3 high-impact, sophisticated recommendations for the Manager to improve service speed and guest satisfaction.
      Focus on "Masterclass" hospitality standards.
      
      Return a JSON object with:
      {
        "narrative": "markdown formatted analysis and recommendations"
      }
    `;

    return callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || '{"narrative": "Analysis incomplete."}');
    }, { narrative: "Operational intelligence synthesis delayed. Please check network protocols." });
  },

  async getStaffingInsights(staff: { id: string; name: string; role: string; performanceScore?: number; availabilityStatus?: string }[], zones: { id: string; name: string }[], journeys: { id: string; guest_name: string }[]) {
    const fallback = { 
      narrative: "Manual deployment suggested.",
      assignments: []
    };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Staff Available: ${JSON.stringify(staff)}\nFloor Zones: ${JSON.stringify(zones)}\nUpcoming Guests: ${JSON.stringify(journeys)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative: { type: Type.STRING },
              assignments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    staffId: { type: Type.STRING },
                    zoneId: { type: Type.STRING },
                    priority: { type: Type.NUMBER }
                  },
                  required: ["staffId", "zoneId", "priority"]
                }
              }
            },
            required: ["narrative", "assignments"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getFacilityMaintenanceBrief(equipment: { id: string; name: string; status: string; healthScore: number }[]) {
    const fallback = { riskSummary: "Diagnostic offline." };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Equipment Telemetry: ${JSON.stringify(equipment)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskSummary: { type: Type.STRING }
            },
            required: ["riskSummary"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getSustainabilityImpactAudit(orders: { id: string; items: { name: string; quantity: number }[] }[]) {
    const fallback = { wasteReductionPct: 0, fiscalSavings: 0, topSpillageItems: [], aiActionPlan: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze sustainability impact for these orders: ${JSON.stringify(orders)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wasteReductionPct: { type: Type.NUMBER },
              fiscalSavings: { type: Type.NUMBER },
              topSpillageItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    loss: { type: Type.NUMBER }
                  },
                  required: ["name", "loss"]
                }
              },
              aiActionPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["wasteReductionPct", "fiscalSavings", "topSpillageItems", "aiActionPlan"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async generateGuestEngagement(profile: Record<string, unknown>, context: Record<string, unknown>) {
    const fallback = { email: { body: "" }, sms: { body: "" } };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Profile: ${JSON.stringify(profile)}\nContext: ${JSON.stringify(context)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              email: {
                type: Type.OBJECT,
                properties: { body: { type: Type.STRING } },
                required: ["body"]
              },
              sms: {
                type: Type.OBJECT,
                properties: { body: { type: Type.STRING } },
                required: ["body"]
              }
            },
            required: ["email", "sms"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async generateServiceBrief(profile: Record<string, unknown>, sessionInfo?: { startTime?: string, durationMinutes?: number, tableNumber?: string }, orders: ServiceOrder[] = []) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      
      const sessionContext = sessionInfo ? `
      CURRENT SESSION:
      - Table: ${sessionInfo.tableNumber || 'Pending'}
      - Seated Since: ${sessionInfo.startTime || 'N/A'}
      - Duration: ${sessionInfo.durationMinutes || 0} minutes
      - Active Orders: ${orders.length}
      - Order History: ${JSON.stringify(orders.map(o => ({ item: o.itemName, status: o.status, time: o.timestamp })))}
      ` : 'Guest has not been seated yet.';

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `
        ${getPersonaInstruction('Concierge')}
        
        REAL-TIME GUEST CONTEXT:
        ${JSON.stringify(profile)}
        
        ${sessionContext}
        
        TASK:
        Create a one-sentence, highly sophisticated service briefing for the staff. 
        It MUST focus on the CURRENT MOMENT (e.g., if they just ordered, if they've been seated too long without a drink, or based on their specific palate preferences relative to their current status). 
        Be concise, authoritative, and actionable.`
      });
      return response.text || "Service protocol operational.";
    }, "Service protocol operational.");
  },

  async getServicePacingRecommendations(profile: Record<string, unknown>, mode: string, orders: ServiceOrder[] = []) {
    const fallback = { recommendations: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Guest Profile: ${JSON.stringify(profile)}\nRequested Pace: ${mode}\nCurrent Order Status: ${JSON.stringify(orders)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["recommendations"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getPreArrivalOutreach(profile: Record<string, unknown>, inventory: { id: string; name: string; stock: number; unit: string; price: number }[]) {
    const fallback = {};
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Guest: ${JSON.stringify(profile)}\nInventory: ${JSON.stringify(inventory.slice(0, 20))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plan: { type: Type.STRING },
              suggestedItems: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    }, fallback);
  },

  async getPalateMarketingCampaign(target: Record<string, unknown>, inventory: { id: string; name: string; stock: number; unit: string; price: number }[]) {
    const fallback = { title: "Special Offer", targetCluster: "", subject: "", body: "", offerItem: "" };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Target Cluster: ${JSON.stringify(target)}\nInventory: ${JSON.stringify(inventory.slice(0, 20))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              targetCluster: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
              offerItem: { type: Type.STRING }
            },
            required: ["title", "targetCluster", "subject", "body", "offerItem"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getSmartSeatingSuggestion(profile: Record<string, unknown>, tables: { id: string; number: string; capacity: number; status: string; zoneId?: string }[], partySize: number) {
    const fallback = { tableId: "", rationale: "Manual selection required." };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Party Size: ${partySize}\nGuest Profile: ${JSON.stringify(profile)}\nAvailable Tables: ${JSON.stringify(tables.filter(t => t.status === 'Available'))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tableId: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ["tableId", "rationale"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getBarPrepIntelligence(orders: ServiceOrder[]) {
    const fallback = { sequence: [], proTip: "" };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Active Orders: ${JSON.stringify(orders)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sequence: { type: Type.ARRAY, items: { type: Type.STRING } },
              proTip: { type: Type.STRING }
            },
            required: ["sequence", "proTip"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getCocktailPreparationGuide(name: string) {
    const fallback = { instructions: [], videoUrl: "", imageUrl: "", tips: [] };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Provide a detailed preparation guide for the cocktail: ${name}. Search for a high-quality YouTube tutorial video link specifically for making this cocktail.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              videoUrl: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["instructions", "videoUrl", "imageUrl", "tips"]
          },
          tools: [{ googleSearch: {} }]
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getFinancialIntelligence(transactions: { id: string; amount: number; date: string; description: string }[], inventory: { id: string; name: string; stock: number; unit: string; price: number }[], type: string) {
    const fallback = { 
      title: "Fiscal Synthesis", 
      narrative: "Standard financial mapping.", 
      metrics: [], 
      aiAdvice: [] 
    };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze data for a ${type} report. Transactions: ${JSON.stringify(transactions.slice(0, 50))}\nInventory: ${JSON.stringify(inventory.slice(0, 50))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              narrative: { type: Type.STRING },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    trend: { type: Type.STRING }
                  },
                  required: ["label", "value", "trend"]
                }
              },
              aiAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "narrative", "metrics", "aiAdvice"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getInvestorIntelligence(transactions: { id: string; amount: number; date: string; description: string }[]) {
    const fallback = { 
      narrative: "Equity alpha remains stable based on local node velocity.",
      equityAlpha: "Strong potential for market expansion.",
      projectedValuationMultiplier: 4.2,
      scalabilityRoadmap: [
        { phase: "Node Density", milestone: "Establishment of secondary units", impact: "Increased MRR via scale" }
      ],
      riskAssessment: [
        { category: "Market Scarcity", level: "Low", detail: "Exclusive access to specific vintage nodes." }
      ],
      benchmarks: []
    };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-pro-latest',
        contents: `Investor Synthesis. Data: ${JSON.stringify(transactions.slice(0, 50))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative: { type: Type.STRING },
              equityAlpha: { type: Type.STRING },
              projectedValuationMultiplier: { type: Type.NUMBER },
              scalabilityRoadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    milestone: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  },
                  required: ["phase", "milestone", "impact"]
                }
              },
              riskAssessment: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    level: { type: Type.STRING },
                    detail: { type: Type.STRING }
                  },
                  required: ["category", "level", "detail"]
                }
              },
              benchmarks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    venueValue: { type: Type.NUMBER },
                    indexValue: { type: Type.NUMBER },
                    unit: { type: Type.STRING }
                  },
                  required: ["category", "venueValue", "indexValue", "unit"]
                }
              }
            },
            required: ["narrative", "equityAlpha", "projectedValuationMultiplier", "scalabilityRoadmap", "riskAssessment", "benchmarks"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async getSentimentReport(feedback: GuestFeedback[]) {
    const feedbackText = feedback.map(f => `Guest: ${f.guestName}, Rating: ${f.rating}, Comment: ${f.comment}`).join('\n');
    const prompt = `Analyze the following guest feedback for a luxury restaurant/bar and provide a strategic sentiment report. 
    Identify key themes, areas of excellence, and critical friction points. 
    Recommend 3 specific actions to improve guest retention.
    
    Format the response in professional Markdown with clear headings and bullet points.
    
    Feedback:
    ${feedbackText}`;

    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });
      return response.text || "Unable to generate report at this time.";
    }, "Unable to generate report at this time.");
  },

  async getChurnPrediction(feedback: GuestFeedback[], loyaltyMembers: LoyaltyMember[]) {
    const feedbackText = feedback.map(f => `Guest: ${f.guestName}, Rating: ${f.rating}, Comment: ${f.comment}`).join('\n');
    const loyaltyText = loyaltyMembers.map(m => `Member: ${m.name}, Tier: ${m.tier}, Points: ${m.points}, Last Visit: ${m.lastVisit}`).join('\n');
    
    const prompt = `Based on the following guest feedback and loyalty data, predict potential customer churn. 
    Identify high-risk members and suggest 3 proactive retention strategies.
    
    Format the response in professional Markdown with clear headings and bullet points.
    
    Feedback:
    ${feedbackText}
    
    Loyalty Data:
    ${loyaltyText}`;

    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });
      return response.text || "Unable to generate churn prediction at this time.";
    }, "Unable to generate churn prediction at this time.");
  },

  async generatePromoCampaign(context: { establishmentName: string, items: string[], theme?: string }) {
    const fallback = {
      videoScript: "Loading script...",
      linkedInPost: "Loading post...",
      videoPrompt: "A high-end cinematic shot of a luxury bar.",
      scenes: []
    };
    
    return callWithRetry(async () => {
      const apiKey = getApiKey();
      if (!apiKey) return fallback;

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Create a marketing campaign for ${context.establishmentName}. 
        Items to feature: ${context.items.join(', ')}. 
        Theme: ${context.theme || 'Luxury and Sophistication'}.
        
        Provide:
        1. A 15-second cinematic video script/storyboard.
        2. A polished LinkedIn post with hashtags.
        3. A detailed visual prompt for an AI video generation model (Veo).
        4. Break the video into 3 distinct scenes with descriptions and specific visual prompts for image generation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              videoScript: { type: Type.STRING },
              linkedInPost: { type: Type.STRING },
              videoPrompt: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING }
                  },
                  required: ["description", "visualPrompt"]
                }
              }
            },
            required: ["videoScript", "linkedInPost", "videoPrompt", "scenes"]
          }
        }
      });
      return JSON.parse(response.text || JSON.stringify(fallback));
    }, fallback);
  },

  async generateSceneFrame(prompt: string) {
    const fallback = { imageUrl: "" };
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: getApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: `Ultra-high-end professional food and hospitality photography. ${prompt}. Cinematic lighting, shallow depth of field, 8k resolution, luxury aesthetic.`
      });
      
      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      return { imageUrl };
    }, fallback);
  },

  async startVideoGeneration(prompt: string) {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });
    
    return operation;
  },

  async pollVideoStatus(operationId: string) {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const operation = await (ai as any).operations.getVideosOperation({ operation: { name: operationId } });
    return operation;
  }
};
