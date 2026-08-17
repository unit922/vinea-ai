import React, { useState, useRef } from 'react';

interface ThreadMessage {
  id: string;
  sender: 'guest' | 'staff' | 'assistant';
  text: string;
  timestamp: string;
  channel: 'whatsapp' | 'sms' | 'email';
}

interface CustomerThread {
  id: string;
  customerName: string;
  customerPhone: string;
  channel: 'whatsapp' | 'sms' | 'email';
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatar: string;
  palateTags: string[];
  messages: ThreadMessage[];
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

const INITIAL_THREADS: CustomerThread[] = [
  {
    id: 'thread-1',
    customerName: 'Marcus Sterling',
    customerPhone: '+1 (246) 555-0192',
    channel: 'whatsapp',
    lastMessage: 'Can you reserve a table for 4 near the patio tonight?',
    time: '2 mins ago',
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    palateTags: ['Volcanic Whites', 'Peated Malts', 'Riesling'],
    messages: [
      { id: 'm1', sender: 'staff', text: 'Welcome Marcus, your bespoke guest profile is verified with our Caribbean Node.', timestamp: '11:40 AM', channel: 'whatsapp' },
      { id: 'm2', sender: 'guest', text: 'Thank you! I was hoping to dine on the deck.', timestamp: '11:42 AM', channel: 'whatsapp' },
      { id: 'm3', sender: 'assistant', text: 'Vinea AI: Ground deck reservation recommended. Marcus is associated with our high-end patio pairings directory.', timestamp: '11:43 AM', channel: 'whatsapp' },
      { id: 'm4', sender: 'guest', text: 'Can you reserve a table for 4 near the patio tonight?', timestamp: '12:48 PM', channel: 'whatsapp' }
    ]
  },
  {
    id: 'thread-2',
    customerName: 'Elena Rostova',
    customerPhone: '+1 (305) 555-8310',
    channel: 'sms',
    lastMessage: 'Which organic vintage did we pair with the grilled seafood yesterday?',
    time: '24 mins ago',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    palateTags: ['Zero-Proof', 'Biodynamic', 'Chablis'],
    messages: [
      { id: 'm2-1', sender: 'guest', text: 'We absolute loved the wine service yesterday.', timestamp: 'Yesterday', channel: 'sms' },
      { id: 'm2-2', sender: 'staff', text: 'It was our absolute pleasure hosting you at Oenovia.', timestamp: 'Yesterday', channel: 'sms' },
      { id: 'm2-3', sender: 'guest', text: 'Which organic vintage did we pair with the grilled seafood yesterday?', timestamp: '12:26 PM', channel: 'sms' }
    ]
  },
  {
    id: 'thread-3',
    customerName: 'Julian Blackwood',
    customerPhone: 'j.blackwood@luxestates.com',
    channel: 'email',
    lastMessage: 'Inquiry regarding the Caribbean private cellar event on Saturday.',
    time: '2 hours ago',
    unreadCount: 3,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    palateTags: ['Vintage Champagne', 'Aged Bordeaux', 'Somatic Tasting'],
    messages: [
      { id: 'm3-1', sender: 'guest', text: 'Hello, our group is arriving via charter this Friday.', timestamp: '10:15 AM', channel: 'email' },
      { id: 'm3-2', sender: 'guest', text: 'Inquiry regarding the Caribbean private cellar event on Saturday.', timestamp: '10:16 AM', channel: 'email' }
    ]
  }
];

const PRESETS: MessageTemplate[] = [
  {
    id: 't-prearrival',
    name: 'Pre-Arrival Palate Questionnaire',
    subject: 'Pre-arrival tasting survey for {{guestName}}',
    body: 'Greetings {{guestName}}, we are preparing for your stay at {{venueName}}. To deliver custom-styled pairings, what is your preferred wine category (e.g., Bold Reds, Crisp Whites)?',
    variables: ['guestName', 'venueName']
  },
  {
    id: 't-gm-outreach',
    name: 'GM / Beverage Director Outreach',
    subject: 'Optimizing beverage margins at {{venueName}}',
    body: 'Most high-volume spots lose 15% to 20% of their beverage revenue to hidden inventory leakage and mismatched roster schedules. We built Vinetelligence to stop that. It natively plugs into your Toast or Oracle Micros stack to recover that margin. On average, our partners see a 32.4% yield increase. I ran a quick simulation based on your menu profile. You can see the live data dashboard and how it flags leakage in under 60 seconds here: [Launch Interactive Demo] (No signup required).',
    variables: ['venueName']
  },
  {
    id: 't-[#flair]',
    name: 'Nightly Caribbean Flair Special Alert',
    subject: 'Evening Specials at {{venueName}}',
    body: 'Hi {{guestName}}! In tonight’s service, our Sommelier is unlocking a rare vintage pairing. Secure your waterfront reservation by replying BOOK to this thread.',
    variables: ['guestName', 'venueName']
  },
  {
    id: 't-confirm',
    name: 'VIP Sommelier confirmation',
    subject: 'Your Sommelier Table is Confirmed',
    body: 'Dear {{guestName}}, your exclusive table mapping under the stars is certified. Our cellars have set aside volcanic wines tuned to your favorite tags.',
    variables: ['guestName']
  }
];

export const OmnichannelDispatchDesk: React.FC = () => {
  const [threads, setThreads] = useState<CustomerThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [activeChannelFilter, setActiveChannelFilter] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [staffReplyText, setStaffReplyText] = useState('');
  
  // Template states
  const [templates, setTemplates] = useState<MessageTemplate[]>(PRESETS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t-prearrival');
  const [customSubject, setCustomSubject] = useState(PRESETS[0].subject);
  const [customBody, setCustomBody] = useState(PRESETS[0].body);
  
  // Simulation feedback alert
  const [notification, setNotification] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find(t => t.id === id);
    if (found) {
      setCustomSubject(found.subject);
      setCustomBody(found.body);
    }
  };

  // Compute AI Autodraft Recommendation
  const aiDraftRecommendation = (() => {
    if (!activeThread) return '';
    const lastGuestMsg = [...activeThread.messages].reverse().find(m => m.sender === 'guest')?.text || '';
    
    if (lastGuestMsg.toLowerCase().includes('patio') || lastGuestMsg.toLowerCase().includes('table')) {
      return `Marcus, we would be delighted to reserve a premium patio deck table for 4 tonight at Oenovia. I can lock this down for 7:00 PM. Shall I confirm?`;
    } else if (lastGuestMsg.toLowerCase().includes('organic') || lastGuestMsg.toLowerCase().includes('vintage')) {
      return `Elena, we paired your fresh sea bass yesterday with our organic 'AOP Chablis Domaine de la Mandre' 2021. It features exquisite flinty mineral tones.`;
    } else {
      return `Hello Julian, the Caribbean private cellar event on Saturday begins at 6:30 PM with private rum tastings led by master blenders. Shall we add 2 passes for you?`;
    }
  })();

  // Filter threads
  const filteredThreads = threads.filter(t => {
    const matchesFilter = activeChannelFilter === 'all' || t.channel === activeChannelFilter;
    const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  // Dispatch live staff message
  const handleSendReply = (overrideText?: string) => {
    const msgBody = overrideText || staffReplyText;
    if (!msgBody.trim()) return;

    const newMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      sender: 'staff',
      text: msgBody,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: activeThread.channel
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          lastMessage: msgBody,
          unreadCount: 0,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));

    setStaffReplyText('');
    triggerNotification('Message Sent successfully!');
    
    // Auto simulated simulated AI reply in 2 seconds to keep it interactive
    setTimeout(() => {
      const autoBotReply: ThreadMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: `Vinea Operational Hub: Action successfully parsed. Synchronized status with the active local POS Node.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: activeThread.channel
      };
      setThreads(p => p.map(th => th.id === activeThread.id ? { ...th, messages: [...th.messages, autoBotReply] } : th));
    }, 2000);
  };

  // Template custom values render
  const getRenderedTemplate = (field: 'subject' | 'body') => {
    let result = field === 'subject' ? customSubject : customBody;
    result = result.replace('{{guestName}}', activeThread.customerName);
    result = result.replace('{{venueName}}', 'Oenovia Beachfront');
    return result;
  };

  // Push custom Template to Chat Input
  const handleApplyTemplateToChat = () => {
    const bodyText = getRenderedTemplate('body');
    setStaffReplyText(bodyText);
    setShowTemplateModal(false);
    triggerNotification('Template applied to composing deck');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Top Banner */}
      <div className="bg-stone-900 border-2 border-stone-800 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4 z-10 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
            Unified Omnichannel Dispatch Center
          </span>
          <h2 className="text-4xl font-serif font-black italic tracking-tighter">Neural Omnichannel Dispatch Desk</h2>
          <p className="text-xs text-stone-300 font-medium leading-relaxed italic">
            Monitor incoming threads across WhatsApp, SMS, and email. Align the somatic directions of your guest profiles, verify wine pairing suggestions directly, and dispatch templates inside single synchronized threads.
          </p>
        </div>

        <div className="flex gap-4 shrink-0">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2 shadow-lg"
          >
            <i className="fas fa-file-code text-indigo-400"></i> Manage Templates
          </button>
          <div className="bg-white/5 border border-white/10 p-4 rounded-[2rem] flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Inbox Integration Status</p>
              <p className="text-xs font-serif font-black italic text-emerald-400 leading-none">Telemetry Unified // 100% Ok</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <i className="fas fa-network-wired text-emerald-500 text-xs"></i>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-8 right-8 z-[1000] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-stone-900/90 text-white px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#10b981]/20">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{notification}</span>
          </div>
        </div>
      )}

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch font-sans">
        
        {/* Left column: Channel Threads Directory (4 Cols) */}
        <div className="xl:col-span-4 bg-white rounded-[3rem] border border-stone-200/90 shadow-sm overflow-hidden flex flex-col h-[750px]">
          
          {/* Thread list search / headers */}
          <div className="p-6 border-b border-stone-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-900 italic">Incoming Threads</h3>
              <span className="text-[9.5px] font-black bg-stone-100 text-stone-500 px-3 py-1 rounded-full">
                {threads.reduce((acc, cr) => acc + cr.unreadCount, 0)} pending
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search guests or message text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/60 rounded-full py-3 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-stone-400 text-stone-900"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-xs"></i>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl">
              {(['all', 'whatsapp', 'sms', 'email'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveChannelFilter(ch)}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${activeChannelFilter === ch ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Directory thread cards container */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredThreads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-300">
                  <i className="fas fa-comment-slash text-lg"></i>
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">No synchronized threads found</p>
                <p className="text-xs text-stone-400 italic">Check channel setup parameters for connectivity validation.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = activeThreadId === thread.id;
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      // Clear unreads
                      setThreads(p => p.map(t => t.id === thread.id ? { ...t, unreadCount: 0 } : t));
                    }}
                    className={`w-full text-left p-6 transition-all flex gap-4 ${isActive ? 'bg-stone-50 border-r-4 border-indigo-600' : 'hover:bg-stone-50/50'}`}
                  >
                    <div className="relative">
                      <img src={thread.avatar} alt={thread.customerName} className="w-12 h-12 rounded-full object-cover shadow-sm border border-stone-200 animate-in fade-in" />
                      <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white ${thread.channel === 'whatsapp' ? 'bg-[#25D366]' : thread.channel === 'sms' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                        <i className={`fab ${thread.channel === 'whatsapp' ? 'fa-whatsapp' : thread.channel === 'sms' ? 'fa-comment-alt-dots' : 'fa-envelope'} font-black`}></i>
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-tighter truncate">{thread.customerName}</h4>
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tight">{thread.time}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight truncate">{thread.lastMessage}</p>
                      
                      {/* Palate traits previews */}
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {thread.palateTags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[7.5px] font-black uppercase tracking-widest bg-stone-100 border border-stone-200/50 text-stone-600 px-1.5 py-0.5 rounded-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-lg shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Right column: Active Dialogue + Parameters Panel (8 Cols) */}
        <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Active Chat Panel (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[3rem] border border-stone-200/90 shadow-sm overflow-hidden flex flex-col h-[750px]">
            
            {/* Conversations header */}
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-3">
                <img src={activeThread.avatar} alt={activeThread.customerName} className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-sm animate-in fade-in" />
                <div>
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-tighter leading-none">{activeThread.customerName}</h4>
                  <p className="text-[10px] text-stone-400 font-bold mt-1 tracking-wider uppercase">{activeThread.customerPhone}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 bg-stone-100 rounded-full text-[9px] font-black uppercase text-stone-500 border border-stone-200/20">
                  Channel: {activeThread.channel}
                </span>
              </div>
            </div>

            {/* Conversation message frame */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30">
              {activeThread.messages.map((msg, i) => {
                const isGuest = msg.sender === 'guest';
                const isStaff = msg.sender === 'staff';
                
                return (
                  <div key={msg.id || i} className={`flex ${isGuest ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[85%] space-y-1">
                      
                      {/* Sender label */}
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-stone-400 px-1 block">
                        {isGuest ? activeThread.customerName : isStaff ? 'Hotel Staff' : 'Gemini AI Advisor'}
                      </span>

                      {/* Msg bubble */}
                      <div className={`rounded-2xl px-5 py-3 text-xs leading-relaxed border shadow-sm relative ${
                        isGuest ? 'bg-white text-stone-900 rounded-tl-sm border-stone-200' :
                        isStaff ? 'bg-stone-900 text-white rounded-tr-sm border-stone-800' :
                        'bg-indigo-50 border-indigo-100 text-indigo-950 font-medium'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span className={`text-[7px] block mt-1.5 text-right ${isStaff ? 'text-stone-400' : isGuest ? 'text-stone-400' : 'text-indigo-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Composition Pad wrapper */}
            <div className="p-6 border-t border-stone-100 space-y-4 bg-white">
              
              {/* Quick action helper links */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (aiDraftRecommendation) {
                        setStaffReplyText(aiDraftRecommendation);
                        triggerNotification('AI Autodraft populated');
                      }
                    }} 
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-indigo-100"
                  >
                    <i className="fas fa-wand-magic-sparkles text-indigo-500"></i> Use Gemini Draft
                  </button>
                  <button 
                    onClick={() => setShowTemplateModal(true)} 
                    className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-stone-200/50"
                  >
                    <i className="fas fa-file-invoice text-stone-400"></i> Add Template
                  </button>
                </div>
                
                <span className="text-[8px] text-stone-400 uppercase tracking-widest font-black">
                  Type draft or apply guidelines
                </span>
              </div>

              {/* Input text frame */}
              <div className="flex gap-4 items-end">
                <textarea
                  value={staffReplyText}
                  onChange={(e) => setStaffReplyText(e.target.value)}
                  placeholder={`Type response, use templates, or summon Gemini directives...`}
                  className="flex-1 h-20 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none text-stone-900 placeholder:text-stone-400 font-medium leading-relaxed shadow-inner"
                />

                <button
                  onClick={() => handleSendReply()}
                  disabled={!staffReplyText.trim()}
                  className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/10 self-stretch animate-in fade-in"
                >
                  <i className="fas fa-paper-plane"></i> Send
                </button>
              </div>
            </div>
          </div>

          {/* AI Advisor Context Panel (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* CRM Profile Card */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-2">Verified CRM Insight</h4>
              
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <i className="fas fa-wine-glass text-indigo-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-stone-400 leading-none">Preference Direction</p>
                    <p className="text-[11px] text-stone-800 font-bold mt-1 uppercase tracking-tight">Somatic Beverage Connoisseur</p>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-1 border border-stone-100/50">
                  <p className="text-[7.5px] font-black text-stone-400 uppercase tracking-widest">Active Palate DNA Tags</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeThread.palateTags.map((tag, idx) => (
                      <span key={idx} className="text-[8px] font-bold text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Autodraft Recommendation Deck */}
            <div className="bg-stone-900 text-white p-6 rounded-[2.5rem] border border-stone-800 shadow-2xl flex-1 flex flex-col justify-between space-y-4 animate-in slide-in-from-right duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-[9.5px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                    Gemini suggested reply
                  </h4>
                  <span className="text-[7.5px] uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">AUTO DRAFT</span>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl italic text-[11px] text-stone-300 leading-relaxed border border-white/5 font-medium">
                  "{aiDraftRecommendation}"
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[7.5px] text-stone-500 leading-normal uppercase font-black tracking-widest">Aesthetic Guidelines: Checked</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStaffReplyText(aiDraftRecommendation);
                      triggerNotification('Suggested reply applied');
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                  >
                    Apply suggestion
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Templates Management overlay */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[800] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-stone-200 overflow-hidden flex flex-col lg:flex-row h-[600px] animate-in zoom-in-95 duration-200">
            
            {/* Sidebar list (5 Cols) */}
            <div className="lg:w-2/5 border-r border-stone-100 p-8 flex flex-col justify-between bg-stone-50/50">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-black italic tracking-tighter text-stone-900">Message Templates</h3>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Select structured dispatch options</p>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[380px]">
                  {templates.map(temp => (
                    <button
                      key={temp.id}
                      onClick={() => handleSelectTemplate(temp.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all block ${selectedTemplateId === temp.id ? 'border-indigo-600 bg-white shadow-sm' : 'border-stone-100 hover:border-stone-200'}`}
                    >
                      <h4 className="text-xs font-black uppercase tracking-tighter text-stone-800">{temp.name}</h4>
                      <p className="text-[9px] text-stone-400 truncate mt-1 leading-none">Subject: {temp.subject}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  onClick={() => {
                    const id = `t-${Date.now()}`;
                    const nTemp: MessageTemplate = {
                      id,
                      name: 'Custom Template',
                      subject: 'Exclusive Pairing Reservation Inquiry',
                      body: 'Dear {{guestName}}, we are offering nightly Sommelier slots at Oenovia Beachfront. Would you like to save an allocation?',
                      variables: ['guestName']
                    };
                    setTemplates([...templates, nTemp]);
                    setSelectedTemplateId(id);
                    setCustomSubject(nTemp.subject);
                    setCustomBody(nTemp.body);
                  }}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all text-center flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> Create Custom Template
                </button>
              </div>
            </div>

            {/* Editing Pane (7 Cols) */}
            <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-900 italic">Configure Template Parameters</h3>
                  <button 
                    onClick={() => setShowTemplateModal(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 animate-in fade-in">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Subject Line / ID Header</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-3 text-xs font-bold outline-none text-stone-900 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Template Dialogue Core Body</label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="w-full h-36 bg-stone-50 border border-stone-200 rounded-[1.5rem] px-5 py-4 text-xs italic focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none leading-relaxed text-stone-800"
                    />
                  </div>

                  <div className="bg-indigo-50/60 p-4 rounded-2xl space-y-2 border border-indigo-100/50 animate-in fade-in duration-300">
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-700">Dynamic Live Render Preview</p>
                    <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-1.5 shadow-sm text-stone-900">
                      <p className="text-[10px] font-bold"><strong className="text-[8px] font-black uppercase text-stone-400 block tracking-wider">Subject Rendered:</strong> {getRenderedTemplate('subject')}</p>
                      <p className="text-[11px] text-stone-600 leading-relaxed italic"><strong className="text-[8px] font-black uppercase text-stone-400 block tracking-wider mt-1">Body Text Output:</strong> "{getRenderedTemplate('body')}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-stone-100 pt-6 bg-white">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-4 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTemplateToChat}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all shadow-lg hover:shadow-indigo-500/15"
                >
                  Apply to Active Chat Compose
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OmnichannelDispatchDesk;
