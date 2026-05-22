
import React, { useMemo, useRef, useState } from 'react';
import { InventoryItem } from '../lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InventoryReportProps {
  items: InventoryItem[];
  onClose: () => void;
}

const InventoryReport: React.FC<InventoryReportProps> = ({ items, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('intelligence_profile') || localStorage.getItem('oenovia_profile') || '{}');
    } catch {
      return {};
    }
  }, []);

  const reportTimestamp = useMemo(() => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      iso: now.toISOString().split('T')[0]
    };
  }, []);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((acc, item) => acc + (Number(item.stock) || 0), 0);
    const totalConsumed = items.reduce((acc, item) => acc + (Number(item.consumed) || 0), 0);
    const totalValue = items.reduce((acc, item) => acc + (Number(item.stock) * Number(item.price)), 0);
    const lowStockItems = items.filter(item => item.stock <= item.minStock).length;

    return {
      totalItems,
      totalStock: Number(totalStock.toFixed(2)),
      totalConsumed: Number(totalConsumed.toFixed(2)),
      totalValue,
      lowStockItems,
      utilizationRate: totalConsumed > 0 ? (totalConsumed / (totalStock + totalConsumed) * 100).toFixed(2) : '0'
    };
  }, [items]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const scrollableDiv = element.querySelector('.overflow-y-auto') as HTMLElement;
      
      // Save original styles
      const originalMaxHeight = element.style.maxHeight;
      const originalHeight = element.style.height;
      const originalOverflow = scrollableDiv ? scrollableDiv.style.overflow : '';
      
      // Adjust styles for full-content capture
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
      if (scrollableDiv) {
        scrollableDiv.style.overflow = 'visible';
        scrollableDiv.style.maxHeight = 'none';
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.hasAttribute('data-pdf-ignore')
      });
      
      // Restore original styles
      element.style.maxHeight = originalMaxHeight;
      element.style.height = originalHeight;
      if (scrollableDiv) {
        scrollableDiv.style.overflow = originalOverflow;
        scrollableDiv.style.maxHeight = '';
      }
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If content is longer than one page, we could add multi-page logic here, 
      // but usually a4 is enough for scaled inventory if not too many items.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297)); 
      
      pdf.save(`Intelligence_Inventory_Report_${reportTimestamp.iso}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div 
        ref={reportRef}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col"
      >
        <div className="p-6 md:p-8 bg-stone-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <i className="fas fa-chart-line text-8xl"></i>
          </div>
          <div className="relative z-10 w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-black uppercase text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Logistics Audit</span>
              <div className="hidden sm:block h-4 w-px bg-white/10" />
              <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest italic truncate max-w-[200px]">{profile.name || 'Intelligence Sandbox'}</p>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-black italic tracking-tight">Inventory Utilization Report</h3>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <i className="far fa-calendar text-[10px] text-amber-500/60"></i>
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-tighter">{reportTimestamp.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="far fa-clock text-[10px] text-amber-500/60"></i>
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-tighter">{reportTimestamp.time}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 z-20 w-full sm:w-auto">
            <button 
              data-pdf-ignore
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 text-stone-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-file-pdf"></i>
              )}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button 
              data-pdf-ignore
              onClick={onClose} 
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90 border border-white/5 shadow-xl shrink-0"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-stone-50 border-b border-stone-200 shrink-0">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Total Available</p>
            <p className="text-2xl font-serif font-black italic text-stone-900">{stats.totalStock.toFixed(2)}</p>
            <p className="text-[8px] text-stone-500 mt-1 uppercase font-bold tracking-tighter">Current Units in Stock</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Total Consumed</p>
            <p className="text-2xl font-serif font-black italic text-amber-900">{stats.totalConsumed.toFixed(2)}</p>
            <p className="text-[8px] text-stone-500 mt-1 uppercase font-bold tracking-tighter">Historical Usage Volume</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Utilization Rate</p>
            <p className="text-2xl font-serif font-black italic text-emerald-900">{stats.utilizationRate}%</p>
            <div className="w-full h-1 bg-stone-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${stats.utilizationRate}%` }}></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <p className="text-[9px] font-black text-rose-600 uppercase mb-1">Inventory Value</p>
            <p className="text-2xl font-serif font-black italic text-rose-900">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[8px] text-stone-500 mt-1 uppercase font-bold tracking-tighter">Liquid Asset Valuation</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-100">
                <th className="px-4 py-4">Item Identity</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4 text-emerald-600">Available</th>
                <th className="px-4 py-4 text-amber-600">Consumed</th>
                <th className="px-4 py-4">Forecast (7D)</th>
                <th className="px-4 py-4">Total Capacity</th>
                <th className="px-4 py-4">Usage %</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {items.map(item => {
                const total = (item.stock || 0) + (item.consumed || 0);
                const usagePct = total > 0 ? ((item.consumed || 0) / total * 100).toFixed(2) : '0';
                const isLow = item.stock <= item.minStock;

                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition-all">
                    <td className="px-4 py-5">
                      <p className="text-sm font-bold text-stone-800">{item.name}</p>
                      <p className="text-[8px] text-stone-400 font-black uppercase tracking-tighter">{item.unit}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-3 py-1 bg-stone-100 rounded-full text-[8px] font-black uppercase text-stone-500">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-black text-emerald-600">{(item.stock || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-black text-amber-600">{(item.consumed || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black ${item.predictedDemand && item.predictedDemand > item.stock ? 'text-amber-600' : 'text-stone-700'}`}>
                          {item.predictedDemand || '--'}
                        </span>
                        <span className="text-[7px] font-black text-stone-400 uppercase tracking-tighter">Predicted</span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-black text-stone-400">{total.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${usagePct}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-stone-600">{usagePct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      {isLow ? (
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100">
                          Critical Depletion
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        <div className="p-8 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
          <p className="text-[10px] text-stone-400 italic">
            * All data is synchronized in real-time with the Supabase Cloud Silo.
          </p>
          <button 
            data-pdf-ignore
            onClick={onClose}
            className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-500 hover:text-stone-950 transition-all active:scale-95"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
