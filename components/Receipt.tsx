
import React, { useRef } from 'react';
import { RetailTransaction, RestaurantProfile } from '../lib/types';
import { motion } from 'motion/react';
import { Printer, Download, X, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceiptProps {
  transaction: RetailTransaction;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ transaction, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const profile: RestaurantProfile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
            .receipt-container { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .totals { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
            .bold { font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = receiptRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150] // Receipt size
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${transaction.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div>
            <h3 className="text-xl font-serif font-black italic text-stone-900">Guest Receipt</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Transaction Settlement</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-rose-500 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-stone-50/30">
          {/* Receipt Preview */}
          <div 
            ref={receiptRef}
            className="bg-white p-8 shadow-sm border border-stone-100 font-mono text-[#141414] mx-auto max-w-[320px]"
            style={{ minHeight: '400px' }}
          >
            <div className="text-center mb-6 border-b border-dashed border-stone-300 pb-4">
              <h2 className="text-lg font-black uppercase tracking-tighter">{profile.name || 'VINETELLIGENCE AI'}</h2>
              <p className="text-[10px] opacity-60">{profile.location || 'GLOBAL OPERATIONS'}</p>
              <p className="text-[10px] opacity-60 mt-1">{new Date(transaction.timestamp).toLocaleString()}</p>
              <p className="text-[10px] font-bold mt-2">TX: {transaction.id}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[10px] font-bold border-b border-stone-100 pb-1">
                <span>ITEM</span>
                <span>QTY</span>
                <span>PRICE</span>
              </div>
              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[150px]">{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Subtotal</span>
                <span>${transaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Tax</span>
                <span>${transaction.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Gratuity</span>
                <span>${transaction.gratuity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-stone-100">
                <span>TOTAL</span>
                <span>${transaction.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 text-[10px] space-y-1 opacity-70">
              <p>Payment: {transaction.paymentMethod}</p>
              <p>Table: {transaction.tableNumber}</p>
              {transaction.guestName && <p>Guest: {transaction.guestName}</p>}
            </div>

            <div className="mt-8 text-center border-t border-dashed border-stone-300 pt-4">
              <p className="text-[10px] font-bold italic uppercase tracking-widest">Thank You</p>
              <p className="text-[8px] opacity-50 mt-1 italic">Vinetelligence AI Beverage Intelligence</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-stone-100 grid grid-cols-2 gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-3 py-4 bg-stone-100 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-3 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button 
            className="col-span-2 flex items-center justify-center gap-3 py-4 border border-stone-200 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-stone-900 hover:text-stone-900 transition-all"
          >
            <Mail className="w-4 h-4" />
            Send to Email
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Receipt;
