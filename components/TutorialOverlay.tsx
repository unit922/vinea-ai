
import React, { useState } from 'react';

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
      {
        title: "Welcome to Intelligence",
        subtitle: "The Future of Hospitality Management",
        icon: "fa-rocket",
        content: "Intelligence is a multi-silo generative AI ecosystem designed to bridge the gap between technical data and hospitality excellence. Whether you are an Explorer or a Visionary, we empower your establishment through neural insights.",
        instruction: "The platform is organized into distinct 'Intelligence Nodes' found on the left sidebar. Explore them to see how AI transforms your daily operations."
      },
    {
      title: "Establishment Persona",
      subtitle: "Your AI, Your Vibe",
      icon: "fa-sliders",
        content: "In the 'Profile' section, you can configure your establishment's AI Persona. Choose 'Technical' for precision or 'Playful' for a more engaging staff experience. Your choice dictates how Intelligence communicates with your team.",
      instruction: "Go to Profile to set your Tagline and AI Persona. Higher tiers unlock 'Dedicated Model Tuning' for bespoke brand alignment."
    },
      {
        title: "Command Center",
        subtitle: "Global Network Surveillance",
        icon: "fa-shield-halved",
        content: "For Master Admins (vinetelligence.live users), the Command Center provides an executive view of the entire global network. Monitor Monthly Recurring Revenue (MRR), billing health, and real-time establishment activity in a private data silo.",
        instruction: "If you have @vinetelligence.live credentials, access the Command Center from the sidebar to see the status of every Node in the nebula."
      },
    {
      title: "Service Ledger",
      subtitle: "Operational Pulse",
      icon: "fa-clipboard-list",
      content: "The Service Ledger tracks every order in real-time. It monitors staff performance, order priority, and table velocity to ensure seamless service flow during peak hours.",
      instruction: "View active 'Orders' to monitor hospitality speed. Use the 'Performance Scores' in the Roster to see who is leading your team."
    },
      {
        title: "Palate Mapping",
        subtitle: "Guest Intelligence DNA",
        icon: "fa-fingerprint",
        content: "Intelligence uses biometric hints and past interactions to generate 'Guest Palate DNA'. We derive bespoke 3-course beverage journeys with specific cultural etiquette notes for every guest.",
        instruction: "Access 'Guest Journeys' to see your current guest roster. Click on a guest to generate an AI-powered beverage journey matched to their specific profile."
      },
    {
      title: "Supply Chain Yield",
      subtitle: "Predictive Logistics",
      icon: "fa-arrow-trend-up",
      content: "Our 'Yield Alpha' system analyzes consumption velocity and upcoming covers to predict demand before it happens. It tells you exactly what to order and why, reducing waste and optimizing capital.",
      instruction: "Navigate to 'Inventory' and select an item to see its AI demand prediction. Higher tiers offer fully automated re-ordering recommendations."
    },
      {
        title: "Neural Coaching",
        subtitle: "Always-On Training",
        icon: "fa-graduation-cap",
        content: "The Intelligence Coach provides instant feedback and training for your staff. From cocktail masterclasses to wine service etiquette, knowledge is just one neural link away.",
        instruction: "Visit the 'Social & Training' hub to access masterclasses or query the AI Avatar for instant beverage wisdom."
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
              className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-10 md:p-14 flex-1">
          <div className="flex justify-between items-start mb-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all duration-500 ${step % 2 === 0 ? 'bg-stone-900 text-indigo-500' : 'bg-indigo-500 text-stone-900'}`}>
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
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Module {step + 1} of {steps.length}</h4>
              <h2 className="text-3xl font-serif font-bold text-stone-900">{current.title}</h2>
              <p className="text-stone-500 font-medium italic">{current.subtitle}</p>
            </div>
            
            <p className="text-stone-600 text-lg leading-relaxed pt-4">
              {current.content}
            </p>

            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-2">
                <i className="fas fa-terminal"></i>
                Pro User Instruction
              </p>
              <p className="text-sm text-indigo-900 font-bold leading-relaxed">
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
            <i className="fas fa-chevron-right text-indigo-500 text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
