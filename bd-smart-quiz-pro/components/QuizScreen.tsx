import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Timer, CheckCircle2, ArrowRight, Trophy, Info, XCircle, Loader2, Image as ImageIcon, Bookmark } from 'lucide-react';
import { generateQuestions } from '../services/geminiService';
import { Question, QuizResult } from '../types';
import { db, auth } from '../services/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface QuizScreenProps {
  subject: string;
  onClose: () => void;
  onFinish: (result: QuizResult & { mistakes?: Question[]; timeTaken?: number }) => void;
  numQuestions: number;
  timePerQuestion: number;
  isPaid?: boolean;
  quizId?: string;
  collectionName?: string;
  lang: any;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ subject, onClose, onFinish, numQuestions, timePerQuestion, isPaid, quizId, collectionName, lang }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(timePerQuestion);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // নতুন স্টেট
  const [quizStartTime] = useState(Date.now());

  // প্রশ্ন লোড করার লজিক
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let fetched: Question[] = [];
        // ফায়ারবেস থেকে প্রশ্ন আনা
        if (quizId && quizId !== 'mock') {
          const col = collectionName || 'mock_quizzes';
          const snap = await getDoc(doc(db, col, quizId));
          if (snap.exists()) {
            const data = snap.data();
            fetched = data.manualQuestions || data.questions || [];
          }
        }
        
        // যদি ফায়ারবেসে না থাকে তবে Gemini AI দিয়ে জেনারেট করা
        if (fetched.length === 0) {
          const data = await generateQuestions(subject, numQuestions, lang);
          if (data && Array.isArray(data)) fetched = data;
        }
        
        setQuestions(fetched.slice(0, numQuestions));
      } catch (e) { 
        console.error("Error loading questions:", e);
        alert("প্রশ্নপত্র লোড করা যায়নি।"); 
      } finally { setLoading(false); }
    };
    load();
  }, [quizId, subject, numQuestions, lang, collectionName]);

  // টাইমার লজিক
  useEffect(() => {
    if (loading || finished || isAnswered || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimer(ti => { 
        if (ti <= 1) { 
          handleAnswer(-1); // সময় শেষ হলে নেগেটিভ মার্কিং বা স্কিপ
          return 0; 
        } 
        return ti - 1; 
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, finished, isAnswered, questions]);

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentIndex];
    if (idx === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    } else {
      setMistakes(prev => [...prev, currentQuestion]);
      // পেইড কুইজে ভুল উত্তরের জন্য ০.২৫ নেগেটিভ মার্কিং
      if (isPaid) setScore(s => s - 0.25);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(timePerQuestion);
    } else {
      setFinished(true);
    }
  };

  // রেজাল্ট সাবমিট করার ফাংশন (App.tsx এ ডাটা পাঠাবে)
  const handleSubmitResult = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const finalResult = {
      score: Number(score.toFixed(2)),
      total: questions.length,
      subject,
      date: new Date().toLocaleDateString('bn-BD'),
      quizId: quizId || 'mock',
      mistakes,
      timeTaken: Math.floor((Date.now() - quizStartTime) / 1000)
    };

    try {
      await onFinish(finalResult); // App.tsx এর handleFinishQuiz কল হবে
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // বুকমার্ক লজিক
  const handleBookmark = async () => {
    if (!auth.currentUser || isBookmarking) return;
    setIsBookmarking(true);
    try {
      const q = questions[currentIndex];
      await addDoc(collection(db, 'bookmarks'), {
        uid: auth.currentUser.uid,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        timestamp: serverTimestamp()
      });
      alert("বুকমার্ক করা হয়েছে!");
    } catch (e) { alert("বুকমার্ক করা যায়নি।"); }
    finally { setIsBookmarking(false); }
  };

  if (loading) return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center font-hind">
      <div className="w-16 h-16 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-slate-900 text-lg font-black animate-pulse">প্রশ্নপত্র তৈরি হচ্ছে...</p>
    </div>
  );

  if (finished) return (
    <div className="h-full w-full bg-white p-8 flex flex-col items-center justify-center text-center font-hind safe-pb">
      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
        <Trophy size={48} className="text-emerald-700 animate-bounce" />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">চমৎকার!</h2>
      <p className="text-slate-400 font-bold mb-10 uppercase tracking-widest text-xs">আপনি কুইজটি সম্পন্ন করেছেন</p>
      
      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10 border border-slate-100 shadow-inner">
        <p className="text-6xl font-black text-emerald-700">{score.toFixed(2)}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">আপনার মোট স্কোর</p>
      </div>

      <button 
        onClick={handleSubmitResult} 
        disabled={isSubmitting}
        className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : "ফলাফল জমা দিন"}
      </button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="h-full w-full bg-white flex flex-col font-hind max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b sticky top-0 z-50 safe-pt">
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90"><ChevronLeft size={24} /></button>
        <div className="text-center flex-grow">
           <p className="font-black text-slate-800 text-sm mb-1 line-clamp-1">{subject}</p>
           <div className="flex items-center justify-center gap-2">
              <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 font-black">{currentIndex + 1}/{questions.length}</p>
           </div>
        </div>
        <div className={`w-10 h-10 rounded-2xl font-black text-xs flex items-center justify-center shadow-sm ${timer < 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-600'}`}>{timer}</div>
      </div>

      {/* Question Content */}
      <div className="flex-grow overflow-y-auto no-scrollbar p-6 pb-20">
        <div className="flex justify-between items-start gap-4 mb-8">
           <h3 className="text-lg font-black text-slate-900 leading-relaxed text-left flex-1">{q.question}</h3>
           <button onClick={handleBookmark} disabled={isBookmarking} className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 ${isBookmarking ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-300'}`}>
             <Bookmark size={20} fill={isBookmarking ? "currentColor" : "none"} />
           </button>
        </div>
        
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correctAnswer;
            const isSelected = idx === selectedOption;
            return (
              <button 
                key={idx} 
                disabled={isAnswered} 
                onClick={() => handleAnswer(idx)} 
                className={`w-full p-5 rounded-[22px] text-left font-bold border transition-all flex justify-between items-center 
                ${isAnswered 
                  ? (isCorrect ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-100 opacity-60') 
                  : 'bg-white border-slate-100 hover:border-emerald-200 active:bg-slate-50'}`}
              >
                <span className="text-sm">{opt}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isAnswered && isCorrect ? 'bg-white border-white' : 'border-slate-100'}`}>
                  {isAnswered && isCorrect && <CheckCircle2 size={16} className="text-emerald-600"/>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation and Next Button */}
        {isAnswered && (
          <div className="mt-8 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 animate-in slide-in-from-bottom-6">
             <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><Info size={20} /></div>
                <div className="flex-grow">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">ব্যাখ্যা</p>
                   <p className="text-xs text-slate-800 font-bold leading-relaxed">{q.explanation || 'এই প্রশ্নের কোনো সঠিক ব্যাখ্যা দেওয়া নেই।'}</p>
                </div>
             </div>
             <div className="mt-6 flex justify-end">
                <button onClick={handleNext} className="bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                  {currentIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী'} <ArrowRight size={18}/>
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
