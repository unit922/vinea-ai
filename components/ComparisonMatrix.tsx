import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Shield, Zap, Brain, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface CompetitorData {
  id: string;
  name: string;
  category: string;
  description: string;
  primaryGaps: string[];
  role: string;
  outcomeQuote: string;
  outcomeMargin: string;
  metrics: {
    feature: string;
    vinetelligence: string;
    competitor: string;
    icon: React.ReactNode;
  }[];
}

const ComparisonMatrix: React.FC = () => {
  const [activeComp, setActiveComp] = useState<string>('toast');

  const competitors: Record<string, CompetitorData> = {
    toast: {
      id: "toast",
      name: "Toast POS",
      category: "Transaction-First System",
      description: "A traditional POS transaction ledger and kitchen ticketing machine. Built for billing fast-casual transactions, but operates completely blind to sensory flavor science, pairing vectors, or staff oenology education.",
      primaryGaps: [
        "Requires manual stock entry for vintages with zero dynamic pairing or temperature advice.",
        "Guest billing tracking does not link with biological taste profiles—leaves floor staff blind."
      ],
      role: "Legacy Hardware Ledger",
      outcomeQuote: "Toast handles the checkout invoice; Vinetelligence handles the guest sensory curation.",
      outcomeMargin: "Basic Checkout Only",
      metrics: [
        {
          feature: "Palate Profiling",
          vinetelligence: "Neural Organoleptic Mapping (Automatic)",
          competitor: "Manual notes in check text fields",
          icon: <Brain className="w-4 h-4 text-indigo-500" />
        },
        {
          feature: "Staff Floor Coaching",
          vinetelligence: "Direct Voice Scholar Sommelier Node active",
          competitor: "None (staff relies purely on memory)",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />
        },
        {
          feature: "Response Latency",
          vinetelligence: "<42ms Local Edge Client Sync",
          competitor: "250ms - 500ms standard cloud update",
          icon: <Zap className="w-4 h-4 text-amber-500" />
        },
        {
          feature: "Customer Privacy",
          vinetelligence: "Zero-Trust Private isolated DB silos",
          competitor: "Centralized multi-tenant shared servers",
          icon: <Shield className="w-4 h-4 text-sky-500" />
        }
      ]
    },
    sevenrooms: {
      id: "sevenrooms",
      name: "SevenRooms CRM",
      category: "Guest Intake and Seating system",
      description: "A solid hospitality reservation and floor manager database. Excellent for host stand logging, but personal profiling remains static and disconnects from active beverage chemistry or cellar metrics.",
      primaryGaps: [
        "Personalization is dependent on busy floor staff entering manual text notes like 'likes Cabernet'.",
        "No dynamic links with on-site beverage inventory systems to update real-time sommelier insights."
      ],
      role: "Legacy Guest CRM",
      outcomeQuote: "SevenRooms knows who is sitting at the table. Vinetelligence knows exactly what they want to drink.",
      outcomeMargin: "+35% Personalization ROI",
      metrics: [
        {
          feature: "Palate Profiling",
          vinetelligence: "Neural Organoleptic Mapping (Automatic)",
          competitor: "Staff manually typing keyword tags",
          icon: <Brain className="w-4 h-4 text-indigo-500" />
        },
        {
          feature: "Staff Floor Coaching",
          vinetelligence: "Direct Voice Scholar Sommelier Node active",
          competitor: "None (Manual shift logs only)",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />
        },
        {
          feature: "Response Latency",
          vinetelligence: "<42ms Local Edge Client Sync",
          competitor: "Browser screen page loads",
          icon: <Zap className="w-4 h-4 text-amber-500" />
        },
        {
          feature: "Customer Privacy",
          vinetelligence: "Zero-Trust Private isolated DB silos",
          competitor: "Shared SaaS macro-analytics system",
          icon: <Shield className="w-4 h-4 text-sky-500" />
        }
      ]
    },
    opentable: {
      id: "opentable",
      name: "OpenTable Aggregator",
      category: "Public Marketplace Directory",
      description: "A consumer discovery network that filling tables. This structural model leads to crucial business conflicts, as search aggregates are used to redirect your hard-earned guests to alternative competitor listings.",
      primaryGaps: [
        "Aggregates your customer profiles to market competing local restaurants to your diners.",
        "Zero on-floor integration with cellar inventories, food pairing, or master staff education."
      ],
      role: "Leased Marketplace Platform",
      outcomeQuote: "Stop leasing your guest equity of search discovery. Vinetelligence isolates your node data securely.",
      outcomeMargin: "Zero Shared Data Pools",
      metrics: [
        {
          feature: "Palate Profiling",
          vinetelligence: "Neural Organoleptic Mapping (Automatic)",
          competitor: "Past covers/attendance totals",
          icon: <Brain className="w-4 h-4 text-indigo-500" />
        },
        {
          feature: "Staff Floor Coaching",
          vinetelligence: "Direct Voice Scholar Sommelier Node active",
          competitor: "None",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />
        },
        {
          feature: "Response Latency",
          vinetelligence: "<42ms Local Edge Client Sync",
          competitor: "Standard web dashboard loads",
          icon: <Zap className="w-4 h-4 text-amber-500" />
        },
        {
          feature: "Customer Privacy",
          vinetelligence: "Zero-Trust Private isolated DB silos",
          competitor: "Co-mingles data to promote competitors",
          icon: <Shield className="w-4 h-4 text-sky-500" />
        }
      ]
    },
    treema: {
      id: "treema",
      name: "Treema AI",
      category: "Basic Statistical Analytics",
      description: "A basic cloud regression tool tracking sales and general forecasts. Lacks local edge client sync, real-time voice guidance, sommelier scholar repositories, or dedicated hardware terminal protocols.",
      primaryGaps: [
        "Focuses on static retro-active owner dashboards rather than enabling active, high-velocity floor staffs.",
        "Zero real-time wine regional mapping, biological oenology metrics, or pair-score systems."
      ],
      role: "Basic Analytical Tool",
      outcomeQuote: "Treema records static retro-active trends. Vinetelligence actively engineers immediate luxury guest experiences.",
      outcomeMargin: "8x Speed Latency Ratio",
      metrics: [
        {
          feature: "Palate Profiling",
          vinetelligence: "Neural Organoleptic Mapping (Automatic)",
          competitor: "Basic demographic projection regression",
          icon: <Brain className="w-4 h-4 text-indigo-500" />
        },
        {
          feature: "Staff Floor Coaching",
          vinetelligence: "Direct Voice Scholar Sommelier Node active",
          competitor: "None (Owner desk dashboards only)",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />
        },
        {
          feature: "Response Latency",
          vinetelligence: "<42ms Local Edge Client Sync",
          competitor: "250ms+ cloud response intervals",
          icon: <Zap className="w-4 h-4 text-amber-500" />
        },
        {
          feature: "Customer Privacy",
          vinetelligence: "Zero-Trust Private isolated DB silos",
          competitor: "Standard multi-tenant databases",
          icon: <Shield className="w-4 h-4 text-sky-500" />
        }
      ]
    },
    hotelspeaker: {
      id: "hotelspeaker",
      name: "Hotel Speaker",
      category: "Manual Outsource Review Agency",
      description: "An external reviews-answering business that uses generic templates, standard AI rewrite tools, and crowdsourced crowds of freelance copywriters in multiple languages to reply to past guests. They lack any integration with reservation profiles, floor operations, or guest beverage preferences.",
      primaryGaps: [
        "Entirely blind to on-site transactions and Palate DNA curves—responses are hollow generic templates.",
        "Response cycle takes 24h to 48h to dispatch through outsourced copywriter queues."
      ],
      role: "Traditional Outsource Agency",
      outcomeQuote: "Hotel Speaker writes responses purely based on abstract reviews; Vinetelligence automatically crafts responses rich with true, personalized oenological context derived from their actual cellar visits.",
      outcomeMargin: "Immediate AI Sync & Personalization",
      metrics: [
        {
          feature: "Palate Profiling",
          vinetelligence: "Neural Organoleptic Mapping (Automatic link to guest transactions)",
          competitor: "None (absolutely blind to what they drank)",
          icon: <Brain className="w-4 h-4 text-indigo-500" />
        },
        {
          feature: "Staff Floor Coaching",
          vinetelligence: "Direct Voice Scholar Sommelier Node active with review triggers",
          competitor: "None (disconnected third-party writers)",
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />
        },
        {
          feature: "Response Latency",
          vinetelligence: "≤10s Gen-AI draft containing precise cellar inventory names",
          competitor: "12 to 24 hours typical outsourced human-in-the-loop delay",
          icon: <Zap className="w-4 h-4 text-amber-500" />
        },
        {
          feature: "Customer Privacy",
          vinetelligence: "Zero-Trust Private isolated DB silos",
          competitor: "External systems sharing reviews across freelancer channels & sheets",
          icon: <Shield className="w-4 h-4 text-sky-500" />
        }
      ]
    }
  };

  const current = competitors[activeComp];

  return (
    <section className="py-20 md:py-32 px-6 bg-white overflow-hidden border-t border-stone-100">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Competitive Edge Brief</h2>
          <h3 className="text-4xl md:text-7xl font-serif font-black tracking-tighter leading-tight italic text-stone-900">
            Strategic <br /> <span className="text-indigo-600">Performance</span> Matrix
          </h3>
          <p className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest mt-4 max-w-lg mx-auto">
            Why luxury curators reject standard transaction stacks.
          </p>
        </div>

        {/* Dynamic Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {Object.values(competitors).map((comp) => (
            <button
              key={comp.id}
              onClick={() => setActiveComp(comp.id)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeComp === comp.id
                  ? 'bg-stone-900 text-white shadow-lg'
                  : 'bg-stone-50 text-stone-400 border border-stone-100 hover:text-stone-700'
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>

        {/* Main Side-by-Side Panel */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Weakness analysis column */}
          <div className="lg:col-span-4 bg-stone-50 border border-stone-100 p-8 rounded-[2.5rem] flex flex-col justify-between space-y-10">
            <div className="space-y-4">
              <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest">{current.category}</span>
              <h4 className="text-2xl font-serif font-black italic text-stone-900">{current.name}</h4>
              <p className="text-xs text-stone-500 font-medium italic leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-stone-200">
              <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest block">Structural Failure Points</span>
              {current.primaryGaps.map((gap, i) => (
                <div key={i} className="flex gap-2.5 items-start text-[11px] text-stone-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase">
              <span className="text-stone-400">SaaS Tier Status</span>
              <span className="text-rose-600">{current.role}</span>
            </div>
          </div>

          {/* Interactive core table column */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="border border-stone-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 border-b border-stone-100">
                    <th className="p-5 text-[9px] font-black uppercase tracking-widest text-stone-400">Core Metric</th>
                    <th className="p-5 text-[9px] font-black uppercase tracking-widest text-[#10b981]">Vinetelligence AI</th>
                    <th className="p-5 text-[9px] font-black uppercase tracking-widest text-stone-400">{current.name} Stack</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {current.metrics.map((m, i) => (
                      <motion.tr
                        key={m.feature}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            {m.icon}
                            <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">{m.feature}</span>
                          </div>
                        </td>
                        <td className="p-5 text-xs font-bold text-stone-950 italic">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{m.vinetelligence}</span>
                          </div>
                        </td>
                        <td className="p-5 text-xs text-stone-300 line-through decoration-stone-200">
                          <div className="flex items-center gap-1.5 text-stone-400/80">
                            <X className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />
                            <span>{m.competitor}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Quote of performance outcomes */}
            <div className="p-6 bg-[#0c0e0e] rounded-[2rem] border border-indigo-500/10 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Empirical Outcome Advantage</span>
                <p className="text-xs text-stone-300 font-medium italic">
                  "{current.outcomeQuote}"
                </p>
              </div>
              <span className="bg-[#10b981] text-stone-950 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl shrink-0">
                {current.outcomeMargin}
              </span>
            </div>
          </div>

        </div>

        {/* Promotion Call To Action (to standalone matrix) */}
        <div className="pt-10 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-stone-400 font-medium italic text-center md:text-left">
            Need this dossier formatted for stakeholder review or LinkedIn publication boards?
          </p>
          <a
            href="/competitor-matrix.html"
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-900/20"
          >
            Launch Competitive Dossier & LinkedIn Copier <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default ComparisonMatrix;
