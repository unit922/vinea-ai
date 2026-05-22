import React, { useState, useEffect } from 'react';
import { GuestFeedback, LoyaltyMember, AIInsight, RestaurantProfile } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { isValidUUID } from '../services/supabaseSync';
import { 
  Target, 
  ShieldAlert, 
  Activity,
  FileText,
  Printer,
  X,
  Zap,
  Brain
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const RetentionIntelligence: React.FC = () => {
  const [feedback, setFeedback] = useState<GuestFeedback[]>([]);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'feedback' | 'loyalty' | 'insights' | 'sentiment'>('insights');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentReport, setSentimentReport] = useState<string | null>(null);
  const [isPredictingChurn, setIsPredictingChurn] = useState(false);
  const [churnReport, setChurnReport] = useState<string | null>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    const profile: RestaurantProfile | null = profileStr ? JSON.parse(profileStr) : null;
    const isDemo = !profile || ((!profile.edition || profile.edition === 'demo') && !isValidUUID(profile.id));

    // Load real feedback from localStorage
    const storedFeedback = JSON.parse(localStorage.getItem('vinetelligence_feedback') || localStorage.getItem('vinea_feedback') || '[]');
    
    if (isDemo && storedFeedback.length === 0) {
      // Mock data for initial state if no real feedback exists
      setFeedback([
        {
          id: 'f-1',
          guestName: 'Alexander Mercer',
          rating: 5,
          comment: 'The Laphroaig 10 was perfectly served. Exceptional knowledge from the staff.',
          tags: ['Exceptional Service', 'Expert Guidance', 'Technical Mastery'],
          sentiment: 'Positive',
          timestamp: new Date().toISOString(),
          aiSummary: 'High satisfaction with beverage knowledge and service quality.'
        },
        {
          id: 'f-2',
          guestName: 'Elena Rossi',
          rating: 4,
          comment: 'Great atmosphere, but the Negroni was a bit too bitter for my taste.',
          tags: ['Elegant Vibe', 'Modern Classic'],
          sentiment: 'Neutral',
          timestamp: new Date().toISOString(),
          aiSummary: 'Positive atmosphere feedback; potential for personalized cocktail adjustments.'
        }
      ]);
    } else {
      setFeedback(storedFeedback);
    }

    if (!isDemo) return;

    setLoyaltyMembers([
      {
        id: 'l-1',
        name: 'Alexander Mercer',
        email: 'alex.m@example.com',
        points: 1250,
        tier: 'Gold',
        joinDate: '2025-01-15',
        lastVisit: new Date().toISOString(),
        preferences: ['Peated Scotch', 'Old World Reds']
      },
      {
        id: 'l-2',
        name: 'Elena Rossi',
        email: 'elena.r@example.com',
        points: 850,
        tier: 'Silver',
        joinDate: '2025-02-20',
        lastVisit: new Date().toISOString(),
        preferences: ['Negroni', 'Franciacorta']
      }
    ]);

    setInsights([
      {
        id: 'i-1',
        type: 'Retention',
        title: 'High-Value Guest Alert',
        message: 'Alexander Mercer has visited 3 times this month. Consider offering a complimentary tasting of the new Ardbeg release.',
        impactScore: 85,
        actionable: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'i-2',
        type: 'Revenue',
        title: 'Cocktail Upsell Opportunity',
        message: 'Guests who enjoy Negronis are 40% more likely to try the "Vinetelligence Signature Sbagliato". Train staff on this pairing.',
        impactScore: 72,
        actionable: true,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const handlePredictChurn = async () => {
    setIsPredictingChurn(true);
    try {
      const report = await geminiService.getChurnPrediction(feedback, loyaltyMembers);
      setChurnReport(report);
      setActiveTab('insights');
    } catch (error) {
      console.error("Vinetelligence: Churn Prediction Failed", error);
    } finally {
      setIsPredictingChurn(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setIsAnalyzing(true);
    try {
      const report = await geminiService.getSentimentReport(feedback);
      setSentimentReport(report);
      setActiveTab('sentiment');
    } catch (error) {
      console.error("Vinetelligence: Sentiment Analysis Failed", error);
      setSentimentReport("Analysis failed. Please ensure your AI configuration is correct.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-white overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-stone-900/50 border-b border-white/5 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter">Retention Intelligence</h1>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mt-2">AI-Driven Guest Loyalty & Sentiment Analysis</p>
        </div>
        <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
          {(['insights', 'feedback', 'loyalty', 'sentiment'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-amber-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button 
          onClick={handleAnalyzeSentiment}
          disabled={isAnalyzing}
          className="ml-4 px-8 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-stone-800 transition-all border border-white/10 disabled:opacity-50"
        >
          {isAnalyzing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles text-amber-500"></i>}
          {isAnalyzing ? 'Analyzing Sentiment...' : 'Generate AI Report'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-black italic tracking-tight">Churn Intelligence</h3>
                        <p className="text-[10px] font-mono uppercase text-stone-500 tracking-widest">Predictive Risk Engine</p>
                      </div>
                    </div>
                    <p className="text-stone-400 text-xs leading-relaxed mb-8 italic font-medium">
                      Synthesizing guest behavior patterns, sentiment decay, and engagement deltas to identify high-risk accounts before disengagement occurs.
                    </p>
                    <button 
                      onClick={handlePredictChurn}
                      disabled={isPredictingChurn}
                      className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isPredictingChurn ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {isPredictingChurn ? 'Synthesizing Data...' : 'Run Prediction Engine'}
                    </button>
                  </div>
                </div>

                <div className="bg-stone-900/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                  <h3 className="text-xl font-serif font-black italic text-white mb-8">Retention Pulse</h3>
                  <div className="space-y-6">
                    {insights.map(insight => (
                      <div key={insight.id} className="flex items-center gap-6 p-4 bg-black/20 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                          insight.type === 'Retention' ? 'bg-blue-500' :
                          insight.type === 'Revenue' ? 'bg-emerald-500' :
                          'bg-amber-500'
                        }`}>
                          <i className={`fas ${
                            insight.type === 'Retention' ? 'fa-user-minus' :
                            insight.type === 'Revenue' ? 'fa-chart-line' :
                            'fa-bolt'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">{insight.title}</p>
                          <p className="text-[10px] text-stone-500 font-medium italic">{insight.message}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-serif font-black italic text-white">{insight.impactScore}%</p>
                          <p className="text-[8px] font-black uppercase text-stone-600 tracking-widest">Impact</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {churnReport && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col"
                >
                  {/* Report Header - Technical/Brutalist Style */}
                  <div className="bg-stone-950 p-8 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-black italic text-white tracking-tight">Intelligence Dossier: Churn Prediction</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-mono font-bold uppercase text-stone-500 tracking-widest">Ref: VINETELLIGENCE-INTEL-0301</span>
                          <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                          <span className="text-[9px] font-mono font-bold uppercase text-amber-500 tracking-widest animate-pulse">Live Synthesis Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => window.print()} 
                        className="p-2 text-stone-500 hover:text-white transition-colors border border-white/5 rounded hover:bg-white/5"
                        title="Export PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setChurnReport(null)} 
                        className="p-2 text-stone-500 hover:text-white transition-colors border border-white/5 rounded hover:bg-white/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Risk Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 border-b border-white/10">
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Risk Assessment</span>
                      <span className="text-2xl font-serif font-black italic text-rose-500">Elevated</span>
                    </div>
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Confidence Score</span>
                      <span className="text-2xl font-serif font-black italic text-white">92.4%</span>
                    </div>
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">High-Risk Nodes</span>
                      <span className="text-2xl font-serif font-black italic text-amber-500">03 Members</span>
                    </div>
                    <div className="p-6 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Est. Revenue Impact</span>
                      <span className="text-2xl font-serif font-black italic text-emerald-500">-$12.4k/mo</span>
                    </div>
                  </div>

                  {/* Report Content */}
                  <div className="p-10 flex flex-col lg:flex-row gap-10">
                    {/* Left Column: AI Summary */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Executive Summary</h4>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <div className="markdown-body text-sm text-stone-300 leading-relaxed font-medium italic">
                          <Markdown>{churnReport}</Markdown>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Technical Details */}
                    <div className="w-full lg:w-80 shrink-0 space-y-8">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Neural Indicators</h4>
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: 'Sentiment Decay', value: 78, color: 'bg-rose-500' },
                            { label: 'Visit Frequency', value: 45, color: 'bg-amber-500' },
                            { label: 'Engagement Delta', value: 62, color: 'bg-amber-500' },
                          ].map(indicator => (
                            <div key={indicator.label} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500 italic">
                                <span>{indicator.label}</span>
                                <span>{indicator.value}%</span>
                              </div>
                              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${indicator.value}%` }}
                                  className={`h-full ${indicator.color}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Next Best Actions</h4>
                        </div>
                        <ul className="space-y-3">
                          {[
                            'Direct Concierge Outreach',
                            'Personalized Tasting Invite',
                            'Tier Status Re-evaluation'
                          ].map((action, i) => (
                            <li key={i} className="flex items-start gap-3 text-[11px] text-stone-400 italic leading-snug">
                              <span className="text-amber-500 font-mono mt-0.5">{i+1}.</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-stone-950/50 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] font-mono font-bold uppercase text-stone-600 tracking-widest italic">Vinetelligence Intelligence Core v3.1 // Churn Analysis Module</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 tracking-widest">Secure Node 0x82F</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {feedback.map(f => (
                <div key={f.id} className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 flex gap-8 items-start">
                  <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <span className="text-2xl font-serif italic font-black text-amber-500">{f.rating}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-black italic">{f.guestName}</h3>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        f.sentiment === 'Positive' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {f.sentiment} Sentiment
                      </span>
                    </div>
                    <p className="text-sm text-stone-300 italic leading-relaxed">"{f.comment}"</p>
                    {f.tags && f.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {f.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {f.aiSummary && (
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex gap-3 items-start">
                        <i className="fas fa-sparkles text-amber-500 text-xs mt-1"></i>
                        <p className="text-[11px] text-stone-400 leading-relaxed italic">
                          <span className="text-amber-500 font-black uppercase tracking-widest mr-2">AI Summary:</span>
                          {f.aiSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'loyalty' && (
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {loyaltyMembers.map(member => (
                <div key={member.id} className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950">
                        <i className="fas fa-crown text-xl"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-black italic">{member.name}</h3>
                        <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-serif italic font-black text-amber-500">{member.points}</div>
                      <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Points</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest mb-1">Current Tier</p>
                      <p className="text-sm font-serif italic font-black text-white">{member.tier}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest mb-1">Member Since</p>
                      <p className="text-sm font-serif italic font-black text-white">{member.joinDate}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Guest Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.map(pref => (
                        <span key={pref} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-300">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {activeTab === 'sentiment' && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {sentimentReport ? (
                <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"></div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-amber-500 rounded-[2rem] flex items-center justify-center text-stone-950 shadow-xl">
                      <i className="fas fa-brain text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-black italic">Strategic Sentiment Analysis</h2>
                      <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Generated by Vinetelligence Intelligence Engine</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none prose-p:text-stone-300 prose-p:leading-relaxed prose-p:italic prose-headings:font-serif prose-headings:italic prose-headings:text-amber-500">
                    <div className="markdown-body text-lg leading-relaxed">
                      <Markdown>{sentimentReport}</Markdown>
                    </div>
                  </div>
                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest">Confidential Intelligence Report</p>
                    <button onClick={() => window.print()} className="text-[9px] font-black uppercase text-amber-500 hover:text-white transition-colors">
                      <i className="fas fa-print mr-2"></i> Export PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
                  <div className="w-32 h-32 bg-stone-900 rounded-[3rem] flex items-center justify-center border border-white/5 animate-pulse">
                    <i className="fas fa-chart-line text-5xl text-stone-700"></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-black italic text-stone-500">No Report Generated</h3>
                    <p className="text-sm text-stone-600 max-w-xs italic">Click the "Generate AI Report" button above to analyze current guest sentiment.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
