
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { VisionAuditResult } from '../lib/types';

interface VisionAuditorProps {
  onCommit: (result: VisionAuditResult) => void;
  onClose: () => void;
}

const VisionAuditor: React.FC<VisionAuditorProps> = ({ onCommit, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VisionAuditResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCameraLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError("Camera access was denied. Please enable camera permissions in your browser settings for this site and retry.");
      } else {
        setError("Camera access failed or is unavailable. Please ensure you are using a secure (HTTPS) connection and a compatible browser, or use file upload.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg');
      setPreview(base64);
      stopCamera();
      processImage(base64.split(',')[1], 'image/jpeg');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(reader.result as string);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setIsScanning(true);
    setResult(null);
    try {
      const auditResult = await geminiService.performVisionAudit(base64, mimeType);
      setResult(auditResult);
    } catch (err) {
      console.error(err);
      setError("Vision hand-shake failed. Please ensure the label is legible.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
      {error && (
        <div className="fixed top-8 right-8 z-[1000] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-rose-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl border border-rose-400 backdrop-blur-xl flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <i className="fas fa-exclamation-triangle text-xs"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{error}</span>
          </div>
        </div>
      )}
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col md:flex-row h-[85vh]">
        
        {/* Left: Scan Area */}
        <div className="md:w-1/2 bg-stone-900 flex flex-col relative overflow-hidden">
           {error ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                   <i className="fas fa-exclamation-triangle text-3xl"></i>
                </div>
                <div className="space-y-3">
                   <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">Intelligence Neural Link Failed</p>
                   <p className="text-stone-400 text-[11px] leading-relaxed max-w-[240px] mx-auto">{error}</p>
                </div>
                <button 
                  onClick={() => { setError(null); startCamera(); }}
                  className="px-6 py-3 bg-white text-stone-900 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-amber-50 transition-all active:scale-95"
                >
                  Retry Intelligence Neural Link
                </button>
             </div>
           ) : isCameraActive ? (
             <div className="relative w-full h-full">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder Frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-64 h-80 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-xl"></div>
                      
                      <div className="absolute -top-10 left-0 right-0 text-center">
                         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500 bg-stone-900/80 px-3 py-1 rounded-full">Align Label Frame</span>
                      </div>
                   </div>
                </div>
             </div>
           ) : preview ? (
             <img src={preview} className="w-full h-full object-cover" alt="Scan Preview" />
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center text-stone-700">
                   <i className="fas fa-camera text-4xl"></i>
                </div>
                <div className="space-y-2">
                   <p className="text-stone-500 font-black uppercase tracking-widest text-[10px]">Initialize Multimodal Audit</p>
                   <p className="text-stone-600 text-[8px] uppercase tracking-wider">Neural Vision Engine Ready</p>
                </div>
             </div>
           )}

           {isScanning && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-full h-1 bg-amber-500 shadow-[0_0_20px_#f59e0b] animate-scan-line absolute top-0"></div>
                <div className="bg-stone-900/90 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
                   <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                   <div className="text-amber-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">
                      Parsing Neural Matrix...
                   </div>
                </div>
             </div>
           )}

            <div className="absolute bottom-8 left-0 right-0 px-8 flex flex-col gap-3">
              {isCameraActive ? (
                <button 
                  onClick={capturePhoto}
                  className="w-full py-5 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <i className="fas fa-circle text-[10px] text-white animate-pulse"></i>
                  Capture Frame
                </button>
              ) : (
                <button 
                  onClick={preview ? resetScanner : startCamera}
                  disabled={isCameraLoading}
                  className="w-full py-5 bg-white text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  {isCameraLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-video"></i>}
                  {preview ? 'Initialize New Scan' : 'Activate Neural Camera'}
                </button>
              )}
              
              {!isCameraActive && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-stone-800/50 backdrop-blur-md text-white/50 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-800 hover:text-white transition-all"
                >
                  Upload Static Frame
                </button>
              )}
              
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
           </div>
           
           <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Right: Intelligence Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
           <div className="p-8 border-b border-stone-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <h3 className="text-xl font-serif font-black italic">Neural Parse Results</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"><i className="fas fa-times"></i></button>
           </div>

           <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
              {result ? (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Identity Verified</span>
                         <span className="text-[10px] font-black uppercase text-stone-400 border border-stone-200 px-3 py-1 rounded-full">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <h4 className="text-4xl font-serif font-black text-stone-900 leading-tight">{result.brandName}</h4>
                      <p className="text-stone-500 font-medium italic text-lg">{result.vintage} • {result.region}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 shadow-sm group hover:border-amber-200 transition-all">
                         <p className="text-[9px] font-black text-stone-400 uppercase mb-2 tracking-widest">Market Value</p>
                         <p className="text-2xl font-black text-stone-900">${typeof result.estimatedPrice === 'object' ? (result.estimatedPrice as { value: number }).value : result.estimatedPrice}</p>
                      </div>
                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 shadow-sm group hover:border-emerald-200 transition-all">
                         <p className="text-[9px] font-black text-stone-400 uppercase mb-2 tracking-widest">Neural Confidence</p>
                         <div className="flex items-end gap-2">
                            <p className="text-2xl font-black text-emerald-600">{(result.confidence * 100).toFixed(0)}%</p>
                            <div className="flex gap-0.5 mb-1.5">
                               {[1,2,3,4,5].map(i => (
                                 <div key={i} className={`w-1 h-3 rounded-full ${i <= result.confidence * 5 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] border-b border-stone-100 pb-3 italic">Technical Tasting Notes</h5>
                      <p className="text-base text-stone-600 leading-relaxed italic font-medium">"{result.tastingNotes}"</p>
                   </div>

                   <div className="p-8 bg-stone-900 text-white rounded-[2.5rem] space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-leaf text-8xl text-emerald-500"></i></div>
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <h5 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic">ESG Sustainability Index</h5>
                            <p className="text-[8px] text-stone-500 uppercase font-black">Environmental Social Governance Audit</p>
                         </div>
                         <div className="text-right space-y-1">
                            {result.sustainability.isBiodynamic && <span className="inline-block text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 ml-2">Biodynamic</span>}
                            {result.sustainability.isFairTrade && <span className="inline-block text-[8px] font-black uppercase bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 ml-2">Fair Trade</span>}
                         </div>
                      </div>
                      
                      <div className="flex items-end gap-6">
                         <div>
                            <p className="text-5xl font-serif font-black text-white italic">{result.sustainability.carbonScore}</p>
                            <p className="text-[8px] text-stone-500 uppercase font-black mt-1">Carbon Alpha Score</p>
                         </div>
                         <div className="flex-1 space-y-2 pb-2">
                            <div className="flex justify-between text-[8px] font-black uppercase text-stone-500">
                               <span>Impact Level</span>
                               <span className="text-emerald-500">{result.sustainability.waterIntensity} Intensity</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981] transition-all duration-1000" style={{ width: `${result.sustainability.carbonScore}%` }}></div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-6">
                   <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100">
                      <i className="fas fa-satellite-dish text-4xl text-stone-400"></i>
                   </div>
                   <div className="space-y-2">
                      <p className="text-sm italic font-black uppercase tracking-widest text-stone-500">Awaiting Neural Frame Analysis</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Align label within viewfinder to begin synthesis</p>
                   </div>
                </div>
              )}
           </div>

           <div className="p-8 bg-stone-50 border-t border-stone-100 shrink-0">
              <button 
                disabled={!result}
                onClick={() => onCommit(result!)}
                className="w-full py-6 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {result && <i className="fas fa-check-circle text-emerald-400"></i>}
                Review & Add to Inventory
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VisionAuditor;
