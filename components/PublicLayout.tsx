import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Check, ArrowUp } from 'lucide-react';
import VinetelligenceLogo from './VinetelligenceLogo';
import AHLALogo from './AHLALogo';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { getPublicBrand } from '../utils/branding';

interface LayoutProps {
  children: React.ReactNode;
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
  onLogin?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onEnterDemo, onStartOnboarding, onLogin }) => {
  const brand = getPublicBrand();
  const primaryTextClass = brand.theme === 'vinea' ? 'text-amber-600' : 'text-indigo-600';
  const primaryBgClass = brand.theme === 'vinea' ? 'bg-amber-600' : 'bg-indigo-600';
  const primaryHoverBgClass = brand.theme === 'vinea' ? 'hover:bg-amber-700' : 'hover:bg-indigo-700';
  const hoverTextClass = brand.theme === 'vinea' ? 'hover:text-amber-600' : 'hover:text-indigo-600';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const setAIChatOpen = useVinetelligenceStore(state => state.setAIChatOpen);
  const [activeModal, setActiveModal] = useState<'contact' | 'success' | 'privacy' | 'terms' | null>(null);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 1000);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [leadForm, setLeadForm] = useState({ name: '', email: '', establishment: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Added console log to avoid unused variable warning while keeping it for future use
  if (isSubmitting) {
    console.debug("Submitting lead form...");
  }

  const handleLeadSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setLeadForm({ name: '', email: '', establishment: '', message: '' });
    setActiveModal('success');
    setIsSubmitting(false);
  };

  const navLinks = [
    { name: 'Platform', path: '/platform' },
    { name: 'Intelligence', path: '/intelligence' },
    { name: 'Academy', path: '/academy' },
    { name: 'Corporate', path: '/corporate' },
    { name: 'Pricing', path: '/pricing' }
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Experience Notice */}
      <div className={`md:hidden ${primaryBgClass} text-white px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-[60]`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <i className="fas fa-laptop text-xs"></i>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
            Laptop or Tablet recommended <br /> for the full experience.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className={`absolute bottom-0 left-0 h-0.5 ${primaryBgClass} transition-all duration-150 ease-out`} style={{ width: `${progress}%` }}></div>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <VinetelligenceLogo size="sm" withText={false} className={`${primaryTextClass} group-hover:scale-110 transition-transform`} />
            <span className="text-xl font-serif font-black tracking-tighter italic">{brand.name}</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${location.pathname === link.path ? primaryTextClass : hoverTextClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence')) {
                  localStorage.setItem('platform_selected_app', 'vinetelligence');
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.set('mode', 'login');
                  window.history.replaceState({}, '', newUrl.toString());
                  window.location.reload();
                  return;
                }
                onLogin?.();
                setIsMobileMenuOpen(false);
              }}
              className={`text-[10px] font-black uppercase tracking-widest text-stone-600 ${hoverTextClass} transition-colors hidden sm:block mr-4`}
            >
              Sign In to your establishment
            </button>
            {onEnterDemo && (
              <button 
                onClick={onEnterDemo}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95"
              >
                Launch Demo
              </button>
            )}
            <button 
              onClick={() => {
                if (onStartOnboarding) {
                  onStartOnboarding();
                } else {
                  setActiveModal('contact');
                }
                setIsMobileMenuOpen(false);
              }}
              className={`hidden sm:block px-6 py-2.5 ${primaryBgClass} ${primaryHoverBgClass} text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95`}
            >
              Get Started
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-stone-900"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-stone-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="text-left text-sm font-black uppercase tracking-widest text-stone-600 py-2">
                    {link.name}
                  </Link>
                ))}
                <button 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence')) {
                      localStorage.setItem('platform_selected_app', 'vinetelligence');
                      const newUrl = new URL(window.location.href);
                      newUrl.searchParams.set('mode', 'login');
                      window.history.replaceState({}, '', newUrl.toString());
                      window.location.reload();
                      return;
                    }
                    onLogin?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-4 w-full py-4 text-xs font-black uppercase tracking-widest text-stone-600 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all text-center"
                >
                  Sign In to your establishment
                </button>
                <button 
                  onClick={() => {
                    onEnterDemo?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 w-full py-4 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center"
                >
                  Interactive Demo
                </button>
                <button 
                  onClick={() => {
                    if (onStartOnboarding) {
                      onStartOnboarding();
                    } else {
                      setActiveModal('contact');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-stone-50 border-t border-stone-100 pt-24 pb-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 md:gap-24">
          <div className="col-span-2 lg:col-span-2 space-y-10">
            <div className="flex items-center gap-2">
              <VinetelligenceLogo size="sm" withText={false} className="text-stone-900" />
              <span className="text-xl font-serif font-black tracking-tighter italic">{brand.name}</span>
            </div>
            <p className="text-sm font-medium text-stone-500 leading-relaxed max-w-sm italic">
               {brand.theme === 'vinea' 
                 ? "Empowering premium establishments with fine-wine and hospitality service intelligence, live cellar inventory mapping, and neural guidelines." 
                 : "Empowering premium establishments with AI-powered operating systems, predictive inventory tools, and intelligent hospitality optimization."} <br />
               Fueling Flavor & Success since 2024.
            </p>
            <div className="pt-6 border-t border-stone-200 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Official Member & Strategic Alliance</p>
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 grayscale brightness-90 opacity-60 hover:opacity-100 hover:grayscale-0 transition-all">
                     <AHLALogo height={22} theme="color" />
                  </div>
                  <div className="flex gap-4 items-center grayscale opacity-40 text-stone-400">
                     <span className="text-[10px] font-black italic">Global Tech Hub</span>
                     <span className="text-[10px] font-black italic">•</span>
                     <span className="text-[10px] font-black italic">Hospitality Intelligence Group</span>
                  </div>
               </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Solutions</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <Link to="/intelligence" className={`hover:${primaryTextClass}`}>Yield Intelligence</Link>
              <Link to="/academy" className={`hover:${primaryTextClass}`}>Growth Academy</Link>
              <Link to="/pricing" className={`hover:${primaryTextClass}`}>Growth Plans</Link>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Corporate</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <Link to="/corporate" className={`hover:${primaryTextClass}`}>Company HQ</Link>
              <a href="/competitor-matrix.html" target="_blank" className={`hover:${primaryTextClass}`}>Competitive Edge (PDF)</a>
              <button onClick={() => setActiveModal('privacy')} className={`text-left hover:${primaryTextClass}`}>Privacy Protocol</button>
              <button onClick={() => setActiveModal('terms')} className={`text-left hover:${primaryTextClass}`}>Terms of Intel</button>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Ecosystem</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              {typeof window !== 'undefined' && (window.location.hostname.includes('vinea.live') || (localStorage.getItem('platform_selected_app') === 'vinea' && !window.location.hostname.includes('vinetelligence.live') && !window.location.hostname.includes('vinea.live'))) ? (
                typeof window !== 'undefined' && !window.location.hostname.includes('vinetelligence.live') && !window.location.hostname.includes('vinea.live') ? (
                  <button 
                    onClick={() => {
                      localStorage.setItem('platform_selected_app', 'marketing');
                      window.location.href = '/?app=marketing';
                    }}
                    className={`text-left hover:${primaryTextClass}`}
                  >
                    Vinetelligence Platform
                  </button>
                ) : (
                  <a href="https://vinetelligence.live" className={`hover:${primaryTextClass}`}>Vinetelligence Platform</a>
                )
              ) : (
                typeof window !== 'undefined' && !window.location.hostname.includes('vinetelligence.live') && !window.location.hostname.includes('vinea.live') ? (
                  <button 
                    onClick={() => {
                      localStorage.setItem('platform_selected_app', 'vinea');
                      window.location.href = '/?app=vinea';
                    }}
                    className={`text-left hover:${primaryTextClass}`}
                  >
                    Vinea App Platform
                  </button>
                ) : (
                  <a href="https://vinea.live" className={`hover:${primaryTextClass}`}>Vinea App Platform</a>
                )
              )}
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence')) {
                    localStorage.setItem('platform_selected_app', 'vinetelligence');
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('mode', 'login');
                    window.history.replaceState({}, '', newUrl.toString());
                    window.location.reload();
                    return;
                  }
                  onLogin?.();
                }}
                className={`text-left hover:${primaryTextClass}`}
              >
                Sign In to your establishment
              </button>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Contact Support</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-stone-400">Global Operations</p>
                <p className="text-stone-900 leading-tight italic">Caribbean AI Intelligent Hub</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-stone-400">Support Node</p>
                <a href="mailto:business@vinetelligence.live" className="text-stone-900 hover:text-indigo-600 lowercase transition-colors">business@vinetelligence.live</a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex flex-col items-center md:items-start gap-2">
             <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono">© 2026 Vinetelligence Neural Systems. ALL RIGHTS RESERVED.</p>
             <p className="text-[8px] font-medium text-stone-300 uppercase tracking-[0.2em]">Inventory. Intelligence. Operational Excellence. Fueling Hospitality.</p>
           </div>
        </div>
      </footer>

      {/* Back to Top & AI Avatar */}
      <div className="fixed bottom-10 right-10 z-[80] flex flex-col gap-4">
        <AnimatePresence>
          <motion.button
            onClick={() => setAIChatOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all group relative border-2 border-transparent hover:border-indigo-400"
          >
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
            <i className="fas fa-brain text-xl"></i>
            {/* Tooltip */}
            <div className="absolute right-16 px-4 py-2 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10">
              Query Neural Node
            </div>
          </motion.button>

          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-stone-900 border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* AI Avatar Overlay removed - Handled by App.tsx */}

      {/* Universal Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto p-12">
              <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900"><X /></button>
              
              {activeModal === 'contact' && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-serif font-black">Strategic Request</h4>
                    <p className="text-xs text-stone-400 font-medium tracking-widest uppercase">Strategic Intelligence Integration</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <input placeholder="Name" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})} />
                      <input placeholder="Email" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} />
                    </div>
                    <textarea placeholder="Establishment & Inquiry" rows={4} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm resize-none" value={leadForm.message} onChange={e => setLeadForm({...leadForm, message: e.target.value})} />
                    <button onClick={handleLeadSubmit} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Submit Transmission</button>
                  </div>
                </div>
              )}

              {activeModal === 'success' && (
                <div className="text-center space-y-8 py-10">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl"><Check /></div>
                  <h4 className="text-3xl font-serif font-black">Intel Received</h4>
                  <p className="text-stone-500 font-medium italic">Our Strategic Support node has logged your request. We will synchronise shortly.</p>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Close Protocol</button>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-8">
                  <h4 className="text-3xl font-serif font-black">Privacy Intelligence Protocol</h4>
                  <div className="space-y-6 text-stone-600 text-sm font-medium leading-relaxed italic">
                    <p>
                       The Vinetelligence platform operates on a **Zero-Trust Neural Architecture**. We acknowledge that guest sentiment data and establishment operational patterns are your most valuable assets. 
                    </p>
                    <p>
                       **Data Processing:** All neural extractions from label scans or guest sentiment audits are processed within ephemeral memory nodes and purged every 6 hours unless explicitly committed to your establishment's secure encrypted data silo (AES-256).
                    </p>
                    <p>
                       **Third-Party Interop:** We do not sell data to third-party beverage distributors. Integration data shared with POS providers like Oracle or Toast is strictly limited to inventory decrement and billing synchronization.
                    </p>
                    <p>Adhering to GDPR, CCPA, and ISO 27001 data security standards.</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Acknowledge Policy</button>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-8">
                  <h4 className="text-3xl font-serif font-black">Terms of Excellence</h4>
                  <div className="space-y-6 text-stone-600 text-sm font-medium leading-relaxed italic">
                    <p>
                       Vinetelligence Neural Systems provides a cloud-based software-as-a-service (SaaS) environment. By accessing the "Live Engine," you acknowledge that the AI-driven recommendations are decision-support tools and do not replace final human managerial oversight.
                    </p>
                    <p>
                       **Intellectual Property:** All models, "Palate DNA" algorithms, and custom "Staff Mastery" nodes remain the exclusive property of Vinetelligence. Establishments receive a commercial revocable license for internal use.
                    </p>
                    <p>
                       **Service Continuity:** We guarantee a 99.8% Uptime Index. During neural maintenance cycles, fallback manual inventory protocols are recommended.
                    </p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Accept Terms</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
