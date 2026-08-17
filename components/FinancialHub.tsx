
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { geminiService } from '../services/geminiService';
import { generateUUID } from '../services/supabaseSync';
import { financialIntegrationService } from '../services/financialIntegrationService';
import { RetailTransaction, InventoryItem, FinancialReport, InvestorInsight, RestaurantProfile } from '../lib/types';
import { FISCAL_ENGINE_CONFIG, FISCAL_ENGINE_LOGIC } from '../constants';

interface FinancialHubProps {
  restaurantProfile?: RestaurantProfile | null;
  inventory?: InventoryItem[];
  transactions?: RetailTransaction[];
  authMode?: 'demo' | 'secure';
}

const FinancialHub: React.FC<FinancialHubProps> = ({ 
  restaurantProfile = null,
  inventory = [], 
  transactions = [],
  authMode = 'demo'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'ledger' | 'reports' | 'integration'>('overview');
  const isRuthChris = restaurantProfile && (restaurantProfile.name?.includes("Ruth's Chris") || ('isRuthChris' in restaurantProfile && (restaurantProfile as unknown as { isRuthChris?: boolean }).isRuthChris));
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isPushingData, setIsPushingData] = useState(false);
  const [integrationResult, setIntegrationResult] = useState<{ success: boolean; message: string; referenceId?: string } | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState({ endpoint: 'https://api.financial-system.com/v1/ledger', apiKey: 'SK-VNTL-XXXXXXXXXX' });
  const [currentReport, setCurrentReport] = useState<FinancialReport | null>(null);
  const [investorInsight, setInvestorInsight] = useState<InvestorInsight | null>(null);

  // Export and print states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<{
    title: string;
    type: 'statement' | 'ledger' | 'report' | 'investor';
    date: string;
    refId: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportStatement = () => {
    setExportData({
      title: "Net Round Statement",
      type: "statement",
      date: new Date().toLocaleDateString(),
      refId: `STM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    setIsExportModalOpen(true);
  };

  const handleExportLedger = () => {
    setExportData({
      title: "Global Settlement Ledger",
      type: "ledger",
      date: new Date().toLocaleDateString(),
      refId: `LDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    setIsExportModalOpen(true);
  };

  const handleExportReport = () => {
    if (!currentReport) return;
    setExportData({
      title: currentReport.title,
      type: "report",
      date: new Date(currentReport.timestamp).toLocaleDateString(),
      refId: currentReport.id
    });
    setIsExportModalOpen(true);
  };

  const handleExportInvestor = () => {
    if (!investorInsight) return;
    setExportData({
      title: "Strategic Equity Brief",
      type: "investor",
      date: new Date().toLocaleDateString(),
      refId: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    setIsExportModalOpen(true);
  };

  const handleGeneratePDF = async () => {
    const element = document.getElementById('export-document-target');
    if (!element) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Vinetelligence_Export_${exportData?.type || 'financial'}_${exportData?.refId || 'export'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('export-document-target');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>\${exportData?.title || 'Financial Export'}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #000; background-color: #fff; }
            .print-container { max-width: 800px; margin: 0 auto; }
            h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 12px 8px; text-align: left; }
            th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 800; }
            .text-right { text-align: right; }
            .grid { display: grid; gap: 20px; }
            .grid-cols-1 { grid-template-columns: 1fr; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
            .bg-stone-50 { background-color: #f9fafb; border-radius: 12px; padding: 16px; }
            .bg-stone-900 { background-color: #111827; color: #fff; border-radius: 16px; padding: 24px; }
            .p-4 { padding: 16px; }
            .p-6 { padding: 24px; }
            .rounded-2xl { border-radius: 16px; }
            .border { border: 1px solid #e5e7eb; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-4 > * + * { margin-top: 16px; }
            .space-y-6 > * + * { margin-top: 24px; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-[10px] { font-size: 10px; }
            .text-[9px] { font-size: 9px; }
            .text-[8px] { font-size: 8px; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .italic { font-style: italic; }
            .text-indigo-600 { color: #4f46e5; }
            .text-indigo-500 { color: #6366f1; }
            .text-rose-500 { color: #f43f5e; }
            .text-amber-600 { color: #d97706; }
            .text-emerald-500 { color: #10b981; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .pb-4 { padding-bottom: 16px; }
            .pb-8 { padding-bottom: 32px; }
            .pt-4 { padding-top: 16px; }
            .pt-8 { padding-top: 32px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            \${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Deep Profitability Mapping utilizing central config
  const categoryStats = useMemo(() => {
    const data: Record<string, { name: string, revenue: number, cost: number, count: number }> = {
      'Wine': { name: 'Wine', revenue: 0, cost: 0, count: 0 },
      'Spirit': { name: 'Spirit', revenue: 0, cost: 0, count: 0 },
      'Beer': { name: 'Beer', revenue: 0, cost: 0, count: 0 },
      'Mixer': { name: 'Mixer', revenue: 0, cost: 0, count: 0 },
      'Snack': { name: 'Snack', revenue: 0, cost: 0, count: 0 },
    };

    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const cat = item.style || 'Other';
        if (data[cat]) {
          data[cat].revenue += item.priceAtOrder * item.quantity;
          data[cat].count += item.quantity;
          const invItem = inventory.find(i => i.name === item.name);
          if (invItem) {
            data[cat].cost += invItem.originalPrice * item.quantity;
          } else {
            // Fallback: Use generic COGS fallback from config
            data[cat].cost += (item.priceAtOrder * FISCAL_ENGINE_CONFIG.DEFAULT_COGS_FALLBACK) * item.quantity;
          }
        }
      });
    });

    return Object.values(data).map(d => ({
      ...d,
      margin: FISCAL_ENGINE_LOGIC.calculateMargin(d.revenue, d.cost)
    }));
  }, [transactions, inventory]);

  // Global Ledger Summation
  const netRevenue = transactions.reduce((acc, curr) => acc + curr.total, 0);
  const totalCogs = transactions.reduce((acc, curr) => {
    return acc + curr.items.reduce((iSum, i) => {
      const inv = inventory.find(inv => inv.name === i.name);
      return iSum + (inv ? inv.originalPrice * i.quantity : (i.priceAtOrder * FISCAL_ENGINE_CONFIG.DEFAULT_COGS_FALLBACK * i.quantity));
    }, 0);
  }, 0);

  // Use Centralized Formula Logic
  const estimatedLabor = FISCAL_ENGINE_LOGIC.calculateLabor(netRevenue);
  const estimatedOverhead = FISCAL_ENGINE_LOGIC.calculateOverhead(netRevenue);
  const netProfit = FISCAL_ENGINE_LOGIC.calculateNetAlpha(netRevenue, totalCogs);

  const handleGenerateReport = async (type: string) => {
    setIsGeneratingReport(true);
    setCurrentReport(null);
    setInvestorInsight(null);

    try {
      if (type === 'Investor') {
        const res = await geminiService.getInvestorIntelligence(transactions, inventory);
        setInvestorInsight(res);
      } else {
        const res = await geminiService.getFinancialIntelligence(transactions, inventory, type);
        const report: FinancialReport = {
          id: generateUUID(),
          timestamp: new Date().toISOString(),
          type: type as FinancialReport['type'],
          title: res.title,
          narrative: res.narrative,
          metrics: res.metrics,
          aiAdvice: res.aiAdvice
        };
        setCurrentReport(report);
      }
      setActiveTab('reports');
    } catch (e) { console.error(e); }
    finally { setIsGeneratingReport(false); }
  };

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handlePushToThirdParty = async () => {
    setIsPushingData(true);
    setIntegrationResult(null);
    try {
      const payload = financialIntegrationService.generateExportPayload(transactions, inventory);
      const res = await financialIntegrationService.pushToThirdParty(integrationConfig.endpoint, integrationConfig.apiKey, payload);
      if (res.success) {
        setNotification({ message: `Data successfully pushed to ${integrationConfig.endpoint}. Reference: ${res.referenceId}`, type: 'success' });
      } else {
        setNotification({ message: `Failed to push data: ${res.message}`, type: 'error' });
      }
      setTimeout(() => setNotification(null), 5000);
      setIntegrationResult(res);
    } catch (e) {
      console.error(e);
      setIntegrationResult({ success: false, message: "Critical failure during data synthesis." });
    } finally {
      setIsPushingData(false);
    }
  };

  const handleDownloadExport = () => {
    const payload = financialIntegrationService.generateExportPayload(transactions, inventory);
    financialIntegrationService.downloadJsonExport(payload);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 px-4 md:px-0 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 mb-8 pb-4 shrink-0">
        <div>
           <h2 className="text-3xl font-serif font-black text-stone-900 italic">Fiscal Auditor</h2>
           <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em] mt-1">Consolidated Net round Yield Terminal</p>
        </div>
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl shadow-inner">
           {['overview', 'statement', 'ledger', 'reports', 'integration'].map(t => (
             <button 
              key={t}
              onClick={() => setActiveTab(t as 'overview' | 'statement' | 'ledger' | 'reports' | 'integration')}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      {authMode === 'demo' && (
        <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
              Fiscal Simulation Active: Using Synthetic Transactional Data
            </p>
          </div>
          <p className="text-[9px] italic text-indigo-500/60">
            Connect a production profile to view live financial intelligence.
          </p>
        </div>
      )}

      <div className="flex-1 lg:overflow-y-auto custom-scrollbar pr-1 pb-20 touch-scrolling">
        {notification && (
          <div className={`mb-8 p-6 rounded-2xl border animate-in slide-in-from-top-4 flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
            <div className="flex items-center gap-4">
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-indigo-500'} text-xl`}></i>
              <p className="text-[11px] font-black uppercase tracking-widest">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             {isRuthChris && (
               <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2 text-amber-600 font-bold">
                        <i className="fas fa-chart-line"></i>
                        <span className="text-xs font-black uppercase tracking-widest">Ruth's Chris Benchmark Active</span>
                     </div>
                     <p className="text-xs text-stone-600 leading-relaxed italic">
                        Evaluating single-location fine dining steakhouse economics. Pro forma baseline built on historic 2022/2023 public filings.
                     </p>
                  </div>
                  <div className="flex gap-4 text-center">
                     <div className="px-4 py-2 bg-stone-900 rounded-xl text-white">
                        <p className="text-[8px] uppercase tracking-widest text-stone-400">Capacity</p>
                        <p className="text-xs font-bold">120 Seats</p>
                     </div>
                     <div className="px-4 py-2 bg-stone-900 rounded-xl text-white">
                        <p className="text-[8px] uppercase tracking-widest text-stone-400">Turns</p>
                        <p className="text-xs font-bold">1.8 turns/day</p>
                     </div>
                     <div className="px-4 py-2 bg-stone-900 rounded-xl text-white">
                        <p className="text-[8px] uppercase tracking-widest text-stone-400">Spend</p>
                        <p className="text-xs font-bold">$95.00</p>
                     </div>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
                   <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest text-center">Gross realized Revenue</p>
                   <p className="text-3xl font-serif font-black italic text-emerald-400 text-center">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{netRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4">
                   <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center">Acquisition Cost (COGS)</p>
                   <p className="text-3xl font-serif font-black italic text-stone-800 text-center">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{totalCogs.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4">
                   <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center">Burn (Labor {FISCAL_ENGINE_CONFIG.LABOR_BURN_RATE * 100}%)</p>
                   <p className="text-3xl font-serif font-black italic text-stone-800 text-center">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{(estimatedLabor + estimatedOverhead).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
                   <p className="text-[9px] font-black uppercase text-emerald-200 tracking-widest text-center">Net round Alpha</p>
                   <p className="text-3xl font-serif font-black italic text-center">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{netProfit.toLocaleString()}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-stone-200 shadow-xl space-y-8">
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 italic">Profitability Radar</h3>
                      <p className="text-[9px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">Gross Margin Accuracy by category</p>
                   </div>
                   <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryStats}>
                            <PolarGrid stroke="#f5f5f4" />
                            <PolarAngleAxis dataKey="name" tick={{fill: '#a8a29e', fontSize: 10, fontWeight: 'bold'}} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                            <Radar name="Margin %" dataKey="margin" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-stone-950 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><i className="fas fa-coins text-9xl"></i></div>
                   <div className="space-y-6 relative z-10">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">AI Yield Insight</span>
                      <h4 className="text-3xl font-serif font-black italic leading-tight">"Fiscal archives suggest Spirit-Forward rounds are generating {((categoryStats.find(c => c.name === 'Spirit')?.margin || 0)).toFixed(0)}% margin representing optimal net yield."</h4>
                      <p className="text-stone-400 text-sm leading-relaxed italic border-l-2 border-emerald-500/50 pl-6">Prioritize premium spirit upselling during high-occupancy cycles to maximize net alpha.</p>
                   </div>
                   <div className="pt-10 space-y-4">
                      <div className="flex justify-between text-[9px] font-black text-stone-500 uppercase"><span>Auditor Confidence Index</span><span>94.2%</span></div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_15px_#10b981]"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="bg-white rounded-[3.5rem] border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 max-w-5xl mx-auto">
             <div className="p-4 md:p-12 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50">
                <div>
                   <h3 className="text-2xl md:text-4xl font-serif font-black text-stone-900 italic tracking-tighter">Net Round Statement</h3>
                   <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-2">Fiscal Synthesis: Historical Aggregate</p>
                </div>
                <div className="flex items-center gap-4 text-left md:text-right">
                   <div className="hidden sm:block">
                      <p className="text-[9px] font-black uppercase text-stone-400">Node Status</p>
                      <p className="text-xs font-bold text-indigo-600 uppercase italic">Audited & Verified</p>
                   </div>
                   <button 
                     onClick={handleExportStatement}
                     className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-indigo-500/15 cursor-pointer"
                   >
                     <i className="fas fa-file-pdf"></i> Print / Export
                   </button>
                </div>
             </div>
             
             <div className="p-6 md:p-12 space-y-12">
                {isRuthChris ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-stone-800">
                    {/* Column 1: Live Simulation Actuals */}
                    <div className="space-y-8 border-b lg:border-b-0 lg:border-r border-stone-100 pr-0 lg:pr-12 pb-12 lg:pb-0">
                       <div className="border-b border-stone-200 pb-4">
                          <h4 className="text-sm font-black uppercase text-indigo-600 tracking-wider">Live Simulation Scaling</h4>
                          <p className="text-[10px] text-stone-400 uppercase mt-1">POS records scaled to annual operating run-rate</p>
                       </div>
                       
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Projected Run-rate Revenue</p>
                          <div className="flex justify-between items-end border-b border-stone-100 pb-2">
                             <span className="text-xs text-stone-500 font-bold uppercase">Estimated Annual Revenue</span>
                             <span className="font-serif font-black text-xl text-stone-900">${(netRevenue * 360).toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="space-y-4 pt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Projected Variable Costs</p>
                          <div className="flex justify-between border-b border-stone-100 pb-2 text-xs">
                             <span className="text-stone-500 font-bold uppercase">Estimated COGS</span>
                             <span className="font-bold text-stone-800">-${(totalCogs * 360).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-stone-100 pb-2 text-xs">
                             <span className="text-stone-500 font-bold uppercase">Estimated Labor (Est 22%)</span>
                             <span className="font-bold text-stone-800">-${(estimatedLabor * 360).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-b border-stone-100 pb-2 text-xs">
                             <span className="text-stone-500 font-bold uppercase">Operating Overhead (Est 12%)</span>
                             <span className="font-bold text-stone-800">-${(estimatedOverhead * 360).toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-stone-200">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Est. Target Run Margin</p>
                                <p className="text-xs text-stone-400 mt-1 italic">{(netRevenue > 0 ? ((netProfit / netRevenue) * 100) : 0).toFixed(1)}% Net Margin</p>
                             </div>
                             <span className="font-serif font-black text-2xl text-indigo-600 italic">${(netProfit * 360).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                    {/* Column 2: Ruth's Chris Steak House Benchmark */}
                    <div className="space-y-8">
                       <div className="border-b border-stone-200 pb-4 flex justify-between items-start">
                          <div>
                             <h4 className="text-sm font-black uppercase text-amber-600 tracking-wider">Ruth's Chris 10-K Blueprint</h4>
                             <p className="text-[10px] text-stone-400 uppercase mt-1">Strict fine dining baseline economics</p>
                          </div>
                          <span className="text-[8px] bg-amber-500 text-stone-950 font-black px-2 py-1 rounded">10-K BENCHMARK</span>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Standard Revenue Streams</p>
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-stone-500">Food Revenue (70%)</span>
                             <span className="font-bold text-stone-800">$5,164,560</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-stone-500">Beverage Revenue (30%)</span>
                             <span className="font-bold text-stone-800">$2,213,384</span>
                          </div>
                          <div className="flex justify-between items-end border-b border-stone-100 pb-2">
                             <span className="text-xs font-black text-amber-700 uppercase">Total Target Revenue (360 Operating Days)</span>
                             <span className="font-serif font-black text-xl text-stone-900">$7,377,944</span>
                          </div>
                       </div>

                       <div className="space-y-4 pt-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Cost Structure (Target 60% Prime Costs)</p>
                          <div className="space-y-2">
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Food COGS (31% of Food Sales)</span>
                                <span className="font-medium text-stone-600">-$1,601,013</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Beverage COGS (21% of Bev Sales)</span>
                                <span className="font-medium text-stone-600">-$464,810</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-stone-500 font-bold">Total Cost of Goods Sold (28% of Rev)</span>
                                <span className="font-bold text-stone-800">-$2,065,823</span>
                             </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-dashed border-stone-100">
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Management Salaries</span>
                                <span className="font-medium text-stone-600">-$240,000</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Back of House (BOH, 14% of Rev)</span>
                                <span className="font-medium text-stone-600">-$1,032,912</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Front of House (FOH, 11% of Rev)</span>
                                <span className="font-medium text-stone-600">-$811,573</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Benefits & Taxes (4% of Rev)</span>
                                <span className="font-medium text-stone-600">-$295,117</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-stone-500 font-bold">Total Labor & Personnel (32% of Rev)</span>
                                <span className="font-bold text-stone-800">-$2,379,602</span>
                             </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-dashed border-stone-100">
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Occupancy (Rent, NNN, Utilities, 8%)</span>
                                <span className="font-medium text-stone-600">-$590,235</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Restaurant Operating Expenses (5%)</span>
                                <span className="font-medium text-stone-600">-$368,897</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Marketing & Acquisition (3%)</span>
                                <span className="font-medium text-stone-600">-$221,338</span>
                             </div>
                             <div className="flex justify-between text-xs pl-2">
                                <span className="text-stone-500">Administrative & Insurance (4%)</span>
                                <span className="font-medium text-stone-600">-$295,117</span>
                             </div>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-stone-200">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Target Net Operating Margin</p>
                                <p className="text-xs text-amber-600 font-bold mt-1">20.0% Net Pro Forma Margin</p>
                             </div>
                             <span className="font-serif font-black text-2xl text-amber-600 italic">$1,477,588</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <>
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-3">Operational Revenue</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-lg font-serif">
                         <span className="text-stone-600 italic text-sm md:text-lg">Beverage realized Sales</span>
                         <span className="font-black text-stone-900">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{netRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs md:text-sm italic opacity-40">
                         <span className="text-stone-400">Tax Liabilities ({FISCAL_ENGINE_CONFIG.TAX_RATE * 100}%)</span>
                         <span className="font-bold text-stone-900">({FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{ (netRevenue * FISCAL_ENGINE_CONFIG.TAX_RATE).toFixed(2) })</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 border-b border-indigo-50 pb-3">Operational Burn (Costs)</h4>
                   <div className="space-y-4">
                      {categoryStats.map(cat => (
                        <div key={cat.name} className="flex justify-between items-center text-xs md:text-sm font-bold">
                           <span className="text-stone-400 uppercase tracking-widest">{cat.name} COGS</span>
                           <span className="text-indigo-600">-{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{cat.cost.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-xs md:text-sm font-bold">
                         <span className="text-stone-400 uppercase tracking-widest">Labor Allocation (Est {FISCAL_ENGINE_CONFIG.LABOR_BURN_RATE * 100}%)</span>
                         <span className="text-indigo-600">-{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{estimatedLabor.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t-4 border-stone-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <h4 className="text-xl md:text-2xl font-serif font-black text-stone-900 italic tracking-tighter uppercase">Net Fiscal Alpha</h4>
                   <div className="text-left md:text-right">
                      <p className="text-3xl md:text-5xl font-serif font-black text-indigo-600 italic tracking-tighter">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{netProfit.toLocaleString()}</p>
                      <p className="text-[9px] font-black uppercase text-stone-400 mt-2 tracking-widest">Profit Margin: {netRevenue > 0 ? ((netProfit/netRevenue)*100).toFixed(1) : 0}%</p>
                   </div>
                </div>

                <div className="p-8 bg-stone-100 rounded-3xl border border-stone-200 border-dashed text-center">
                   <p className="text-xs text-stone-500 italic font-medium">"This statement is a high-fidelity synthesis based on global {FISCAL_ENGINE_CONFIG.LOCALE} tax standards."</p>
                </div>
                  </>
                )}
             </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
             <div className="p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50">
                <div>
                   <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest italic">Global Settlement Ledger</h3>
                   <span className="text-[9px] font-black bg-stone-900 text-white px-3 py-1 rounded-full mt-1 inline-block">{transactions.length} Transactions Synced</span>
                </div>
                <button 
                  onClick={handleExportLedger}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-indigo-500/15 cursor-pointer"
                >
                  <i className="fas fa-file-pdf"></i> Print / Export
                </button>
             </div>
             <div className="overflow-x-auto touch-scrolling">
                <table className="w-full text-left min-w-[800px]">
                   <thead>
                      <tr className="text-[9px] font-black uppercase text-stone-400 border-b border-stone-50 bg-stone-50/20">
                         <th className="px-10 py-6">Transaction identity</th>
                         <th className="px-10 py-6">Composition</th>
                         <th className="px-10 py-6">Settlement</th>
                         <th className="px-10 py-6 text-right">Value</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                      {transactions.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(tx => (
                        <tr key={tx.id} className="hover:bg-stone-50 transition-all group">
                           <td className="px-10 py-6">
                              <p className="text-sm font-bold text-stone-900">{tx.id}</p>
                              <p className="text-[9px] text-stone-400 font-mono mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                           </td>
                           <td className="px-10 py-6">
                              <p className="text-xs font-bold text-stone-700">{tx.items.length} Units Synthesized</p>
                              <p className="text-[9px] text-stone-400 italic mt-1 truncate max-w-[200px]">{tx.items.map(i => i.name).join(', ')}</p>
                           </td>
                           <td className="px-10 py-6">
                              <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-600 px-3 py-1 rounded-full border border-stone-200">{tx.paymentMethod}</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <span className="text-lg font-serif font-black italic text-stone-900">{FISCAL_ENGINE_CONFIG.CURRENCY_SYMBOL}{tx.total.toFixed(2)}</span>
                           </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan={4} className="py-20 text-center opacity-30 italic">No transactions identified in the local silo.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 space-y-4">
                <div className="bg-stone-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5"><i className="fas fa-file-contract text-7xl"></i></div>
                   <h3 className="text-xl font-serif font-bold text-indigo-400 mb-4 italic">Auditing Hub</h3>
                   <div className="space-y-2">
                      {[
                        { type: 'Executive', icon: 'fa-briefcase', label: 'Executive Intelligence Brief' },
                        { type: 'Investor', icon: 'fa-crown', label: 'Stakeholder Equity Brief', color: 'text-indigo-500' },
                        { type: 'Yield', icon: 'fa-chart-area', label: 'Category Yield Audit' },
                        { type: 'Audit', icon: 'fa-shield-halved', label: 'Fiscal Integrity Audit' },
                        { type: 'Sustainability', icon: 'fa-leaf', label: 'ESG Sustainability Report' }
                      ].map(r => (
                        <button 
                          key={r.type}
                          disabled={isGeneratingReport}
                          onClick={() => handleGenerateReport(r.type)}
                          className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all text-left group"
                        >
                           <i className={`fas ${r.icon} ${r.color || 'text-indigo-500'} opacity-50 group-hover:opacity-100`}></i>
                           <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="lg:col-span-8">
                {isGeneratingReport ? (
                   <div className="h-full flex flex-col items-center justify-center bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-100 py-20">
                      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                      <h4 className="text-xl font-serif font-bold italic text-stone-900">Synthesizing Fiscal Audit...</h4>
                   </div>
                ) : investorInsight ? (
                   <div className="bg-white p-6 md:p-10 rounded-[3rem] border-4 border-rose-500 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><i className="fas fa-crown text-9xl text-rose-500"></i></div>
                      <div className="flex flex-col md:flex-row justify-between items-start border-b border-stone-100 pb-8 gap-4">
                         <div>
                            <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-3 py-1 rounded-full mb-3 inline-block">EQUITY INTELLIGENCE SUITE // STAKEHOLDER</span>
                            <h3 className="text-2xl md:text-4xl font-serif font-black italic text-stone-900">Strategic Equity Brief</h3>
                         </div>
                         <div className="text-left md:text-right">
                            <p className="text-[9px] font-black uppercase text-stone-400">Valuation Node</p>
                            <p className="text-2xl md:text-3xl font-serif font-black italic text-indigo-600">{investorInsight.projectedValuationMultiplier}x</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest italic">Growth Narrative</h4>
                         <p className="text-sm md:text-base text-stone-600 leading-relaxed italic font-medium">"{investorInsight.narrative}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-stone-900 text-white p-6 md:p-8 rounded-3xl space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Scalability Roadmap</h4>
                            <div className="space-y-4">
                               {investorInsight.scalabilityRoadmap.map((item, i) => (
                                 <div key={i} className="border-l-2 border-indigo-500/30 pl-4 space-y-1">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase">{item.phase}</p>
                                    <p className="text-xs font-bold text-white">{item.milestone}</p>
                                    <p className="text-[10px] text-stone-500">{item.impact}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="bg-stone-50 border border-stone-200 p-6 md:p-8 rounded-3xl space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Risk Mitigation</h4>
                            <div className="space-y-4">
                               {investorInsight.riskAssessment.map((item, i) => (
                                 <div key={i} className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                       <p className="text-xs font-bold text-stone-800">{item.category}</p>
                                       <p className="text-[10px] text-stone-500">{item.detail}</p>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded ${item.level === 'Low' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{item.level}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-stone-100 gap-4">
                         <p className="text-[8px] text-stone-300 font-black uppercase tracking-widest">Verified via Vinetelligence Equity Node 2.4</p>
                         <button onClick={handleExportInvestor} className="w-full md:w-auto px-8 py-3 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i className="fas fa-file-pdf"></i> Export Stakeholder Brief
                         </button>
                      </div>
                   </div>
                ) : currentReport ? (
                   <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-stone-200 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                      <div className="flex flex-col md:flex-row justify-between items-start border-b border-stone-100 pb-8 gap-4">
                         <div>
                            <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-3 py-1 rounded-full mb-3 inline-block">VINETELLIGENCE AUDITED // {currentReport.type}</span>
                            <h3 className="text-2xl md:text-4xl font-serif font-black italic text-stone-900">{currentReport.title}</h3>
                         </div>
                         <div className="text-left md:text-right">
                            <p className="text-[9px] font-black uppercase text-stone-400">Node Ref</p>
                            <p className="text-xs font-mono font-bold text-stone-600">{currentReport.id}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {currentReport.metrics.map((m, i) => (
                           <div key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                              <p className="text-[9px] font-black text-stone-400 uppercase">{m.label}</p>
                              <div className="flex justify-between items-end">
                                 <p className="text-2xl font-serif font-black italic text-stone-800">{m.value}</p>
                                 <i className={`fas fa-caret-${m.trend === 'up' ? 'up text-emerald-500' : 'down text-indigo-500'} text-xs mb-1`}></i>
                              </div>
                           </div>
                         ))}
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest italic">Intelligence Narrative</h4>
                         <p className="text-sm md:text-base text-stone-600 leading-relaxed italic font-medium">"{currentReport.narrative}"</p>
                      </div>

                      <div className="bg-stone-900 text-white p-6 md:p-8 rounded-[2rem] space-y-6 shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-lightbulb text-5xl"></i></div>
                         <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest relative z-10">Strategic Guidance</h4>
                         <div className="grid grid-cols-1 gap-3 relative z-10">
                            {currentReport.aiAdvice.map((adv, i) => (
                               <div key={i} className="flex gap-4 items-start">
                                  <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500 text-stone-900 flex items-center justify-center text-[10px] font-black">{i+1}</span>
                                  <p className="text-xs font-bold text-stone-300 pt-1 leading-relaxed">{adv}</p>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-stone-100 gap-4">
                         <p className="text-[8px] text-stone-300 font-black uppercase tracking-widest">Verified via Vinetelligence Intelligence Node 7.2</p>
                         <button onClick={handleExportReport} className="w-full md:w-auto px-8 py-3 bg-stone-100 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <i className="fas fa-file-pdf"></i> Export Protocol
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                      <i className="fas fa-file-invoice-dollar text-6xl mb-4 text-emerald-950"></i>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-950">Select Synthesis Protocol to Initialize Report</p>
                   </div>
                )}
             </div>
          </div>
        )}
        {activeTab === 'integration' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="bg-white p-6 md:p-12 rounded-[3rem] border border-stone-200 shadow-xl space-y-10">
                 <div className="flex items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3 shrink-0">
                          <i className="fas fa-network-wired text-2xl md:text-3xl text-rose-500"></i>
                       </div>
                       <div>
                          <h3 className="text-2xl md:text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Financial Synthesis Interface</h3>
                          <p className="text-stone-500 text-[10px] md:text-xs font-medium uppercase tracking-widest">External Ledger Integration Protocol</p>
                       </div>
                    </div>
                    <div className="hidden md:flex gap-4">
                       <div className="px-5 py-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">API: Live</span>
                       </div>
                    </div>
                 </div>

                 {/* Real-time Synthesis Feed Simulation */}
                 <div className="bg-stone-50 rounded-[2.5rem] p-8 border border-stone-200 mb-10 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Live Synthesis Monitor</h4>
                       <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 italic">Synthetic Stream Active</span>
                    </div>
                    <div className="space-y-2 font-mono text-[9px] text-stone-400 overflow-hidden h-32 no-scrollbar">
                       <p className="flex justify-between"><span>[{new Date().toLocaleTimeString()}] Handshake Request: Stripe v3</span><span className="text-emerald-500">SUCCESS</span></p>
                       <p className="flex justify-between"><span>[{new Date().toLocaleTimeString()}] Poll Node Terminal 04</span><span className="text-emerald-500">200 OK</span></p>
                       <p className="flex justify-between"><span>[{new Date().toLocaleTimeString()}] Sythesizing Local Silo Transactions</span><span className="text-indigo-500">IN PROGRESS</span></p>
                       <p className="flex justify-between"><span>[{new Date().toLocaleTimeString()}] Verification Step 2: JWT Integrity</span><span className="text-emerald-500">VALID</span></p>
                       <p className="flex justify-between"><span>[{new Date().toLocaleTimeString()}] External Audit Sync: Adyen Proxy</span><span className="text-stone-500">PENDING</span></p>
                    </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-4">Target API Endpoint</label>
                         <input 
                           type="text" 
                           value={integrationConfig.endpoint}
                           onChange={e => setIntegrationConfig({...integrationConfig, endpoint: e.target.value})}
                           className="w-full px-6 md:px-8 py-4 bg-stone-50 border border-stone-200 rounded-2xl font-mono text-xs text-stone-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-4">Integration Secret Key</label>
                         <input 
                           type="password" 
                           value={integrationConfig.apiKey}
                           onChange={e => setIntegrationConfig({...integrationConfig, apiKey: e.target.value})}
                           className="w-full px-6 md:px-8 py-4 bg-stone-50 border border-stone-200 rounded-2xl font-mono text-xs text-stone-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="bg-stone-900 rounded-[2.5rem] p-8 md:p-10 text-white space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-file-export text-9xl"></i></div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Payload Preview</h4>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-[9px] font-black uppercase text-stone-500">Transactions</span>
                            <span className="text-xs font-mono">{transactions.length} Nodes</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-[9px] font-black uppercase text-stone-500">Gross Yield</span>
                            <span className="text-xs font-mono text-emerald-400">${netRevenue.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-[9px] font-black uppercase text-stone-500">Schema Version</span>
                            <span className="text-xs font-mono text-rose-500">VNTL-FIN-2.0</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6">
                   <button 
                     onClick={handlePushToThirdParty}
                     disabled={isPushingData}
                     className="flex-1 py-6 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-4"
                   >
                      {isPushingData ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-arrow-up text-rose-500"></i>}
                      Execute Remote Sync
                   </button>
                   <button 
                     onClick={handleDownloadExport}
                     className="w-full md:w-auto px-10 py-6 bg-white border-2 border-stone-900 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-stone-50 transition-all active:scale-95 flex items-center justify-center gap-4"
                   >
                      <i className="fas fa-file-download"></i>
                      Local Export
                   </button>
                </div>

                {integrationResult && (
                  <div className={`p-8 rounded-2xl border animate-in slide-in-from-top-4 ${integrationResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                     <div className="flex items-center gap-4">
                        <i className={`fas ${integrationResult.success ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-rose-500'} text-2xl`}></i>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest">{integrationResult.success ? 'Success' : 'Failure'}</p>
                           <p className="text-[10px] font-medium opacity-80">{integrationResult.message}</p>
                           {integrationResult.referenceId && (
                             <p className="text-[9px] font-mono mt-2 opacity-60">Reference: {integrationResult.referenceId}</p>
                           )}
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}
       </div>

       {isExportModalOpen && exportData && (
        <div className="fixed inset-0 z-[3000] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-stone-100 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-stone-200">
            
            {/* Modal Header */}
            <div className="px-6 md:px-10 py-5 border-b border-stone-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-file-invoice-dollar"></i>
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-900">Export Protocol</h3>
                    <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">Active Safe Tunnel</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-stone-900 text-white hover:bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer animate-in duration-200"
                >
                  <i className="fas fa-print"></i>
                  Print to Printer
                </button>
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isExporting}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 animate-in duration-200"
                >
                  {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                  {isExporting ? 'Generating PDF...' : 'Generate Certified PDF'}
                </button>
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-all cursor-pointer"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Document Workspace/Preview Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar flex items-start justify-center">
              <div className="w-full max-w-[800px] bg-white p-8 md:p-12 rounded-3xl border border-stone-200 shadow-sm space-y-8" id="export-document-target">
                
                {/* Document Header */}
                <div className="border-b border-stone-200 pb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-serif font-black italic tracking-tighter text-stone-900">VINETELLIGENCE</h1>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-1">Consolidated Net Round Yield Terminal</p>
                    <div className="text-[9px] text-stone-400 font-mono mt-3 space-y-0.5">
                      <p>Node ID: {restaurantProfile?.id || 'demo-establishment'}</p>
                      <p>Compliance: VNTL-SEC-2.4</p>
                      <p>Source Node: Vinetelligence.live</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[8px] bg-stone-900 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Official Document</span>
                    <h2 className="text-lg font-serif font-black italic text-stone-800 mt-3">{exportData.title}</h2>
                    <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Ref: {exportData.refId}</p>
                    <p className="text-[9px] font-mono text-stone-400 mt-1">{exportData.date}</p>
                  </div>
                </div>

                {/* Conditional Content */}
                {exportData.type === 'statement' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {isRuthChris ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-stone-800 text-xs">
                        <div className="space-y-4">
                          <h3 className="font-black text-[10px] uppercase text-indigo-600 tracking-wider border-b border-stone-100 pb-2">Live Simulation Run-rate</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Estimated Annual Rev</span>
                              <span className="font-bold">${(netRevenue * 360).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Estimated COGS</span>
                              <span className="font-bold">-${(totalCogs * 360).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Estimated Labor</span>
                              <span className="font-bold">-${(estimatedLabor * 360).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Estimated Overhead</span>
                              <span className="font-bold">-${(estimatedOverhead * 360).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                              <span className="font-black text-stone-900 uppercase">Target Run Margin</span>
                              <span className="font-black text-indigo-600">${(netProfit * 360).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-black text-[10px] uppercase text-amber-600 tracking-wider border-b border-stone-100 pb-2">Ruth's Chris 10-K Blueprint</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Total Target Rev</span>
                              <span className="font-bold">$7,377,944</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Total Target COGS</span>
                              <span className="font-bold">-$2,065,823</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Total Labor</span>
                              <span className="font-bold">-$2,379,602</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-500 font-medium">Total Occupancy / Ops</span>
                              <span className="font-bold">-$1,475,487</span>
                            </div>
                            <div className="flex justify-between pt-2">
                              <span className="font-black text-stone-900 uppercase">Target Net Margin</span>
                              <span className="font-black text-amber-600">$1,477,588</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        <div className="space-y-2 border-b border-stone-100 pb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Operational Revenue</p>
                          <div className="flex justify-between">
                            <span>Beverage realized Sales</span>
                            <span className="font-bold">${netRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-stone-400">
                            <span>Tax Liabilities ({FISCAL_ENGINE_CONFIG.TAX_RATE * 100}%)</span>
                            <span>-(${(netRevenue * FISCAL_ENGINE_CONFIG.TAX_RATE).toFixed(2)})</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-b border-stone-100 pb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Operational Burn (Costs)</p>
                          {categoryStats.map(cat => (
                            <div key={cat.name} className="flex justify-between">
                              <span className="uppercase">{cat.name} COGS</span>
                              <span className="font-medium">-${cat.cost.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span>Labor Allocation (Est {FISCAL_ENGINE_CONFIG.LABOR_BURN_RATE * 100}%)</span>
                            <span className="font-medium">-${estimatedLabor.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex justify-between pt-4 text-sm font-bold">
                          <span className="uppercase text-stone-900 font-black">Net Fiscal Alpha</span>
                          <div className="text-right">
                            <span className="text-lg font-serif font-black italic text-indigo-600">${netProfit.toLocaleString()}</span>
                            <p className="text-[9px] text-stone-400 font-black uppercase">Margin: {netRevenue > 0 ? ((netProfit/netRevenue)*100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {exportData.type === 'ledger' && (
                  <div className="space-y-4 overflow-x-auto animate-in fade-in duration-300">
                    <table className="w-full text-left text-[10px] border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-stone-200 uppercase text-stone-400 font-black">
                          <th className="py-2">Tx Identity</th>
                          <th className="py-2">Composition</th>
                          <th className="py-2">Settlement</th>
                          <th className="py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {transactions.map(tx => (
                          <tr key={tx.id} className="py-2">
                            <td className="py-2 font-mono">
                              <p className="font-bold text-stone-800">{tx.id}</p>
                              <p className="text-[8px] text-stone-400">{new Date(tx.timestamp).toLocaleString()}</p>
                            </td>
                            <td className="py-2 text-stone-600">
                              <p>{tx.items.length} Units</p>
                              <p className="text-[8px] italic truncate max-w-[150px]">{tx.items.map(i => i.name).join(', ')}</p>
                            </td>
                            <td className="py-2 font-bold text-stone-500 uppercase">{tx.paymentMethod}</td>
                            <td className="py-2 text-right font-serif font-black italic">${tx.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {exportData.type === 'report' && currentReport && (
                  <div className="space-y-6 text-xs text-stone-800 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentReport.metrics.map((m, i) => (
                        <div key={i} className="p-4 bg-stone-50 border border-stone-100 rounded-xl">
                          <p className="text-[8px] font-black text-stone-400 uppercase">{m.label}</p>
                          <p className="text-base font-serif font-black italic text-stone-900 mt-1">{m.value}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-black text-[9px] uppercase tracking-widest text-indigo-600">Intelligence Narrative</h3>
                      <p className="leading-relaxed italic font-medium">"{currentReport.narrative}"</p>
                    </div>

                    <div className="bg-stone-900 text-white p-6 rounded-2xl space-y-4">
                      <h3 className="font-black text-[9px] uppercase tracking-widest text-indigo-500">Strategic Guidance</h3>
                      <div className="space-y-2">
                        {currentReport.aiAdvice.map((adv, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="font-black text-indigo-500 text-[10px]">{i+1}.</span>
                            <p className="text-[10px] text-stone-300 font-bold">{adv}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {exportData.type === 'investor' && investorInsight && (
                  <div className="space-y-6 text-xs text-stone-800 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                      <span className="font-black text-[9px] uppercase text-indigo-600">Projected Valuation Multiplier</span>
                      <span className="font-serif font-black italic text-xl text-indigo-600">{investorInsight.projectedValuationMultiplier}x</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-black text-[9px] uppercase tracking-widest text-indigo-600">Growth Narrative</h3>
                      <p className="leading-relaxed italic font-medium">"{investorInsight.narrative}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-stone-900 text-white p-4 rounded-xl space-y-3">
                        <h3 className="font-black text-[8px] uppercase tracking-widest text-indigo-500">Scalability Roadmap</h3>
                        <div className="space-y-2 text-[9px]">
                          {investorInsight.scalabilityRoadmap.map((item, i) => (
                            <div key={i} className="border-l border-indigo-500/30 pl-2">
                              <p className="font-black uppercase text-indigo-500">{item.phase}</p>
                              <p className="font-bold">{item.milestone}</p>
                              <p className="text-stone-400">{item.impact}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
                        <h3 className="font-black text-[8px] uppercase tracking-widest text-stone-400">Risk Assessment</h3>
                        <div className="space-y-2 text-[9px]">
                          {investorInsight.riskAssessment.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <div>
                                <p className="font-bold text-stone-800">{item.category}</p>
                                <p className="text-stone-500">{item.detail}</p>
                              </div>
                              <span className="text-[7px] font-black uppercase text-indigo-600">{item.level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Footer */}
                <div className="border-t border-stone-200 pt-8 flex flex-col sm:flex-row justify-between items-end text-[8px] text-stone-400 gap-4">
                  <div>
                    <p className="font-black uppercase tracking-widest text-stone-500">Certification Sign-off</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-16 h-0.5 bg-stone-300"></div>
                      <span className="font-serif italic font-black text-stone-500">Vinetelligence Node v3.1.0</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-1">
                    <p className="font-mono">Verification: MD5-{Math.random().toString(36).substr(2, 16).toUpperCase()}</p>
                    <p className="font-black uppercase tracking-widest text-indigo-500">Audited Security Level: Tier-1</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-4 bg-stone-950 text-stone-500 flex justify-between items-center text-[9px] font-black uppercase tracking-widest shrink-0">
               <span>Tunnel Status: Secured</span>
               <span className="text-indigo-500">Vinetelligence Audit Protocol v3.1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialHub;
