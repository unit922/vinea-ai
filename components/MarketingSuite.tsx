
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Linkedin, 
  Sparkles, 
  Loader2, 
  Share2, 
  Copy, 
  Check, 
  Play, 
  RotateCcw,
  Film,
  Type as TypeIcon,
  Mail,
  Code,
  Globe,
  Database,
  Eye,
  Terminal
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { InventoryItem, RestaurantProfile } from '../lib/types';

interface MarketingSuiteProps {
  profile: RestaurantProfile;
  inventory: InventoryItem[];
  onBack?: () => void;
}

interface PromoScene {
  description: string;
  visualPrompt: string;
  imageUrl?: string;
}

interface PromoCampaign {
  videoScript: string;
  linkedInPost: string;
  videoPrompt: string;
  scenes: PromoScene[];
}

const MarketingSuite: React.FC<MarketingSuiteProps> = ({ profile, inventory, onBack }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [theme, setTheme] = useState('Luxury & Sophistication');
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<PromoCampaign | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const institutionalAssets = [
    {
      id: 'platform',
      title: 'Vinetelligence Ecosystem',
      icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
      content: "Vinetelligence bridges the gap between traditional service and neural intelligence. By mapping palate DNA and predicting consumption velocity, we empower establishments to yield higher margins while delivering unparalleled guest experiences. #HospitalitySynthesized #VinetelligenceAI",
      description: "Core platform vision and value proposition."
    },
    {
      id: 'tiers',
      title: 'Architecture Tiers',
      icon: <Check className="w-5 h-5 text-emerald-500" />,
      content: "Select your protocol. From the local 'Explorer' demo to the enterprise-grade 'Architect' silo, Vinetelligence scales with your vision. Higher tiers unlock multimodal vision audits, predictive pricing, and investor intelligence nodes. #VinetelligenceOS #Tiers #HospitalityTech",
      description: "Highlighting the Explorer, Operator, Visionary, and Architect editions."
    },
    {
      id: 'gm_outreach',
      title: 'GM Email Outreach',
      icon: <Mail className="w-5 h-5 text-blue-500" />,
      content: `Most high-volume spots lose 15% to 20% of their beverage revenue to hidden inventory leakage and mismatched roster schedules. We built Vinetelligence to stop that. It natively plugs into your [Toast / Oracle Micros] stack to recover that margin. On average, our partners see a 32.4% yield increase. I ran a quick simulation based on your menu profile. You can see the live data dashboard and how it flags leakage in under 60 seconds here: [Link: Launch Interactive Demo] (No signup required).`,
      description: "High-impact email template targeting General Managers and Beverage Directors."
    }
  ];

  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);

  // Syndication & Widget Embed Studio state
  const [embedTheme, setEmbedTheme] = useState<'dark' | 'light'>('dark');
  const [embedHeight, setEmbedHeight] = useState('720');
  const [embedAppTarget, setEmbedAppTarget] = useState<'vinetelligence' | 'vinea'>('vinetelligence');
  const [showLiveEmbedPreview, setShowLiveEmbedPreview] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vinetelligence.live';
  const liveEmbedUrl = `${baseUrl}?embed=${embedAppTarget}&theme=${embedTheme}`;

  const iframeSnippet = `<!-- Aetheria AI Hospitality & Vinetelligence Sommelier Widget -->
<iframe
  src="${liveEmbedUrl}"
  width="100%"
  height="${embedHeight}"
  style="border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);"
  title="Aetheria AI Hospitality & Sommelier Suite on Vinetelligence.live"
  allow="camera; microphone; geolocation"
></iframe>`;

  const syndicationJson = JSON.stringify({
    partnerBrand: "Aetheria AI Hospitality & Residences",
    syndicationTarget: "Vinetelligence.live",
    campaignTitle: "Aetheria AI Hospitality x Vinetelligence Master Sommelier Platform",
    featuredCellarBottles: 6420,
    headline: "Transforming Luxury Hotel Stays with Generative AI Concierge & Smart Cellar Vaults",
    liveAppUrl: baseUrl,
    keyFeatures: [
      "24/7 Gemini 3.6 Multimodal AI Concierge",
      "Vinetelligence AI Wine Label Vision & Dish Pairing Engine",
      "ASSA ABLOY Smart Room Key & In-Suite Cellar Dispatch",
      "Multi-tenant Firestore Database Architecture for Hotels & Wineries"
    ]
  }, null, 2);

  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-expect-error - AI Studio platform global
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-expect-error - AI Studio platform global
        const result = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(result);
      } else {
        // Fallback for dev/demo if not in AI Studio environment
        setHasApiKey(!!(process.env.GEMINI_API_KEY || profile.geminiApiKey));
      }
    };
    checkApiKey();
  }, [profile.geminiApiKey]);

  const toggleItem = (name: string) => {
    setSelectedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleGenerateCampaign = async () => {
    if (selectedItems.length === 0) return;
    setIsGenerating(true);
    setGenerationStatus('Synthesizing institutional assets...');
    try {
      const data = await geminiService.generatePromoCampaign({
        establishmentName: profile.name,
        items: selectedItems,
        theme
      });
      setCampaign(data);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Failed to generate campaign", error);
      if (error.isPermissionError) {
        setGenerationStatus('Access Denied: Please provision an API Key with model permissions in Settings.');
      } else {
        setGenerationStatus('Synchronization interrupted. Retrying protocols...');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenApiKey = async () => {
    // @ts-expect-error - AI Studio platform global
    if (window.aistudio?.openSelectKey) {
      // @ts-expect-error - AI Studio platform global
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleAuditionScenes = async () => {
    if (!campaign?.scenes) return;
    setIsGeneratingFrames(true);
    try {
      const updatedScenes = [...campaign.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        setGenerationStatus(`Synthesizing Frame ${i + 1}/${updatedScenes.length}...`);
        const result = await geminiService.generateSceneFrame(updatedScenes[i].visualPrompt);
        updatedScenes[i].imageUrl = result.imageUrl;
        setCampaign({ ...campaign, scenes: updatedScenes });
      }
      setGenerationStatus('Visual audit complete.');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Frame generation failed", error);
      if (error.isPermissionError) {
        setGenerationStatus('Frame Access Denied: Check API model permissions.');
      }
    } finally {
      setIsGeneratingFrames(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!campaign?.videoPrompt) return;
    
    setIsVideoGenerating(true);
    setGenerationStatus('Synthesizing cinematic shots...');
    
    try {
      const operation = await geminiService.startVideoGeneration(campaign.videoPrompt);
      let currentOp = operation;
      
      const poll = async () => {
        if (!currentOp.done) {
          setGenerationStatus('Rendering temporal aesthetics (this takes 1-2 minutes)...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          currentOp = await geminiService.pollVideoStatus(currentOp.name);
          await poll();
        }
      };
      
      await poll();
      
      if (currentOp.response?.generatedVideos?.[0]?.video?.uri) {
        const uri = currentOp.response.generatedVideos[0].video.uri;
        // Fetch the video with original API Key
        const apiKey = profile.geminiApiKey || process.env.GEMINI_API_KEY || "";
        const response = await fetch(uri, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey }
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setGenerationStatus('Cinematic render complete.');
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Video generation failed", error);
      if (error?.message?.includes("permission denied") || error?.message?.includes("403") || error.isPermissionError) {
        setGenerationStatus('Veo Access Denied: This model requires specific allowlisting on your API Key.');
      } else {
        setGenerationStatus('Synthesis interrupted. Check credentials.');
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-stone-500 hover:text-white transition-all active:scale-90"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-serif font-black italic text-white tracking-tighter">Marketing Suite</h2>
            <p className="text-stone-500 font-medium italic text-sm tracking-tight">AI-Powered Social Media Promotion Generator</p>
          </div>
        </div>
      </div>
      
      {/* Visitor Intelligence Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-emerald-950/40 border border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col justify-between hover:bg-emerald-950/60 transition-all">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic mb-4">Neural Traffic Scan</p>
            <div>
               <p className="text-4xl font-serif font-black italic text-white animate-pulse">428</p>
               <p className="text-[9px] font-bold text-stone-500 uppercase mt-1">Visitors (Promo View)</p>
            </div>
         </div>
          <div className="bg-stone-900/50 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic mb-4">Interest Synthesis</p>
            <div className="flex flex-wrap gap-2">
               {['Cabernet', 'Modern Art', 'Sustainability', 'VIP Pairing'].map(tag => (
                 <span key={tag} className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-stone-400 uppercase border border-white/5">
                   {tag}
                 </span>
               ))}
            </div>
         </div>
         <div className="bg-stone-900/50 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic mb-4">Conversion Alpha</p>
            <div>
               <p className="text-4xl font-serif font-black italic text-white">12.5%</p>
               <p className="text-[9px] font-bold text-stone-500 uppercase mt-1">Lead Capture Velocity</p>
            </div>
         </div>
         <div className="bg-stone-900/50 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic mb-4">Network Attribution</p>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Linkedin className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-sm font-black text-white">LinkedIn Sync</p>
                  <p className="text-[9px] font-bold text-stone-500 uppercase">Primary Catalyst</p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-stone-900/50 border border-white/5 rounded-[2rem] p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                <Film className="w-3 h-3" /> Select Featured Items
              </label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar touch-scrolling">
                {inventory.filter(i => ['Wine', 'Cocktail', 'Lunch', 'Dinner'].includes(i.category)).map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.name)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-xs font-medium italic flex justify-between items-center ${
                      selectedItems.includes(item.name)
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                        : 'bg-stone-800/30 border-white/5 text-stone-400 hover:border-white/10'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[9px] opacity-40 uppercase font-black">{item.category}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Campaign Theme
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Summer Soiree, Winter Warmth..."
                className="w-full bg-stone-800/50 border border-white/5 rounded-xl p-4 text-xs italic text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <button
              onClick={handleGenerateCampaign}
              disabled={isGenerating || selectedItems.length === 0}
              className="w-full py-4 bg-white text-stone-950 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-stone-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Digital Assets
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Institutional Promos (Always available) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-6">
            {institutionalAssets.map(asset => (
              <div key={asset.id} className="bg-stone-900/50 border border-white/5 rounded-[2.5rem] p-6 space-y-4 hover:border-white/10 transition-all group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center">
                      {asset.icon}
                    </div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">{asset.title}</h4>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(asset.content, asset.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-all"
                    title="Copy Content"
                  >
                    {copiedField === asset.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="bg-stone-950/50 rounded-xl p-4 border border-white/5">
                  <p className="text-[11px] text-stone-400 italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    "{asset.content}"
                  </p>
                </div>
                <p className="text-[9px] text-stone-600 font-medium italic">{asset.description}</p>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!campaign ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[3rem] space-y-4"
              >
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center text-stone-700">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-500 italic">No Campaign Generated</h3>
                <p className="text-xs text-stone-600 max-w-xs italic">Select your signature items and a theme to generate institutional marketing assets.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* LinkedIn Content */}
                <div className="bg-stone-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Linkedin className="w-32 h-32" />
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0077b5]/10 rounded-xl flex items-center justify-center text-[#0077b5]">
                        <Linkedin className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif font-bold text-white italic">LinkedIn Social Promo</h4>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(campaign.linkedInPost, 'linkedin')}
                      className="p-2 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      {copiedField === 'linkedin' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'linkedin' ? 'Copied' : 'Copy Post'}
                    </button>
                  </div>
                  <div className="bg-stone-950/50 rounded-2xl p-6 relative z-10">
                    <p className="text-sm text-stone-300 italic whitespace-pre-wrap leading-relaxed">
                      {campaign.linkedInPost}
                    </p>
                  </div>
                </div>

                  {/* Video Generation */}
                <div className="bg-stone-900/50 border border-white/10 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                        <Video className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif font-bold text-white italic">Cinematic Promo Video</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Storyboard View */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                          <TypeIcon className="w-3 h-3" /> Storyboard Evolution
                        </div>
                        {campaign.scenes && !videoUrl && !isVideoGenerating && (
                          <button
                            onClick={handleAuditionScenes}
                            disabled={isGeneratingFrames}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingFrames ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Synthesize Frames
                          </button>
                        )}
                      </div>
                      <div className="bg-stone-950/50 rounded-2xl p-6 h-[300px] overflow-hidden flex flex-col">
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 mb-4 touch-scrolling">
                          {campaign.scenes?.map((scene, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => setActiveFrameIndex(idx)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                activeFrameIndex === idx 
                                  ? 'bg-indigo-500/5 border-indigo-500/20' 
                                  : 'bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[9px] font-black text-stone-600 uppercase">Scene {idx + 1}</span>
                                {scene.imageUrl && <Check className="w-3 h-3 text-emerald-500" />}
                              </div>
                              <p className="text-[11px] text-stone-400 italic leading-relaxed">
                                {scene.description}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] text-stone-500 italic">
                            {campaign.videoScript.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Video Generator */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                        <Film className="w-3 h-3" /> Predictive Synthesis (Veo)
                      </div>
                      <div className="aspect-video bg-stone-950/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-0 text-center relative overflow-hidden shadow-2xl">
                        {videoUrl ? (
                          <video 
                            src={videoUrl} 
                            controls 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : isVideoGenerating || isGeneratingFrames ? (
                          <div className="p-8 space-y-6 w-full">
                             {/* Mock Frame Display during generation if we have image but no video yet */}
                             <div className="relative w-full aspect-video rounded-xl bg-stone-900 border border-white/5 overflow-hidden">
                                {campaign.scenes?.[activeFrameIndex]?.imageUrl ? (
                                  <motion.img 
                                    key={activeFrameIndex}
                                    initial={{ scale: 1.1, filter: 'blur(10px)', opacity: 0 }}
                                    animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                                    src={campaign.scenes[activeFrameIndex].imageUrl}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-stone-900">
                                    <Loader2 className="w-8 h-8 text-indigo-500/50 animate-spin" />
                                    <p className="text-[10px] text-stone-700 font-black uppercase tracking-widest">Aura Syncing...</p>
                                  </div>
                                )}
                             </div>
                            <div className="space-y-2">
                              <p className="text-xs text-white font-serif font-bold italic">{generationStatus}</p>
                              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-500"
                                  animate={{ width: isVideoGenerating ? '90%' : '100%' }}
                                  transition={{ duration: isVideoGenerating ? 60 : 1 }}
                                />
                              </div>
                              <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest">Global Cloud Synapse Active</p>
                            </div>
                          </div>
                        ) : campaign.scenes?.[activeFrameIndex]?.imageUrl ? (
                           <div className="group relative w-full h-full">
                              <img 
                                src={campaign.scenes[activeFrameIndex].imageUrl} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent p-8 flex flex-col justify-end text-left">
                                <p className="text-[10px] text-indigo-500 font-black uppercase mb-1">Scene {activeFrameIndex + 1}</p>
                                <p className="text-xs text-white font-serif font-bold italic">{campaign.scenes[activeFrameIndex].description}</p>
                              </div>
                              
                              <button
                                onClick={handleGenerateVideo}
                                className="absolute bottom-8 right-8 px-6 py-3 bg-white text-stone-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl flex items-center gap-2"
                              >
                                <Video className="w-4 h-4" /> Synthesize Reel
                              </button>
                              
                              <div className="absolute top-4 left-4 flex gap-1">
                                {campaign.scenes.map((_, i) => (
                                  <div 
                                    key={i}
                                    className={`w-6 h-1 rounded-full transition-all ${i === activeFrameIndex ? 'bg-indigo-500 w-12' : 'bg-white/20'}`}
                                  />
                                ))}
                              </div>
                           </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-110">
                              <Play className="w-8 h-8 text-stone-800" />
                            </div>
                            
                            {!hasApiKey ? (
                              <div className="space-y-4">
                                <p className="text-[10px] text-stone-500 font-medium italic">High-fidelity video synthesis requires AI Studio Enterprise access.</p>
                                <button 
                                  onClick={handleOpenApiKey}
                                  className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-500/20 transition-all font-sans"
                                >
                                  Provision Pro Credentials
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-6 px-8">
                                <div className="space-y-2">
                                  <p className="text-[10px] text-stone-400 font-medium italic leading-relaxed">
                                    Predictive engine ready to render institutional cinematic assets based on your curated selection.
                                  </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                  <button
                                    onClick={handleAuditionScenes}
                                    className="w-full py-3 bg-stone-800 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Film className="w-4 h-4" /> Audition Scenes
                                  </button>
                                  <button
                                    onClick={handleGenerateVideo}
                                    className="w-full py-4 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                  >
                                    <Sparkles className="w-4 h-4" /> Synthesize Full Video
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Visual Prompt Info */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Model Configuration</p>
                        <p className="text-[10px] text-stone-500 font-medium italic truncate">{campaign.videoPrompt}</p>
                      </div>
                      <button 
                         onClick={() => copyToClipboard(campaign.videoPrompt, 'prompt')}
                         className="p-2 hover:bg-white/10 rounded-lg text-stone-400"
                      >
                        {copiedField === 'prompt' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Aetheria AI Hospitality & Vinetelligence Partner Syndication & Widget Studio */}
      <div className="mt-12 bg-stone-900/60 border border-purple-500/20 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Code className="w-48 h-48 text-purple-400" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Globe className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-serif font-black italic text-white tracking-tight">
                Aetheria AI Hospitality & Partner Winery Syndication Studio
              </h3>
            </div>
            <p className="text-xs text-stone-400 italic">
              Paste the interactive Sommelier widget code or syndication feed onto any page on <span className="text-purple-400 font-mono font-bold">vinetelligence.live</span> or partner estate websites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLiveEmbedPreview(!showLiveEmbedPreview)}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              {showLiveEmbedPreview ? 'Hide Live Preview' : 'Test Live Widget'}
            </button>
          </div>
        </div>

        {/* Live Widget Preview Modal/Box */}
        {showLiveEmbedPreview && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 bg-stone-950 p-6 rounded-2xl border border-purple-500/30 shadow-2xl"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-purple-400 text-[11px] flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Live Interactive Preview Frame
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Active Protocol: {embedAppTarget.toUpperCase()}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl bg-black">
              <iframe
                src={liveEmbedUrl}
                width="100%"
                height={embedHeight}
                style={{ border: 'none' }}
                title="Aetheria AI Hospitality & Sommelier Suite Preview"
                allow="camera; microphone; geolocation"
              />
            </div>
          </motion.div>
        )}

        {/* Snippets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* HTML Iframe Widget Snippet */}
          <div className="bg-stone-950/80 rounded-2xl p-6 border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-black uppercase text-white tracking-widest">
                    1. Interactive Sommelier Widget HTML
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(iframeSnippet, 'widget_snippet')}
                  className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {copiedField === 'widget_snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'widget_snippet' ? 'Copied HTML' : 'Copy HTML Snippet'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Target Protocol</label>
                  <select 
                    value={embedAppTarget} 
                    onChange={e => setEmbedAppTarget(e.target.value as 'vinetelligence' | 'vinea')}
                    className="w-full mt-1 bg-stone-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-mono"
                  >
                    <option value="vinetelligence">Vinetelligence</option>
                    <option value="vinea">Vinea Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Theme</label>
                  <select 
                    value={embedTheme} 
                    onChange={e => setEmbedTheme(e.target.value as 'dark' | 'light')}
                    className="w-full mt-1 bg-stone-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-mono"
                  >
                    <option value="dark">Dark Luxury</option>
                    <option value="light">Light Minimal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Frame Height (px)</label>
                  <input 
                    type="text" 
                    value={embedHeight} 
                    onChange={e => setEmbedHeight(e.target.value)}
                    className="w-full mt-1 bg-stone-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-stone-900/90 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-purple-300 leading-relaxed overflow-x-auto whitespace-pre custom-scrollbar">
                {iframeSnippet}
              </div>
            </div>

            <p className="text-[10px] text-stone-500 italic">
              Paste into any HTML container, CMS widget block, or Shopify/WordPress partner template.
            </p>
          </div>

          {/* Syndication JSON Feed */}
          <div className="bg-stone-950/80 rounded-2xl p-6 border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase text-white tracking-widest">
                    2. Vinetelligence.live Syndication JSON Feed
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(syndicationJson, 'json_feed')}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {copiedField === 'json_feed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'json_feed' ? 'Copied JSON' : 'Copy JSON Feed'}
                </button>
              </div>

              <div className="bg-stone-900/90 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre custom-scrollbar max-h-56">
                {syndicationJson}
              </div>
            </div>

            <p className="text-[10px] text-stone-500 italic">
              Automated multi-tenant JSON feed used for REST/GraphQL API syndication across luxury hotels and partner cellars.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingSuite;
