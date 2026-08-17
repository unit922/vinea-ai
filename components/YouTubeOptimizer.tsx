import React, { useState } from 'react';
import { 
  Youtube, 
  TrendingUp, 
  Clock, 
  Play, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Target, 
  MessageSquare, 
  AlertTriangle 
} from 'lucide-react';

interface ScriptSection {
  title: string;
  recommendedDuration: string;
  thePrimalGoal: string;
  currentFlaw: string;
  proposedFix: string;
  interactivePlaceholder: string;
}

export const YouTubeOptimizer: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<'intro' | 'mid' | 'end'>('intro');
  const [interactiveScript, setInteractiveScript] = useState({
    hookText: 'What if you could replace every manual hospitality audit clipboard with a single high-fidelity intelligence stream? Inside the next 5 minutes...',
    midText: 'The core bottleneck in luxury resort cells isn\'t staff capabilities; it\'s information asymmetry. Let\'s look at how the Vinetelligence core node...',
    outroText: 'Before we summarize our strategic analysis, click the link in the description to run a complimentary 5-minute ROI audit for your establishment.'
  });

  // Analytics State
  const metrics = {
    title: "Vinetelligence AI Hospitality Beverage",
    views: 25,
    viewsVsTypical: "Aligned with channel benchmarks",
    ctr: "3.1%",
    ctrTypical: "3.1%",
    avd: "6:46",
    avdTypical: "7:02",
    watchTimeTotal: "2.8 Hours",
    highIntentRetention: "47% flat (4:00 - 9:00)"
  };

  const segmentGuides: Record<'intro' | 'mid' | 'end', ScriptSection> = {
    intro: {
      title: 'The Unstoppable 10-Second Hook',
      recommendedDuration: '0:00 - 0:45',
      thePrimalGoal: 'Maintain the 79% introductory hook and completely eliminate the 30% drop-off in the transition to the main content block.',
      currentFlaw: 'Retention dips from 100% to 68% in the first 45 seconds. This indicates the primary hook was strong, but we lost velocity when transitioning to the logo, introduction, or slides.',
      proposedFix: 'Exhaustively avoid long logo screen rollouts or personal introductions. Jump straight from the hook directly into the core solution within 8 seconds.',
      interactivePlaceholder: 'Write your 10-second opening statement...'
    },
    mid: {
      title: 'The Flatline Retention Plateau',
      recommendedDuration: '4:00 - 9:00',
      thePrimalGoal: 'Capitalize on the legendary 47% hyper-flat retention rate to nurture a highly committed, high-intent audience segment.',
      currentFlaw: 'No flaws identified here. Viewers who crossed the 3-minute milestone stayed with perfect momentum. This shows your deep technical substance is extremely engaging.',
      proposedFix: 'Double-down on the style of raw, premium dashboard screencasts and clinical analyses. Avoid generic stock footages; your target audience values extreme precision.',
      interactivePlaceholder: 'Write your core educational reveal segment...'
    },
    end: {
      title: 'The Pre-Outro Call-to-Action (CTA)',
      recommendedDuration: '6:00 - End',
      thePrimalGoal: 'Prevent late-stage viewer dispersion by positioning the highest-converting B2B call-to-action BEFORE the wrap-up slides start.',
      currentFlaw: 'A steep drop-off occurs as soon as the concluding remarks are announced. Viewers instantly click away when they sense the educational portion is complete.',
      proposedFix: 'Deliver the CTA to click "the link below to request a private dossier" EXACTLY before starting the final slide summaries. Do not say "In summary" or "Finally".',
      interactivePlaceholder: 'Write your high-converting transitional command...'
    }
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const downloadOptimizedPlan = () => {
    const brief = `📊 YOUTUBE B2B PERFORMANCE AUDIT & COMPANION SCRIPT
Video Segment: ${metrics.title}

=========================================
1. HISTORIC METRICS DEBRIEFING
=========================================
- Total Views: ${metrics.views} (Typical benchmark: 24)
- Average View Duration (AVD): ${metrics.avd} (Typical: ${metrics.avdTypical})
- Click-Through Rate (CTR): ${metrics.ctr}
- Overall Watch Time: ${metrics.watchTimeTotal}
- Primary Core Trend: Legendary 47% retention plateau between the 4:00 and 9:00 marks. Highly qualified leads.

=========================================
2. OPTIMIZED HIGH-CONVERSION SCRIPT
=========================================
[0:00 - 0:45] INTRO HOOK TRANSITION:
"${interactiveScript.hookText}"

[4:00 - 9:00] CORE RETENTION ANCHOR:
"${interactiveScript.midText}"

[BEFORE WRAP-UP] REVENUE CTA NODE:
"${interactiveScript.outroText}"

=========================================
Action Plan:
1. Eliminate logo loops in first 15 seconds.
2. Insert CTA card before concluding the screen.
3. Test a high-contrast clinical white schema for the thumbnail.`;

    navigator.clipboard.writeText(brief);
    setCopiedText('full-strategic-plan');
    setTimeout(() => setCopiedText(null), 3000);
  };

  return (
    <div id="youtube-retention-optimizer-catalyst" className="space-y-12">
      {/* Intro banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-10 bg-red-950/20 border border-red-500/15 rounded-[3rem] text-stone-900">
        <div className="space-y-3 font-sans max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-550/10 text-red-700 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            <Youtube size={12} className="text-red-600 animate-pulse" />
            B2B YouTube Optimizer
          </div>
          <h3 className="text-3xl font-serif font-black italic tracking-tight text-stone-900">
            Let’s Scale the Next Upload.
          </h3>
          <p className="text-stone-600 text-xs leading-relaxed font-semibold">
            Based on the actual metrics of your latest video upload, you are speaking directly to a highly-sophisticated, high-intent audience. Use this customized workspace simulator to iron out the first-minute drop-off and capture those leads securely.
          </p>
        </div>

        <button
          onClick={downloadOptimizedPlan}
          className="px-6 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-850 shrink-0 transition-all flex items-center gap-2 cursor-pointer border border-stone-800"
        >
          {copiedText === 'full-strategic-plan' ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Blueprint Copied!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Copy Complete Script Blueprint</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Metrics Dashboard & Interactive Segment Optimizer */}
      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Left Side: Diagnostics Display */}
        <div className="lg:col-span-5 space-y-8 font-sans">
          
          {/* Historical Vital Signs */}
          <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
              <TrendingUp className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-black uppercase text-stone-900 tracking-widest font-mono">Performance Core Indicators</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider font-mono">Channel Views</p>
                <p className="text-3xl font-serif font-black text-stone-900">25</p>
                <span className="inline-block text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">
                  +4% Above typical
                </span>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider font-mono">Click-Through Rate</p>
                <p className="text-3xl font-serif font-black text-stone-900">3.1%</p>
                <span className="inline-block text-[9px] text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full">
                  Perfect typical match
                </span>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider font-mono">Avg View Duration</p>
                <p className="text-3xl font-serif font-black text-stone-900">6:46</p>
                <span className="inline-block text-[9px] text-stone-500 font-extrabold bg-stone-100 px-2 py-0.5 rounded-full">
                  Target: 7:02
                </span>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider font-mono">Watch Time Accumulation</p>
                <p className="text-3xl font-serif font-black text-stone-900">2.8h</p>
                <span className="inline-block text-[9px] text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full">
                  High-Value Leads
                </span>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-red-800 tracking-wider font-mono">Retention Diagnostics</p>
                <p className="text-stone-600 text-xs font-semibold leading-relaxed mt-1">
                  Viewer count drops to 68% between 0:10 and 0:45. Viewers who endure the drop flatline at 47% all the way through to 9:00. This is an elite client retention curve: adjust the start & end to trigger massive lead spikes.
                </p>
              </div>
            </div>
          </div>

          {/* Retention Curve Simulator Graph (Interactive) */}
          <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-2">
              <Clock className="w-4 h-4 text-stone-600" />
              <h4 className="text-xs font-black uppercase text-stone-900 tracking-widest font-mono">Interactive Retention Navigator</h4>
            </div>
            <p className="text-[10px] text-stone-500 font-semibold italic">Click the specific video segments below to optimize the underlying scripts.</p>

            <div className="space-y-3 pt-2">
              {[
                { key: 'intro', range: '0:00 - 0:45', percentage: '100% → 68%', label: 'Intro Hook Transition', status: 'Warning: Dip Detected', colorClass: 'bg-red-500' },
                { key: 'mid', range: '0:45 - 6:00', percentage: '47% Plateau', label: 'Mid-Video Core Insight', status: 'Solid: Flatline Retention', colorClass: 'bg-emerald-500' },
                { key: 'end', range: '6:00 - 10:00', percentage: '68% → 32%', label: 'Closing & CTA Node', status: 'Review needed: Screen Exit', colorClass: 'bg-amber-500' }
              ].map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => setActiveSegment(seg.key as 'intro' | 'mid' | 'end')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    activeSegment === seg.key 
                      ? 'bg-stone-900 border-stone-900 text-white shadow-md' 
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-750'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${seg.colorClass}`} />
                      <p className="text-xs font-black uppercase tracking-wider">{seg.label}</p>
                    </div>
                    <p className={`text-[10px] font-semibold italic ${activeSegment === seg.key ? 'text-stone-400' : 'text-stone-500'}`}>{seg.range} ({seg.percentage})</p>
                  </div>

                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activeSegment === seg.key 
                      ? 'bg-white/10 text-stone-200 border border-white/15' 
                      : 'bg-stone-200 text-stone-600 border border-stone-300'
                  }`}>
                    {activeSegment === seg.key ? 'Selected' : 'Optimize'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Script Optimization Workshop */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          <div className="bg-white border border-stone-200 rounded-[3.5rem] p-8 md:p-12 space-y-8 shadow-sm flex-1">
            
            {/* Optimizer Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-stone-200">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 font-mono">
                  Optimizing Block: {segmentGuides[activeSegment].recommendedDuration}
                </p>
                <h4 className="text-2xl font-serif font-black text-stone-900 italic">
                  {segmentGuides[activeSegment].title}
                </h4>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-[10px] font-black uppercase tracking-wider font-mono">
                <Target size={12} />
                <span>Segment Focus</span>
              </div>
            </div>

            {/* Diagnostics Analysis Grid */}
            <div className="space-y-6 font-sans">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest font-mono">The Strategic Flaw</p>
                  <p className="text-stone-600 text-xs leading-relaxed font-semibold">
                    {segmentGuides[activeSegment].currentFlaw}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest font-mono">The AI Growth Solution</p>
                  <p className="text-stone-600 text-xs leading-relaxed font-semibold">
                    {segmentGuides[activeSegment].proposedFix}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900">
                  <MessageSquare size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest font-mono">Target Executive Goal</p>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed font-semibold italic">
                  {segmentGuides[activeSegment].thePrimalGoal}
                </p>
              </div>

              {/* Dynamic script editor input box */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest font-mono">
                  {segmentGuides[activeSegment].interactivePlaceholder}
                </label>
                
                <div className="relative">
                  <textarea
                    rows={4}
                    value={
                      activeSegment === 'intro' ? interactiveScript.hookText :
                      activeSegment === 'mid' ? interactiveScript.midText :
                      interactiveScript.outroText
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setInteractiveScript(prev => ({
                        ...prev,
                        ...(activeSegment === 'intro' && { hookText: val }),
                        ...(activeSegment === 'mid' && { midText: val }),
                        ...(activeSegment === 'end' && { outroText: val })
                      }));
                    }}
                    className="w-full p-4 border border-stone-250 bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-stone-805 leading-relaxed"
                  />
                  
                  <button
                    onClick={() => {
                      const text = activeSegment === 'intro' ? interactiveScript.hookText :
                        activeSegment === 'mid' ? interactiveScript.midText :
                        interactiveScript.outroText;
                      handleCopyText(`segment-${activeSegment}`, text);
                    }}
                    className="absolute bottom-4 right-4 p-2 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white rounded-lg text-[10px] flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer"
                  >
                    {copiedText === `segment-${activeSegment}` ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="font-bold uppercase">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span className="font-bold uppercase text-[9px]">Copy block</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Strategic Summary Advice */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider font-mono">B2B Thumbnail Tip:</p>
                <span className="text-stone-700 text-xs font-semibold">Test a high-contrast white layout.</span>
              </div>

              <div className="flex items-center gap-1.5 text-stone-500 font-bold hover:text-stone-903 cursor-pointer text-xs transition-colors"
                   onClick={() => setActiveSegment(activeSegment === 'intro' ? 'mid' : activeSegment === 'mid' ? 'end' : 'intro')}>
                <span>Next segment optimizer</span>
                <ArrowRight size={14} />
              </div>
            </div>

          </div>

          {/* Quick YouTube Strategy card */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
              <Play size={18} />
            </div>
            <div className="space-y-1 max-w-xl font-sans">
              <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-mono">Strategic Counsel from ForItGLO</h5>
              <p className="text-[11px] text-stone-600 font-semibold leading-relaxed">
                Because your views have extreme view duration (average <span className="text-amber-900 underline font-extrabold">{metrics.avd}</span>), the algorithm represents your video to a "high-intent cohort." Keep content deeply informative, shorten the logo transition sequence, and maintain your professional B2B narrative!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
