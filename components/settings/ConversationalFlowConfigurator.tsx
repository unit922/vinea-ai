import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatbotNode {
  id: string;
  name: string;
  type: 'ai_response' | 'action_trigger' | 'human_escalation';
  triggers: string[];
  systemPrompt: string;
  actionPayload?: string;
  x: number;
  y: number;
}

interface ChatMessage {
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  nodeId?: string;
}

const PRESET_TEMPLATES: Record<string, { name: string; desc: string; nodes: ChatbotNode[] }> = {
  sommelier: {
    name: 'Caribbean Wine Sommelier',
    desc: 'Optimized for elegant wine consultations, cocktail styling, and fine-dining pairings.',
    nodes: [
      {
        id: 'node-welcome',
        name: 'Welcome Sommelier Service',
        type: 'ai_response',
        triggers: ['hello', 'hi', 'start', 'begin', 'welcome'],
        systemPrompt: 'You are a warm, sophisticated sommelier in a high-end Caribbean beachfront restaurant. Greet the guest with high hospitality, introduce yourself as the Vinea AI Sommelier, and inquire if they would like wine recommendations, food pairings, or table booking support.',
        x: 100,
        y: 120
      },
      {
        id: 'node-beverage',
        name: 'Palate pairing AI Assistant',
        type: 'ai_response',
        triggers: ['wine', 'drink', 'beverage', 'pair', 'seafood', 'menu', 'cocktail', 'steak'],
        systemPrompt: 'Provide prestigious wine pairing recommendations. Suggest crisp, light volcanic whites (e.g., Assyrtiko or Pinot Grigio) for fresh seafood on sunny patios. Suggest structural bold reds (e.g., Cabernet Sauvignons or Syrahs) for aged steak. Present choices inside an inviting luxury dialogue.',
        x: 400,
        y: 50
      },
      {
        id: 'node-booking',
        name: 'Reservation Concierge',
        type: 'action_trigger',
        triggers: ['book', 'table', 'reservation', 'reserve', 'seat', 'rsvp'],
        systemPrompt: 'Assist the guest in locking down a table reservation. Dynamically collect party size, date, time (standard dining hours), and dietary concerns. Keep the request concise and ultra-professional.',
        actionPayload: 'Trigger: DB Table Booking Hook',
        x: 400,
        y: 280
      },
      {
        id: 'node-escalate',
        name: 'Host Handover Tunnel',
        type: 'human_escalation',
        triggers: ['agent', 'human', 'help', 'manager', 'speak to someone', 'real person'],
        systemPrompt: 'Decline standard bot replies and guide the customer to a physical host. Apologize elegantly for the limitation and state that an on-site master host has been notified and is taking over the conversation thread on WhatsApp.',
        actionPayload: 'Alert: Host Terminal Node Dispatcher',
        x: 700,
        y: 160
      }
    ]
  },
  latenight: {
    name: 'Late-Night Sommelier & Bistro',
    desc: 'Tailored for late-night service, room service delivery, and prompt, nocturnal order captures.',
    nodes: [
      {
        id: 'node-welcome',
        name: 'Nocturnal Welcome Hub',
        type: 'ai_response',
        triggers: ['hello', 'hi', 'night', 'open', 'room service'],
        systemPrompt: 'You are the Elite Late-Night Butler for our luxury estate. Greet the guest politely and state our night sommelier cellar remains open. Highlight we deliver aged Caribbean rum selections and gourmet midnight bites straight to guest suites.',
        x: 100,
        y: 120
      },
      {
        id: 'node-beverage',
        name: 'Rum & Dessert Connoisseur',
        type: 'ai_response',
        triggers: ['rum', 'nightcap', 'dessert', 'whiskey', 'sweet', 'cigar'],
        systemPrompt: 'Exuberate expertise on matured Caribbean rums, premium cognacs, and artisan dark chocolate pairings. Focus on creating high-margin nightcap moments under cozy night atmospheres.',
        x: 400,
        y: 50
      },
      {
        id: 'node-booking',
        name: 'Midnight Express Order',
        type: 'action_trigger',
        triggers: ['order', 'room service', 'buy', 'deliver', 'food'],
        systemPrompt: 'Capture room service express orders on behalf of guests. Require their room number and selected night specials to trigger instant kitchen notification routing.',
        actionPayload: 'Trigger: Express POS Delivery Sync',
        x: 400,
        y: 280
      },
      {
        id: 'node-escalate',
        name: 'VIP Butler Override',
        type: 'human_escalation',
        triggers: ['emergency', 'manager', 'complaint', 'real person', 'help'],
        systemPrompt: 'Immediately hand over the line to the overnight supervisor Node with an extremely reassuring, attentive concierge tone.',
        actionPayload: 'Alert: Host Terminal Node Dispatcher',
        x: 700,
        y: 160
      }
    ]
  }
};

export const ConversationalFlowConfigurator: React.FC = () => {
  const [nodes, setNodes] = useState<ChatbotNode[]>(PRESET_TEMPLATES.sommelier.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-welcome');
  const [selectedPreset, setSelectedPreset] = useState<string>('sommelier');
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([
    { sender: 'system', text: 'WhatsApp Sandboxed Simulator Active. Type to interact with your configured Gemini Flow.', timestamp: '12:00' },
    { sender: 'bot', text: 'Hello! I am your Vinea AI Sommelier. Would you like a bespoke wine recommendation or food pairing tonight?', timestamp: '12:01', nodeId: 'node-welcome' }
  ]);
  const [userText, setUserText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // States of nodes for flow metrics calculation
  const [intentMatches, setIntentMatches] = useState<number>(31);
  const [handoffsCount, setHandoffsCount] = useState<number>(2);
  const [avgScore] = useState<number>(4.8);

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, isTyping]);

  const handleUpdatePreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setNodes(PRESET_TEMPLATES[presetKey].nodes);
    setSelectedNodeId(PRESET_TEMPLATES[presetKey].nodes[0].id);
    
    // Reset simulation
    const introNode = PRESET_TEMPLATES[presetKey].nodes[0];
    setSimMessages([
      { sender: 'system', text: `WhatsApp Simulator synchronized with template: ${PRESET_TEMPLATES[presetKey].name}`, timestamp: '12:00' },
      { sender: 'bot', text: 'Hello! Setting up flow. How can I assist you today?', timestamp: '12:01', nodeId: introNode.id }
    ]);
  };

  const handleUpdateNodeValue = <K extends keyof ChatbotNode>(key: K, value: ChatbotNode[K]) => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, [key]: value } : n));
  };

  // Node Drag and Drop Math
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    setIsDragging(nodeId);
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      setDragOffset({
        x: e.clientX - targetNode.x,
        y: e.clientY - targetNode.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const parentRect = e.currentTarget.getBoundingClientRect();
      const nextX = Math.max(10, Math.min(parentRect.width - 200, e.clientX - dragOffset.x));
      const nextY = Math.max(10, Math.min(parentRect.height - 120, e.clientY - dragOffset.y));
      
      setNodes(prev => prev.map(n => n.id === isDragging ? { ...n, x: nextX, y: nextY } : n));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(null);
  };

  // Add custom node
  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const newNode: ChatbotNode = {
      id,
      name: 'Custom Response Node',
      type: 'ai_response',
      triggers: ['special', 'promo'],
      systemPrompt: 'You are the Vinetelligence Specialty Coordinator. Introduce our nightly promotional offerings or VIP cellar events in a modern and appealing style.',
      x: 300,
      y: 180
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  // Simulated Chat Flow Match Engine
  const handleSendSimMessage = async () => {
    if (!userText.trim()) return;
    
    const text = userText.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg: ChatMessage = { sender: 'user', text, timestamp: now };
    setSimMessages(prev => [...prev, userMsg]);
    setUserText('');
    setIsTyping(true);

    // Call simulated delay
    setTimeout(async () => {
      // Intent Parser: Check triggers in order
      const lowercaseInput = text.toLowerCase();
      let matchedNode = nodes[0]; // default fallback (welcome or faq)
      let highestMatchScore = 0;

      for (const node of nodes) {
        let matches = 0;
        for (const trigger of node.triggers) {
          if (lowercaseInput.includes(trigger.toLowerCase())) {
            matches++;
          }
        }
        if (matches > highestMatchScore) {
          highestMatchScore = matches;
          matchedNode = node;
        }
      }

      // Record matches statistics
      setIntentMatches(prev => prev + 1);

      // Connect to Gemini if server is responding or fallback to static-guided LLM responses
      let replyText = '';
      try {
        const payload = {
          prompt: `User is chatting with a luxury establishment WhatsApp chatbot. 
Node Context: "${matchedNode.name}"
Instructions: "${matchedNode.systemPrompt}"
Incoming Message: "${text}"
Generate a short 1-2 sentence real-time WhatsApp response that sounds premium, direct, and adheres strictly to the instructions. No markdown outside basic italic/bold. Do not exceed 60 words.`,
          model: "gemini-3.5-flash"
        };

        const response = await fetch('/api/config/gemini-key') // Check key status
          .then(res => res.json())
          .catch(() => null);

        if (response && response.apiKey) {
          // Send actual simulation generation via proxy endpoint if key exists
          const genResponse = await fetch('/api/campaigns/preview', { // reuse preview mock route or fallback cleanly
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: payload.prompt })
          }).then(res => res.json()).catch(() => null);

          if (genResponse && genResponse.text) {
            replyText = genResponse.text;
          }
        }
      } catch {
        console.warn('Fallback local somatic LLM simulated response active due to connection status');
      }

      if (!replyText) {
        // High fidelity local guided somatic rules
        if (matchedNode.id === 'node-welcome') {
          replyText = `Welcome to Vinea Sommelier Cellars. ☀️ I am your personal hospitality specialist. Shall I suggest elegant wine pairings for seafood, or assist you in booking a waterfront table tonight?`;
        } else if (matchedNode.id === 'node-beverage') {
          replyText = `A majestic choice! For fresh fish or beach pastas, I highly suggest our chilled *Assyrtiko* volcanic white. For grilled lamb or steak, our reserve *Syrah* with dark berry notes is pristine.`;
        } else if (matchedNode.id === 'node-booking') {
          replyText = `Understood. I will prepare your table inquiry. Please provide your desired party size and dining hour (e.g., 7:00 PM) to confirm dynamic availability.`;
        } else if (matchedNode.id === 'node-escalate') {
          replyText = `Apologies for the brief limit! I've engaged our on-duty master butler. They are taking over this WhatsApp thread immediately. Please stand by for a manual response. 🤵`;
          setHandoffsCount(prev => prev + 1);
        } else {
          replyText = `Thank you. Following the custom instructions of *${matchedNode.name}*, I will guide you through our offerings. What other detail can I share?`;
        }
      }

      setIsTyping(false);
      setSimMessages(prev => [...prev, {
        sender: matchedNode.type === 'human_escalation' ? 'system' : 'bot',
        text: replyText,
        timestamp: now,
        nodeId: matchedNode.id
      }]);
      setSelectedNodeId(matchedNode.id);
    }, 1200);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodes.length <= 1) return; // Prevent deleting all nodes
    const remaining = nodes.filter(n => n.id !== nodeId);
    setNodes(remaining);
    setSelectedNodeId(remaining[0].id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Banner and Preset Sync */}
      <div className="bg-stone-900 border-2 border-stone-800 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3 z-10 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10b981] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            WhatsApp Gateway v4.2 Live Sync
          </span>
          <h2 className="text-3xl font-serif font-black italic tracking-tighter">Conversational Agent Configurator</h2>
          <p className="text-xs text-stone-300 font-medium leading-relaxed italic">
            Coordinate the cognitive flows of your Gemini-powered WhatsApp chatbot. Route incoming hospitality requests, map somatic sommeliers, or design human escalation gates instantly.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4 backdrop-blur-md min-w-[280px]">
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">Establishment Tone Preset</p>
          <div className="flex gap-2">
            {Object.entries(PRESET_TEMPLATES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleUpdatePreset(key)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedPreset === key ? 'bg-amber-500 text-stone-950 shadow-md transform -translate-y-0.5' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {value.name.split(' ')[0]} Cellar
              </button>
            ))}
          </div>
          <p className="text-[9px] text-stone-400 italic">*{PRESET_TEMPLATES[selectedPreset].desc}</p>
        </div>
      </div>

      {/* Analytics Meter Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Somatic Matches</p>
            <p className="text-2xl font-serif font-black italic text-stone-900">{intentMatches} Handshakes</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="fas fa-brain text-sm"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Escalation Handoffs</p>
            <p className="text-2xl font-serif font-black italic text-stone-900">{handoffsCount} Redirects</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-100">
            <i className="fas fa-user-tie text-sm"></i>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sentiment Resonance</p>
            <p className="text-2xl font-serif font-black italic text-stone-900">{avgScore} / 5 Stars</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
            <i className="fas fa-star text-sm animate-pulse"></i>
          </div>
        </div>
      </div>

      {/* main grid: left flow canvas & details, right whatsapp simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Visual Node Graph Canvas + Parameters Editor (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Visual Canvas Block */}
          <div className="bg-white rounded-[3rem] border border-stone-200 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100/50">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Visual Cognitive Flow Map</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase">Click to Select and Edit / Drag to Position Nodes</p>
              </div>
              <button
                onClick={handleAddNode}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all border border-stone-800 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Add Flow Node
              </button>
            </div>

            {/* Interactive Canvas Grid */}
            <div 
              className="relative w-full h-[400px] bg-stone-50 border-2 border-dashed border-stone-200/60 rounded-[2.5rem] overflow-hidden select-none"
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              {/* Grid Background Pattern */}
              <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(10,1fr)] opacity-[0.03] pointer-events-none">
                {Array.from({ length: 200 }).map((_, idx) => (
                  <div key={idx} className="border border-stone-900"></div>
                ))}
              </div>

              {/* Draw Connector Lines via SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8"/>
                  </marker>
                  <marker id="arrow-selected" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5"/>
                  </marker>
                </defs>
                {/* Connect Welcome Node sequentially to and through others */}
                {(() => {
                  const welcomeNode = nodes.find(n => n.id === 'node-welcome');
                  const targetList = nodes.filter(n => n.id !== 'node-welcome');
                  if (!welcomeNode) return null;
                  
                  return targetList.map((node) => {
                    // Line math
                    const startX = welcomeNode.x + 180;
                    const startY = welcomeNode.y + 40;
                    const endX = node.x;
                    const endY = node.y + 40;
                    const midX = (startX + endX) / 2;

                    const isLineSelected = selectedNodeId === node.id || selectedNodeId === 'node-welcome';

                    return (
                      <g key={`edge-${node.id}`} className="transition-all">
                        <path
                          d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                          fill="none"
                          stroke={isLineSelected ? '#4f46e5' : '#e2e8f0'}
                          strokeWidth={isLineSelected ? '3' : '2'}
                          strokeDasharray={node.type === 'human_escalation' ? '5,5' : undefined}
                          markerEnd={isLineSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
                          className="transition-all duration-300"
                        />
                        <foreignObject 
                          x={midX - 50} 
                          y={((startY + endY) / 2) - 10} 
                          width="100" 
                          height="20"
                        >
                          <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase text-center tracking-widest ${isLineSelected ? 'bg-indigo-100 text-indigo-700 font-bold border border-indigo-200' : 'bg-stone-50 text-stone-400 border border-stone-200'}`}>
                            {node.type === 'human_escalation' ? 'Fallback Trigger' : `Keywords match`}
                          </div>
                        </foreignObject>
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Render Draggable Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                
                return (
                  <motion.div
                    key={node.id}
                    className={`absolute w-[200px] bg-white rounded-2xl border-2 shadow-sm cursor-grab active:cursor-grabbing p-4 select-none ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-500/10 z-30' : 'border-stone-200/90 z-10'}`}
                    style={{ left: node.x, top: node.y }}
                    onMouseDown={(e) => {
                      setSelectedNodeId(node.id);
                      handleNodeMouseDown(e, node.id);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${node.type === 'human_escalation' ? 'bg-red-50 text-red-600 border border-red-100' : node.type === 'action_trigger' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {node.type.replace('_', ' ')}
                        </span>
                        {nodes.length > 1 && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteNode(node.id); 
                            }}
                            className="text-stone-300 hover:text-red-500 text-[10px] transition-colors"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                      
                      <h4 className="text-[11px] font-black uppercase tracking-tighter text-stone-900 truncate">
                        {node.name}
                      </h4>
                      <p className="text-[8px] text-stone-400 italic truncate leading-snug">
                        {node.systemPrompt}
                      </p>

                      <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                        {node.triggers.slice(0, 3).map((tr, idx) => (
                          <span key={idx} className="text-[7px] font-bold font-mono text-stone-500 bg-stone-100 px-1 py-0.5 rounded">
                            {tr}
                          </span>
                        ))}
                        {node.triggers.length > 3 && (
                          <span className="text-[7px] font-bold text-stone-400">+{node.triggers.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Configuration Parameter Deck (Editable fields for activeNode) */}
          <div className="bg-white rounded-[3rem] border border-stone-200 shadow-sm p-10 space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2 block italic">Parameter Calibration</span>
                <h3 className="text-2xl font-serif font-black italic tracking-tighter text-stone-900 shadow-sm pb-1.5 w-fit">Edit Node: {activeNode.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase bg-violet-50 text-indigo-600 px-3 py-1 rounded-full border border-violet-100 tracking-wider">Node Config Engine Enforced</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">Node Title Name</label>
                  <input
                    type="text"
                    value={activeNode.name}
                    onChange={(e) => handleUpdateNodeValue('name', e.target.value)}
                    className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">Node Output Flow Behavior Model</label>
                  <select
                    value={activeNode.type}
                    onChange={(e) => handleUpdateNodeValue('type', e.target.value)}
                    className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5"
                  >
                    <option value="ai_response">Generate Somatic AI Response</option>
                    <option value="action_trigger">Execute Automated Event Hook</option>
                    <option value="human_escalation">Relay Human Escalation Bypass</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">
                    Incoming Match Triggers (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={activeNode.triggers.join(', ')}
                    onChange={(e) => handleUpdateNodeValue('triggers', e.target.value.split(',').map(tr => tr.trim()))}
                    className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-stone-300"
                    placeholder="hello, wine, book, help"
                  />
                  <p className="text-[8px] text-stone-400 italic">Incoming messages containing these terms will automatically switch the chatbot thread context to this node.</p>
                </div>

                {activeNode.type !== 'ai_response' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">Action Payload Hook Identifier</label>
                    <input
                      type="text"
                      value={activeNode.actionPayload || ''}
                      onChange={(e) => handleUpdateNodeValue('actionPayload', e.target.value)}
                      className="w-full bg-indigo-50/50 border-2 border-indigo-100/60 text-indigo-950 font-mono rounded-2xl px-6 py-4 text-xs focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                      placeholder="e.g. system_event_booking_lock"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest pl-1">Gemini Semantic Prompt Directives</label>
                <textarea
                  value={activeNode.systemPrompt}
                  onChange={(e) => handleUpdateNodeValue('systemPrompt', e.target.value)}
                  className="w-full h-[240px] bg-stone-50 border-2 border-stone-100 rounded-[2rem] px-8 py-8 text-xs italic font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-stone-300 leading-relaxed shadow-inner"
                  placeholder="Tell Gemini how to behave and what constraints to enforce when responding on this channel..."
                />
                <div className="flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-3 rounded-xl">
                  <i className="fas fa-certificate text-amber-500 text-xs shrink-0"></i>
                  <p className="text-[9px] text-stone-500 leading-relaxed font-bold italic">
                    Ground Truth Rule Enforced: Somatic limits defined here override general model tendencies to prevent system hallucination on wine vintages or price quotes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: High Fidelity WhatsApp Simulator (4 Cols) */}
        <div className="xl:col-span-4 bg-stone-900 p-8 rounded-[3.5rem] shadow-2xl border-2 border-stone-800 text-stone-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest">WhatsApp Sandbox Sim</p>
              </div>
              <div className="px-3 py-1 bg-stone-800 rounded-md text-[8px] font-mono text-stone-400">
                Active Node: <span className="text-amber-500">{activeNode.name.split(' ')[0]}</span>
              </div>
            </div>

            {/* Smart Phone Container */}
            <div className="relative w-full aspect-[9/18] bg-stone-950 rounded-[3rem] border-[6px] border-stone-800 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              {/* Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-stone-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-stone-950 rounded-full"></div>
              </div>

              {/* WhatsApp App Blue/Gray Header */}
              <div className="bg-[#075e54] text-white pt-8 pb-3 px-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs border border-white/10 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                      className="w-full h-full object-cover"
                      alt="Vinea Sommelier Guide"
                    />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black truncate max-w-[120px]">Vinea AI Sommelier</h5>
                    <p className="text-[7.5px] text-emerald-100 opacity-90 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-300 rounded-full animate-ping"></span>
                      online
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 text-stone-200 text-xs items-center opacity-80">
                  <i className="fas fa-video"></i>
                  <i className="fas fa-phone"></i>
                  <i className="fas fa-ellipsis-v"></i>
                </div>
              </div>

              {/* Chat Thread Canvas */}
              <div 
                className="flex-1 bg-[#efe7dd] p-4 overflow-y-auto space-y-4 flex flex-col justify-end"
                style={{ backgroundImage: 'radial-gradient(circle, #e5ddd5 10%, transparent 11%)', backgroundSize: '12px 12px' }}
              >
                <div className="flex-1"></div>
                <AnimatePresence initial={false}>
                  {simMessages.map((msg, i) => {
                    if (msg.sender === 'system') {
                      return (
                        <div key={i} className="text-center my-2 p-2 bg-[#d4ebd5]/80 border border-[#b2dbb4]/50 rounded-xl text-[7.5px] font-mono text-emerald-800 font-bold uppercase tracking-widest leading-none">
                          {msg.text}
                        </div>
                      );
                    }

                    const isBot = msg.sender === 'bot';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[10.5px] leading-relaxed shadow-sm relative ${isBot ? 'bg-white text-stone-900 rounded-tl-sm border-b border-stone-200' : 'bg-[#dcf8c6] text-stone-950 rounded-tr-sm'}`}>
                          <p className="font-medium whitespace-pre-line">{msg.text}</p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-500/5">
                            {msg.nodeId && (
                              <span className="text-[6.5px] opacity-60 font-mono uppercase bg-black/5 px-1 py-0.5 rounded leading-none mr-4">
                                {nodes.find(n => n.id === msg.nodeId)?.name.split(' ')[0]}
                              </span>
                            )}
                            <span className="text-[7px] text-stone-400 block text-right">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-stone-100 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-[#075e54] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Entry Pad */}
              <div className="p-3 bg-[#f0f0f0] border-t border-stone-200 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm border border-stone-200">
                  <i className="far fa-face-smile text-stone-400 text-sm"></i>
                  <input
                    type="text"
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendSimMessage(); }}
                    placeholder="Type a WhatsApp message..."
                    className="flex-1 text-[11px] bg-transparent outline-none text-stone-900 border-none placeholder:text-stone-300"
                  />
                  <i className="fas fa-paperclip text-stone-400 text-sm"></i>
                </div>

                <button
                  onClick={handleSendSimMessage}
                  className="w-10 h-10 bg-[#075e54] hover:bg-[#128c7e] text-white rounded-full flex items-center justify-center shadow transition-colors shrink-0"
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ConversationalFlowConfigurator;
