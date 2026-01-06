
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Send, Sparkles, Loader2, Brain, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, Star, Info, FileSignature, PlayCircle, Hash } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface WrittenExamScreenProps {
  subject: string;
  onClose: () => void;
  lang: any;
  quizId?: string;
}

const WrittenExamScreen: React.FC<WrittenExamScreenProps> = ({ subject, onClose, lang, quizId }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    loadExam();
  }, [subject, quizId]);

  const loadExam = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetched: any[] = [];
      if (quizId && quizId !== 'mock') {
        const snap = await getDoc(doc(db, 'written_quizzes', quizId));
        if (snap.exists()) {
           const data = snap.data();
           fetched = data.manualQuestions || data.questions || [];
        }
      }
      
      if (fetched.length === 0) {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Topic: ${subject}. Generate 1 descriptive high-quality written exam question in Bengali. Assign a marks value of 10.`,
        });
        const qText = response.text || "No question generated.";
        fetched = [{ question: qText, marks: 10 }];
      }
      
      setQuestions(fetched);
      setUserAnswers(new Array(fetched.length).fill(''));
    } catch (e: any) { 
      console.error("Written Exam Load Error:", e);
      setError("প্রশ্নপত্র লোড করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।"); 
    }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("লগইন প্রয়োজন!");
    
    const isReady = userAnswers.every(a => a && a.trim().length > 0);
    if (!isReady) return alert("দয়া করে সবগুলো প্রশ্নের উত্তর লিখুন।");
    
    setIsSubmitting(true);
    
    const withTimeout = (promise: Promise<any>, ms: number) => 
      Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))]);

    try {
      // Ensure all mapped values are strings/numbers and NOT undefined
      const submissionData = {
        uid: uid,
        userName: auth.currentUser?.displayName || 'User',
        quizId: quizId || 'mock',
        quizTitle: subject || 'Subject',
        subject: subject || 'General',
        answers: questions.map((q, i) => ({
          question: q.question || 'Question',
          userAnswer: userAnswers[i] || '',
          marksGained: 0,
          maxMarks: Number(q.marks) || 10,
          feedback: '',
          modelAnswer: ''
        })),
        totalScore: 0,
        status: 'pending',
        timestamp: serverTimestamp()
      };

      await withTimeout(addDoc(collection(db, 'written_submissions'), submissionData), 45000);
      setSubmitted(true);
    } catch (e: any) { 
      console.error("Submit Error:", e);
      alert(e.message === "Timeout" ? "সার্ভার রেসপন্স করছে না। ইন্টারনেট চেক করে আবার চেষ্টা করুন।" : "সাবমিট ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।"); 
    }
    finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-10 text-center font-['Hind_Siliguri']">
      <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-slate-900 text-lg font-black">প্রশ্নপত্র সাজানো হচ্ছে...</p>
      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Generating Exam Layout</p>
    </div>
  );

  if (error) return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-10 text-center font-['Hind_Siliguri']">
      <AlertCircle size={48} className="text-rose-500 mb-4" />
      <p className="text-slate-900 text-lg font-black">{error}</p>
      <button onClick={() => loadExam()} className="mt-8 flex items-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">
        <RefreshCw size={18}/> পুনরায় চেষ্টা করুন
      </button>
      <button onClick={onClose} className="mt-4 text-slate-400 font-bold uppercase text-[10px]">ফিরে যান</button>
    </div>
  );

  if (submitted) return (
    <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center font-['Hind_Siliguri'] animate-in zoom-in-95">
       <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-50/50">
          <CheckCircle2 size={48} />
       </div>
       <h2 className="text-2xl font-black text-slate-900 mb-4">উত্তরপত্র জমা হয়েছে!</h2>
       <p className="text-sm text-slate-500 font-bold mb-10 leading-relaxed px-6">আপনার উত্তরপত্রটি পর্যালোচনার পর ফলাফল হিস্ট্রি ট্যাবে দেখতে পাবেন।</p>
       <button onClick={onClose} className="w-full max-w-[280px] bg-slate-900 text-white py-5 rounded-[28px] font-black shadow-xl active:scale-95 transition-all">ফিরে যান</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="h-screen w-full bg-white flex flex-col font-['Hind_Siliguri'] overflow-hidden fixed inset-0 z-[5000]">
      <div className="p-6 flex items-center justify-between border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50 safe-pt shadow-sm shrink-0">
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl active:scale-90 transition-all"><ChevronLeft size={24} /></button>
        <div className="text-center">
           <h3 className="font-black text-slate-900 text-sm truncate max-w-[150px]">{subject}</h3>
           <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Question {currentIndex + 1}/{questions.length}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-40">
        {q.mediaUrl && q.mediaType !== 'none' && (
          <div className="mb-8 rounded-[40px] overflow-hidden shadow-xl border border-slate-100 bg-black aspect-video relative">
            {q.mediaType === 'image' ? (
              <img src={q.mediaUrl} className="w-full h-full object-contain" alt="Question media" />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                 <video src={q.mediaUrl} controls className="w-full h-full" />
                 <PlayCircle className="absolute pointer-events-none opacity-20 text-white" size={60} />
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 p-8 rounded-[44px] border border-slate-100 mb-8 relative overflow-hidden group shadow-inner">
           <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><FileSignature size={20}/></div>
              <div className="bg-white px-3 py-1 rounded-lg text-xs font-black text-emerald-700 shadow-sm border border-emerald-50">Marks: {q.marks || 10}</div>
           </div>
           <h3 className="text-xl font-black text-slate-800 leading-relaxed">{q.question}</h3>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">আপনার উত্তর</label>
           <textarea 
            value={userAnswers[currentIndex]}
            onChange={(e) => { const n = [...userAnswers]; n[currentIndex] = e.target.value; setUserAnswers(n); }}
            placeholder="এখানে উত্তরটি লিখুন..."
            className="w-full h-64 bg-white border-2 border-slate-100 p-8 rounded-[48px] font-bold text-slate-700 outline-none focus:border-emerald-300 transition-all shadow-xl shadow-slate-200/10 leading-relaxed text-lg"
           />
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[360px] px-6 z-50 safe-pb">
         <button 
          onClick={currentIndex === questions.length - 1 ? handleSubmit : () => setCurrentIndex(c => c + 1)}
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
         >
           {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={24}/>
                <span>সাবমিট হচ্ছে...</span>
              </>
           ) : (
              <>
                <Send size={24}/>
                <span>{currentIndex === questions.length - 1 ? 'সাবমিট করুন' : 'পরবর্তী প্রশ্ন'}</span>
              </>
           )}
         </button>
      </div>
    </div>
  );
};

export default WrittenExamScreen;
