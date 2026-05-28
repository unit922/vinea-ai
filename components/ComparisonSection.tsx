import React from 'react';
import { Check, X, Zap, Brain } from 'lucide-react';

const ComparisonSection: React.FC = () => {
    const features = [
        {
            feature: "Focus Area",
            legacy: "Specific Utility (Booking, CRM, or Chat)",
            vinetelligence: "Full-Stack Cognitive Operating System",
            isBetter: "vinetelligence"
        },
        {
            feature: "Operational Context",
            legacy: "Isolated to one department",
            vinetelligence: "Deep mapping of inventory, staff, & logistics",
            isBetter: "vinetelligence"
        },
        {
            feature: "Training & mastery",
            legacy: "Manual or nonexistent",
            vinetelligence: "AI-Powered Academy & Mastery Index",
            isBetter: "vinetelligence"
        },
        {
            feature: "Integrations",
            legacy: "Limited (API or Webhooks)",
            vinetelligence: "Omni-channel: Logistics, IoT, Finance, CRM",
            isBetter: "vinetelligence"
        },
        {
            feature: "Intelligence Type",
            legacy: "Reactive (Manual Data Entry)",
            vinetelligence: "Predictive (Agentic AI Demand Forecasting)",
            isBetter: "vinetelligence"
        },
        {
            feature: "Business Goal",
            legacy: "Solve a tactical problem (e.g. fill a table)",
            vinetelligence: "Operational Clarity & Executive Leverage",
            isBetter: "vinetelligence"
        }
    ];

    return (
        <section className="py-32 px-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Market Evolution</h2>
                    <h3 className="text-4xl md:text-7xl font-serif font-black italic tracking-tighter">Connected System vs. Isolated App.</h3>
                    <p className="text-stone-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                        The future SME will not operate app-by-app. It will operate as one intelligent connected system. Vinetelligence is the OS that replaces the chaos of fragmented solutions.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* The "App-by-App" Chaos */}
                    <div className="p-12 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-8 relative group hover:bg-stone-100 transition-colors">
                        <div className="flex items-center gap-4 text-stone-400">
                             <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center">
                                <X className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest">The Legacy Model (e.g. TheFork, HotelHelp)</p>
                        </div>
                        <h4 className="text-3xl font-serif font-black italic">Fragmented Utility.</h4>
                        <p className="text-stone-500 font-medium italic leading-relaxed">
                            Legacy tools like TheFork solve specific reservation problems, but they remain isolated "extra apps". They have no visibility into your supply chain, staff mastery, or real-time operational demand beyond a booking.
                        </p>
                        <div className="space-y-4 pt-8">
                            {[
                                "Static Reservation Logs",
                                "Isolated Booking Nodes",
                                "No Operational Context",
                                "Third-Party Data Silos"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-stone-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Intelligent System */}
                    <div className="p-12 bg-stone-900 text-white rounded-[3rem] space-y-8 relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)]">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Zap className="w-24 h-24 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-4 text-indigo-400">
                             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Zap className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest">The OS Model (Vinetelligence)</p>
                        </div>
                        <h4 className="text-3xl font-serif font-black italic text-white font-medium">AI-Powered Operating System.</h4>
                        <p className="text-stone-400 font-medium italic leading-relaxed">
                            Vinetelligence connects every operational node—from the cellar to the guest—into a single Claude-powered Agentic system. It doesn't just "chat" with guests; it optimizes your entire business intelligence layer.
                        </p>
                        <div className="space-y-4 pt-8">
                            {[
                                "Predictive Supply Chain Node",
                                "AI Staff Training & Intelligence",
                                "Real-time Yield Optimization",
                                "Executive Command Visibility"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-indigo-400">
                                    <Check className="w-4 h-4" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="mt-20 overflow-x-auto rounded-[3rem] border border-stone-100 bg-white shadow-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-100">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Capability Node</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Legacy Utility Apps</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-indigo-600">Vinetelligence OS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {features.map((row, i) => (
                                <tr key={i} className="group hover:bg-stone-50 transition-colors">
                                    <td className="px-8 py-6 text-sm font-bold text-stone-900 italic">{row.feature}</td>
                                    <td className="px-8 py-6 text-xs font-medium text-stone-500 italic opacity-50 group-hover:opacity-100 transition-opacity">{row.legacy}</td>
                                    <td className="px-8 py-6 text-xs font-black text-indigo-600 tracking-tight">{row.vinetelligence}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quote Section */}
                <div className="pt-20 text-center">
                    <div className="inline-block p-12 bg-stone-50 border border-stone-100 rounded-[4rem] max-w-4xl">
                        <p className="text-2xl md:text-4xl font-serif font-black italic text-stone-900 leading-tight">
                            "The advantage is not just automation. It's operational clarity, executive visibility, and reduced digital overhead."
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">
                            <Brain className="w-3 h-3" />
                            Connected Protocol V2.2
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ComparisonSection;
