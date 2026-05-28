import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ComparisonMatrix from "../components/ComparisonMatrix";
import PartnerNetwork from "../components/PartnerNetwork";
import BlogSection from "../components/BlogSection";
import jsPDF from "jspdf";
import { getPublicBrand } from "../utils/branding";

interface PlatformProps {
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Platform: React.FC<PlatformProps> = ({
  onEnterDemo,
  onStartOnboarding,
}) => {
  const brand = getPublicBrand();
  const primaryText = brand.theme === 'vinea' ? 'text-amber-600' : 'text-indigo-600';

  const navigate = useNavigate();

  // Hospitality Audit Lead Form & Quiz States
  const [estName, setEstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("Owner");

  // Diagnostic rating questions (1 to 5 scale)
  const [q1, setQ1] = useState(3); // Inventory Counts Lag
  const [q2, setQ2] = useState(3); // Predictive Ordering Margin
  const [q3, setQ3] = useState(3); // Palate DNA Tracking
  const [q4, setQ4] = useState(3); // Campaign Retention Rate
  const [q5, setQ5] = useState(3); // Table Pacing Coordination
  const [q6, setQ6] = useState(3); // Roster & Capacity Balancing

  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [reportedScore, setReportedScore] = useState(0);
  const [auditSent, setAuditSent] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [primaryBottleneck, setPrimaryBottleneck] = useState("");

  const handleDownloadBlankAuditPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const printableWidth = pageWidth - margin * 2;
      let yPos = 25;

      const brandHue = brand.theme === 'vinea' ? { r: 217, g: 119, b: 6 } : { r: 79, g: 70, b: 229 };

      // Top Accent
      doc.setFillColor(brandHue.r, brandHue.g, brandHue.b);
      doc.rect(margin, yPos, printableWidth, 4, "F");
      yPos += 12;

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(`${brand.name.toUpperCase()} OPERATIONAL AUDIT`, margin, yPos);
      yPos += 7;

      // Subtitle
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(10);
      doc.setTextColor(brandHue.r, brandHue.g, brandHue.b);
      doc.text(
        "Offline Hospitality Assessment Sheet & Friction Metrics Tracker",
        margin,
        yPos
      );
      yPos += 12;

      // Guidance Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, yPos, printableWidth, 24, "FD");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const descLines = doc.splitTextToSize(
        `This offline self-assessment checklist helps venue owners, general managers, and sommeliers track operational friction. Walk your floor, talk with your staff, and give your current systems a clear rating from 1 (fully automated or simple) to 5 (extreme headache, lost sales, or manual bottlenecks). Once finished, enter your scores online to get your digital Playbook.`,
        printableWidth - 10
      );
      descLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPos + 6);
        yPos += 4.5;
      });
      yPos += 14;

      // Profile Section
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("PART 1: ESTABLISHMENT BASIC PROFILE", margin, yPos);
      yPos += 8;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const fields = [
        "1. Venue/Establishment Name: ____________________________________________________",
        "2. Weekly Sales & Guest Volume (covers): _________________________________________",
        "3. Cooking POS / Register Software (e.g. Toast, Lightspeed): ______________________",
        "4. Floor Reservation App (e.g. Resy, OpenTable): __________________________________",
        "5. Cellar Inventory Method (e.g. Excel, Paper Ledger): ___________________________"
      ];
      fields.forEach((f) => {
        doc.text(f, margin, yPos);
        yPos += 7;
      });
      yPos += 4;

      // Check height before printing Part 2
      if (yPos > 230) {
        doc.addPage();
        yPos = 25;
      }

      // Diagnostic Items Section
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("PART 2: LOCAL FRICTION METRICS DIAGNOSTICS", margin, yPos);
      yPos += 8;

      const frictionItems = [
        {
          title: "1. Slow Bottle Counts (Counting Stock by Hand) [1 to 5]",
          detail: "Your managers or staff have to walk through the cellar with a clipboard, counting wine bottles one by one, or typing numbers laboriously into spreadsheets. Wastes hours of shift time."
        },
        {
          title: "2. Ordering Drinks Based on Guesswork [1 to 5]",
          detail: "When it is time to buy more wine or drinks, you guess what to order based on 'feeling' rather than upcoming table reservations, party sizes, wine pairings, or weather forecasts."
        },
        {
          title: "3. Pouring Waste & Untracked Depletion [1 to 5]",
          detail: "How often opened wines, spillages, or free custom samples get poured without any transaction recorded on your cash registers. Directly drains premium sales margins."
        },
        {
          title: "4. Missing Guest Taste Preferences [1 to 5]",
          detail: "Do floor waitstaff know returning guests' custom grape choices, food allergies, and historical bottle spend averages instantly at table-side?"
        },
        {
          title: "5. Forgotten or Weak Guest Follow-ups [1 to 5]",
          detail: "You either send zero follow-up messages, or you send rare, generic email newsletter blasts to everyone on your marketing list, regardless of what they order or prefer."
        },
        {
          title: "6. Unprepared Waitstaff Floor Nervousness [1 to 5]",
          detail: "How often floor servers feel nervous, stressed, or freeze up when a guest asks for premium custom wine pairings or complex bottle recommendations at the table."
        }
      ];

      frictionItems.forEach((item) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 25;
        }

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.title, margin, yPos);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(148, 163, 184);
        doc.text("SCORE [1–5]: _____ ", margin + printableWidth - 36, yPos);

        yPos += 4.5;
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const itemLines = doc.splitTextToSize(item.detail, printableWidth - 5);
        itemLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 4;
        });
        yPos += 5.5;
      });

      doc.save(`${brand.name.replace(/\s+/g, "_")}_Hospitality_Self_Audit_Sheet.pdf`);
    } catch (err) {
      console.error("Error drawing blank PDF:", err);
    }
  };
  return (
    <div className="pt-24 min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center space-y-8 bg-stone-50">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">
          The Infrastructure
        </h2>
        <h1 className="text-3xl md:text-8xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
          Engineering <br /> Hospitality.
        </h1>
        <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto font-medium italic">
          Vinetelligence isn't just an app—it's an AI-powered operating system
          designed specifically for the complexities of high-end establishments.
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic flex items-center gap-2 justify-center">
          <i className="fas fa-desktop text-xs"></i>
          Optimization Note: Laptop or Tablet recommended for full experience.
        </p>
      </section>

      {/* Core Modules Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Module 1: Intelligence Engine */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                <i className="fas fa-brain-circuit"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-serif font-black italic">
                  Intelligence Engine
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed italic">
                  The core of our platform uses generative models to analyze
                  inventory velocity and guest preferences. It doesn't just
                  track stock; it predicts when you'll run out and suggests
                  order quantities optimized for your specific revenue goals.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "Predictive Inventory Auditing",
                  "Guest Palate DNA Mapping",
                  "Dynamic Revenue Forecasting",
                ].map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-stone-700"
                  >
                    <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-stone-900 rounded-[3rem] p-12 shadow-3xl border border-stone-800">
              <div className="aspect-video bg-stone-800 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                <div className="text-center space-y-4 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Processing Node
                  </p>
                  <p className="text-4xl font-mono font-bold text-white">
                    READY
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Staff Academy */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="lg:order-2 space-y-8">
              <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-serif font-black italic">
                  Staff Academy
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed italic">
                  Excellence is consistent. Our Academy provides
                  mobile-optimized training modules that bridge the gap between
                  back-of-house knowledge and front-of-house service.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "Interactive Mixology Labs",
                  "Sommelier Digital Testing",
                  "Service Protocol Certification",
                ].map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-stone-700"
                  >
                    <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100">
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100"
                  >
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                      <i className="fas fa-play"></i>
                    </div>
                    <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${30 * i}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Module 3: Executive Command */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                <i className="fas fa-tower-observation"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-serif font-black italic">
                  Executive Command
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed italic">
                  The "Command Center" provides owners and group managers with
                  an eagle-eye view of their entire network. Monitor MRR, staff
                  sentiment, and facility health from a single, unified
                  interface.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "Global Revenue Ledger",
                  "Network Health Heartbeat",
                  "Emergency Protocol Revocation",
                ].map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-stone-700"
                  >
                    <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-stone-900 rounded-[3rem] p-8 shadow-3xl border border-white/10">
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">
                    Global Overview
                  </p>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5"
                    >
                      <div className="text-stone-400 text-[10px] font-bold">
                        Node_{i}
                      </div>
                      <div className="text-white font-mono text-[10px]">
                        98.2% ONLINE
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Interoperability Section */}
          <div className="py-24 border-t border-stone-100">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">
                  The Neural Mesh
                </h2>
                <h3 className="text-4xl font-serif font-black italic">
                  Technical Interoperability.
                </h3>
                <p className="text-stone-500 font-medium leading-relaxed italic">
                  Vinetelligence connects seamlessly to your existing
                  infrastructure via our proprietary **Universal API Mesh**.
                  Whether you use legacy Enterprise systems or modern
                  cloud-native POS platforms, we provide zero-latency
                  synchronization.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">
                      Methods
                    </h4>
                    <ul className="text-xs font-bold text-stone-700 space-y-2">
                      <li>• Native API Integration</li>
                      <li>• Secure Middleware Bridge</li>
                      <li>• Zero-Integration Vision Node</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">
                      Supported POS
                    </h4>
                    <ul className="text-xs font-bold text-stone-700 space-y-2">
                      <li>• Oracle GLAS / Micros</li>
                      <li>• Toast / Lightspeed</li>
                      <li>• Square / Clover</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 flex items-center justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                  <i className="fas fa-plug text-5xl"></i>
                  <div className="h-20 w-px bg-stone-200"></div>
                  <div className="space-y-4">
                    <div className="w-32 h-4 bg-stone-200 rounded-full"></div>
                    <div className="w-24 h-4 bg-stone-200 rounded-full"></div>
                    <div className="w-40 h-4 bg-stone-200 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Deployment: 48 Hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* New Section: Human + AI Synergy */}
          <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                  Thought Leadership
                </h2>
                <h3 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter leading-none">
                  The Future <br /> is Human.
                </h3>
                <p className="text-xl text-indigo-100 font-medium italic leading-relaxed">
                  "Are human-first teams possible in the age of AI?" We believe
                  they aren't just possible—they are necessary. Vinetelligence
                  is built to amplify human connection, not replace it.
                </p>
                <a
                  href="https://www.mews.com/en/resources/future-is-human/are-human-first-teams-possible-in-the-age-of-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 group"
                >
                  Read the Perspective{" "}
                  <i className="fas fa-external-link-alt opacity-50 group-hover:translate-x-1 transition-transform"></i>
                </a>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-indigo-900 group">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                    alt="The Future is Human"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse cursor-pointer">
                      <i className="fas fa-play text-2xl ml-1"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Diagnostic Audit Lead Magnet Section */}
      <section
        id="operational-audit"
        className="py-24 px-6 bg-stone-50 border-t border-b border-stone-200"
      >
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${primaryText}`}>
              Dynamic Discovery
            </h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black italic text-stone-900 leading-tight">
              {brand.name} Operational Audit & AI Assessment
            </h3>
            <p className="text-stone-500 max-w-2xl mx-auto text-base italic leading-relaxed">
              Evaluate your establishment's current operational friction. Submit
              this self-assessment to discover your **AI Readiness Score**, and
              instantly download a curated tactical playbook mapped directly to
              your bottlenecks.
            </p>
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleDownloadBlankAuditPDF}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-full transition-all active:scale-95 border border-stone-200 shadow-sm cursor-pointer"
              >
                <i className="fas fa-file-pdf text-red-600 text-sm"></i> Download Blank Audit Checklist (PDF)
              </button>
            </div>
          </div>

          {!leadSubmitted ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email) return;
                setIsCapturing(true);
                const sum = q1 + q2 + q3 + q4 + q5 + q6;
                const computedScore = Math.max(
                  10,
                  Math.round(100 - (sum / 30) * 100),
                );
                setReportedScore(computedScore);

                const questionsList = [
                  { key: "Slow Bottle Counts (Counting Stock by Hand)", val: q1 },
                  { key: "Ordering Drinks Based on Guesswork", val: q2 },
                  { key: "Pouring Waste & Untracked Depletion", val: q3 },
                  { key: "Missing Guest Taste Preferences", val: q4 },
                  { key: "Forgotten or Weak Guest Follow-ups", val: q5 },
                  {
                    key: "Unprepared Waitstaff Floor Nervousness",
                    val: q6,
                  },
                ];
                questionsList.sort((a, b) => b.val - a.val);
                setPrimaryBottleneck(questionsList[0].key);

                try {
                  await fetch("/api/leads", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: estName || "Anonymous Establishment",
                      email,
                      phone,
                      location,
                      role,
                      score: computedScore,
                      type: "Evaluation",
                      source: "Interactive Evaluation Portal",
                    }),
                  });
                  setLeadSubmitted(true);
                } catch (err) {
                  console.error("Vinetelligence: Lead sync failed", err);
                  // Fallback to client-side state
                  setLeadSubmitted(true);
                } finally {
                  setIsCapturing(false);
                }
              }}
              className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-stone-200/60 space-y-12 text-left"
            >
              {/* Contact Block */}
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest border-b border-stone-100 pb-2">
                  1. Profile Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                      Establishment Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. The Gilded Shaker"
                      value={estName}
                      onChange={(e) => setEstName(e.target.value)}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-stone-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                      Contact Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. director@gildedshaker.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-stone-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +44 20 7629 8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-stone-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                      Operational Location / Country
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. London, UK"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-stone-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                      Your Professional Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-xl font-bold text-sm text-stone-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="Owner / Operator">Owner / Operator</option>
                      <option value="Beverage Director / Sommelier">
                        Beverage Director / Sommelier
                      </option>
                      <option value="Food & Beverage Manager">
                        Food & Beverage Manager
                      </option>
                      <option value="General Manager">General Manager</option>
                      <option value="Enterprise Consultant">
                        Enterprise Consultant
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quiz Rating Block */}
              <div className="space-y-8">
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest border-b border-stone-100 pb-2">
                  2. Friction Point Diagnostics
                </h4>
                <p className="text-xs text-stone-400 italic">
                  Rate your current bottlenecks on a scale from 1
                  (Seamless/Automated) to 5 (Critical Pain Point / Revenue
                  Leak):
                </p>

                <div className="space-y-8">
                  {[
                    {
                      label: "Slow Bottle Counts (Counting Stock by Hand)",
                      desc: "How tedious, slow or error-prone is your clipboard wine-counting at the end of a long dinner shift?",
                      value: q1,
                      setter: setQ1,
                    },
                    {
                      label: "Ordering Drinks Based on Guesswork",
                      desc: "Do you restock bottles by 'gut feeling' rather than upcoming table reservations, wine pairings, and weather trends?",
                      value: q2,
                      setter: setQ2,
                    },
                    {
                      label: "Pouring Waste & Untracked Depletion",
                      desc: "How often do opened wines, spillages, or free custom tasting samples get poured without any record on your registers?",
                      value: q3,
                      setter: setQ3,
                    },
                    {
                      label: "Missing Guest Taste Preferences",
                      desc: "Do floor waitstaff know returning guests' custom grape choices, bottle spend averages, and allergies instantly table-side?",
                      value: q4,
                      setter: setQ4,
                    },
                    {
                      label: "Forgotten or Weak Guest Follow-ups",
                      desc: "Do you send rare, generic email newsletter blasts to everyone, rather than small customized invitations they love?",
                      value: q5,
                      setter: setQ5,
                    },
                    {
                      label: "Unprepared Waitstaff Floor Nervousness",
                      desc: "How often do newly hired servers feel stressed or freeze when a guest asks for premium wine recommendations?",
                      value: q6,
                      setter: setQ6,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-100"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-stone-800">
                          {item.label}
                        </span>
                        <span className="text-xs font-mono font-black px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700">
                          Level {item.value} / 5
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 italic font-medium">
                        {item.desc}
                      </p>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={item.value}
                        onChange={(e) => item.setter(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] text-stone-400 font-black uppercase tracking-wider">
                        <span>1 — Automated</span>
                        <span>3 — Moderate Drag</span>
                        <span>5 — Severe Loss</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to action submit button */}
              <div className="pt-4 border-t border-stone-100 flex flex-col items-center space-y-4">
                <button
                  type="submit"
                  disabled={isCapturing}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-900 transition-all shadow-xl active:scale-95"
                >
                  {isCapturing
                    ? "Synthesizing Architecture State..."
                    : "Generate Strategy & Access Download Token"}
                </button>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider italic">
                  <i className="fas fa-shield-halved text-emerald-500 mr-1"></i>{" "}
                  Data encrypted in accordance with SOC-2 policies. Zero
                  unsolicited lists.
                </p>
              </div>
            </form>
          ) : (
            <div className="bg-stone-900 text-white rounded-[3.5rem] p-10 md:p-16 border border-stone-800 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 text-left">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px]"></div>

              <div className="space-y-10 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Diagnosis Report Complete
                    </p>
                    <h4 className="text-3xl font-serif font-bold text-white italic">
                      {estName || "Your Establishment"}
                    </h4>
                  </div>
                  <div className="bg-indigo-900/40 border-2 border-indigo-500 px-8 py-5 rounded-3xl text-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 mb-1">
                      AI Readiness Index
                    </p>
                    <p className="text-5xl font-mono font-black text-indigo-400">
                      {reportedScore}%
                    </p>
                  </div>
                </div>

                {/* Custom breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-stone-500 tracking-wider">
                      Strategic Recommendation
                    </p>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-lg font-bold font-serif italic text-indigo-300">
                        Target Bottleneck Located:
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {primaryBottleneck}
                      </p>
                      <p className="text-xs text-stone-400 leading-relaxed italic">
                        Your ratings signal substantial performance drag in this
                        node. Standard spreadsheet logs often struggle with
                        high-velocity data. Deploying our real-time
                        synchronization hooks mitigates this loss gap within 48
                        hours.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-stone-500 tracking-wider">
                      Your Digital Playbook
                    </p>
                    <div className="space-y-4">
                      <p className="text-xs text-stone-300 leading-relaxed">
                        We have compiled custom reconciliation sequences mapped
                        to your scores. You can download the report immediately
                        below or choose to email it to your administrative
                        staff.
                      </p>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            try {
                              const doc = new jsPDF("p", "mm", "a4");
                              const pageWidth = doc.internal.pageSize.getWidth();
                              const margin = 20;
                              const printableWidth = pageWidth - margin * 2;
                              let yPos = 25;

                              const brandHue = brand.theme === 'vinea' ? { r: 217, g: 119, b: 6 } : { r: 79, g: 70, b: 229 };

                              // Top accent line
                              doc.setFillColor(brandHue.r, brandHue.g, brandHue.b);
                              doc.rect(margin, yPos, printableWidth, 4, "F");
                              yPos += 12;

                              // Title
                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(22);
                              doc.setTextColor(15, 23, 42);
                              doc.text(`${brand.name.toUpperCase()} AI`, margin, yPos);
                              yPos += 7;

                              // Subtitle
                              doc.setFont("Helvetica", "oblique");
                              doc.setFontSize(10);
                              doc.setTextColor(brandHue.r, brandHue.g, brandHue.b);
                              doc.text(
                                `${brand.theme === 'vinea' ? 'Fine Wine & Hospitality Service Intelligence Playbook' : 'Hospitality Operational Audit & AI Optimization Strategy'}`,
                                margin,
                                yPos
                              );
                              yPos += 10;

                              // Divider
                              doc.setDrawColor(226, 232, 240);
                              doc.line(
                                margin,
                                yPos,
                                margin + printableWidth,
                                yPos
                              );
                              yPos += 12;

                              // Profile Metadata
                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(10);
                              doc.setTextColor(71, 85, 105);
                              doc.text("ESTABLISHMENT PROFILE", margin, yPos);
                              yPos += 6;

                              doc.setFont("Helvetica", "normal");
                              doc.setFontSize(9);
                              doc.setTextColor(15, 23, 42);
                              doc.text(
                                `Venue Name: ${estName || "Your Establishment"}`,
                                margin,
                                yPos
                              );
                              doc.text(
                                `Generated On: ${new Date().toLocaleDateString()}`,
                                margin + 90,
                                yPos
                              );
                              yPos += 5;
                              doc.text(
                                `Location: ${location || "Unknown"}`,
                                margin,
                                yPos
                              );
                              doc.text(
                                `Contact: ${email || "N/A"}${
                                  phone ? ` (${phone})` : ""
                                }`,
                                margin + 90,
                                yPos
                              );
                              yPos += 5;
                              doc.text(`Role: ${role}`, margin, yPos);
                              yPos += 12;

                              // Divider
                              doc.line(
                                margin,
                                yPos,
                                margin + printableWidth,
                                yPos
                              );
                              yPos += 12;

                              // Overall Score Block
                              doc.setFillColor(248, 250, 252);
                              doc.setDrawColor(226, 232, 240);
                              doc.rect(
                                margin,
                                yPos,
                                printableWidth,
                                24,
                                "FD"
                              );

                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(11);
                              doc.setTextColor(71, 85, 105);
                              doc.text(
                                "OVERALL PERFORMANCE EVALUATION",
                                margin + 8,
                                yPos + 10
                              );

                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(26);
                              doc.setTextColor(brandHue.r, brandHue.g, brandHue.b);
                              doc.text(
                                `${reportedScore}%`,
                                margin + printableWidth - 32,
                                yPos + 15
                              );

                              doc.setFont("Helvetica", "normal");
                              doc.setFontSize(8.5);
                              doc.setTextColor(100, 116, 139);
                              doc.text(
                                "AI Readiness Index: Based on 6 standard operational friction metrics.",
                                margin + 8,
                                yPos + 16
                              );
                              yPos += 36;

                              // Primary bottleneck highlight box
                              doc.setFillColor(254, 242, 242);
                              doc.setDrawColor(252, 165, 165);
                              doc.rect(
                                margin,
                                yPos,
                                printableWidth,
                                18,
                                "FD"
                              );

                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(9.5);
                              doc.setTextColor(185, 28, 28);
                              doc.text("CRITICAL AREA LOCATED:", margin + 6, yPos + 7);

                              doc.setFont("Helvetica", "normal");
                              doc.setFontSize(9.5);
                              doc.setTextColor(15, 23, 42);
                              const truncatedBottleneck =
                                primaryBottleneck || "Slow Bottle Counts (Counting Stock by Hand)";
                              doc.text(
                                `"${truncatedBottleneck}" leads your friction metrics.`,
                                margin + 56,
                                yPos + 7
                              );

                              doc.setFont("Helvetica", "normal");
                              doc.setFontSize(8.5);
                              doc.setTextColor(127, 29, 29);
                              doc.text(
                                `Recommendation Strategy: Active deployment of ${brand.name} ${
                                  primaryBottleneck.includes("Counts") ||
                                  primaryBottleneck.includes("Counts")
                                    ? "AI Inventory Node"
                                    : primaryBottleneck.includes("Follow-ups") ||
                                      primaryBottleneck.includes("Preferences")
                                      ? "Guest Outreach Desk"
                                      : "Dynamic Operations Management"
                                } protocol.`,
                                margin + 6,
                                yPos + 13
                              );
                              yPos += 28;

                              // Detailed metrics
                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(12);
                              doc.setTextColor(15, 23, 42);
                              doc.text(
                                "DETAILED METRIC BREAKDOWN (FRICTION LEVEL OUT OF 5)",
                                margin,
                                yPos
                              );
                              yPos += 8;

                              const metricsData = [
                                {
                                  label: "Slow Bottle Counts (Counting Stock by Hand)",
                                  score: q1,
                                  desc: "Counting wine bottles one by one or typing numbers laboriously into spreadsheets.",
                                },
                                {
                                  label: "Ordering Drinks Based on Guesswork",
                                  score: q2,
                                  desc: "Restocking bottles by 'gut feeling' rather than reservation pace and weather trends.",
                                },
                                {
                                  label: "Pouring Waste & Untracked Depletion",
                                  score: q3,
                                  desc: "Opened bottles, spillages, or free custom samples poured without any cash register entry.",
                                },
                                {
                                  label: "Missing Guest Taste Preferences",
                                  score: q4,
                                  desc: "Servers not knowing returning guests' favorite grape choices or average bottle spends.",
                                },
                                {
                                  label: "Forgotten or Weak Guest Follow-ups",
                                  score: q5,
                                  desc: "Sending rare, generic marketing emails rather than warm customized invites.",
                                },
                                {
                                  label: "Unprepared Waitstaff Floor Nervousness",
                                  score: q6,
                                  desc: "Newly hired staff feeling stressed to suggest custom vintage wine pairings.",
                                },
                              ];

                              metricsData.forEach((metric) => {
                                if (yPos > 265) {
                                  doc.addPage();
                                  yPos = 20;
                                }

                                doc.setFont("Helvetica", "bold");
                                doc.setFontSize(9.5);
                                doc.setTextColor(51, 65, 85);
                                doc.text(metric.label, margin, yPos);

                                doc.setFont("Helvetica", "bold");
                                doc.setFontSize(9.5);
                                if (metric.score >= 4) {
                                  doc.setTextColor(185, 28, 28);
                                  doc.text(
                                    `Severe Drag [${metric.score}/5]`,
                                    margin + printableWidth - 34,
                                    yPos
                                  );
                                } else if (metric.score === 3) {
                                  doc.setTextColor(217, 119, 6);
                                  doc.text(
                                    `Moderate [${metric.score}/5]`,
                                    margin + printableWidth - 30,
                                    yPos
                                  );
                                } else {
                                  doc.setTextColor(22, 163, 74);
                                  doc.text(
                                    `Optimized [${metric.score}/5]`,
                                    margin + printableWidth - 30,
                                    yPos
                                  );
                                }

                                yPos += 4.5;

                                doc.setFont("Helvetica", "normal");
                                doc.setFontSize(8.5);
                                doc.setTextColor(100, 116, 139);
                                doc.text(metric.desc, margin, yPos);

                                yPos += 8;
                              });

                              // New page or offset for steps
                              if (yPos > 180) {
                                doc.addPage();
                                yPos = 20;
                              } else {
                                yPos += 6;
                              }

                              doc.setFont("Helvetica", "bold");
                              doc.setFontSize(12);
                              doc.setTextColor(15, 23, 42);
                              doc.text("TACTICAL SYSTEM RECONCILIATION STEPS", margin, yPos);
                              yPos += 8;

                              const steps = [
                                {
                                  title: `Step 1: Focus on your biggest problem: "${primaryBottleneck}"`,
                                  detail: `To instantly stop losing money, we recommend connecting your point-of-sale register (like Toast, Square, or Lightspeed) directly with your live digital inventory database. This simple step connects real-time sales data to your physical cellar stock automatically. It stops wine bottle loss within 48 hours, warns you beforehand when item counts are running low, and completely eliminates the daily headache of doing tedious bottle hand-counts at the end of long shifts. Your service managers can finally look at a clean on-screen dashboard and know exactly what is on the shelves right now.`,
                                },
                                {
                                  title: "Step 2: Equip Foot Staff with Instant Pocket Helpers",
                                  detail:
                                    `Instead of printing thick beverage manuals or doing long training sessions with paper flashcards, let your floor servers use active mobile search utilities right at the table. When a guest asks a tough question about a vintage wine or requests a custom pairing recommendation, staff can type a quick keyword into their pocket assistant. They get simple wine facts, flavor notes, price ranges, and food pairing tips instantly. This builds confidence, speeds up floor table-turns, and allows any server to sell premium bottles and deliver high-end guest experiences on their very first shift.`,
                                },
                                {
                                  title: "Step 3: Switch to Highly Personal Automated Guest Invites",
                                  detail:
                                    `Stop sending boring, generic email blasts to everyone on your marketing list. Instead, use automated follow-up rules triggered by what your guests actually ordered in the past. For example, when a new shipment of fine wine or premium drinks arrives in your cellar, the system can automatically send a warm, personal SMS or email invitation only to guests who previously ordered those exact types or bottles. This creates a deeply thoughtful VIP feeling, secures repeat bookings on empty weeknights, and respects your customers' inboxes without sending annoying spam.`,
                                },
                              ];

                              steps.forEach((step) => {
                                if (yPos > 245) {
                                  doc.addPage();
                                  yPos = 20;
                                }

                                doc.setFont("Helvetica", "bold");
                                doc.setFontSize(10);
                                doc.setTextColor(brandHue.r, brandHue.g, brandHue.b);
                                doc.text(step.title, margin, yPos);
                                yPos += 4.5;

                                doc.setFont("Helvetica", "normal");
                                doc.setFontSize(8.5);
                                doc.setTextColor(51, 65, 85);
                                const textLines = doc.splitTextToSize(
                                  step.detail,
                                  printableWidth
                                );
                                textLines.forEach((line: string) => {
                                  if (yPos > 275) {
                                    doc.addPage();
                                    yPos = 20;
                                  }
                                  doc.text(line, margin, yPos);
                                  yPos += 4;
                                });

                                yPos += 6;
                              });

                              // Legal Footer
                              if (yPos > 270) {
                                doc.addPage();
                                yPos = 20;
                              } else {
                                yPos = 275;
                              }
                              doc.setDrawColor(241, 245, 249);
                              doc.line(margin, yPos, margin + printableWidth, yPos);
                              yPos += 5;

                              doc.setFont("Helvetica", "normal");
                              doc.setFontSize(7.5);
                              doc.setTextColor(148, 163, 184);
                              doc.text(
                                "This document contains private proprietary optimization data compiled specifically for your business email. Root authorized clearance.",
                                margin,
                                yPos
                              );
                              doc.text(
                                "© 2026 Vinetelligence AI-Powered Operating System. All rights reserved.",
                                margin,
                                yPos + 3.5
                              );

                              doc.save(
                                `${(estName || "My_Establishment").replace(
                                  /\s+/g,
                                  "_"
                                )}_Vinetelligence_AI_Audit.pdf`
                              );
                              setAuditSent(true);
                            } catch (pdfErr) {
                              console.error("Error creating PDF:", pdfErr);
                            }
                          }}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                        >
                          <i className="fas fa-download"></i> Download Blueprint
                          Document (PDF)
                        </button>

                        <a
                          href={`mailto:${email}?subject=Your Vinetelligence AI Readiness Audit Report&body=Hi ${estName || "Team"},\n\nWe computed your AI Readiness Score at ${reportedScore}%.\n\nYour main operational constraint resides in "${primaryBottleneck}".\n\nYour customized Vinetelligence template has been logged for digital delivery.`}
                          onClick={() => setAuditSent(true)}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-3"
                        >
                          <i className="fas fa-envelope"></i> Send Report Copy
                          via Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {auditSent && (
                  <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                    <i className="fas fa-check-circle mr-2"></i> Report
                    Blueprint Compiled & Dispatched to Downloads & Lead
                    Registry.
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-stone-500 font-bold uppercase">
                  <span>
                    LEAD_ID: #$
                    {Math.random().toString(36).substring(2, 9).toUpperCase()}
                  </span>
                  <button
                    onClick={() => {
                      setLeadSubmitted(false);
                      setAuditSent(false);
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Perform New Diagnostic Audit{" "}
                    <i className="fas fa-arrow-rotate-left ml-1"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <BlogSection
        onAction={onEnterDemo || (() => navigate("/?mode=contact"))}
      />

      <PartnerNetwork />

      <ComparisonMatrix />

      {/* Technical Specs Footer */}
      <section className="py-32 px-6 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16">
          <div className="space-y-4">
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Latency
            </h4>
            <p className="text-2xl font-serif font-bold italic">
              Sub-42ms Data Pulse.
            </p>
            <p className="text-stone-400 text-sm italic">
              Optimized for high-velocity environments where every millisecond
              counts toward guest satisfaction.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Security
            </h4>
            <p className="text-2xl font-serif font-bold italic">
              SOC-2 Type II Certified.
            </p>
            <p className="text-stone-400 text-sm italic">
              Individual data silos for every establishment. Your data is your
              property, period.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Integration
            </h4>
            <p className="text-2xl font-serif font-bold italic">
              Universal API Mesh.
            </p>
            <p className="text-stone-400 text-sm italic">
              Compatible with all major POS systems, supply chain nodes, and
              local commerce APIs.
            </p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h2 className="text-5xl font-serif font-black text-white italic tracking-tighter">
            Ready to upgrade your establishment's brain?
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => onStartOnboarding?.()}
              className="px-12 py-6 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-50 transition-all shadow-2xl active:scale-95"
            >
              Get Started
            </button>
            <button
              onClick={() => onEnterDemo?.()}
              className="px-12 py-6 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-950 transition-all shadow-2xl active:scale-95"
            >
              Interactive Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Platform;
