import React from 'react';
import { motion } from 'motion/react';
import { Shield, Brain, Layers, Database, Zap, Binary } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BlogSection from '../components/BlogSection';
import ComparisonSection from '../components/ComparisonSection';

interface IntelligenceProps {
  onEnterDemo?: () => void;
}

const Intelligence: React.FC<IntelligenceProps> = ({ onEnterDemo }) => {
  const navigate = useNavigate();
  return (
    <div className="pt-24 min-h-screen bg-white">
      {/* Solution Header */}
      <section className="py-24 px-6 border-b border-stone-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Strategic Solutions</h2>
            <h1 className="text-3xl md:text-7xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
              Neural <br /> Operating System.
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              We provide the specialized neural infrastructure and predictive engines needed to separate your establishment from the competition. We transform your restaurant's operations into a high-performance intelligence node.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="aspect-square bg-stone-900 rounded-[3rem] p-8 text-white flex flex-col justify-between group hover:bg-indigo-600 transition-colors duration-500">
               <Layers className="w-10 h-10 text-indigo-400 group-hover:text-white" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Logistics</p>
                 <p className="text-xl font-serif font-black italic">Inventory <br /> Nodes</p>
               </div>
             </div>
             <div className="aspect-square bg-stone-50 rounded-[3rem] p-8 text-stone-900 flex flex-col justify-between border border-stone-100">
               <Database className="w-10 h-10 text-indigo-600" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Optimization</p>
                 <p className="text-xl font-serif font-black italic">Yield <br /> Optimization</p>
               </div>
             </div>
             <div className="aspect-square bg-stone-50 rounded-[3rem] p-8 text-stone-900 flex flex-col justify-between border border-stone-100">
               <Brain className="w-10 h-10 text-indigo-600" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Insights</p>
                 <p className="text-xl font-serif font-black italic">Predictive <br /> Demand Data</p>
               </div>
             </div>
             <div className="aspect-square bg-indigo-600 rounded-[3rem] p-8 text-white flex flex-col justify-between">
               <Shield className="w-10 h-10 text-indigo-200" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Trust</p>
                 <p className="text-xl font-serif font-black italic">GDPR <br /> Sovereign</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Core Protocol Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Zap />,
                title: "Real-time Sync",
                desc: "Our neural scanners synthesize labels and inventory levels in milliseconds, providing an always-accurate reflection of your cellars and bars."
              },
              {
                icon: <Binary />,
                title: "Operational Alpha",
                desc: "Predictive algorithms designed to optimize staffing deployment and minimize waste through atmospheric and historical data analysis."
              },
              {
                icon: <Database />,
                title: "Unified Data Hub",
                desc: "We synchronize your operational data across all touchpoints: from your backend inventory systems to your staff's handheld terminals."
              }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-12 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-8 hover:shadow-2xl transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  {item.icon}
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-serif font-black">{item.title}</h4>
                  <p className="text-stone-500 font-medium leading-relaxed italic">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Intelligence & Global Insights */}
      <section className="py-32 px-6 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Global Strategy Hub</h2>
            <h3 className="text-4xl md:text-6xl font-serif font-black italic">Strategic Intelligence <br /> & Global Insights.</h3>
            <p className="text-stone-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
              Vinetelligence provides a macro-view of the hospitality landscape. Our global sensor network identifies shifting guest preferences and supply chain volatility before they impact your P&L.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-12 bg-white rounded-[4rem] border border-stone-100 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <i className="fas fa-globe-americas text-xl"></i>
                </div>
                <h4 className="text-2xl font-serif font-black italic">Market Velocity Mapping</h4>
                <p className="text-sm text-stone-500 font-medium leading-relaxed italic">
                  Track regional beverage trends across the Caribbean and global luxury markets. Our AI identifies emerging varietal demands and spirit preferences 3-6 months in advance.
                </p>
              </div>
              <ul className="space-y-4 pt-8 border-t border-stone-100">
                {[
                  "Predictive Demand Forecasting",
                  "Cross-border Competitive Analysis",
                  "Yield Optimization Protocols"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    <i className="fas fa-check-circle opacity-50"></i>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-12 bg-stone-900 text-white rounded-[4rem] space-y-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <i className="fas fa-chart-line text-9xl"></i>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 font-serif font-black italic text-xl">
                  AI
                </div>
                <h4 className="text-2xl font-serif font-black italic">Macro-Yield Analytics</h4>
                <p className="text-sm text-stone-400 font-medium leading-relaxed italic">
                  Analyze high-level operational performance across groups. Our "Executive Command" node provides deep insights into staff efficiency, inventory shrinkage, and ROI attribution.
                </p>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-4 relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Current Prediction Index</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-serif font-black italic">+14.2%</span>
                    <span className="text-xs text-stone-500 italic">Avg. Yield Improvement</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ComparisonSection />

      <BlogSection onAction={onEnterDemo || (() => navigate('/?mode=contact'))} />

      {/* Corporate Callout */}
      <section className="py-24 bg-[#0c0e0e] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20 translate-x-1/2 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12 relative">
          <h3 className="text-4xl font-serif font-black italic">Engineered for Excellence. <br /> Deployed Globally.</h3>
          <p className="max-w-2xl mx-auto text-stone-400 font-medium leading-relaxed uppercase text-[10px] tracking-[0.3em]">
            Operated on enterprise-grade infrastructure. Our protocols ensure professional-grade data integrity and security for global hospitality.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/corporate" className="px-10 py-4 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all">
              Transparency Report
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Intelligence;
