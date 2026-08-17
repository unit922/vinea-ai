
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { SubscriptionTier } from '../lib/types';
import { TRAINING_MODULES, INITIAL_SHIFTS } from '../constants';
import { geminiService } from '../services/geminiService';
import CocktailSearch from './CocktailSearch';
import CompetitorIntelligence from './CompetitorIntelligence';
import { StaffShift, Cocktail, InventoryItem, AIPairingSuggestion } from '../lib/types';

const PREDEFINED_COURSES: Record<string, { lessons: string[]; quizQuestions: { question: string; options: string[]; correctIndex: number; explanation: string; }[] }> = {
  '1': {
    lessons: [
      "Old World wines (Europe) emphasize terroir—how the soil, climate, and local environment impact the wine's character. They tend to be lighter-bodied, higher in acidity, and show earthier, more mineral notes with lower alcohol levels. Modern regulation in Europe protects geographic origins (AOC/DOCG).",
      "New World wines (US, South America, Australia, New Zealand) emphasize fruit-forward profiles, technological innovation, and grape varietal labeling rather than geographic naming. Warm climates lead to riper grapes, fuller bodies, higher alcohol, and lush vanilla profiles from toasted oak barrel aging.",
      "Service & Selling Tip: Match guest preferences to technical profiles. If a guest asks for 'an earthy, savory Pinot Noir with soft tannin,' steer them Old World (e.g., Burgundy). If they want 'a rich, bold, jammy Cabernet,' recommend New World (e.g., Napa Valley)."
    ],
    quizQuestions: [
      {
        question: "Which of the following characteristics is most representative of a classic 'Old World' wine style?",
        options: [
          "Lush, fruit-forward flavors with high alcohol and sweet oak profiles",
          "Drier profiles with higher acidity, mineral terroir, and lower alcohol",
          "A reliance on genetic varietal modifications and steel tank carbonation",
          "Exclusive bottling in rectangular high-friction glass containers"
        ],
        correctIndex: 1,
        explanation: "Old World styles generally prioritize terroir, high acidity, mineral notes, and lower alcohol compared to New World styles."
      },
      {
        question: "Why are New World wines typically labeled by grape varietal rather than geographic region?",
        options: [
          "European laws strictly prohibit geographic labeling in other continents",
          "New World producers prioritized grape varietal labeling to simplify customer discovery and build brand trust",
          "New World soils cannot produce regional distinctiveness",
          "Grape varietals are legally patented as trademarks by New World governments"
        ],
        correctIndex: 1,
        explanation: "New World labeling emphasizes the grape variety (e.g., Cabernet Sauvignon) to make discovery accessible and approachable for modern consumers."
      },
      {
        question: "A VIP guest asks for a 'crisp, lean white wine with intense flinty minerality and bright green apple acidity.' Which should you recommend?",
        options: [
          "A heavily toasted New Oak-aged Napa Valley Chardonnay",
          "A classic French Chablis (100% Chardonnay) from the Yonne region of Burgundy",
          "An Australian sweet Fortified Tawny Port",
          "A warm-climate Chilean Cabernet Sauvignon Reserve"
        ],
        correctIndex: 1,
        explanation: "Chablis is famous for its cool climate, Kimmeridgian limestone soils, crisp green apple acidity, and intense, clean flinty minerality (Old World Chardonnay style)."
      }
    ]
  },
  '13': {
    lessons: [
      "Vinetelligence brand standards command a seamless integration of somatic expertise and technical intelligence. Staff must treat the POS, digital cellar, and real-time alerts as helpful co-pilots, not distractions, delivering a smooth experience for guests.",
      "Service Timing: When a Service Alert warns of an order delay, the host or server must intercept the guest *before* they notice the lag. Warm hospitality paired with precise, data-driven transparency builds customer trust.",
      "Upselling Standards: Leverage AI flavor pairings. Never ask general questions like 'Would you like some wine?'. Instead, suggest precise, mouthwatering options: 'Our sommelier recommends the dry German Riesling to cut through the richness of our crispy pork belly.'"
    ],
    quizQuestions: [
      {
        question: "What is the core pillar of the Vinetelligence Brand Standards?",
        options: [
          "Replacing all waitstaff with mobile touch screens and payment links",
          "Combining elite human somatic hospitality with predictive digital co-pilots",
          "Charging guest tables automatically based on facial expression analytics",
          "Selling only private-label wines and spirits directly to VIP subscribers"
        ],
        correctIndex: 1,
        explanation: "The core standard is the integration of elite human hospitality with precise, data-driven digital assistance."
      },
      {
        question: "How should a server handle an AI service delay alert on their terminal?",
        options: [
          "Ignore the alert until the guest explicitly complains to management",
          "Proactively intercept the guest, acknowledge the delay with warm transparency, and manage their expectations",
          "Blame the kitchen printer or software systems in front of the customer",
          "Offer the guest free high-value vintage Champagne immediately without manager approval"
        ],
        correctIndex: 1,
        explanation: "Proactive communication with warm transparency prevents negative customer experiences and builds trust."
      },
      {
        question: "When recommending pairings to tables, what is the Vinetelligence standard?",
        options: [
          "Ask generic questions such as 'Do you want to see the wine list?'",
          "Suggest high-fidelity, descriptive combinations that reference the exact dish and recommended flavor contrasts",
          "Select the single most expensive vintage regardless of compatibility",
          "Suggest a generic cocktail from memory"
        ],
        correctIndex: 1,
        explanation: "Vinetelligence upsell protocols emphasize mouthwatering, flavor-contrast descriptions linked to exact inventory listings."
      }
    ]
  }
};

const FLASH_DRILLS = [
  { id: 'fd1', question: "What temperature should vintage Champagne be served at?", answer: "7°C to 10°C (45°F to 50°F). Serving too cold masks the delicate autolytic yeast and brioche aromas.", category: "Service" },
  { id: 'fd2', question: "What is the primary chemical compound responsible for 'cork taint'?", answer: "2,4,6-Trichloroanisole (TCA). It causes damp cardboard, musty, and wet dog aromas.", category: "Chemistry" },
  { id: 'fd3', question: "Which grape varietal is the sole grape of Barolo and Barbaresco DOCG?", answer: "Nebbiolo (highly tannic, high acidity, pale translucent color with aromas of tar and roses).", category: "Wine Knowledge" },
  { id: 'fd4', question: "What is the traditional glassware and ratio for a Classic Dry Martini?", answer: "Served in a chilled Martini/Coupette glass. Traditional ratio is 5:1 (Dry Gin to Dry Vermouth) with a dash of orange bitters.", category: "Mixology" },
  { id: 'fd5', question: "What is 'Somatic service' in modern hospitality theory?", answer: "A physical/sensory-led service protocol focusing on posture, temperature transitions, spatial acoustics, and tactile glass weight.", category: "Service Standard" }
];

interface IntelligenceAcademyProps {
  searchQuery?: string;
  userRole?: StaffShift['role'];
  inventory?: InventoryItem[];
  initialTab?: 'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | 'market' | 'cognitive-lab';
  onAddToMenu?: (cocktail: Cocktail) => void;
  onRemoveFromMenu?: (cocktailId: string) => void;
}

const IntelligenceAcademy: React.FC<IntelligenceAcademyProps> = ({ 
  searchQuery = '', 
  userRole = 'Manager',
  inventory = [],
  initialTab,
  onAddToMenu,
  onRemoveFromMenu
}) => {
  const store = useVinetelligenceStore();
  const tier = store.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
  const isOperator = tier === SubscriptionTier.OPERATOR;

  const [activeTab, setActiveTab] = useState<'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | 'market' | 'cognitive-lab'>(initialTab || 'academy');
  const [pairingSuggestions, setPairingSuggestions] = useState<AIPairingSuggestion[]>([]);
  const [isLoadingPairings, setIsLoadingPairings] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'vinetelligence', text: string, feedback?: number}[]>(() => {
    const isRC = typeof window !== 'undefined' && (() => {
      try {
        const p = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
        return p && (p.name?.includes("Ruth's Chris") || ('isRuthChris' in p && (p as unknown as { isRuthChris?: boolean }).isRuthChris));
      } catch {
        return false;
      }
    })();
    return [
      { 
        role: 'vinetelligence', 
        text: isRC
          ? `Ruth's Chris Steak House Benchmark operational. System calibrated for USDA Prime steak pairing matrices and sizzling 500°F butter serving protocols. Ask about steak chemistry, dry aging, or luxury Cabernet pairings.`
          : `Vinetelligence Academy operational. System tuned for ${userRole} level technical coaching. Inquire about vintages, chemistry, or protocols.` 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showTransparencyNotice, setShowTransparencyNotice] = useState(false);
  
  // Signature Lab State
  const [theme, setTheme] = useState('');
  const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);
  const [signatureResult, setSignatureResult] = useState<{ imageUrl: string; recipe: { name: string; story: string; ingredients: string[]; glassware: string } } | null>(null);

  // Cognitive Neuromarketing Lab States
  const [labItemName, setLabItemName] = useState('Gilded Truffle Crostini');
  const [labItemPrice, setLabItemPrice] = useState(32);
  const [labItemCategory, setLabItemCategory] = useState('Snack');
  const [labDeBiasCurrency, setLabDeBiasCurrency] = useState(true);
  const [labSensoryDescriptions, setLabSensoryDescriptions] = useState(true);
  const [labNestedPrice, setLabNestedPrice] = useState(true);
  
  const [customNarrativeResult, setCustomNarrativeResult] = useState('Crispy hand-toasted artisanal brioche dressed with wild wood-harvested black truffles, finished under a velvet warm cascade of aged fontina cheese.');
  const [neurologicalHookResult, setNeurologicalHookResult] = useState('Utilizes sensory-rich warmth adjectives to prime gustatory satisfaction centers, bypassing logical price-scrutiny by shifting user attention from expense to luxury expectation.');
  const [optimizedPriceTextResult, setOptimizedPriceTextResult] = useState('32');
  const [isGeneratingLabNarrative, setIsGeneratingLabNarrative] = useState(false);
  const [highlightedPrinciple, setHighlightedPrinciple] = useState<'insula' | 'scanners' | 'sensory' | 'pooling' | null>('sensory');

  const handleGenerateLabCopy = async () => {
    if (!labItemName.trim() || isGeneratingLabNarrative) return;
    setIsGeneratingLabNarrative(true);
    try {
      const res = await geminiService.getNeuromarketingCopy(labItemName, labItemCategory, labItemPrice);
      setCustomNarrativeResult(res.sensoryDescription || '');
      setNeurologicalHookResult(res.neurologicalHook || '');
      setOptimizedPriceTextResult(res.optimizedPriceText || `${labItemPrice}`);
    } catch (e) {
      console.error("Vinetelligence: Neuromarketing optimization synthesis failed.", e);
    } finally {
      setIsGeneratingLabNarrative(false);
    }
  };

  // Roster State
  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list');
    const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    return saved ? JSON.parse(saved) : (profile.edition === 'demo' ? INITIAL_SHIFTS : []);
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active Course and Quiz states
  const [activeCourse, setActiveCourse] = useState<typeof TRAINING_MODULES[0] | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [courseMaterials, setCourseMaterials] = useState<{ lessons: string[]; quizQuestions: { question: string; options: string[]; correctIndex: number; explanation: string; }[] } | null>(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeCourseTab, setActiveCourseTab] = useState<'lessons' | 'quiz' | 'coach'>('lessons');
  const [flashCardIndex, setFlashCardIndex] = useState(0);
  const [showFlashAnswer, setShowFlashAnswer] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('vinetelligence_staff_list', JSON.stringify(staffList));
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    const fetchPairings = async () => {
      if (!inventory || inventory.length === 0) return;
      setIsLoadingPairings(true);
      try {
        const foodItems = inventory.filter(i => i.category === 'Lunch' || i.category === 'Dinner' || i.category === 'Snack');
        const beverageInventory = inventory.filter(i => i.category === 'Wine' || i.category === 'Beer' || i.category === 'Cocktail' || i.category === 'Spirit');
        if (foodItems.length > 0 && beverageInventory.length > 0) {
          const suggestions = await geminiService.getAIPairingSuggestions(foodItems, beverageInventory);
          setPairingSuggestions(suggestions);
        }
      } catch (e) {
        console.error("Vinetelligence: Failed to fetch pairing suggestions", e);
      } finally {
        setIsLoadingPairings(false);
      }
    };
    if (activeTab === 'pairing') {
      fetchPairings();
    }
  }, [inventory, activeTab]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking) return;
    const msg = input; 
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await geminiService.getTrainingResponse(msg, history, userRole);
      setMessages(prev => [...prev, { role: 'vinetelligence', text: response }]);
    } catch {
      console.error("Vinetelligence: Academy synthesis failed.");
    } finally {
      setIsThinking(false);
    }
  };

  const activeStaffMember = useMemo(() => {
    return staffList.find(s => s.role === userRole) || staffList[0];
  }, [staffList, userRole]);

  const modulesWithCompletion = useMemo(() => {
    const completions = activeStaffMember?.assignedModules || [];
    return TRAINING_MODULES.map(m => {
      const assigned = completions.find(c => c.moduleId === m.id);
      return {
        ...m,
        completed: assigned ? assigned.completed : m.completed
      };
    });
  }, [activeStaffMember]);

  const filteredModules = useMemo(() => {
    return modulesWithCompletion.filter(m => m.topic.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [modulesWithCompletion, searchQuery]);

  const completeModuleForActiveStaff = (moduleId: string) => {
    if (!activeStaffMember) return;
    
    const updatedStaff = staffList.map(s => {
      if (s.id === activeStaffMember.id) {
        const assignedModules = s.assignedModules || [];
        const exists = assignedModules.some(am => am.moduleId === moduleId);
        let updatedModules = [];
        if (exists) {
          updatedModules = assignedModules.map(am => 
            am.moduleId === moduleId ? { ...am, completed: true } : am
          );
        } else {
          updatedModules = [...assignedModules, { moduleId, completed: true }];
        }
        return {
          ...s,
          assignedModules: updatedModules
        };
      }
      return s;
    });
    
    setStaffList(updatedStaff);
    localStorage.setItem('vinetelligence_staff_list', JSON.stringify(updatedStaff));
    localStorage.setItem('vinea_staff_list', JSON.stringify(updatedStaff));
    window.dispatchEvent(new Event('storage'));
  };

  const handleModuleClick = async (module: typeof TRAINING_MODULES[0]) => {
    setActiveCourse(module);
    setActiveSlide(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setActiveCourseTab('lessons');
    
    if (PREDEFINED_COURSES[module.id]) {
      setCourseMaterials(PREDEFINED_COURSES[module.id]);
    } else {
      setIsGeneratingCourse(true);
      try {
        const res = await geminiService.generateCourseMaterial(module.topic, module.category, module.difficulty);
        setCourseMaterials(res);
      } catch (err) {
        console.error("Failed to generate course syllabus", err);
        setCourseMaterials({
          lessons: [
            `Introduction to ${module.topic}: Overview of key operational standards and somatic hospitality techniques in the ${module.category} workspace.`,
            `Advanced Technical Integration: Standardizing the service, tasting, or management routines for ${module.topic} at an ${module.difficulty} level.`,
            `Upselling & Quality Control: Practical exercises for staff to maximize cellar turnover, inventory accuracy, and VIP guest satisfaction.`
          ],
          quizQuestions: [
            {
              question: `Which represents the primary best practice for ${module.topic}?`,
              options: [
                "Proactively communicating with guests using data-backed transparency",
                "Leaving inventory tracking entirely to manual end-of-month estimates",
                "Replacing all staff-guest interaction with static touch-points",
                "Refusing to offer upsells or somatic recommendations"
              ],
              correctIndex: 0,
              explanation: "Proactive communication and technical data synchronization help minimize operational latency and elevate the customer experience."
            },
            {
              question: `When dealing with a high-pressure scenario regarding ${module.topic}, what is the first action step?`,
              options: [
                "Delay response to see if the issue self-corrects",
                "Coordinate with the sommelier or general manager while maintaining transparent guest dialogue",
                "Inform the guest that the systems are locked",
                "Increase the price of vintage cellar listings to compensate"
              ],
              correctIndex: 1,
              explanation: "Team coordination combined with prompt, authentic transparency is the gold standard for high-pressure hospitality recovery."
            }
          ]
        });
      } finally {
        setIsGeneratingCourse(false);
      }
    }
  };

  const handleGenerateSignature = async () => {
    if (!theme.trim()) return;
    setIsGeneratingSignature(true);
    try {
      const res = await geminiService.generateSignatureSpecial(theme);
      setSignatureResult(res);
    } catch {
      console.error("Vinetelligence: Signature synthesis failed.");
    } finally {
      setIsGeneratingSignature(false);
    }
  };

  const handleFeedback = (idx: number, rating: number) => {
    const newMessages = [...messages];
    newMessages[idx].feedback = rating;
    setMessages(newMessages);
    geminiService.logAIFeedback('Coach', messages[idx-1]?.text || 'N/A', messages[idx].text, rating)
      .catch(e => console.error("Vinetelligence: Failed to log AI feedback", e));
  };

  const globalProgress = useMemo(() => {
    const allAssigned = staffList.flatMap(s => s.assignedModules || []);
    if (allAssigned.length === 0) return 0;
    const completed = allAssigned.filter(m => m.completed).length;
    return Math.round((completed / allAssigned.length) * 100);
  }, [staffList]);

  const progressTitle = useMemo(() => {
    if (globalProgress < 20) return 'Novice Node';
    if (globalProgress < 40) return 'Apprentice Sommelier';
    if (globalProgress < 60) return 'Technical Specialist';
    if (globalProgress < 80) return 'Master Operator';
    return 'Elite Intelligence';
  }, [globalProgress]);

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      <div className="flex justify-between items-center border-b border-stone-200 shrink-0 pr-4 overflow-x-auto">
        <div className="flex gap-8 whitespace-nowrap px-1">
          {(['academy', 'mixology', 'signature', 'pairing', 'market', 'roster', 'cognitive-lab'] as const)
            .filter(t => !isOperator || (t === 'academy' || t === 'mixology' || t === 'cognitive-lab'))
            .map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`pb-4 text-[10px] uppercase tracking-widest font-black transition-all px-2 ${activeTab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-stone-400 hover:text-stone-600'}`}>
                {t === 'cognitive-lab' ? 'Cognitive Labs 🧪' : t.replace('-', ' ')}
              </button>
            ))}
        </div>
        <button onClick={() => setShowTransparencyNotice(true)} className="hidden sm:block text-[9px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors mr-4 mb-4">
           AI Governance Brief
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'academy' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full pb-10">
                 <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fas fa-graduation-cap text-6xl text-indigo-500"></i></div>
                    <p className="text-[10px] font-black uppercase text-indigo-500 mb-2 italic">Curriculum Control</p>
                    <h3 className="text-xl font-serif font-bold italic mb-4">Active Training Path</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-indigo-500">{globalProgress}%</div>
                          <div>
                             <p className="text-xs font-bold">{progressTitle}</p>
                             <p className="text-[8px] text-stone-500 uppercase font-black">Level 02 Capability</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Rapid Recall: Daily Flash Drills */}
                 <div className="bg-gradient-to-br from-violet-950 to-indigo-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-violet-800/20">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><i className="fas fa-bolt text-6xl"></i></div>
                    <p className="text-[10px] font-black uppercase text-violet-400 mb-1 italic">Rapid Recall ⚡</p>
                    <h3 className="text-lg font-serif font-bold italic mb-3">Daily Sommelier Flash Drills</h3>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          {FLASH_DRILLS[flashCardIndex].category}
                        </span>
                        <span className="text-[8px] font-mono text-stone-400">
                          {flashCardIndex + 1} / {FLASH_DRILLS.length}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold leading-relaxed">
                        {FLASH_DRILLS[flashCardIndex].question}
                      </p>
                      
                      {showFlashAnswer ? (
                        <div className="pt-3 border-t border-white/5 animate-in fade-in space-y-3">
                          <p className="text-[11px] text-stone-300 leading-relaxed font-medium">
                            {FLASH_DRILLS[flashCardIndex].answer}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button 
                              onClick={() => {
                                setShowFlashAnswer(false);
                                setFlashCardIndex((prev) => (prev + 1) % FLASH_DRILLS.length);
                              }}
                              className="flex-1 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-600/30 transition-all"
                            >
                              Known
                            </button>
                            <button 
                              onClick={() => {
                                setShowFlashAnswer(false);
                                setFlashCardIndex((prev) => (prev + 1) % FLASH_DRILLS.length);
                              }}
                              className="flex-1 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl font-black text-[9px] uppercase hover:bg-rose-600/30 transition-all"
                            >
                              Need Practice
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowFlashAnswer(true)}
                          className="w-full py-3 bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-white/15 transition-all flex items-center justify-center gap-1.5"
                        >
                          <i className="fas fa-eye"></i> Reveal Expert Answer
                        </button>
                      )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Available Modules</h4>
                    {filteredModules.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleModuleClick(m)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer group shadow-sm hover:shadow-md ${activeCourse?.id === m.id ? 'border-indigo-600 bg-indigo-50/20' : 'bg-white border-stone-100 hover:border-indigo-500'}`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              m.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-600' : 
                              m.difficulty === 'Intermediate' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-900/10 text-indigo-900'
                            }`}>{m.difficulty}</span>
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-indigo-500 transition-colors">
                                  <i className="fas fa-chevron-right text-[8px]"></i>
                                </div>
                               {m.completed && <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
                            </div>
                         </div>
                         <p className="text-sm font-bold text-stone-800 leading-tight mb-2">{m.topic}</p>
                         <p className="text-[9px] text-stone-400 font-bold uppercase flex items-center gap-2"><i className="far fa-clock"></i> {m.duration}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-stone-200 flex flex-col overflow-hidden shadow-2xl relative">
                {activeCourse ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="p-8 border-b border-stone-100 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            setActiveCourse(null);
                            setCourseMaterials(null);
                          }}
                          className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:border-stone-400 transition-all"
                        >
                          <i className="fas fa-arrow-left text-xs"></i>
                        </button>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                              Course {activeCourse.id} Syllabus
                            </span>
                            <span className="text-[8px] font-black uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                              {activeCourse.difficulty}
                            </span>
                          </div>
                          <h3 className="text-lg font-serif font-black text-stone-900 italic">
                            {activeCourse.topic}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Tabs */}
                      <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
                        <button 
                          onClick={() => setActiveCourseTab('lessons')}
                          className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${activeCourseTab === 'lessons' ? 'bg-white text-indigo-600 shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                          Lessons
                        </button>
                        <button 
                          onClick={() => setActiveCourseTab('quiz')}
                          className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${activeCourseTab === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                          Exam
                        </button>
                        <button 
                          onClick={() => setActiveCourseTab('coach')}
                          className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all ${activeCourseTab === 'coach' ? 'bg-white text-indigo-600 shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                        >
                          Ask Coach
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-stone-50/20">
                      {isGeneratingCourse ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                          <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-violet-500/10">
                            <i className="fas fa-graduation-cap text-2xl animate-spin"></i>
                          </div>
                          <div className="text-center">
                            <h4 className="text-sm font-black text-stone-800 uppercase tracking-widest">Synthesizing Interactive Syllabus</h4>
                            <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Calibrating sommelier lessons & quiz bank via Gemini...</p>
                          </div>
                        </div>
                      ) : courseMaterials ? (
                        <>
                          {/* Lessons Tab */}
                          {activeCourseTab === 'lessons' && (
                            <div className="space-y-8 animate-in fade-in">
                              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-150 shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded">
                                    Slide {activeSlide + 1} of {courseMaterials.lessons.length}
                                  </span>
                                  <div className="flex gap-1.5">
                                    {courseMaterials.lessons.map((_, i) => (
                                      <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-6 bg-indigo-600' : 'bg-stone-200'}`} />
                                    ))}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-stone-700 leading-relaxed font-medium min-h-[5rem]">
                                  {courseMaterials.lessons[activeSlide]}
                                </p>
                                
                                <div className="flex justify-between pt-4 border-t border-stone-100">
                                  <button 
                                    disabled={activeSlide === 0}
                                    onClick={() => setActiveSlide(prev => prev - 1)}
                                    className="px-5 py-3 bg-stone-50 hover:bg-stone-100 text-stone-600 disabled:opacity-30 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border border-stone-200"
                                  >
                                    Previous Slide
                                  </button>
                                  
                                  {activeSlide === courseMaterials.lessons.length - 1 ? (
                                    <button 
                                      onClick={() => setActiveCourseTab('quiz')}
                                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all flex items-center gap-1.5"
                                    >
                                      Begin Exam <i className="fas fa-arrow-right text-[8px]"></i>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => setActiveSlide(prev => prev + 1)}
                                      className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-md"
                                    >
                                      Next Slide
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><i className="fas fa-brain text-8xl"></i></div>
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                                  <i className="fas fa-lightbulb text-lg"></i>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-serif font-bold italic text-stone-200">Interactive Exam Warning</h4>
                                  <p className="text-[10px] text-stone-400 leading-relaxed">
                                    You must complete the 3-question interactive exam with a perfect score (100%) to complete this module and update your profile capability.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quiz Tab */}
                          {activeCourseTab === 'quiz' && (
                            <div className="space-y-8 animate-in fade-in">
                              {quizSubmitted ? (
                                <div className="bg-white p-10 rounded-[3rem] border border-stone-200 text-center space-y-6 shadow-sm animate-in zoom-in-95 duration-300">
                                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                                    <i className="fas fa-trophy text-2xl"></i>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-xl font-serif font-black italic text-stone-900">Module Certified!</h4>
                                    <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                                      Outstanding work! You have successfully answered all examination questions correctly. Your role certificate is officially unlocked.
                                    </p>
                                  </div>
                                  <div className="bg-stone-50 p-6 rounded-2xl max-w-sm mx-auto border border-stone-100 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Overall Score</span>
                                    <span className="text-lg font-serif font-black text-emerald-600">3 / 3 (100%)</span>
                                  </div>
                                  <div className="flex gap-4 justify-center">
                                    <button 
                                      onClick={() => {
                                        setActiveCourse(null);
                                        setCourseMaterials(null);
                                      }}
                                      className="px-8 py-4 bg-stone-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-850 transition-all shadow-md"
                                    >
                                      Claim Certificate & Exit
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {courseMaterials.quizQuestions.map((q, qIdx) => {
                                    const selectedOption = quizAnswers[qIdx];
                                    const showFeedback = selectedOption !== undefined;
                                    const isCorrect = selectedOption === q.correctIndex;

                                    return (
                                      <div key={qIdx} className="bg-white p-8 rounded-[2.5rem] border border-stone-150 shadow-sm space-y-5">
                                        <p className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Question {qIdx + 1} of {courseMaterials.quizQuestions.length}</p>
                                        <h4 className="text-sm font-black text-stone-900 leading-snug">{q.question}</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {q.options.map((opt, oIdx) => {
                                            const isThisSelected = selectedOption === oIdx;
                                            const isThisCorrect = oIdx === q.correctIndex;
                                            
                                            let btnStyle = 'border-stone-100 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50';
                                            if (showFeedback) {
                                              if (isThisCorrect) {
                                                btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                                              } else if (isThisSelected) {
                                                btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                                              } else {
                                                btnStyle = 'border-stone-100 bg-stone-50/30 opacity-60';
                                              }
                                            }

                                            return (
                                              <button 
                                                key={oIdx}
                                                disabled={showFeedback}
                                                onClick={() => {
                                                  setQuizAnswers(prev => {
                                                    const updated = { ...prev, [qIdx]: oIdx };
                                                    // Check if all questions are answered
                                                    const allAnswered = Object.keys(updated).length === courseMaterials.quizQuestions.length;
                                                    if (allAnswered) {
                                                      const allCorrect = Object.entries(updated).every(([idx, ans]) => ans === courseMaterials.quizQuestions[Number(idx)].correctIndex);
                                                      if (allCorrect) {
                                                        completeModuleForActiveStaff(activeCourse.id);
                                                        setQuizSubmitted(true);
                                                      }
                                                    }
                                                    return updated;
                                                  });
                                                }}
                                                className={`p-5 rounded-2xl border text-left text-xs font-bold leading-relaxed transition-all flex items-start gap-3 ${btnStyle}`}
                                              >
                                                <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center shrink-0 font-mono text-[9px] font-black uppercase bg-white">{String.fromCharCode(65 + oIdx)}</span>
                                                <span className="flex-1">{opt}</span>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {showFeedback && (
                                          <div className={`p-6 rounded-2xl border text-xs leading-relaxed animate-in slide-in-from-top-2 duration-300 ${isCorrect ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                                            <p className="font-black uppercase text-[9px] mb-1.5 flex items-center gap-1.5">
                                              {isCorrect ? (
                                                <><i className="fas fa-check-circle text-emerald-500"></i> Correct Answer</>
                                              ) : (
                                                <><i className="fas fa-times-circle text-rose-500"></i> Incorrect Choice</>
                                              )}
                                            </p>
                                            <p className="font-medium">{q.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Coach Tab */}
                          {activeCourseTab === 'coach' && (
                            <div className="flex flex-col h-[28rem] animate-in fade-in bg-white rounded-3xl border border-stone-150 overflow-hidden">
                              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-stone-50/10">
                                <div className="flex gap-4">
                                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] shadow-sm font-black"><i className="fas fa-user-tie"></i></div>
                                  <div className="bg-stone-50 p-6 rounded-2xl text-xs font-medium text-stone-700 leading-relaxed border border-stone-100 flex-1">
                                    Hi! I'm your dedicated Sommelier Course Coach. Ask me any conceptual, pairing, or technical question specifically about <strong>{activeCourse.topic}</strong>.
                                  </div>
                                </div>
                                {messages.filter(m => m.text.includes(activeCourse.topic) || m.role === 'user').map((m, i) => (
                                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                                    <div className="flex gap-4 max-w-[85%]">
                                      {m.role === 'vinetelligence' && (
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white shrink-0"><i className="fas fa-robot"></i></div>
                                      )}
                                      <div className={`p-6 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-white text-stone-800 border border-stone-100'}`}>
                                        {m.text}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {isThinking && (
                                  <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl border border-stone-100 flex gap-2">
                                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
                                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <form 
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!input.trim() || isThinking) return;
                                  const query = input;
                                  setInput('');
                                  setMessages(prev => [...prev, { role: 'user', text: query }]);
                                  setIsThinking(true);
                                  try {
                                    const history = messages.map(m => ({ role: m.role, text: m.text }));
                                    const response = await geminiService.getTrainingResponse(`Regarding the course "${activeCourse.topic}": ${query}`, history, userRole);
                                    setMessages(prev => [...prev, { role: 'vinetelligence', text: response }]);
                                  } catch {
                                    console.error("Course coach response failed");
                                  } finally {
                                    setIsThinking(false);
                                  }
                                }}
                                className="p-4 bg-stone-50 border-t border-stone-150 flex gap-3 items-center"
                              >
                                <input 
                                  value={input} 
                                  onChange={e => setInput(e.target.value)} 
                                  placeholder={`Ask about ${activeCourse.topic}...`} 
                                  className="flex-1 bg-white border border-stone-200 rounded-xl px-5 py-3 text-xs font-semibold focus:border-indigo-500 outline-none transition-all shadow-sm" 
                                />
                                <button type="submit" className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-800 transition-all"><i className="fas fa-paper-plane text-xs"></i></button>
                              </form>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-stone-50/20">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                           <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {m.role === 'vinetelligence' && (
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 border-2 border-white mt-1">
                                   <i className="fas fa-robot text-white text-[10px]"></i>
                                </div>
                              )}
                              <div className="space-y-2">
                                 <div className={`p-8 rounded-[2.5rem] shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white rounded-br-none shadow-stone-900/10' : 'bg-white text-stone-800 rounded-bl-none border border-stone-100'}`}>
                                   <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                                 </div>
                                 {m.role === 'vinetelligence' && i > 0 && (
                                   <div className="flex gap-2 ml-4">
                                      <button onClick={() => handleFeedback(i, 1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${m.feedback === 1 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-stone-300 hover:bg-emerald-50 hover:text-emerald-500 border border-stone-100'}`}><i className="fas fa-thumbs-up text-[10px]"></i></button>
                                      <button onClick={() => handleFeedback(i, -1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${m.feedback === -1 ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-stone-300 hover:bg-indigo-50/10 hover:text-indigo-500 border border-stone-100'}`}><i className="fas fa-thumbs-down text-[10px]"></i></button>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))}
                      {isThinking && (
                        <div className="flex justify-start">
                           <div className="bg-white p-6 rounded-3xl border border-stone-100 flex gap-2 shadow-sm">
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                           </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-8 bg-white border-t border-stone-100 flex gap-4 items-center">
                       <input 
                         value={input} 
                         onChange={e => setInput(e.target.value)} 
                         placeholder="Inquire technical specifications or operational logic..." 
                         className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-[2rem] px-8 py-5 text-sm font-bold focus:border-indigo-500 outline-none transition-all shadow-inner" 
                       />
                       <button 
                         type="submit" 
                         disabled={isThinking}
                         className="w-16 h-16 bg-stone-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-30"
                       >
                         <i className="fas fa-paper-plane"></i>
                       </button>
                    </form>
                  </div>
                )}
              </div>
           </div>
        )}

        {activeTab === 'signature' && (
           <div className="h-full flex flex-col space-y-10 py-4 max-w-6xl mx-auto overflow-y-auto custom-scrollbar pb-20">
              <div className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><i className="fas fa-flask-vial text-9xl"></i></div>
                 <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-4xl font-serif font-black italic text-stone-900">Signature Concept Lab</h3>
                    <p className="text-stone-500 italic max-w-xl mx-auto font-medium">Synthesize professional beverage recipes and AI visual profiles based on conceptual themes.</p>
                 </div>
                 <div className="flex gap-4 relative z-10">
                    <input 
                      type="text" 
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                      placeholder="e.g. Kyoto Cherry Blossom, Neo-Noir Manhattan, Alpine Frost..."
                      className="flex-1 px-10 py-6 bg-stone-50 border border-stone-200 rounded-[2rem] font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner"
                    />
                    <button 
                      onClick={handleGenerateSignature}
                      disabled={isGeneratingSignature || !theme.trim()}
                      className="px-12 bg-stone-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                       {isGeneratingSignature ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles text-indigo-500"></i>}
                       Synthesize
                    </button>
                 </div>
              </div>

              {signatureResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-10 duration-700">
                   <div className="bg-stone-900 rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative group aspect-square">
                      <img src={signatureResult.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" alt="AI special" />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                       <div className="absolute bottom-12 left-12 right-12">
                         <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-stone-950 px-4 py-1.5 rounded-full mb-4 inline-block shadow-xl">AI PROTOTYPE</span>
                         <h4 className="text-5xl font-serif font-black italic text-white tracking-tighter">{signatureResult.recipe?.name}</h4>
                      </div>
                   </div>
                   <div className="bg-white p-12 rounded-[4rem] border border-stone-200 shadow-xl space-y-10 overflow-y-auto custom-scrollbar">
                      <div>
                         <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-4 italic">Concept Narrative</h5>
                         <p className="text-lg font-serif italic text-stone-700 leading-relaxed">"{signatureResult.recipe?.story}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Composition</h5>
                            <ul className="space-y-3">
                               {signatureResult.recipe?.ingredients.map((ing: string, i: number) => (
                                 <li key={i} className="text-xs font-bold text-stone-800 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                                    {ing}
                                 </li>
                               ))}
                            </ul>
                         </div>
                         <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Standards</h5>
                            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Glassware</p>
                               <p className="text-xs font-bold text-stone-800">{signatureResult.recipe?.glassware}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        )}

        {activeTab === 'pairing' && (
          <div className="h-full flex flex-col space-y-8 p-8 overflow-y-auto custom-scrollbar pb-20">
             <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Pairing Intelligence</h2>
                <p className="text-stone-500 text-sm font-medium italic">AI-driven flavor synthesis based on current inventory and menu items.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-sparkles"></i>
                  Dynamic Synthesis
                </div>
              </div>
            </header>

            {isLoadingPairings ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40 py-20">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-stone-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Analyzing Flavor Profiles...</p>
              </div>
            ) : pairingSuggestions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-inner">
                <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center text-stone-300 border border-stone-100">
                  <i className="fas fa-wine-glass-alt text-4xl"></i>
                </div>
                <div className="space-y-2">
                  <p className="text-stone-900 font-bold text-xl">No Pairings Synthesized</p>
                  <p className="text-stone-500 italic max-w-xs mx-auto text-sm leading-relaxed">Ensure you have both food items (Lunch, Dinner, Snacks) and beverages in your inventory to generate intelligence.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pairingSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-900/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <i className="fas fa-utensils text-7xl"></i>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-stone-900 text-white px-4 py-1.5 rounded-full shadow-lg">
                          {suggestion.foodCategory}
                        </span>
                        <div className="flex items-center gap-1 text-indigo-500">
                          <i className="fas fa-star text-[8px]"></i>
                          <i className="fas fa-star text-[8px]"></i>
                          <i className="fas fa-star text-[8px]"></i>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-stone-900 leading-tight">{suggestion.foodItem}</h4>
                        <div className="flex items-center gap-3">
                          <div className="h-[1px] w-8 bg-stone-200"></div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Paired with</p>
                          <div className="h-[1px] w-8 bg-stone-200"></div>
                        </div>
                        <h5 className="text-lg font-serif font-bold italic text-stone-800">{suggestion.beveragePairing}</h5>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest italic">Category: {suggestion.beverageCategory}</p>
                      </div>

                      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100/50">
                        <p className="text-xs text-stone-600 leading-relaxed italic font-medium">
                          "{suggestion.rationale}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-50 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                        <i className="fas fa-lightbulb text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Technical Insight</p>
                        <p className="text-[10px] font-bold text-stone-800 leading-tight">{suggestion.pairingInsight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mixology' && <CocktailSearch inventory={inventory} onAddToMenu={onAddToMenu} onRemoveFromMenu={onRemoveFromMenu} userRole={userRole} />}

        {activeTab === 'market' && <CompetitorIntelligence inventory={inventory} />}

        {activeTab === 'cognitive-lab' && (
          <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-20 px-4">
             {/* Header block */}
             <div className="bg-gradient-to-br from-stone-900 to-indigo-950 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <i className="fas fa-brain text-8xl text-indigo-400"></i>
               </div>
               <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-2 inline-block italic">Neuromarketing Lab</span>
               <h3 className="text-3xl font-serif font-black italic mb-3">Cognitive Menu Engineering Labs</h3>
               <p className="text-stone-300 text-xs font-medium max-w-2xl leading-relaxed">
                 Demonstrate the subconscious psychological triggers embedded in your guest-facing digital menus. Move readers from logical price-auditing to experiential value-appreciation.
               </p>
               <div className="mt-6 flex flex-wrap gap-4">
                 <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#a5b4fc] flex items-center gap-2">
                   <i className="fas fa-heartbeat text-red-400"></i> Bypasses Pain Centers
                 </span>
                 <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#a5b4fc] flex items-center gap-2">
                   <i className="fas fa-chart-line text-emerald-400"></i> Up to +27% Ticket Uplift
                 </span>
                 <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#a5b4fc] flex items-center gap-2">
                   <i className="fas fa-eye text-sky-400"></i> Directs Visual Gaze
                 </span>
               </div>
             </div>

             {/* Main Interactive Stage */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               
               {/* Left Controller Panel (Inputs & Switches) */}
               <div className="lg:col-span-4 space-y-6 flex flex-col h-full min-h-[400px]">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6 flex-1">
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Interactive Lab Form</h4>
                     <p className="text-[11px] text-stone-400 font-medium leading-relaxed">Customize any menu item to generate optimized neuro-psychological copy.</p>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <label className="block text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Item Identity</label>
                       <input 
                         type="text" 
                         value={labItemName}
                         onChange={(e) => setLabItemName(e.target.value)}
                         placeholder="e.g. Sizzling Ribeye Ribs"
                         className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                       />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Category</label>
                         <select 
                           value={labItemCategory}
                           onChange={(e) => setLabItemCategory(e.target.value)}
                           className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none"
                         >
                           <option value="Snack">Snack</option>
                           <option value="Lunch">Lunch</option>
                           <option value="Dinner">Dinner</option>
                           <option value="Wine">Wine</option>
                           <option value="Cocktail">Cocktail</option>
                           <option value="Spirit">Spirit</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Price ($)</label>
                         <input 
                           type="number" 
                           value={labItemPrice}
                           onChange={(e) => setLabItemPrice(Number(e.target.value))}
                           className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold text-stone-800 focus:outline-none"
                         />
                       </div>
                     </div>

                     <button
                       onClick={handleGenerateLabCopy}
                       disabled={isGeneratingLabNarrative || !labItemName.trim()}
                       className="w-full py-4 bg-stone-900 text-white hover:bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       {isGeneratingLabNarrative ? (
                         <>
                           <i className="fas fa-spinner fa-spin"></i>
                           Calibrating Cognitive Load...
                         </>
                       ) : (
                         <>
                           <i className="fas fa-magic text-indigo-400"></i>
                           Generate Neuro Copywriter Copy
                         </>
                       )}
                     </button>
                   </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6 mt-6">
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Micro-Trigger Toggles</h4>
                     <p className="text-[11px] text-stone-400 font-medium leading-relaxed">Turn individual neuromarketing modules on or off to inspect their real-time visual impact.</p>
                   </div>

                   <div className="space-y-4">
                     {/* Toggle 1 */}
                     <div className="flex justify-between items-center bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                       <div>
                         <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                           De-bias Currency <i className="fas fa-info-circle text-[9px] text-indigo-500 cursor-help" title="Hiding dollar signs decreases insular brain activation."></i>
                         </p>
                         <p className="text-[9px] text-stone-400 font-medium leading-tight mt-0.5">Omit the '$' triggers</p>
                       </div>
                       <button 
                         onClick={() => setLabDeBiasCurrency(!labDeBiasCurrency)}
                         className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${labDeBiasCurrency ? 'bg-indigo-600' : 'bg-stone-300'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${labDeBiasCurrency ? 'translate-x-4' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     {/* Toggle 2 */}
                     <div className="flex justify-between items-center bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                       <div>
                         <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                           Nest Price Inline <i className="fas fa-info-circle text-[9px] text-indigo-500 cursor-help" title="Inline prices stop guests scanning prices down a sheet."></i>
                         </p>
                         <p className="text-[9px] text-stone-400 font-medium leading-tight mt-0.5">Eradicate aligning dotted columns</p>
                       </div>
                       <button 
                         onClick={() => setLabNestedPrice(!labNestedPrice)}
                         className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${labNestedPrice ? 'bg-indigo-600' : 'bg-stone-300'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${labNestedPrice ? 'translate-x-4' : 'translate-x-0'}`} />
                       </button>
                     </div>

                     {/* Toggle 3 */}
                     <div className="flex justify-between items-center bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                       <div>
                         <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                           Sensory Vocabulary <i className="fas fa-info-circle text-[9px] text-indigo-500 cursor-help" title="Simulates high-end tactile/origin vocabulary mapping."></i>
                         </p>
                         <p className="text-[9px] text-stone-400 font-medium leading-tight mt-0.5">Inject gustatory warmth indicators</p>
                       </div>
                       <button 
                         onClick={() => setLabSensoryDescriptions(!labSensoryDescriptions)}
                         className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${labSensoryDescriptions ? 'bg-indigo-600' : 'bg-stone-300'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${labSensoryDescriptions ? 'translate-x-4' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Right Symmetrical Stage (Comparison Slots) */}
               <div className="lg:col-span-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Conventional Standard Menu Card */}
                   <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-stone-200 p-8 flex flex-col justify-between shadow-sm relative group">
                     <div className="absolute top-4 right-4 bg-stone-100 text-stone-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-stone-200/50">
                       Control Setup (Conventional)
                     </div>
                     
                     <div className="space-y-6 pt-6">
                       <div className="flex items-baseline justify-between font-bold border-b border-stone-100 pb-2">
                         <h5 className="text-md font-serif text-stone-800 leading-tight">{labItemName}</h5>
                         <span className="text-stone-300 hover:text-stone-400 select-none tracking-tighter overflow-hidden max-w-[100px] whitespace-nowrap block">..................................</span>
                         <span className="text-sm font-mono text-stone-900">${Number(labItemPrice).toFixed(2)}</span>
                       </div>
                       
                       <p className="text-xs text-stone-400 italic font-medium leading-relaxed">
                         Standard quality cooked {labItemCategory.toLowerCase()} item utilizing generic description and price aligning columns.
                       </p>
                     </div>

                     <div className="mt-10 bg-rose-50 border border-rose-100 text-[10px] text-rose-700 font-black uppercase p-4 rounded-2xl flex items-center gap-2">
                       <i className="fas fa-exclamation-triangle"></i>
                       Insula brain activity heightened • Transaction friction active
                     </div>
                   </div>

                   {/* Neuromarketing Optimized Card */}
                   <div className="bg-gradient-to-br from-indigo-950 to-stone-950 text-white rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group border-2 border-indigo-500/30">
                     <div className="absolute top-4 right-4 bg-indigo-500 text-stone-950 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg font-bold flex items-center gap-1.5 animate-pulse">
                       <i className="fas fa-bolt"></i> Calibrated (Optimized)
                     </div>

                     {/* Sparkle background elements */}
                     <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl"></div>

                     <div className="space-y-6 pt-6 relative z-10">
                       <div className="flex flex-wrap items-baseline gap-2.5">
                         <h5 className="text-lg font-serif font-black italic text-white leading-tight">
                           {labItemName}
                         </h5>
                         
                         {/* Nested Dynamic Inline Price with optional Currency debiasing */}
                         {labNestedPrice ? (
                           <span 
                             onClick={() => setHighlightedPrinciple('scanners')}
                             className="text-xs font-serif italic font-black text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:scale-110 cursor-pointer transition-transform"
                           >
                             {labDeBiasCurrency ? '' : '$'}{optimizedPriceTextResult}
                           </span>
                         ) : null}
                       </div>

                       {/* Traditional pricing position if nested inline is disabled */}
                       {!labNestedPrice && (
                         <div className="flex justify-between items-center text-xs font-mono font-medium text-amber-400">
                            <span>Traditional Right Side:</span>
                            <span className="font-bold">{labDeBiasCurrency ? '' : '$'}{labItemPrice}</span>
                         </div>
                       )}
                       
                       {/* Evocative Sensorial copywriting toggle option */}
                       <p 
                         onClick={() => setHighlightedPrinciple('sensory')}
                         className="text-xs text-stone-300 italic font-medium leading-relaxed hover:text-white cursor-pointer transition-colors border-l-2 border-amber-500/20 pl-3 py-1"
                       >
                         {labSensoryDescriptions ? customNarrativeResult : `Standard ${labItemCategory.toLowerCase()} served at a value optimized pricing metric.`}
                       </p>
                     </div>

                     <div 
                       onClick={() => setHighlightedPrinciple('insula')}
                       className="mt-10 bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-bold uppercase p-4 rounded-2xl flex items-center gap-2 justify-between cursor-pointer hover:bg-indigo-500/20 transition-all"
                     >
                       <span className="flex items-center gap-2">
                         <i className="fas fa-lock-open text-amber-400"></i>
                         Transactional pain bypassed completely
                       </span>
                       <i className="fas fa-chevron-right text-[8px] text-stone-500"></i>
                     </div>
                   </div>

                 </div>

                 {/* Operational Ledger Insights / Theory Card Deck */}
                 <div className="bg-stone-900 rounded-[2.5rem] border border-white/5 p-8 text-stone-100 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-400"><i className="fas fa-chart-pie text-9xl"></i></div>
                   
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                       <i className="fas fa-microscope text-sm"></i>
                     </div>
                     <div>
                       <h4 className="text-xs font-black uppercase tracking-widest text-[#a5b4fc]">Scientific Explanation Node</h4>
                       <p className="text-[10px] text-stone-400 font-medium">Click on optimized card sections to explore active neuroscience patterns.</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 whitespace-nowrap overflow-x-auto">
                       <button 
                         onClick={() => setHighlightedPrinciple('sensory')}
                         className={`px-4 py-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all ${highlightedPrinciple === 'sensory' ? 'bg-indigo-600 text-stone-950 border-indigo-400 font-black shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'}`}
                       >
                         <i className="fas fa-apple-alt mr-2"></i> Sensory Priming
                       </button>
                       <button 
                         onClick={() => setHighlightedPrinciple('insula')}
                         className={`px-4 py-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all ${highlightedPrinciple === 'insula' ? 'bg-indigo-600 text-stone-950 border-indigo-400 font-black shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'}`}
                       >
                         <i className="fas fa-hand-holding-usd mr-2"></i> Insula Protection
                       </button>
                       <button 
                         onClick={() => setHighlightedPrinciple('scanners')}
                         className={`px-4 py-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all ${highlightedPrinciple === 'scanners' ? 'bg-indigo-600 text-stone-950 border-indigo-400 font-black shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'}`}
                       >
                         <i className="fas fa-drafting-compass mr-2"></i> Scanner Block
                       </button>
                       <button 
                         onClick={() => setHighlightedPrinciple('pooling')}
                         className={`px-4 py-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-wider transition-all ${highlightedPrinciple === 'pooling' ? 'bg-indigo-600 text-stone-950 border-indigo-400 font-black shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/5 text-stone-400 hover:text-white'}`}
                       >
                         <i className="fas fa-weight-hanging mr-2"></i> Anchor Pricing
                       </button>
                   </div>

                   <div className="mt-8 bg-white/5 border border-white/5 rounded-2xl p-6 leading-relaxed">
                     {highlightedPrinciple === 'sensory' && (
                       <div className="space-y-4">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            Sensorial Priming: Prefrontal Cortical Stimulations
                          </p>
                          <p className="text-xs text-stone-300 italic leading-relaxed">
                            Standard descriptions represent "items as nouns". High-quality culinary psychology treats "items as journeys". Evocative terms describing sensory action (e.g. "wood-harvested", "hand-toasted", "velvety") stimulate the prefrontal cortex by priming memory reserves of taste and familiarity. Studies demonstrate sensory copywriting increases volume sales by 27% and leaves guests reporting higher post-consumption taste satisfaction scores.
                          </p>
                          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-stone-400 break-words">
                            <strong>Active Calibration:</strong> "{customNarrativeResult}"
                          </div>
                       </div>
                     )}

                     {highlightedPrinciple === 'insula' && (
                       <div className="space-y-4">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            Insula Neutralizer: Pain of Paying Suppression
                          </p>
                          <p className="text-xs text-stone-300 italic leading-relaxed">
                            FMRI imagery studies show that symbols in visual fields pointing of a commercial currency format (such as the standard '$' trigger) immediately stimulate blood flow into the insular cortex of the human brain—the area associated with negative physical pain or distress. Removing the currency symbol mutes this distress, allowing guests to evaluate flavor matrices without transactional discomfort.
                          </p>
                          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-stone-400 break-words">
                            <strong>Active Mechanism Hook:</strong> "{neurologicalHookResult}"
                          </div>
                       </div>
                     )}

                     {highlightedPrinciple === 'scanners' && (
                       <div className="space-y-4">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            Saccadic Scanner Bypass: Inline Price Nesting
                          </p>
                          <p className="text-xs text-stone-300 italic leading-relaxed">
                            Traditional column sheets format menus using dot leader lines (`..........`) that flow right-aligned to a clean price. This organizes guest optical sweeps (saccades) into hierarchical scanning pathways. Guests read down the prices first, choosing the cheapest integers before reading descriptions. Nesting raw integers inline directly behind sensory names disrupts vertical sweep, forcing horizontal focus through descriptions.
                          </p>
                          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-stone-400 break-words">
                            <strong>Visual Presentation Matrix:</strong> "{labItemName} • {optimizedPriceTextResult}"
                          </div>
                       </div>
                     )}

                     {highlightedPrinciple === 'pooling' && (
                       <div className="space-y-4">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            Cognitive Premium Price Anchoring
                          </p>
                          <p className="text-xs text-stone-300 italic leading-relaxed">
                            Our cognitive system constructs judgment relative to local contextual anchors. By ensuring category lists display the most expensive, luxury items first (e.g. high-end signature reserves), we establish an initial high baseline scale in the guest's mental ledger. Subsequent moderately-priced items feel incredibly value-positive in relative contrast, drastically lowering pricing sensitivity.
                          </p>
                          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/5 text-[10px] font-mono text-stone-400 break-words">
                            <strong>Franchise Calibration:</strong> Active across all unit digital menu files in Guest Modes.
                          </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

             </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-20">
             <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <div>
                   <h3 className="text-2xl font-serif font-black italic text-stone-900">Team Roster Node</h3>
                   <p className="text-stone-500 text-sm font-medium italic mt-1">Manage node permissions and technical role authorizations.</p>
                </div>
                <button className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3">
                   <i className="fas fa-user-plus text-indigo-500"></i> Authorize Node
                </button>
             </div>

             <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-stone-50 border-b border-stone-100">
                      <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                         <th className="px-10 py-6">Node identity</th>
                         <th className="px-10 py-6">Tier (Role)</th>
                         <th className="px-10 py-6">Performance Sync</th>
                         <th className="px-10 py-6 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                      {staffList.map(staff => (
                        <tr key={staff.id} className="hover:bg-stone-50 transition-all group">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-stone-900 text-indigo-500 flex items-center justify-center font-black text-xs shadow-sm">{staff.name.charAt(0)}</div>
                                 <div>
                                    <p className="text-sm font-bold text-stone-900">{staff.name}</p>
                                    <p className="text-[10px] text-stone-400 font-mono">NODE_UID: {staff.id.slice(0,6)}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                                staff.role === 'Sommelier' ? 'bg-indigo-950/10 text-indigo-900 border-indigo-100' :
                                staff.role === 'Mixologist' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-stone-100 text-stone-600 border-stone-200'
                              }`}>{staff.role}</span>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-stone-800">{staff.performanceScore}%</span>
                                 <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${staff.performanceScore}%` }}></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">SYNCED</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          </div>
        )}
      </div>

      {showTransparencyNotice && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-6 border border-stone-200 shadow-2xl">
              <h3 className="text-2xl font-serif font-black italic text-stone-900">AI Governance Protocol</h3>
              <div className="space-y-4 text-sm text-stone-600 leading-relaxed italic font-medium">
                 <p>"Vinetelligence utilizes generative probabilistic mapping (Gemini 3) to synthesize beverage intelligence."</p>
                 <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3">
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Ethical Guardrails:</p>
                    <ul className="text-[11px] space-y-2">
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> No automated fiscal commitment without human review.</li>
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> PII obfuscation active for all model requests.</li>
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> Transparency scores provided for all logic nodes.</li>
                    </ul>
                 </div>
              </div>
              <button onClick={() => setShowTransparencyNotice(false)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Acknowledge</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceAcademy;
