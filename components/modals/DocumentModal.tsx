
import React, { useRef } from 'react';
import { Invoice, RestaurantProfile } from '../../lib/types';

interface DocumentModalProps {
  type: 'invoice' | 'receipt';
  invoice: Invoice;
  profile: RestaurantProfile;
  onClose: () => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ type, invoice, profile, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore app state after printing
    }
  };

  const isPaid = invoice.status === 'Paid';
  const docTitle = type === 'invoice' ? 'Commercial Invoice' : 'Payment Receipt';
  const subTotal = invoice.amount / 1.2; // Mock calculation
  const tax = invoice.amount - subTotal;

  const transactionId = `node_${invoice.id.replace('INV-', '')}`;

  return (
    <div className="fixed inset-0 z-[1000] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-stone-200">
        
        {/* Modal Header */}
        <div className="px-6 md:px-10 py-4 md:py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-500 flex items-center justify-center shadow-lg">
                <i className={`fas ${type === 'invoice' ? 'fa-file-invoice-dollar' : 'fa-receipt'}`}></i>
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">{docTitle}</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Reference: {invoice.id}</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="px-6 py-2.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <i className="fas fa-print"></i>
              Print
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar print:p-0">
          <div className="max-w-[800px] mx-auto space-y-12 print:max-w-none">
            
            {/* Logo & Header */}
            <div className="flex justify-between items-start">
               <div className="space-y-4">
                  <h1 className="text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Vinetelligence</h1>
                  <div className="text-[10px] text-stone-500 font-medium leading-relaxed">
                     <p>Global Intelligence Network</p>
                     <p>Software Support Operations</p>
                     <p>Cloud Node Integration</p>
                     <p>business@vinetelligence.live</p>
                  </div>
               </div>
               <div className="text-right space-y-1">
                  <h2 className="text-4xl font-serif font-bold text-stone-300 italic opacity-50 uppercase tracking-tighter">{type}</h2>
                  <p className="text-[11px] font-black text-stone-900"># {invoice.id}</p>
                  <p className="text-[10px] font-bold text-stone-400">{invoice.date}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-8 border-t border-stone-100">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Bill To:</h4>
                  <div className="text-xs font-bold text-stone-800 space-y-1">
                     <p className="text-lg font-black italic text-stone-900">{profile.name}</p>
                     <p>{profile.address || 'Address not registered'}</p>
                     <p>{profile.email || 'Email not registered'}</p>
                     <p>Node ID: {profile.id.slice(0, 8)}...</p>
                  </div>
               </div>
               <div className="space-y-4 text-right">
                  <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Payment Meta:</h4>
                  <div className="text-xs font-bold text-stone-800 space-y-1">
                     <p>Method: {invoice.method}</p>
                     <p>Status: <span className={invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{invoice.status}</span></p>
                     {isPaid && <p>Transaction: {transactionId}</p>}
                  </div>
               </div>
            </div>

            {/* Line Items */}
            <div className="pt-12 overflow-x-auto">
               <table className="w-full text-left min-w-[500px]">
                  <thead>
                     <tr className="border-b border-stone-200">
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Description</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Quantity</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Unit Price</th>
                        <th className="py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Total</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                     <tr>
                        <td className="py-6">
                           <p className="text-sm font-black text-stone-900">Beverage Academy & AI Intelligence</p>
                           <p className="text-[10px] text-stone-400 font-medium italic mt-1">Tier: {profile.edition.toUpperCase()} subscription renewal</p>
                        </td>
                        <td className="py-6 text-right text-sm font-bold text-stone-600">1</td>
                        <td className="py-6 text-right text-sm font-bold text-stone-600">${subTotal.toFixed(2)}</td>
                        <td className="py-6 text-right text-sm font-black text-stone-900">${subTotal.toFixed(2)}</td>
                     </tr>
                  </tbody>
               </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-8 border-t border-stone-200">
               <div className="w-64 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-stone-500">
                     <span>Subtotal</span>
                     <span>${subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-stone-500">
                     <span>Network Tax (1.2%)</span>
                     <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-stone-100">
                     <span className="text-[10px] font-black uppercase text-stone-900 tracking-widest">Total due</span>
                     <span className="text-2xl font-serif font-black italic text-stone-900">${invoice.amount.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="pt-20 text-center space-y-4">
               <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em]">Integrated Intelligence Protocols</p>
               <div className="flex justify-center gap-8 opacity-20 filter grayscale">
                  <i className="fab fa-stripe text-3xl"></i>
                  <i className="fab fa-paypal text-3xl"></i>
                  <i className="fas fa-shield-halved text-2xl"></i>
               </div>
               <p className="text-[10px] text-stone-400 italic font-medium leading-relaxed max-w-sm mx-auto">
                  "This document serves as an official record of the Vinetelligence transaction. All neural protocols successfully synchronized."
               </p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        {type === 'receipt' && (
          <div className="p-8 bg-black text-white text-center shrink-0">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Node Verification Successful</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentModal;
