
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RestaurantProfile } from '../lib/types';
import { 
  QrCode, 
  Download, 
  Copy, 
  ExternalLink, 
  Check, 
  Smartphone,
  Printer,
  Share2
} from 'lucide-react';

interface GuestAccessProps {
  restaurantProfile: RestaurantProfile | null;
}

const GuestAccess: React.FC<GuestAccessProps> = ({ restaurantProfile }) => {
  const [copied, setCopied] = useState(false);
  const [selectedTable, setSelectedTable] = useState('1');

  if (!restaurantProfile) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const guestUrl = `${baseUrl}?view=menu&rid=${restaurantProfile.id}&table=${selectedTable}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('guest-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `vinetelligence-qr-${selectedTable}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 border border-stone-200 shadow-2xl space-y-12">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* QR Code Display */}
          <div className="flex-shrink-0 space-y-6 flex flex-col items-center">
            <div className="p-8 bg-stone-50 rounded-[3rem] border-4 border-stone-100 shadow-inner relative group">
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl">
                <QRCodeSVG 
                  id="guest-qr-code"
                  value={guestUrl} 
                  size={240}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "https://vinetelligence.com/favicon.ico", // Placeholder or app logo
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/0 group-hover:bg-stone-900/10 transition-all rounded-[3rem] pointer-events-none">
                <QrCode className="text-stone-900 opacity-0 group-hover:opacity-100 transition-all scale-150" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={downloadQRCode}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-lg"
              >
                <Download size={14} />
                Download PNG
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95"
              >
                <Printer size={14} />
                Print Kit
              </button>
            </div>
          </div>

          {/* Configuration & Info */}
          <div className="flex-1 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-amber-600 mb-2">
                <Smartphone size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Guest Experience Protocol</span>
              </div>
              <h3 className="text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Digital Menu Gateway</h3>
              <p className="text-stone-500 text-sm italic font-medium leading-relaxed">
                Generate unique access nodes for your guests. Each QR code synchronizes with the cloud silo to provide real-time inventory and AI-driven recommendations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Target Table / Node</label>
                <div className="flex flex-wrap gap-2">
                  {['Bar', '1', '2', '3', '4', '5', '6', 'V1', 'V2'].map(table => (
                    <button 
                      key={table}
                      onClick={() => setSelectedTable(table)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedTable === table ? 'bg-amber-500 text-stone-900 shadow-lg scale-110' : 'bg-stone-50 text-stone-400 border border-stone-100 hover:border-stone-300'}`}
                    >
                      {table}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Direct Access URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 text-[10px] font-mono text-stone-500 truncate">
                    {guestUrl}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`px-6 rounded-2xl transition-all flex items-center justify-center ${copied ? 'bg-emerald-500 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
                <div className="flex items-center gap-2 text-stone-900">
                  <ExternalLink size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Preview</span>
                </div>
                <p className="text-[10px] text-stone-500 font-medium italic mb-4">Test the guest interface in a new tab.</p>
                <a 
                  href={guestUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 underline decoration-2 underline-offset-4"
                >
                  Open Portal
                </a>
              </div>
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
                <div className="flex items-center gap-2 text-stone-900">
                  <Share2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Social Integration</span>
                </div>
                <p className="text-[10px] text-stone-500 font-medium italic mb-4">Embed this node in your digital profiles.</p>
                <button className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 underline decoration-2 underline-offset-4">
                  Copy Embed Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Print Preview Helper */}
        <div className="hidden print:block fixed inset-0 bg-white z-[2000] p-20 text-center space-y-10">
          <div className="border-8 border-stone-900 p-20 rounded-[5rem] inline-block">
            <h1 className="text-6xl font-serif font-black italic mb-10">Vinetelligence.com</h1>
            <div className="bg-white p-10 inline-block border-4 border-stone-100 rounded-[3rem]">
               <QRCodeSVG value={guestUrl} size={400} level="H" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-[0.5em] mt-10">Table {selectedTable}</h2>
            <p className="text-xl font-serif italic mt-6 text-stone-500">Scan to explore our curated collection</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestAccess;
