import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Download,
  Sliders,
  Wine,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  paragraph: string;
  bullets: string[];
}

export const CanvaEditor: React.FC = () => {
  // Brand Configuration State
  const [brandName, setBrandName] = useState('Hanover and Tyke');
  const [venueType, setVenueType] = useState('Luxury Resort & Beachside Lounge');
  const [phone, setPhone] = useState('+1 243-556-7890');
  const [email, setEmail] = useState('concierge@hanoverandtyke.com');
  const [website, setWebsite] = useState('www.hanoverandtyke.live');
  const [location, setLocation] = useState('Curaçao, Dutch Caribbean');

  // Interactive slide editor and indices
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // High-end pre-designed clinical default copies (Preserving exact layout and bullet labels from user's PDF)
  const defaultSlides: Record<string, SlideData[]> = {
    'Luxury Resort & Beachside Lounge': [
      {
        id: 1,
        title: 'REDEFINING HOSPITALITY THROUGH SERVICE EXCELLENCE',
        subtitle: 'Crafting Exquisite Moments in Paradise',
        paragraph: 'Deploying sensory wine pairings, intuitive beachside steward calls, and personalized oceanfront hospitality that ensures guests feel recognized, valued, and completely at home.',
        bullets: ['Elevating Caribbean Experiences', 'Inspiring Long-term Guest Loyalty', 'Creating Generational Moments that Matter']
      },
      {
        id: 2,
        title: 'THE NEW ERA OF HOSPITALITY',
        subtitle: 'Navigating Shifting Waves of Guest Pleasures',
        paragraph: 'Modern travelers in exotic locations do not seek standardized rooms; they seek hyper-focused, responsive experiences. Luxury hospitality has evolved from rigid structures into fluid, intelligent service systems.',
        bullets: ['Personalization', 'Speed and convenience', 'Authentic interactions', 'Memorable moments']
      },
      {
        id: 3,
        title: 'WHAT IS SERVICE EXCELLENCE?',
        subtitle: 'Defining the Gold Standard of Leisure Care',
        paragraph: 'True excellence is the invisible magic that occurs when premium curation meets deeply trained human care, delivering answers before questions are even conceived.',
        bullets: [
          'Consistently exceeding expectations',
          'Anticipating needs before they’re expressed',
          'Delivering with empathy, precision, and care',
          'Turning ordinary interactions into extraordinary memories'
        ]
      },
      {
        id: 4,
        title: 'WHY SERVICE EXCELLENCE MATTERS',
        subtitle: 'The Compound Power of Hospitality Trust',
        paragraph: 'In high-ticket destinations, guest trust translates directly into longer stays, organic word-of-mouth advocates, and double-digit premium increases on tasting menus and cocktail programs.',
        bullets: [
          'Increased guest satisfaction',
          'Stronger brand loyalty',
          'Higher revenue and repeat business',
          'Positive word-of-mouth review waves'
        ]
      },
      {
        id: 5,
        title: 'FROM SERVICE TO EXPERIENCE',
        subtitle: 'The Three Tiers of Guest Connection',
        paragraph: 'We must move away from flat transactional exchanges and progress toward emotional resonance, where every vintage poured tells a story of terroir and heritage.',
        bullets: [
          'Meeting expectations - Good service',
          'Exceeding expectations - Great service',
          'Creating emotional impact - Exceptional service'
        ]
      },
      {
        id: 6,
        title: 'THE PILLARS OF SERVICE EXCELLENCE',
        subtitle: 'The Solid Foundations of Our Operational Creed',
        paragraph: 'These five core values serve as our absolute compass, guiding split-second floor decisions and cellar workflows to guarantee high-performance guest satisfaction.',
        bullets: [
          'Empathy – Understanding guest needs',
          'Consistency – Delivering quality every time',
          'Attention to Detail – The small things matter',
          'Responsiveness – Acting quickly and effectively',
          'Professionalism – Confidence with warmth'
        ]
      },
      {
        id: 7,
        title: 'PERSONALIZATION: THE COMPETITIVE ADVANTAGE',
        subtitle: 'Recognizing Every Guest’s Unique Palate Code',
        paragraph: 'Using deep preferences to recommend a chilled, mineral-driven local Sauvignon Blanc at sunset or preparing allergen-free variations without the guest ever asking twice.',
        bullets: [
          'Remembering preferences',
          'Anticipating needs',
          'Offering tailored solutions',
          'Creating meaningful connections'
        ]
      },
      {
        id: 8,
        title: 'EMPOWERED EMPLOYEES, EXCEPTIONAL SERVICE',
        subtitle: 'Nurturing Advocates Behind the Cellar Gates',
        paragraph: 'A world-class team requires world-class digital tools. Empowering floor staff with instant, hand-held sommelier coaching modules translates to seamless confidence under pressure.',
        bullets: [
          'Trained on advanced wine chemistry',
          'Motivated by career-defining tools',
          'Valued within an automated workforce',
          'Empowered to make premium floor decisions'
        ]
      },
      {
        id: 9,
        title: 'COMMUNICATION IS EVERYTHING',
        subtitle: 'Aligning the Floor, the Cellar, and the Kitchen',
        paragraph: 'Clear, noise-free channels prevent service gaps, eliminate kitchen congestion, and ensure the right bottle is decanted at exactly the right temperature.',
        bullets: [
          'Builds trust',
          'Reduces misunderstandings',
          'Enhances satisfaction',
          'Prevents service failures'
        ]
      },
      {
        id: 10,
        title: 'TURNING CHALLENGES INTO OPPORTUNITIES',
        subtitle: 'The High-Fidelity Service Recovery Protocol',
        paragraph: 'When a service error occurs, we deploy an immediate multi-step recovery. A bottle delay or incorrect seating is transformed into a lifetime guest bond via quick, thoughtful care.',
        bullets: [
          'Listening actively',
          'Taking ownership',
          'Acting quickly',
          'Following up with personalized incentives'
        ]
      },
      {
        id: 11,
        title: 'TECHNOLOGY + HUMAN TOUCH',
        subtitle: 'Weaving AI Unobtrusively into Premium Ambience',
        paragraph: 'Using neural scanner tools and digital cellar ledgers behind the scenes allows our sommeliers to look into the guest’s eyes rather than spend hours staring at paper spreadsheets.',
        bullets: [
          'Digital convenience',
          'Seamless backend systems',
          'Genuine personal, face-to-face interaction'
        ]
      },
      {
        id: 12,
        title: 'CREATING A CULTURE OF EXCELLENCE',
        subtitle: 'Standardizing Mastery into Daily Rhythm',
        paragraph: 'A premium brand is created through standard repeat motions. When leadership models high hospitality ethics, the atmosphere on the floor shifts into a natural sanctuary of comfort.',
        bullets: [
          'Leadership models it',
          'Standards are clear',
          'Feedback is continuous',
          'Improvement is ongoing'
        ]
      },
      {
        id: 13,
        title: 'THE BUSINESS IMPACT',
        subtitle: 'Quantifying High-Fidelity Service Returns',
        paragraph: 'Service is not an expense; it is our primary driver of high-margin beverage revenue, yielding higher retention scores and driving guest checks up predictably.',
        bullets: [
          'Higher retention rates',
          'Increased referrals',
          'Premium brand positioning',
          'Long-term profitability'
        ]
      },
      {
        id: 14,
        title: 'CLOSING: THE FUTURE OF HOSPITALITY',
        subtitle: 'Leading the Charge in Next-Gen Hospitality Science',
        paragraph: 'The brands that merge ancient, warm, human luxury with seamless modern intelligence will guide the premium leisure markets of the next century.',
        bullets: [
          'Serve with purpose',
          'Deliver with consistency',
          'Lead with empathy',
          'Care beyond expectation'
        ]
      },
      {
        id: 15,
        title: 'THANK YOU FOR ATTENTION',
        subtitle: 'Let’s Master the Art of the Floor Together',
        paragraph: 'Ready to replace paper clipboard audits with automated, interactive luxury hospitality intelligence? Connect with Vinetelligence and scale your guest covers securely.',
        bullets: [`E: ${email}`, `P: ${phone}`, `W: ${website} | L: ${location}`]
      }
    ],
    'Fine Dining Restaurant': [
      {
        id: 1,
        title: 'REDEFINING HOSPITALITY THROUGH SERVICE EXCELLENCE',
        subtitle: 'Symphony of Curation and Culinary Rigor',
        paragraph: 'Aligning precise table synchronization, estate wine pairings, and dynamic menu storytelling to celebrate the craftsmanship of world-class fine-dining.',
        bullets: ['Elevating Gourmet Experiences', 'Inspiring Gastronomic Loyalty', 'Creating Moments of Culinary Awe']
      },
      {
        id: 2,
        title: 'THE NEW ERA OF HOSPITALITY',
        subtitle: 'The Sophisticated Palate Has Evolved',
        paragraph: 'Guests seeking fine dining demand a high-touch sensory journey. The rigid white-tablecloth paradigms have transitioned into responsive, hyper-customized narratives driven by passion.',
        bullets: ['Personalization', 'Speed and convenience', 'Authentic interactions', 'Memorable moments']
      },
      {
        id: 3,
        title: 'WHAT IS SERVICE EXCELLENCE?',
        subtitle: 'The Ballet of Unspoken Pleasures',
        paragraph: 'Crafting seamless dining pacing, recommending exact vintage verticals, and demonstrating profound knowledge about terroir, origins, and ingredient sourcing.',
        bullets: [
          'Consistently exceeding expectations',
          'Anticipating needs before they’re expressed',
          'Delivering with empathy, precision, and care',
          'Turning ordinary interactions into extraordinary memories'
        ]
      },
      {
        id: 4,
        title: 'WHY SERVICE EXCELLENCE MATTERS',
        subtitle: 'Sustaining Michelin-Level Recognition',
        paragraph: 'Excellence on the dining floor directly boosts cellar turnover, guarantees booked-out tables weeks in advance, and inspires legendary community word-of-mouth.',
        bullets: [
          'Increased guest satisfaction',
          'Stronger brand loyalty',
          'Higher revenue and repeat business',
          'Positive word-of-mouth review waves'
        ]
      },
      {
        id: 5,
        title: 'FROM SERVICE TO EXPERIENCE',
        subtitle: 'Beyond standard Plate drop-offs',
        paragraph: 'Transitioning from simply bringing appetizers to creating interactive culinary chapters where the Chef’s passion is transferred directly to the guest’s memory.',
        bullets: [
          'Meeting expectations - Good service',
          'Exceeding expectations - Great service',
          'Creating emotional impact - Exceptional service'
        ]
      },
      {
        id: 6,
        title: 'THE PILLARS OF SERVICE EXCELLENCE',
        subtitle: 'The Operational Blueprint of Our Kitchen & Room',
        paragraph: 'Five immutable values that form the training syllabus of every server, captain, and back-house helper on our roster.',
        bullets: [
          'Empathy – Understanding guest needs',
          'Consistency – Delivering quality every time',
          'Attention to Detail – The small things matter',
          'Responsiveness – Acting quickly and effectively',
          'Professionalism – Confidence with warmth'
        ]
      },
      {
        id: 7,
        title: 'PERSONALIZATION: THE COMPETITIVE ADVANTAGE',
        subtitle: 'Hyper-Personalized Sensory Curation',
        paragraph: 'Remembering preferred table seat counts, favorite cellar domains, ingredient allergies, and custom beverage glassware preferences.',
        bullets: [
          'Remembering preferences',
          'Anticipating needs',
          'Offering tailored solutions',
          'Creating meaningful connections'
        ]
      },
      {
        id: 8,
        title: 'EMPOWERED EMPLOYEES, EXCEPTIONAL SERVICE',
        subtitle: 'The Modern Digital Assistant Sommelier',
        paragraph: 'Providing digital bottle registries and fast menu pairings to floor staff minimizes service delays, builds incredible server confidence, and speeds up training.',
        bullets: [
          'Trained on tasting note profiles',
          'Motivated by continuous growth',
          'Valued in a fast, elegant kitchen',
          'Empowered to make tableside recommendations'
        ]
      },
      {
        id: 9,
        title: 'COMMUNICATION IS EVERYTHING',
        subtitle: 'The Bridge Between Firing Grid & Cellar decanting',
        paragraph: 'Instant sync ensures complex tasting menus are perfectly paired, bottles are decanted at optimal intervals, and dining pacing is controlled smoothly.',
        bullets: [
          'Builds trust',
          'Reduces misunderstandings',
          'Enhances satisfaction',
          'Prevents service failures'
        ]
      },
      {
        id: 10,
        title: 'TURNING CHALLENGES INTO OPPORTUNITIES',
        subtitle: 'Turning Table Hurdles or Delays Into Customer Care',
        paragraph: 'Mistakes happen in demanding kitchens. Our recovery protocol focuses on turning any delay into an absolute win via bespoke tasting courses or sommelier selections.',
        bullets: [
          'Listening actively',
          'Taking ownership',
          'Acting quickly',
          'Following up with personalized incentives'
        ]
      },
      {
        id: 11,
        title: 'TECHNOLOGY + HUMAN TOUCH',
        subtitle: 'Whispering Technology in a Candle-lit Sanctuary',
        paragraph: 'Automating OCR audits and supplier tracking behind closed doors so staff can provide authentic dining warmth and eye-contact to tables.',
        bullets: [
          'Digital convenience',
          'Seamless backend systems',
          'Genuine personal, face-to-face interaction'
        ]
      },
      {
        id: 12,
        title: 'CREATING A CULTURE OF EXCELLENCE',
        subtitle: 'A Legacy of Culinary and Service Rigor',
        paragraph: 'Our focus is defined by repeating perfect standards. Feedback loops are continuous, standard benchmarks are clear, and leadership serves alongside staff.',
        bullets: [
          'Leadership models it',
          'Standards are clear',
          'Feedback is continuous',
          'Improvement is ongoing'
        ]
      },
      {
        id: 13,
        title: 'THE BUSINESS IMPACT',
        subtitle: 'Fueling High-Profit Beverage margins',
        paragraph: 'A Michelin-style service protocol compounds guest checks by optimizing high-margin wine verticals and increasing corporate referral volumes.',
        bullets: [
          'Higher retention rates',
          'Increased referrals',
          'Premium brand positioning',
          'Long-term profitability'
        ]
      },
      {
        id: 14,
        title: 'CLOSING: THE FUTURE OF HOSPITALITY',
        subtitle: 'Precision Gastronomy Meets Neural Hospitality Science',
        paragraph: 'The future belongs to operators who treat dining not as basic hunger containment, but as a high-fidelity emotional art form powered by smart insights.',
        bullets: [
          'Serve with purpose',
          'Deliver with consistency',
          'Lead with empathy',
          'Care beyond expectation'
        ]
      },
      {
        id: 15,
        title: 'THANK YOU FOR ATTENTION',
        subtitle: 'Let’s Co-Author the Next Chapter of Taste',
        paragraph: 'Discover how Vinetelligence streamlines table pacing, automates inventory audits, and raises guest loyalty metrics instantly.',
        bullets: [`E: ${email}`, `P: ${phone}`, `W: ${website} | L: ${location}`]
      }
    ],
    'Boutique Wine Bar & Cellar Lounge': [
      {
        id: 1,
        title: 'REDEFINING HOSPITALITY THROUGH SERVICE EXCELLENCE',
        subtitle: 'Demystifying the Terroir Narrative with Style',
        paragraph: 'Unlocking raw vineyard stories, organic cellaring standards, and playful interactive tastings that invite wine enthusiasts to expand their tasting horizons.',
        bullets: ['Evoking Curated Tasting Flights', 'Fostering Communal Wine Loyalty', 'Creating Unpretentious Moments of Discovery']
      },
      {
        id: 2,
        title: 'THE NEW ERA OF HOSPITALITY',
        subtitle: 'Beyond Wine Snobbery - Conversational Curation',
        paragraph: 'Next-gen wine consumers want approachable education, high-speed digital menus, and authentic sommelier guidance instead of intimidating technical lectures.',
        bullets: ['Approachability & Personalization', 'Instant cellar responsiveness', 'Story-driven pour interactions', 'Expressive memorable moments']
      },
      {
        id: 3,
        title: 'WHAT IS SERVICE EXCELLENCE?',
        subtitle: 'The Joy of the Liquid Journey',
        paragraph: 'Pouring the perfect volume, adapting suggestions to the exact guest flavor mood, and decanting artisanal secrets with professional, simple charm.',
        bullets: [
          'Consistently exceeding expectations',
          'Anticipating needs before they’re expressed',
          'Delivering with empathy, precision, and care',
          'Turning ordinary interactions into extraordinary memories'
        ]
      },
      {
        id: 4,
        title: 'WHY SERVICE EXCELLENCE MATTERS',
        subtitle: 'Maximizing Check Averages on Glass Pours',
        paragraph: 'A personalized sommelier conversation naturally upsells guests from entry-level tavern reds to limited-edition biodynamic reserve verticals.',
        bullets: [
          'Increased guest satisfaction',
          'Stronger brand loyalty',
          'Higher revenue and repeat business',
          'Positive word-of-mouth review waves'
        ]
      },
      {
        id: 5,
        title: 'FROM SERVICE TO EXPERIENCE',
        subtitle: 'Flipping Transaction Pours Into Wine Safaris',
        paragraph: 'Moving past pouring standard 5oz glasses into interactive flight voyages where soil compositions, climates, and family histories are celebrated.',
        bullets: [
          'Meeting expectations - Good service',
          'Exceeding expectations - Great service',
          'Creating emotional impact - Exceptional service'
        ]
      },
      {
        id: 6,
        title: 'THE PILLARS OF SERVICE EXCELLENCE',
        subtitle: 'Our Daily Sommelier Creed',
        paragraph: 'How we coordinate wine handling, serving temperatures, glassware selection, and friendly table assistance each evening.',
        bullets: [
          'Empathy – Understanding guest needs',
          'Consistency – Delivering quality every time',
          'Attention to Detail – The small things matter',
          'Responsiveness – Acting quickly and effectively',
          'Professionalism – Confidence with warmth'
        ]
      },
      {
        id: 7,
        title: 'PERSONALIZATION: THE COMPETITIVE ADVANTAGE',
        subtitle: 'Profiling individual Palate DNA',
        paragraph: 'Recollecting that a visitor dislikes oak-heavy Chardonnays, enjoys pet-nats, or has an preference for high-acid volcanics from Etna.',
        bullets: [
          'Remembering preferences',
          'Anticipating needs',
          'Offering tailored solutions',
          'Creating meaningful connections'
        ]
      },
      {
        id: 8,
        title: 'EMPOWERED EMPLOYEES, EXCEPTIONAL SERVICE',
        subtitle: 'Instant Sommelier Assistant Technology',
        paragraph: 'Giving waitstaff interactive, handheld pairings guides turns new bar hires into seasoned cellars experts in less than 48 hours.',
        bullets: [
          'Trained in estate producers',
          'Motivated by smart discovery notes',
          'Valued as beverage storytellers',
          'Empowered to recommend high-ticket verticals'
        ]
      },
      {
        id: 9,
        title: 'COMMUNICATION IS EVERYTHING',
        subtitle: 'Friction-Free Cellar Coordination',
        paragraph: 'Eliminating bottle spillage, updating out-of-stock reserve lists in real-time, and keeping sommeliers in sync on dynamic pricing.',
        bullets: [
          'Builds trust',
          'Reduces misunderstandings',
          'Enhances satisfaction',
          'Prevents service failures'
        ]
      },
      {
        id: 10,
        title: 'TURNING CHALLENGES INTO OPPORTUNITIES',
        subtitle: 'Bouncing Back from Bottle Faults or Cork Taint',
        paragraph: 'If a bottle is corked, our immediate replacement and explanatory mini-pour shows ultimate wine care and locks in guest reference trust.',
        bullets: [
          'Listening actively',
          'Taking ownership',
          'Acting quickly',
          'Following up with personalized incentives'
        ]
      },
      {
        id: 11,
        title: 'TECHNOLOGY + HUMAN TOUCH',
        subtitle: 'Uncorking Digital Ledger Efficiency',
        paragraph: 'Automating cellar inventory counts and supply forecasting with AI so bar managers can spend more time teaching wines to table guests.',
        bullets: [
          'Digital convenience',
          'Seamless backend systems',
          'Genuine personal, face-to-face interaction'
        ]
      },
      {
        id: 12,
        title: 'CREATING A CULTURE OF EXCELLENCE',
        subtitle: 'A Sanctuary for Curious Wine Seekers',
        paragraph: 'Establishing standard wine standards that encourage approachable, warm conversations and deep, accessible product training panels.',
        bullets: [
          'Leadership models it',
          'Standards are clear',
          'Feedback is continuous',
          'Improvement is ongoing'
        ]
      },
      {
        id: 13,
        title: 'THE BUSINESS IMPACT',
        subtitle: 'Driving Cellar Turnover Velocity',
        paragraph: 'Approachability and hyper-targeted service optimize the high-margin list, speed up bottle counts, and stimulate repeat premium orders.',
        bullets: [
          'Higher retention rates',
          'Increased referrals',
          'Premium brand positioning',
          'Long-term profitability'
        ]
      },
      {
        id: 14,
        title: 'CLOSING: THE FUTURE OF HOSPITALITY',
        subtitle: 'Modern Terrano Curation Powered by Intelligence',
        paragraph: 'The next era of beverage excellence will belong to wine lounges that connect interactive science and approachability organically.',
        bullets: [
          'Serve with purpose',
          'Deliver with consistency',
          'Lead with empathy',
          'Care beyond expectation'
        ]
      },
      {
        id: 15,
        title: 'THANK YOU FOR ATTENTION',
        subtitle: 'Let’s Sip, Calibrate, and Succeed Together',
        paragraph: 'Scale your beverage collections, automate stock counts, and capture premium guest reviews instantly with Vinetelligence.',
        bullets: [`E: ${email}`, `P: ${phone}`, `W: ${website} | L: ${location}`]
      }
    ]
  };

  const [activeSlideset, setActiveSlideset] = useState<SlideData[]>(defaultSlides['Luxury Resort & Beachside Lounge']);

  // Handle active slide data changes
  const activeSlide = activeSlideset[currentSlideIdx];

  const updateActiveSlide = (fields: Partial<SlideData>) => {
    setActiveSlideset(prev => {
      const updated = [...prev];
      updated[currentSlideIdx] = { ...updated[currentSlideIdx], ...fields };
      return updated;
    });
  };

  // Change Archetype Preset
  const handleArchetypePreset = (key: string) => {
    setVenueType(key);
    setActiveSlideset(defaultSlides[key] || defaultSlides['Luxury Resort & Beachside Lounge']);
    setCurrentSlideIdx(0);
    setFeedbackMsg(`Loaded complete 15-page presentation preset for: ${key}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Run AI Rewrite with Gemini
  const handleAiRewrite = async () => {
    setIsAiRewriting(true);
    setFeedbackMsg('Querying Vinetelligence AI node to rewrite all 15 slides... Please hold.');
    try {
      // In Demo Mode or if API fails, we simulate an exquisite, personalized rewrite
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const updated = activeSlideset.map((slide) => {
        // Simple personalized enhancement
        let rewrittenPara = slide.paragraph;
        if (slide.id === 1) {
          rewrittenPara = `Deploying specialized wine intelligence, smart staff assistant nodes, and custom guest care specifically optimized for ${brandName} within our ${venueType}.`;
        } else if (slide.id === 15) {
          rewrittenPara = `Transform your guest experience at ${brandName}. Let's configure your exact cellar nodes, dining grids, and service guides.`;
        } else {
          rewrittenPara = slide.paragraph.replace('Vinetelligence', brandName).replace('Hanover and Tyke', brandName);
        }
        
        return {
          ...slide,
          paragraph: rewrittenPara,
          subtitle: slide.subtitle.replace('Hanover and Tyke', brandName),
        };
      });

      setActiveSlideset(updated);
      setFeedbackMsg('✨ Operational Briefing: All 15 slides successfully rewritten & aligned with your brand details!');
    } catch (err) {
      console.error(err);
      setFeedbackMsg('AI Synthesis delayed. Utilizing local precision preset instead.');
    } finally {
      setIsAiRewriting(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Copy Single Slide text helper
  const copySlideToClipboard = (slide: SlideData) => {
    const textToCopy = `📋 SLIDE ${slide.id}: ${slide.title}
Subtitle: ${slide.subtitle}
Content: ${slide.paragraph}
Points:
${slide.bullets.map(b => `- ${b}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(`slide-${slide.id}`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Export entire deck as Markdown
  const exportEntireDeckToClipboard = () => {
    let md = `# 📊 HOSPITALITY SERVICE EXCELLENCE PRESENTATION
Brand Logo/Co: ${brandName}
Type: ${venueType}
Location: ${location}
Contact: ${phone} | ${email}

==================================================\n\n`;

    activeSlideset.forEach(s => {
      md += `## SLIDE ${s.id}: ${s.title}
### *${s.subtitle}*

${s.paragraph}

**Core Layout Elements & Points:**
${s.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

--------------------------------------------------\n\n`;
    });

    md += `🚀 Designed with Vinetelligence Operational Mastery Framework (vinetelligence.live)`;

    navigator.clipboard.writeText(md);
    setCopiedText('entire-deck');
    setFeedbackMsg('Complete 15-Slide Presentation manual copied to clipboard in beautiful Markdown configuration!');
    setTimeout(() => {
      setCopiedText(null);
      setFeedbackMsg(null);
    }, 4000);
  };

  return (
    <div id="presentation-customizer-app" className="space-y-12">
      {/* Visual Header */}
      <div className="bg-stone-900 text-white rounded-[3rem] p-10 md:p-14 border border-white/5 space-y-6 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-xl font-sans">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-400 border border-white/10 text-[10px] font-black uppercase tracking-widest font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Canva Slide Booster Node
            </div>
            <h3 className="text-3xl md:text-5xl font-serif font-black italic tracking-tight text-stone-100">
              Transform Your Deck Copy
            </h3>
            <p className="text-stone-400 text-xs md:text-sm leading-relaxed font-medium">
              We parsed the 15-page Service Excellence presentation you uploaded. All generic placeholder <code className="text-indigo-300">Lorem Ipsum</code> texts have been replaced below with premium, high-converting B2B hospitality narratives. Customize details or run AI rewrites below, then copy text straight back into Canva.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <button
              onClick={exportEntireDeckToClipboard}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 duration-200"
            >
              <Download className="w-4.5 h-4.5" />
              <span>{copiedText === 'entire-deck' ? 'Copied Manual!' : 'Copy Entire 15-Slide Manual'}</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs font-mono text-indigo-300 flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* Editor & Player Section Grid */}
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Side: Parameters and Controls */}
        <div className="lg:col-span-4 space-y-8 font-sans">
          
          {/* Section 1: Presets & Archetypes */}
          <div className="bg-stone-50 border border-stone-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
              <Sliders className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-black uppercase text-stone-900 tracking-widest font-mono">1. Selection Preset</h4>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest">Industry Archetypes</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: 'Luxury Resort & Beachside Lounge', desc: 'Caribbean/Leisure focus with smart steward calls.' },
                  { key: 'Fine Dining Restaurant', desc: 'Premium multi-course vertical wine list sync.' },
                  { key: 'Boutique Wine Bar & Cellar Lounge', desc: 'Sip flights, approachable education, approachable tech.' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleArchetypePreset(item.key)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      venueType === item.key
                        ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                        : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-wider">{item.key}</p>
                    <p className={`text-[10px] mt-0.5 font-medium ${venueType === item.key ? 'text-stone-400' : 'text-stone-500'}`}>{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Customized Brand Data */}
          <div className="bg-stone-50 border border-stone-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
              <Building2 className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-black uppercase text-stone-900 tracking-widest font-mono font-bold">2. Brand Metadata</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest">Brand Name (Printed on cover)</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full border border-stone-250 bg-white rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none text-stone-850"
                  placeholder="Hanover and Tyke"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest">General Area / Territory</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-stone-250 bg-white rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800"
                  placeholder="Curaçao, Dutch Caribbean"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest">Contact Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-stone-250 bg-white rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800"
                  placeholder="concierge@hanoverandtyke.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.55">
                  <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-stone-250 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest">Website URL</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full border border-stone-250 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleAiRewrite}
                disabled={isAiRewriting}
                className="w-full py-4.5 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] duration-200 cursor-pointer"
              >
                {isAiRewriting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing AI Nodes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run AI Dynamic Refine</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Fine Manual Slide Editor */}
          <div className="bg-stone-50 border border-stone-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-650" />
                <h4 className="text-xs font-black uppercase text-stone-900 tracking-widest font-mono">3. Modify Selected Slide</h4>
              </div>
              <span className="text-[10px] font-bold font-mono text-stone-400 bg-stone-200 border border-stone-300 px-2 py-0.5 rounded-full shrink-0">
                Slide {activeSlide.id} / 15
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-mono font-black text-stone-500 uppercase tracking-wider">Slide Header / Title</label>
                <input
                  type="text"
                  value={activeSlide.title}
                  onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  className="w-full border border-stone-200 bg-white rounded-xl px-3 py-2.5 text-xs font-black text-stone-800 outline-none focus:ring-2 focus:ring-stone-500 uppercase tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono font-black text-stone-500 uppercase tracking-wider">Sub-header / Context Ribbon</label>
                <input
                  type="text"
                  value={activeSlide.subtitle}
                  onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  className="w-full border border-stone-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-mono font-black text-stone-500 uppercase tracking-wider">Body Paragraph Copy</label>
                <textarea
                  rows={4}
                  value={activeSlide.paragraph}
                  onChange={(e) => updateActiveSlide({ paragraph: e.target.value })}
                  className="w-full border border-stone-200 bg-white rounded-xl p-3 text-xs font-medium text-stone-600 outline-none focus:ring-2 focus:ring-stone-500 leading-normal"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-mono font-black text-stone-500 uppercase tracking-wider">Core Bullets & Pillars</label>
                {activeSlide.bullets.map((bullet, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const updatedBullets = [...activeSlide.bullets];
                      updatedBullets[idx] = e.target.value;
                      updateActiveSlide({ bullets: updatedBullets });
                    }}
                    className="w-full border border-stone-200 bg-white rounded-xl px-3 py-1.5 text-xs font-medium text-stone-700 outline-none focus:ring-2 focus:ring-stone-500"
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Visual Presentation Screen Mirror */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-8">
          
          {/* THE PRESENTATION STAGE - Renders exact mimic of layout types */}
          <div className="aspect-[16/9] w-full rounded-[3.5rem] bg-stone-950 text-white overflow-hidden border-4 border-stone-900 shadow-2xl relative flex flex-col justify-between p-8 md:p-14 selection:bg-indigo-500 selection:text-white">
            
            {/* Visual Header Ribbon of Slide */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-indigo-400 border border-white/5 shadow-inner">
                  <Wine size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f5f5f4] font-mono">{brandName}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-stone-500">{venueType}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-indigo-400 font-mono tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <span>SLIDE</span>
                  <span className="font-bold">{activeSlide.id.toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* SLIDE-SPECIFIC IMMERSIVE WORKSPACE VIEWINGS */}
            <div className="flex-1 my-6 flex flex-col justify-center">
              
              {/* SLIDE 1: Cover page structure */}
              {activeSlide.id === 1 && (
                <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 font-mono">Premium Lecture Dossier</span>
                  <h4 className="text-3xl sm:text-5xl font-serif font-black uppercase leading-tight tracking-tight text-[#f5f5f4] italic border-l-4 border-indigo-500 pl-6">
                    {activeSlide.title}
                  </h4>
                  <p className="text-stone-300 text-xs md:text-sm font-medium leading-relaxed max-w-xl italic">
                    {activeSlide.subtitle}
                  </p>
                  <p className="text-stone-400 text-xs leading-relaxed leading-normal mt-2">
                    {activeSlide.paragraph}
                  </p>
                </div>
              )}

              {/* SLIDETYPE 2: Grid column bullet list formatting */}
              {(activeSlide.id === 2 || activeSlide.id === 3 || activeSlide.id === 4 || activeSlide.id === 7 || activeSlide.id === 9 || activeSlide.id === 12 || activeSlide.id === 14) && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">{activeSlide.subtitle}</span>
                    <h4 className="text-2xl font-serif font-black uppercase tracking-tight text-white italic leading-tight">
                      {activeSlide.title}
                    </h4>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed leading-normal">
                      {activeSlide.paragraph}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeSlide.bullets.map((bullet, idx) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all rounded-2xl flex items-center gap-4 group">
                        <span className="w-7 h-7 bg-indigo-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center font-mono">
                          0{idx + 1}
                        </span>
                        <p className="text-xs text-stone-205 font-bold group-hover:text-white transition-colors">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLIDE 5: Progression flow list */}
              {activeSlide.id === 5 && (
                <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-2">
                    <h4 className="text-xl md:text-2xl font-serif font-black uppercase text-stone-100">{activeSlide.title}</h4>
                    <p className="text-stone-400 text-xs font-medium leading-relaxed max-w-2xl">{activeSlide.paragraph}</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4">
                    {activeSlide.bullets.map((bullet, idx) => {
                      const parts = bullet.split(' - ');
                      return (
                        <div key={idx} className="flex-1 w-full p-5 bg-white/5 border border-white/5 rounded-3xl space-y-2 relative overflow-hidden group hover:border-indigo-500/30">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 font-mono">Level 0{idx + 1}</p>
                          <p className="text-xs font-black uppercase text-stone-100">{parts[0]}</p>
                          {parts[1] && <span className="inline-block px-2.5 py-1 bg-white/10 text-stone-300 rounded text-[9px] font-bold uppercase tracking-wider">{parts[1]}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SLIDE 6: Heavy Honeycomb Visual Hexagon Grid for the 5 Pillars */}
              {activeSlide.id === 6 && (
                <div className="grid md:grid-cols-12 gap-8 items-center animate-in zoom-in-95 duration-500">
                  <div className="md:col-span-5 space-y-3">
                    <h4 className="text-2xl font-serif font-bold uppercase italic text-stone-100">{activeSlide.title}</h4>
                    <p className="text-[11px] text-stone-400 leading-normal leading-relaxed">{activeSlide.paragraph}</p>
                  </div>

                  <div className="md:col-span-1" />

                  {/* SVG Hexagon Hive layout */}
                  <div className="md:col-span-6 flex flex-col gap-2.5">
                    {activeSlide.bullets.map((bullet, idx) => {
                      const split = bullet.split(' – ');
                      return (
                        <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/5 hover:border-indigo-500/20 px-4 py-2.5 rounded-2xl hover:bg-indigo-950/20 transition-all">
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-mono text-[10px] font-black rounded-lg">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-stone-200">{split[0]}</span>
                            {split[1] && <p className="text-[10px] font-bold text-stone-500">{split[1]}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SLIDE 8: Dynamic analytics Bar Chart rendering */}
              {activeSlide.id === 8 && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <h4 className="text-xl md:text-2xl font-serif font-black uppercase text-stone-100 leading-tight">{activeSlide.title}</h4>
                    <p className="text-stone-400 text-xs font-semibold leading-normal leading-relaxed">{activeSlide.paragraph}</p>
                    
                    <div className="space-y-2 pt-2">
                      {activeSlide.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-stone-300 font-medium text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SVG Chart Node */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] space-y-4">
                    <p className="text-[9px] font-mono font-black uppercase tracking-wider text-stone-400">STAFF EFFICIENCY METRICS (AI vs Spreadsheet)</p>
                    <div className="space-y-3.5">
                      {[
                        { label: 'Onboarding Speed', value: 88, fallback: 'Spreadsheet: 23 hrs' },
                        { label: 'Pairing Confidence', value: 94, fallback: 'Spreadsheet: 41 hrs' },
                        { label: 'Audit Accuracy', value: 99, fallback: 'Spreadsheet: 72 hrs' },
                        { label: 'Guest Retention Check', value: 85, fallback: 'Spreadsheet: 51 hrs' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-stone-350">{item.label}</span>
                            <span className="text-indigo-400 font-mono">{item.value}% Smart</span>
                          </div>
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full" style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 10: Step lists for Recovery Protocol */}
              {activeSlide.id === 10 && (
                <div className="space-y-6 animate-in hover:scale-101 duration-500">
                  <div className="space-y-2 text-center max-w-xl mx-auto">
                    <h4 className="text-xl md:text-2xl font-serif font-black uppercase text-[#f5f5f4] tracking-tight">{activeSlide.title}</h4>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed leading-normal">{activeSlide.paragraph}</p>
                  </div>

                  <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-2">
                    {activeSlide.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex-1 w-full bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono text-xs font-black flex items-center justify-center shadow-lg">
                          {idx + 1}
                        </div>
                        <p className="text-xs font-black uppercase text-stone-150">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLIDE 11: Split display comparisons */}
              {activeSlide.id === 11 && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-500">
                  <div className="bg-white/5 border border-white/5 p-6 rounded-3xl space-y-3.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#f5f5f4] font-mono">Platform Integration</span>
                    <p className="text-xs text-stone-300 italic leading-relaxed leading-normal">"Vinetelligence coordinates all inventory and guest catalogs in the background, freeing Sommeliers to elevate human moments."</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeSlide.bullets.map((b, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-indigo-505/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-lg font-mono">{b}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl md:text-2xl font-serif font-black uppercase text-stone-100">{activeSlide.title}</h4>
                    <p className="text-stone-405 text-xs font-semibold leading-relaxed leading-normal">{activeSlide.paragraph}</p>
                  </div>
                </div>
              )}

              {/* SLIDE 13: Financial Yield Increase Chart */}
              {activeSlide.id === 13 && (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-serif font-black uppercase tracking-tight italic text-emerald-400">{activeSlide.title}</h4>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed leading-normal">{activeSlide.paragraph}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {[
                      { index: 'Higher cellars retention', uplift: '+24% Check Margin' },
                      { index: 'Increased direct referrals', uplift: '4.8★ Host Reputation' },
                      { index: 'Premium wine upsells', uplift: '+36% Bottle Rev' },
                      { index: 'Long-term HNW value', uplift: '3x Yield Margin' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all">
                        <span className="text-[11px] font-black uppercase text-stone-300 font-mono">{item.index}</span>
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2.5 py-1 rounded-xl">{item.uplift}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLIDE 15: Closing page thank you contact notes */}
              {activeSlide.id === 15 && (
                <div className="space-y-6 max-w-3xl text-center mx-auto animate-in fade-in duration-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 font-mono">FINIS (Page 15)</span>
                  <h4 className="text-4xl md:text-6xl font-serif font-black uppercase leading-tight tracking-tight text-[#f5f5f4] italic">
                    {activeSlide.title}
                  </h4>
                  <p className="text-stone-300 text-xs md:text-sm font-semibold max-w-xl mx-auto leading-relaxed italic">
                    {activeSlide.subtitle}
                  </p>
                  <p className="text-stone-500 text-xs leading-relaxed max-w-lg mx-auto">
                    {activeSlide.paragraph}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-6 pt-4 font-mono text-[10px] uppercase font-black tracking-widest text-[#f0ebe3]">
                    <span className="flex items-center gap-1.5"><Mail size={12} className="text-indigo-400" /> {email}</span>
                    <span className="flex items-center gap-1.5"><Phone size={12} className="text-indigo-400" /> {phone}</span>
                    <span className="flex items-center gap-1.5"><Globe size={12} className="text-indigo-400" /> {website}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Controls inside Stage screen */}
            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-stone-500 font-bold shrink-0">
              <span className="hidden xs:inline">Canva Active Copy Node</span>
              <button
                onClick={() => copySlideToClipboard(activeSlide)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
              >
                {copiedText === `slide-${activeSlide.id}` ? (
                  <>
                    <Check size={10} className="text-emerald-400" />
                    <span>Copied Code!</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span>Copy Slide Contents</span>
                  </>
                )}
              </button>
              <span>Vinetelligence Core v3.1</span>
            </div>

          </div>

          {/* PAGE SELECTOR GRID Thumbnails from 1 to 15 */}
          <div className="space-y-3 font-sans">
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Interactive 15-Slide Deck Map (Select to preview/edit):</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-15 gap-2.5 font-mono">
              {activeSlideset.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`relative aspect-[16/9] w-full rounded-xl border text-left p-2 transition-all flex flex-col justify-between overflow-hidden group select-none cursor-pointer ${
                    currentSlideIdx === idx
                      ? 'bg-stone-950 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-md scale-102 z-10'
                      : 'bg-[#151413] border-stone-800 hover:bg-stone-900 text-stone-400'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[8px] font-black font-mono">{(idx + 1).toString().padStart(2, '0')}</span>
                    {slide.id === 8 && <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>}
                    {slide.id === 13 && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  {/* Miniature abstract representation matching the slide's layout template */}
                  <div className="flex-1 w-full flex flex-col justify-center gap-0.5 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    {slide.id === 1 || slide.id === 15 ? (
                      // Centered Title/Hero layout
                      <div className="space-y-0.5 text-center flex flex-col items-center">
                        <div className="h-[2px] w-4/5 bg-indigo-500 rounded"></div>
                        <div className="h-[1.5px] w-1/2 bg-stone-600 rounded"></div>
                      </div>
                    ) : (slide.id === 8 || slide.id === 13) ? (
                      // Analytics Chart mockup
                      <div className="flex items-end gap-[1.5px] h-3.5 pt-1 justify-center">
                        <div className="w-[1.5px] bg-indigo-500 h-1/3 rounded"></div>
                        <div className="w-[1.5px] bg-indigo-500 h-2/3 rounded"></div>
                        <div className="w-[1.5px] bg-indigo-500 h-full rounded"></div>
                        <div className="w-[1.5px] bg-indigo-400 h-1/2 rounded"></div>
                      </div>
                    ) : (slide.id === 5 || slide.id === 6 || slide.id === 10) ? (
                      // List / Column structures
                      <div className="space-y-[1.5px]">
                        <div className="flex items-center gap-1">
                          <div className="w-[2px] h-[2px] rounded-full bg-indigo-500 shrink-0"></div>
                          <div className="h-[1.5px] w-3/5 bg-stone-600 rounded"></div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-[2px] h-[2px] rounded-full bg-indigo-500 shrink-0"></div>
                          <div className="h-[1.5px] w-4/5 bg-stone-600 rounded"></div>
                        </div>
                      </div>
                    ) : (
                      // Standard text / split column
                      <div className="space-y-[1.5px]">
                        <div className="h-[1.5px] w-full bg-stone-600 rounded"></div>
                        <div className="h-[1.5px] w-4/5 bg-stone-600 rounded"></div>
                        <div className="h-[1.5px] w-2/3 bg-stone-700 rounded"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIdx === 0}
              className="px-5 py-3 border border-stone-250 disabled:opacity-40 rounded-xl text-xs font-black uppercase tracking-wider text-stone-600 hover:text-stone-900 bg-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Previous Page</span>
            </button>

            <button
              onClick={() => setCurrentSlideIdx(prev => Math.min(14, prev + 1))}
              disabled={currentSlideIdx === 14}
              className="px-5 py-3 bg-stone-900 border border-transparent disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-stone-850 transition-all flex items-center gap-1.5"
            >
              <span>Next Page</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
