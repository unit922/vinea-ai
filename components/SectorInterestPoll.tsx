
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, CheckCircle2, Users, Target, Zap, Brain, Eye, MessageSquare } from 'lucide-react';

const POLL_CONFIG = [
  { 
    id: 'yield-alpha', 
    label: 'Yield Alpha', 
    description: 'Predictive Inventory & Logistics Optimization', 
    icon: <Zap className="w-5 h-5" />,
    initialVotes: 42
  },
  { 
    id: 'guest-intel', 
    label: 'Guest Intelligence', 
    description: 'Palate DNA & Hyper-Personalized Service', 
    icon: <Brain className="w-5 h-5" />,
    initialVotes: 38
  },
  { 
    id: 'neural-coach', 
    label: 'Neural Coaching', 
    description: 'AI-Driven Staff Training & ROI Tracking', 
    icon: <Target className="w-5 h-5" />,
    initialVotes: 25
  },
  { 
    id: 'vision-audit', 
    label: 'Vision Audit', 
    description: 'Multimodal Beverage Identification & Quality Control', 
    icon: <Eye className="w-5 h-5" />,
    initialVotes: 19
  },
  { 
    id: 'concierge-hub', 
    label: 'Concierge Hub', 
    description: 'Neural Hospitality & Guest Journey Management', 
    icon: <Users className="w-5 h-5" />,
    initialVotes: 31
  }
];

export const SectorInterestPoll: React.FC = () => {
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('intelligence_sector_poll_v2');
    if (saved) return JSON.parse(saved);
    
    // Fallback to legacy keys
    const legacy = localStorage.getItem('oenovia_sector_poll_v2');
    if (legacy) return JSON.parse(legacy);
    
    const initial: Record<string, number> = {};
    POLL_CONFIG.forEach(opt => {
      initial[opt.id] = opt.initialVotes;
    });
    return initial;
  });

  const [hasVoted, setHasVoted] = useState(() => {
    return !!(localStorage.getItem('intelligence_user_voted_sector') || localStorage.getItem('oenovia_user_voted_sector'));
  });
  const [votedId, setVotedId] = useState<string | null>(() => {
    return localStorage.getItem('intelligence_user_voted_sector') || localStorage.getItem('oenovia_user_voted_sector');
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('intelligence_sector_poll_v2') || localStorage.getItem('oenovia_sector_poll_v2');
      if (saved) setVotes(JSON.parse(saved));
      
      const userVoted = localStorage.getItem('intelligence_user_voted_sector') || localStorage.getItem('oenovia_user_voted_sector');
      if (userVoted) {
        setHasVoted(true);
        setVotedId(userVoted);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleVote = (id: string) => {
    if (hasVoted) return;

    const updatedVotes = { ...votes, [id]: (votes[id] || 0) + 1 };
    setVotes(updatedVotes);
    setHasVoted(true);
    setVotedId(id);
    localStorage.setItem('intelligence_sector_poll_v2', JSON.stringify(updatedVotes));
    localStorage.setItem('intelligence_user_voted_sector', id);
  };

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] shadow-[8px_8px_0px_#10b981] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
        <BarChart3 className="w-48 h-48" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-emerald-500">Market Intelligence Poll</h4>
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-serif font-black italic leading-[1.1] tracking-tight">
            Which intelligence core module is most critical for your sector's evolution?
          </h3>
          <p className="text-[10px] font-mono font-bold uppercase opacity-50 italic">
            Synthesizing industry interest to prioritize neural development.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          {POLL_CONFIG.map((option) => {
            const optionVotes = votes[option.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const isVoted = votedId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={`w-full text-left relative overflow-hidden border transition-all duration-300 ${
                  hasVoted 
                    ? 'border-white/5 cursor-default' 
                    : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5 cursor-pointer'
                } ${isVoted ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
              >
                {/* Progress Bar Background */}
                <AnimatePresence>
                  {hasVoted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-0 bg-emerald-500/10 z-0"
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-none ${isVoted ? 'text-emerald-500' : 'text-stone-500'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        {option.label}
                        {isVoted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </p>
                      <p className="text-[9px] font-mono opacity-50 italic">{option.description}</p>
                    </div>
                  </div>
                  
                  {hasVoted && (
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-emerald-500">{percentage}%</p>
                      <p className="text-[8px] font-mono opacity-30 uppercase">{optionVotes} Votes</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-stone-500" />
            <span className="text-[9px] font-mono font-bold uppercase text-stone-500">
              Total Industry Responses: {totalVotes}
            </span>
          </div>
          {hasVoted && (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-mono font-bold uppercase text-emerald-500 italic">
                Data Synced to Intelligence Core
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
