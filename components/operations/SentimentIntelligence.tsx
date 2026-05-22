
import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const SentimentIntelligence: React.FC = () => {
  const palateMapping = [
    { subject: 'Tannins', A: 120, fullMark: 150 },
    { subject: 'Acidity', A: 98, fullMark: 150 },
    { subject: 'Minerality', A: 86, fullMark: 150 },
    { subject: 'Floral', A: 99, fullMark: 150 },
    { subject: 'Oak', A: 85, fullMark: 150 },
    { subject: 'Fruit', A: 65, fullMark: 150 },
  ];

  const sentimentHistory = [
    { day: 'Mon', score: 85 },
    { day: 'Tue', score: 88 },
    { day: 'Wed', score: 92 },
    { day: 'Thu', score: 78 },
    { day: 'Fri', score: 95 },
    { day: 'Sat', score: 91 },
    { day: 'Sun', score: 89 },
  ];

  const newsFeeds = [
    { title: 'Global Bordeaux Shortage', impact: 'High', color: 'text-rose-500' },
    { title: 'Chardonnay Trend in Asian Markets', impact: 'Medium', color: 'text-amber-500' },
    { title: 'Low-Sulfite Movement Surge', impact: 'Critical', color: 'text-emerald-500' },
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Sentiment intelligence</h2>
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em] mt-2 italic font-sans">Hospitality Resonance (Module v7.0)</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-stone-900 text-white rounded-2xl flex items-center gap-3 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Live Pulse Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Palate Radar */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div>
            <h4 className="text-xl font-serif font-bold text-stone-900 italic">Neural Palate DNA</h4>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Global guest preference mapping</p>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={palateMapping}>
                <PolarGrid stroke="#f5f5f4" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#a8a29e', fontSize: 10}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Palate"
                  dataKey="A"
                  stroke="#e11d48"
                  fill="#e11d48"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 italic text-[10px] text-stone-500 leading-relaxed">
            "We observe a 15% increase in preference for high-acidity, low-oak profiles across the current visitor cluster."
          </div>
        </div>

        {/* Sentiment Trend */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8 flex flex-col justify-between">
          <div className="flex justify-between items-center text-sm">
            <div>
              <h4 className="text-xl font-serif font-bold text-stone-900 italic">Hospitality Waveform</h4>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Real-time engagement vs. Service quality</p>
            </div>
            <div className="text-right">
               <p className="text-3xl font-serif font-black italic text-rose-600">89.4</p>
               <p className="text-[8px] font-black text-stone-400 uppercase">Avg Sentiment Index</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{fill: '#f5f5f4'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={40}>
                  {sentimentHistory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#e11d48' : '#0c0a09'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4">
             {['Service Speed', 'Ambience', 'Quality'].map(metric => (
               <div key={metric} className="p-4 bg-stone-50 rounded-2xl text-center space-y-1">
                  <p className="text-[8px] font-black text-stone-400 uppercase mb-1">{metric}</p>
                  <p className="font-serif font-black italic text-stone-900">Optimal</p>
               </div>
             ))}
          </div>
        </div>

        {/* External Market Pulse */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="md:col-span-1 bg-rose-600 text-white p-8 rounded-[3rem] shadow-xl flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
              <div className="relative z-10">
                <i className="fas fa-satellite-dish text-2xl mb-4"></i>
                <h4 className="text-xl font-serif font-black italic leading-tight">External Market Signal</h4>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-rose-200 mt-4">Monitoring 1,200+ Nodes</p>
           </div>

           {newsFeeds.map((news, idx) => (
             <div key={idx} className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl flex flex-col justify-between hover:border-rose-500/30 transition-all cursor-pointer group">
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${news.color}`}>{news.impact} Impact</span>
                      <i className="fas fa-arrow-right text-[10px] text-stone-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all"></i>
                   </div>
                   <h5 className="text-lg font-serif font-bold text-stone-900 leading-tight">{news.title}</h5>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-50">
                   <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Predicted Shift: +4.2%</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentIntelligence;
