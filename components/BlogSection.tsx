import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Tag } from 'lucide-react';
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
      title: "Direct Sandbox Access: The 60-Second Transformation",
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
      </div>
    </section>
  );
};

export default BlogSection;
