
import React, { useState } from 'react';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Vinea Intelligence",
      subtitle: "The Future of Hospitality Management",
      icon: "fa-glass-cheers",
      content: "Vinea is more than a dashboard; it's a generative AI ecosystem for your establishment. We bridge the gap between technical data and hospitality excellence.",
      instruction: "Explore the interface to see how AI transforms inventory, training, and guest relations."
    },
    {
      title: "Predictive Inventory",
      subtitle: "Stop Reacting, Start Predicting",
      icon: "fa-boxes-stacked",
      content: "Our 'AI Demand Forecast' analyzes consumption velocity and upcoming covers to tell you exactly what to order before you run out.",
      instruction: "In the Inventory tab, click 'Run AI Demand Forecast' to see suggested orders and reasoning based on your historical patterns."
    },
    {
      title: "Staff Academy & Coach",
      subtitle: "Upskill Your Team with AI",
      icon: "fa-user-graduate",
      content: "The Vinea AI Coach is trained on global beverage traditions. Staff can ask technical questions, and managers can assign role-based training modules.",
      instruction: "Use the 'Academy' tab to chat with the AI coach. In 'Team Roster', assign modules like 'Advanced Mixology' to specific staff members."
    },
    {
      title: "Signature Lab",
      subtitle: "AI-Powered Creativity",
      icon: "fa-vial-circle-check",
      content: "Generate world-class cocktail recipes and high-definition visual profiles based on conceptual themes (e.g., 'Brutalist Espresso' or 'Kyoto Spring').",
      instruction: "Visit the 'Signature Lab' under Staff Academy. Type a theme and watch Vinea brew a recipe and a professional photography-style visual."
    },
    {
      title: "Guest Palate Mapping",
      subtitle: "Hyper-Personalized Service",
      icon: "fa-map-location-dot",
      content: "Vinea uses cultural intelligence to suggest pairings. It automatically prioritizes inclusive 'Zero-Proof' options for guests with dietary preferences.",
      instruction: "Input guest details in 'Guest Preferences' to generate a bespoke 3-course beverage journey with cultural etiquette notes."
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-stone-200">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-stone-100 flex">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-amber-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-10 md:p-14 flex-1">
          <div className="flex justify-between items-start mb-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all duration-500 ${step % 2 === 0 ? 'bg-stone-900 text-amber-500' : 'bg-amber-500 text-stone-900'}`}>
              <i className={`fas ${current.icon}`}></i>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-1">Module {step + 1} of {steps.length}</h4>
              <h2 className="text-3xl font-serif font-bold text-stone-900">{current.title}</h2>
              <p className="text-stone-500 font-medium italic">{current.subtitle}</p>
            </div>
            
            <p className="text-stone-600 text-lg leading-relaxed pt-4">
              {current.content}
            </p>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-2">
                <i className="fas fa-terminal"></i>
                Pro User Instruction
              </p>
              <p className="text-sm text-amber-900 font-bold leading-relaxed">
                {current.instruction}
              </p>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={step === 0}
            className={`text-sm font-bold uppercase tracking-widest transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-stone-400 hover:text-stone-900'}`}
          >
            <i className="fas fa-arrow-left mr-2"></i> Back
          </button>

          <button 
            onClick={nextStep}
            className="px-10 py-4 bg-stone-900 text-white rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2"
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next Insight'}
            <i className="fas fa-chevron-right text-amber-500 text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
