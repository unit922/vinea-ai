import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Tag, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BlogCard = ({ category, title, excerpt, date, image, onClick, externalUrl, internalUrl }: { category: string, title: string, excerpt: string, date: string, image: string, onClick?: () => void, externalUrl?: string, internalUrl?: string }) => {
  const navigate = useNavigate();
  const hasLink = !!(externalUrl || internalUrl || onClick);

  return (
    <motion.div 
      whileHover={hasLink ? { y: -10 } : {}}
      onClick={() => {
        if (externalUrl) {
          window.open(externalUrl, '_blank');
        } else if (internalUrl) {
          navigate(internalUrl);
        } else if (hasLink && onClick) {
          onClick();
        }
      }}
      className={`group ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="aspect-[16/10] rounded-[2rem] overflow-hidden mb-6 relative shadow-xl">
        <img src={image} alt={title} className={`w-full h-full object-cover transition-transform duration-700 ${hasLink ? 'group-hover:scale-110' : 'grayscale opacity-60'}`} referrerPolicy="no-referrer" />
        <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-600">
          {category}
        </div>
        {!hasLink && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-6 py-2 bg-white/10 border border-white/20 rounded-full text-[8px] font-black uppercase tracking-[0.3em] text-white">Protocol Pending</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <span className="flex items-center gap-1.5"><Clock className="w-3" /> {date}</span>
          <span className="flex items-center gap-1.5"><Tag className="w-3" /> Strategic Intel</span>
        </div>
        <h4 className={`text-2xl font-serif font-black leading-tight transition-colors ${hasLink ? 'text-stone-900 group-hover:text-indigo-600' : 'text-stone-300'}`}>
          {title}
        </h4>
        <p className="text-stone-500 text-sm leading-relaxed font-medium line-clamp-2 italic">
          {excerpt}
        </p>
        <div className={`pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all ${hasLink ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
          Read Full Protocol <ArrowRight className="w-3" />
        </div>
      </div>
    </motion.div>
  );
};

const BlogSection: React.FC<{ onAction?: () => void }> = ({ onAction }) => {
  const posts = [
    {
      category: "Protocol",
      title: "Direct Demo Access: The 60-Second Transformation",
      excerpt: "Skip the demo calls. Access the Vinetelligence Neural OS instantly and see how predictive intelligence optimizes your establishment in real-time.",
      date: "May 18, 2026",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
      onClick: onAction
    },
    {
      category: "Future Shock",
      title: "The Future is Human: AI Synergy in 2026",
      excerpt: "Exploring the intersection of neural nodes and human-first hospitality. Why excellence requires both machine logic and human soul.",
      date: "May 14, 2026",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
      externalUrl: "https://www.mews.com/en/resources/future-is-human/are-human-first-teams-possible-in-the-age-of-ai"
    },
    {
      category: "Partnerships",
      title: "Synchronized Hospitality: The Mews Integration Protocol",
      excerpt: "A deep dive into why Mews and Vinetelligence are the definitive tech-stack pairing for 2026 luxury properties.",
      date: "May 13, 2026",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
      internalUrl: "/partners/mews"
    },
    {
      category: "Intelligence",
      title: "The 2026 Beverage Yield Alpha Report",
      excerpt: "Deep dive into how neural mapping is increasing margins across global luxury estates by 14.2%.",
      date: "May 12, 2026",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop"
    },
    {
      category: "Case Study",
      title: "The Ritz Carlton Protocol: A Synthesis",
      excerpt: "How Vinetelligence automated 92% of guest requests across 12 properties in the APAC region.",
      date: "May 02, 2026",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?q=80&w=2070&auto=format&fit=crop"
      // No link
    }
  ];

  return (
    <section id="blog" className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
           <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Dispatch</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-tight">Strategic Intelligence <br /> & Global Insights.</h3>
           </div>
           <button 
             onClick={onAction}
             className="px-10 py-4 border-2 border-stone-900 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all active:scale-95">
              Explore All Intel
           </button>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {posts.map((post, i) => (
            <BlogCard key={i} {...post} 
              // We remove the blanket onClick from the card mapping if the original post object doesn't have it explicitly enabled via a boolean or if we want to honor the user's request for "only placeholder if no link"
            />
          ))}
        </div>

        {/* Active Community Dialogue Widget */}
        <div className="mt-32 border-t border-stone-200 pt-20">
          <div className="max-w-4xl mx-auto bg-stone-50 border border-stone-200/80 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Active Dialogue</h4>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl font-serif font-black text-stone-900 italic">Community Dispatch & Engagement</h3>
              <p className="text-stone-500 text-sm leading-relaxed max-w-xl italic">
                Our initiatives are backed by trusted global service partners. Read the ongoing exchange on our latest operational publication.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-6">
              {/* Zentro's Supporter Comment */}
              <div className="p-8 bg-white border border-stone-200 rounded-[2rem] space-y-4 shadow-sm relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">ZS</div>
                    <div>
                      <h5 className="font-bold text-stone-900 text-sm font-sans">Zentro Supply</h5>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Strategic Supporter</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Today</span>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-150">
                  <p className="text-stone-600 text-xs italic leading-relaxed font-sans">
                    "Great concept! Restaurants also save a lot by having a dependable wholesale supplier for everyday essentials. At Zentro Supply, we help businesses source bulk A4 paper, household products, appliances, and other commercial supplies at competitive prices. Wishing you continued success!"
                  </p>
                </div>
                <div className="flex gap-2 items-center text-[9px] font-black uppercase tracking-widest text-stone-400">
                  <i className="fas fa-handshake"></i> Verified Supply Partner
                </div>
              </div>

              {/* Vinetelligence Prompter Response */}
              <div className="p-8 bg-stone-900 text-white rounded-[2rem] space-y-4 shadow-xl relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-serif italic font-bold text-lg">V</div>
                    <div>
                      <h5 className="font-bold text-white text-sm font-sans">Vinetelligence</h5>
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Author Response</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">Just Now</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-stone-300 text-xs italic leading-relaxed font-sans font-medium">
                    "Thank you, Zentro Supply! Streamlining backend overhead—whether it's sourcing commercial essentials with wholesale leaders like Zentro, or maximizing floor margins with Vinetelligence—is how smart operators stay ahead. 
                    <br/><br/>
                    <strong>To restaurant owners and managers on our channel:</strong> How are you currently balancing the ratio between everyday dry-goods overhead and high-margin premium beverage scaling? Share your protocol below!"
                  </p>
                </div>
                <div className="flex gap-2 items-center text-[9px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">
                  <i className="fas fa-comment-dots"></i> Engagement Prompt Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
