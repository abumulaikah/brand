import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Download, RefreshCw, Building2, Users, UserCircle } from "lucide-react";
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
      { key: "economicStatus", label: "Status ekonomi atau daya beli customer seperti apa?", placeholder: "Contoh: Menengah atas, rela bayar lebih untuk kualitas dan pengalaman", type: "textarea" },
      { key: "buyingMotivation", label: "Mereka membeli karena kebutuhan, aspirasi, atau lifestyle?", placeholder: "Contoh: Aspirasi untuk punya ritual self-care yang terasa premium", type: "textarea" },
      { key: "competitors", label: "Siapa kompetitor atau alternatif brand mereka?", placeholder: "Contoh: Jo Malone atau sekadar scrolling HP", type: "text" },
    ],
  },  {
    id: "identity",
    title: "Identity & Personality",
    icon: UserCircle,
    questions: [
      { key: "elevatorPitch", label: "Dalam 1 kalimat, brand ini ingin dikenal sebagai?", placeholder: "Contoh: Sahabat ketenangan untuk jiwa yang lelah", type: "textarea" },
      { key: "personaTraits", label: "Jika brand ini manusia, apa 3 sifat utamanya?", placeholder: "Contoh: Bijak, Menenangkan, Elegan", type: "text" },
      { key: "toneVoice", label: "Bagaimana tone bicaranya (Santai/Formal)?", placeholder: "Contoh: Lembut, puitis, dan inklusif", type: "text" },
    ],
  },
];
const SECTION_CONTEXT: Record<string, string> = {
  foundation: "Kita sedang merapikan fondasi brand: nama, produk utama, masalah yang diselesaikan, dan pembeda awal. Jawaban di bagian ini akan menjadi bahan dasar untuk positioning dan arah identitas visual.",
  audience: "Kita sedang memahami siapa customer yang paling tepat, daya belinya, motivasi belinya, dan alternatif yang mereka bandingkan. Bagian ini membantu menentukan seberapa premium, praktis, atau aspiratif brand perlu terasa.",
  identity: "Kita sedang membentuk karakter, cara bicara, dan kalimat pengenal brand. Bagian ini akan membantu output terasa lebih siap dipakai sebagai starter point visual identity.",
};

const STRATEGY_NOTE_TEMPLATES: Record<string, string[]> = {
  foundation: [
    "Brand yang kuat dimulai dari kebenaran paling sederhana: siapa kamu, masalah apa yang kamu selesaikan, dan kenapa orang perlu peduli.",
    "Jangan buru-buru masuk ke gaya visual. Pastikan dulu pembeda brand cukup jelas untuk diterjemahkan menjadi desain.",
    "Nama dan produk boleh sederhana, tapi alasan brand ini layak diingat harus tajam.",
  ],
  audience: [
    "Status ekonomi customer membantu menentukan bahasa visual: semakin aspiratif pembelinya, semakin penting rasa percaya, detail, dan konsistensi.",
    "Motivasi beli menentukan arah desain. Kebutuhan perlu kejelasan; aspirasi perlu rasa naik kelas; lifestyle perlu karakter yang mudah dikenali.",
    "Brand tidak harus berbicara ke semua orang. Semakin spesifik customernya, semakin mudah visual identity terasa tepat.",
  ],
  identity: [
    "Personality brand adalah jembatan antara strategi dan visual. Dari sini warna, tipografi, layout, dan tone konten bisa mulai diarahkan.",
    "Kalimat brand yang baik tidak harus panjang. Yang penting mudah diingat, terasa khas, dan sesuai dengan customer yang dituju.",
    "Tone komunikasi akan menentukan apakah brand terasa ramah, premium, teknis, playful, atau serius.",
  ],
};

export default function Brand() {
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate brand foundation");
      }

      setBrandFoundation(data.result);
    } catch (error) {
      console.error("Error generating brand:", error);
      const message = error instanceof Error ? error.message : "Maaf, terjadi kesalahan saat mengolah data. Silakan coba lagi.";
      alert(message);
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
  const strategyNoteIndexes = useMemo(() => {
    return Object.fromEntries(
      Object.entries(STRATEGY_NOTE_TEMPLATES).map(([sectionId, notes]) => [
        sectionId,
        Math.floor(Math.random() * notes.length),
      ])
    ) as Record<string, number>;
  }, []);
  const strategyNotes = STRATEGY_NOTE_TEMPLATES[currentSection.id] ?? STRATEGY_NOTE_TEMPLATES.foundation;
  const strategyNote = strategyNotes[strategyNoteIndexes[currentSection.id] ?? 0];

  return (
    <div className="h-screen w-full bg-[#FAFAF9] text-[#1A1A1A] font-sans flex overflow-hidden border border-[#E5E5E5] selection:bg-[#E5E5E5] selection:text-[#1A1A1A]">
      {/* LEFT NAVIGATION RAIL */}
      <aside className="w-[80px] h-full border-r border-[#E5E5E5] flex flex-col items-center py-10 justify-between shrink-0">
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase vertical-text transform rotate-180 flex items-center gap-2" style={{ writingMode: 'vertical-rl' }}>
          Brand by Fitra <div className="w-1 h-3 bg-[#FF7A00]" />
        </div>
        <div className="flex flex-col gap-6">
          {SECTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === currentSectionIndex ? "bg-[#FF7A00] scale-125" : i < currentSectionIndex ? "bg-[#1A1A1A]" : "bg-[#E5E5E5]"
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
        <header className="h-[80px] w-full border-b border-[#E5E5E5] flex items-center justify-between px-12 shrink-0">
          <div className="text-[11px] font-semibold tracking-[0.3em] uppercase">Brand by Fitra</div>
          <div className="flex gap-8 items-center">
            <span className="hidden md:block text-[11px] uppercase tracking-widest opacity-40">Project: {answers.brandName || "Untitled_Vision"}</span>
            <span className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse" />
              brand.alfitranoor.com
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
                  <span className="text-[14px] font-serif italic text-[#666666]">Section {String(currentSectionIndex + 1).padStart(2, '0')}</span>
                  <div className="h-[1px] w-12 bg-[#FF7A00]"></div>
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
                      className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest hover:bg-[#FF7A00] transition-colors flex items-center gap-2 group"
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
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Konteks Saat Ini</p>
                    <p className="text-[13px] leading-relaxed max-w-xs text-gray-600">
                      {SECTION_CONTEXT[currentSection.id]}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Catatan Strategi</p>
                    <p className="text-[13px] leading-relaxed max-w-xs text-gray-600 italic">
                      "{strategyNote}"
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
                    <h2 className="text-4xl font-serif italic text-[#1A1A1A]">Brand Foundation</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">Strategic Foundation Document</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={downloadPDF}
                      className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest hover:bg-[#333333] transition-colors flex items-center gap-2"
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
                    <header className="mb-20 border-b-4 border-[#FF7A00] pb-8">
                      <p className="text-[12px] uppercase tracking-[0.4em] font-bold text-[#666666] mb-4">Brand by Fitra Report</p>
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
                        Brand by Fitra<br/>
                        Strategic Identity System
                      </div>
                      <div className="w-12 h-1 bg-[#FF7A00]" />
                    </footer>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* STATUS BAR */}
        <footer className="h-[60px] border-t border-[#E5E5E5] flex items-center px-12 justify-between bg-white shrink-0">
          <div className="flex gap-4 items-center">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", isGenerating ? "bg-[#666666]" : "bg-[#FF7A00]")}></div>
            <span className="text-[10px] uppercase tracking-widest font-bold">
              {isGenerating ? "Strategist is thinking..." : "Strategist is listening..."}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-50 hidden sm:block">
            Step by Step Architectural Inquiry • {progressPercentage}% Complete
          </div>
        </footer>
      </main>

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
          background-color: #FF7A00;
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
