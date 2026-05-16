import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, Download, RefreshCw, Send, CheckCircle2, Building2, Users, Target, UserCircle, MessageSquare, Heart, Palette, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/** Simple utility for merging tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Section = {
  id: string;
  title: string;
  icon: any;
  questions: {
    key: string;
    label: string;
    placeholder: string;
    type?: "text" | "textarea";
  }[];
};

const SECTIONS: Section[] = [
  {
    id: "foundation",
    title: "The Foundation",
    icon: Building2,
    questions: [
      { key: "brandName", label: "Apa nama brand kamu?", placeholder: "Contoh: Luminara", type: "text" },
      { key: "productProblem", label: "Apa produk utama & masalah yang kamu selesaikan?", placeholder: "Contoh: Lilin aromaterapi untuk mengatasi burnout kerja", type: "textarea" },
      { key: "difference", label: "Apa yang membuat brand kamu berbeda?", placeholder: "Contoh: Wangi berbasis sains neuro-terapi", type: "textarea" },
    ],
  },
  {
    id: "audience",
    title: "Market & Audience",
    icon: Users,
    questions: [
      { key: "targetPain", label: "Siapa target utama & apa pain point mereka?", placeholder: "Contoh: Wanita karir sibuk yang kesulitan rileks di rumah", type: "textarea" },
      { key: "competitors", label: "Siapa kompetitor atau alternatif brand mereka?", placeholder: "Contoh: Jo Malone atau sekadar scrolling HP", type: "text" },
    ],
  },
  {
    id: "identity",
    title: "Identity & Personality",
    icon: UserCircle,
    questions: [
      { key: "elevatorPitch", label: "Dalam 1 kalimat, brand ini ingin dikenal sebagai?", placeholder: "Contoh: Sahabat ketenangan untuk jiwa yang lelah", type: "textarea" },
      { key: "personaTraits", label: "Jika brand ini manusia, apa 3 sifat utamanya?", placeholder: "Contoh: Bijak, Menenangkan, Elegan", type: "text" },
      { key: "toneVoice", label: "Bagaimana tone bicaranya (Santai/Formal)?", placeholder: "Contoh: Lembut, puitis, dan inklusif", type: "text" },
    ],
  },
  {
    id: "visual_experience",
    title: "Visual & Experience",
    icon: Palette,
    questions: [
      { key: "visualStyle", label: "Gaya visual yang diinginkan (Minimalis/Modern/Klasik)?", placeholder: "Contoh: Minimalis Modern dengan warna Earth Tone", type: "text" },
      { key: "customerFeel", label: "Apa perasaan customer setelah berinteraksi?", placeholder: "Contoh: Merasa divalidasi dan akhirnya bisa bernafas lega", type: "textarea" },
    ],
  },
];

export default function BrandArchitect() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandFoundation, setBrandFoundation] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const currentSection = SECTIONS[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];
  
  const totalQuestionsInSection = currentSection.questions.length;
  const isLastQuestionInSection = currentQuestionIndex === totalQuestionsInSection - 1;
  const isLastSection = currentSectionIndex === SECTIONS.length - 1;

  const totalQuestions = SECTIONS.reduce((acc, section) => acc + section.questions.length, 0);
  
  // Calculate dynamic progress
  let completedQuestions = 0;
  for (let i = 0; i < currentSectionIndex; i++) {
    completedQuestions += SECTIONS[i].questions.length;
  }
  completedQuestions += currentQuestionIndex;

  const handleInputChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      generateBrand();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0) {
      const prevSectionIndex = currentSectionIndex - 1;
      setCurrentSectionIndex(prevSectionIndex);
      setCurrentQuestionIndex(SECTIONS[prevSectionIndex].questions.length - 1);
    }
  };

  const generateBrand = async () => {
    setIsGenerating(true);
    try {
      const apiUrl = new URL("api/generate-brand", window.location.origin + import.meta.env.BASE_URL);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      setBrandFoundation(data.result);
    } catch (error) {
      console.error("Error generating brand:", error);
      alert("Maaf, terjadi kesalahan saat mengolah data. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    const element = resultRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Brand_Foundation_${answers.brandName || 'Brand'}.pdf`);
  };

  const resetForm = () => {
    setAnswers({});
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setBrandFoundation(null);
  };

  const progressPercentage = Math.round((completedQuestions / totalQuestions) * 100);

  return (
    <div className="h-screen w-full bg-[#FBFBFB] text-[#1A1A1A] font-sans flex overflow-hidden border border-gray-200 selection:bg-orange-100 selection:text-orange-900">
      {/* LEFT NAVIGATION RAIL */}
      <aside className="w-[80px] h-full border-r border-[#1A1A1A] flex flex-col items-center py-10 justify-between shrink-0">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase vertical-text transform rotate-180 flex items-center gap-2" style={{ writingMode: 'vertical-rl' }}>
          Phase: {brandFoundation ? 'Output' : 'Inquiry'} <div className="w-1 h-3 bg-orange-600" />
        </div>
        <div className="flex flex-col gap-6">
          {SECTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === currentSectionIndex ? "bg-orange-600 scale-125" : i < currentSectionIndex ? "bg-[#1A1A1A]" : "bg-gray-300"
              )}
            />
          ))}
        </div>
        <div className="text-[14px] font-serif italic">
          {String(currentSectionIndex + 1).padStart(2, '0')}/{String(SECTIONS.length).padStart(2, '0')}
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-[80px] w-full border-b border-[#1A1A1A] flex items-center justify-between px-12 shrink-0">
          <div className="text-[11px] font-bold tracking-[0.3em] uppercase">Brand Strategist AI v1.0</div>
          <div className="flex gap-8 items-center">
            <span className="hidden md:block text-[11px] uppercase tracking-widest opacity-40">Project: {answers.brandName || "Untitled_Vision"}</span>
            <span className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Director: Active
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!brandFoundation ? (
              <motion.section
                key="questionnaire"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="min-h-full flex flex-col justify-center px-12 lg:px-24 py-12"
              >
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-[14px] font-serif italic text-orange-600">Section {String(currentSectionIndex + 1).padStart(2, '0')}</span>
                  <div className="h-[1px] w-12 bg-orange-600"></div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">{currentSection.title}</span>
                </div>

                <div className="mb-12">
                  <h1 className="text-[40px] md:text-[72px] font-serif leading-[1.05] tracking-tight text-[#1A1A1A]">
                    {currentQuestion.label.split('brand').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && currentQuestion.label.includes('brand') && <span className="italic">brand</span>}
                      </span>
                    ))}
                  </h1>
                </div>

                <div className="relative max-w-2xl w-full">
                  {currentQuestion.type === 'textarea' ? (
                    <textarea
                      value={answers[currentQuestion.key] || ""}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      rows={2}
                      className="w-full bg-transparent border-b-2 border-[#1A1A1A] py-4 text-[24px] focus:outline-none placeholder:opacity-20 font-light resize-none transition-all placeholder:text-gray-400"
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[currentQuestion.key] || ""}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="w-full bg-transparent border-b-2 border-[#1A1A1A] py-4 text-[24px] focus:outline-none placeholder:opacity-20 font-light transition-all placeholder:text-gray-400"
                    />
                  )}
                  <div className="mt-8 flex items-center gap-4 flex-wrap">
                    <button
                      onClick={handleNext}
                      disabled={isGenerating}
                      className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center gap-2 group"
                    >
                      {isGenerating ? "Processing..." : (isLastQuestionInSection && isLastSection ? "Generate Foundation" : "Submit Response")}
                      {!isGenerating && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <button
                      onClick={handlePrevious}
                      disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                      className="px-8 py-3 border border-gray-200 text-[#1A1A1A] text-[11px] uppercase tracking-widest hover:border-[#1A1A1A] transition-colors disabled:opacity-0"
                    >
                      Previous
                    </button>
                  </div>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-100 pt-12">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Current Context</p>
                    <p className="text-[13px] leading-relaxed max-w-xs text-gray-600">
                      We are currently defining the <span className="font-bold text-[#1A1A1A]">{currentSection.title}</span>. 
                      Your answers here will shape the strategic direction of the brand mark and narrative.
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Strategy Note</p>
                    <p className="text-[13px] leading-relaxed max-w-xs text-gray-600 italic">
                      "A strong brand is built on truth, not trends." Focus on clarity and recall over complexity at this stage.
                    </p>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 lg:p-24"
              >
                <div className="flex flex-wrap items-center justify-between gap-6 mb-12 border-b border-gray-200 pb-8">
                  <div>
                    <h2 className="text-4xl font-serif italic text-orange-600">Brand Manifesto</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">Strategic Foundation Document</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={downloadPDF}
                      className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export to PDF
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-8 py-3 border border-[#1A1A1A] text-[#1A1A1A] text-[11px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset Process
                    </button>
                  </div>
                </div>

                <div 
                  ref={resultRef}
                  className="bg-white border border-[#EEE] p-8 lg:p-20 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Building2 className="w-64 h-64 text-gray-900" />
                  </div>
                  
                  <div className="relative z-10 max-w-3xl mx-auto">
                    <header className="mb-20 border-b-4 border-[#1A1A1A] pb-8">
                      <p className="text-[12px] uppercase tracking-[0.4em] font-bold text-orange-600 mb-4">Official Brand Report</p>
                      <h3 className="text-6xl font-serif tracking-tighter leading-none">{answers.brandName}</h3>
                      <div className="mt-8 flex justify-between text-[10px] font-mono uppercase tracking-widest text-gray-400">
                        <span>Agency Grade Strategic Output</span>
                        <span>{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </header>

                    <div className="markdown-body artistic-content">
                      <ReactMarkdown>{brandFoundation}</ReactMarkdown>
                    </div>

                    <footer className="mt-32 pt-12 border-t border-gray-100 flex justify-between items-end">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-300">
                        Brand Architect AI<br/>
                        Strategic Identity System
                      </div>
                      <div className="w-12 h-1 bg-orange-600" />
                    </footer>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* STATUS BAR */}
        <footer className="h-[60px] border-t border-[#1A1A1A] flex items-center px-12 justify-between bg-white shrink-0">
          <div className="flex gap-4 items-center">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", isGenerating ? "bg-orange-500" : "bg-green-500")}></div>
            <span className="text-[10px] uppercase tracking-widest font-bold">
              {isGenerating ? "Strategist is thinking..." : "Strategist is listening..."}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-50 hidden sm:block">
            Step by Step Architectural Inquiry • {progressPercentage}% Complete
          </div>
        </footer>
      </main>

      {/* RIGHT ANALYSIS PANEL */}
      <aside className="hidden lg:flex w-[320px] h-full bg-[#1A1A1A] text-[#FBFBFB] p-10 flex-col shrink-0 overflow-y-auto">
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.2em] mb-8 border-b border-gray-700 pb-2 flex justify-between items-center">
            <span>Live Analysis</span>
            <span className="text-orange-500 font-bold">READY</span>
          </div>
          
          <div className="space-y-12">
            <div>
              <h3 className="text-[11px] uppercase font-bold mb-3 tracking-widest flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", currentSectionIndex >= 0 ? "bg-orange-600" : "bg-gray-700")} />
                01. Core Value
              </h3>
              <div className="h-[1px] w-full bg-gray-800 mb-4"></div>
              <p className={cn("text-[12px] leading-relaxed transition-opacity", answers.problem ? "text-gray-300 opacity-100" : "italic opacity-30")}>
                {answers.problem ? `${answers.problem.substring(0, 80)}...` : "Awaiting Business Core data"}
              </p>
            </div>

            <div>
              <h3 className="text-[11px] uppercase font-bold mb-3 tracking-widest flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", currentSectionIndex >= 1 ? "bg-orange-600" : "bg-gray-700")} />
                02. Target Persona
              </h3>
              <div className="h-[1px] w-full bg-gray-800 mb-4"></div>
              <p className={cn("text-[12px] leading-relaxed transition-opacity", answers.targetMain ? "text-gray-300 opacity-100" : "italic opacity-30")}>
                {answers.targetMain ? `${answers.targetMain.substring(0, 80)}...` : "Waiting for audience definition"}
              </p>
            </div>

            <div className="bg-[#1E1E1E] p-6 border border-gray-800 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-3 h-3 text-orange-500" />
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-orange-500">Director's Insight</h3>
              </div>
              <p className="text-[14px] font-serif italic leading-relaxed text-gray-300">
                {currentSectionIndex === 0 && "\"First impressions are binary. A brand either invites curiosity or breeds indifference.\""}
                {currentSectionIndex === 1 && "\"To speak to everyone is to speak to no one. Be precise about who you are for.\""}
                {currentSectionIndex >= 2 && "\"Strategy without aesthetics is invisible. Aesthetics without strategy is hollow.\""}
              </p>
            </div>

            <div className="pt-12">
              <div className="flex justify-between items-end mb-4">
                <div className="text-[48px] font-serif leading-none tracking-tighter">{progressPercentage}%</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Profile Density</div>
              </div>
              <div className="w-full h-1 bg-gray-800 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-orange-600"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="text-[9px] uppercase tracking-widest leading-loose opacity-40">
            Data Privacy Secured<br/>
            Standard: Agency Professional<br/>
            © 2026 Brand Strategist Creative
          </div>
        </div>
      </aside>

      <style>{`
        .artistic-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 2.25rem;
          font-style: italic;
          color: #1A1A1A;
          margin-top: 4rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #1A1A1A;
          padding-bottom: 0.5rem;
          display: inline-block;
        }
        .artistic-content p {
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          color: #333;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }
        .artistic-content ul {
          list-style: none;
          padding-left: 0;
          margin-bottom: 2rem;
        }
        .artistic-content li {
          font-family: 'Inter', sans-serif;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          color: #444;
        }
        .artistic-content li::before {
          content: "";
          width: 8px;
          height: 8px;
          background-color: #EA580C; /* orange-600 */
          border-radius: 9999px;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }
        .artistic-content strong {
          color: #1A1A1A;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
