import React, { useRef, useEffect, useState } from 'react';

interface FacialIDScannerProps {
  onScan: (facialId: string) => void;
  onClose: () => void;
}

export const FacialIDScanner: React.FC<FacialIDScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentVideo = videoRef.current;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (currentVideo) {
          currentVideo.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Camera access denied. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      setIsScanning(true);
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 400, 300);
        // Simulate facial ID generation
        const fakeFacialId = `FID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        setTimeout(() => {
          onScan(fakeFacialId);
          setIsScanning(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[900] bg-stone-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        <div className="p-8 bg-stone-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-900 shadow-lg">
              <i className="fas fa-face-viewfinder text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-serif font-black italic">Facial ID Synthesis</h3>
              <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Biometric Guest Recognition</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-10 flex flex-col items-center space-y-8">
          <div className="relative w-full aspect-video bg-stone-100 rounded-[2rem] overflow-hidden border-4 border-stone-200 shadow-inner group">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <i className="fas fa-exclamation-triangle text-rose-500 text-3xl mb-4"></i>
                <p className="text-xs font-bold text-stone-600">{error}</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover grayscale brightness-110"
                />
                <canvas ref={canvasRef} width="400" height="300" className="hidden" />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-10 border-2 border-amber-500/30 rounded-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-amber-500/50 rounded-full animate-pulse"></div>
                  {isScanning && (
                    <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {/* Corner Accents */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-xl"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-xl"></div>
                </div>
              </>
            )}
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-xl font-serif font-black italic text-stone-900">Position Guest in Node</h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed italic">Align guest facial architecture within the biometric grid for high-fidelity identification.</p>
          </div>

          <button 
            onClick={handleCapture}
            disabled={isScanning || !!error}
            className="w-full py-5 bg-stone-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-stone-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            {isScanning ? 'Synthesizing Biometrics...' : 'Initialize Scan Sequence'}
            {!isScanning && <i className="fas fa-bolt text-amber-500"></i>}
          </button>
        </div>
      </div>
    </div>
  );
};
