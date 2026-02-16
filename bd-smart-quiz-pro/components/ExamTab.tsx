import React, { useState, useEffect } from 'react';
import {
  Wallet, Loader2, Zap, ChevronRight, GraduationCap, School, Briefcase, Moon,
  Sparkles, Star, LayoutGrid, ArrowLeft, Send, AlertCircle, Cpu, BookOpen,
  PlusCircle, ArrowUpRight, X, CheckCircle2, Clock, Calendar, PenTool,
  Brain, FileText, Bookmark, FileSignature, Library, Award, Lightbulb,
  Gamepad2, Users, Target, Trophy, PlayCircle, RefreshCw
} from 'lucide-react';
import { UserProfile, ExamCategory, Lesson } from '../types';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, query, doc, where, orderBy, limit } from 'firebase/firestore';
import PuzzlesTab from './PuzzlesTab';
import AdRenderer from './AdRenderer';

<a>https://defiantenrage.com/r29staxe4?key=16f55b34cec622e9ffb37327506418bc</a>

interface ExamTabProps {
  user: UserProfile;
  onSubjectSelect: (subject: string, isLive: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string, isWritten?: boolean) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const ExamTab: React.FC<ExamTabProps> = ({ user, onSubjectSelect, onLessonSelect, onSubmitDeposit, onSubmitWithdraw }) => {
  const [examMode, setExamMode] = useState<'mock' | 'live' | 'paid' | 'special' | 'lesson' | 'written' | 'weekly' | 'fun'>('mock');
  const [selectedMockCategory, setSelectedMockCategory] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);

  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [resumeData, setResumeData] = useState<any>(null);

  const [selectedLessonDetail, setSelectedLessonDetail] = useState<Lesson | null>(null);

  const [paidQuizzes, setPaidQuizzes] = useState<any[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminMockQuizzes, setAdminMockQuizzes] = useState<any[]>([]);
  const [adminWeeklyQuizzes, setAdminWeeklyQuizzes] = useState<any[]>([]);
  const [adminWrittenQuizzes, setAdminWrittenQuizzes] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // অসমাপ্ত কুইজ চেক
  useEffect(() => {
    const savedQuiz = localStorage.getItem('active_quiz_session');
    if (savedQuiz) {
      try {
        setResumeData(JSON.parse(savedQuiz));
      } catch (e) {
        localStorage.removeItem('active_quiz_session');
      }
    }
  }, []);

  // ফায়ারবেস থেকে ডেটা লোড
  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (snap) => 
        setDynamicCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)))),
      
      onSnapshot(query(collection(db, 'paid_quizzes'), where('status', '==', 'active'), limit(20)), (snap) => 
        setPaidQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      
      onSnapshot(query(collection(db, 'live_quizzes'), where('status', '==', 'active'), limit(20)), (snap) => 
        setLiveQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      
      onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(20)), (snap) => 
        setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),

      onSnapshot(query(collection(db, 'admin_weekly_quizzes'), orderBy('timestamp', 'desc'), limit(20)), (snap) => 
        setAdminWeeklyQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),

      onSnapshot(query(collection(db, 'mock_quizzes'), limit(50)), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setAdminMockQuizzes(list);
      }),

      onSnapshot(query(collection(db, 'written_quizzes'), limit(50)), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setAdminWrittenQuizzes(list);
      }),

      onSnapshot(query(collection(db, 'lessons'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
        setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
        setLoading(false);
      })
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleStartQuiz = (subject: string, isLive: boolean, isPaid: boolean, fee: number, qId?: string, colName?: string, isWritten?: boolean) => {
    const sessionData = { subject, isLive, isPaid, entryFee: fee, quizId: qId, collectionName: colName, isWritten, timestamp: Date.now() };
    localStorage.setItem('active_quiz_session', JSON.stringify(sessionData));
    setResumeData(sessionData);
    onSubjectSelect(subject, isLive, isPaid, fee, qId, colName, isWritten);
  };

  const handleResumeQuiz = () => {
    if (!resumeData) return;
    onSubjectSelect(resumeData.subject, resumeData.isLive, resumeData.isPaid, resumeData.entryFee, resumeData.quizId, resumeData.collectionName, resumeData.isWritten);
  };

  const clearResumeData = () => {
    localStorage.removeItem('active_quiz_session');
    setResumeData(null);
  };

  const getLucideIcon = (name: string) => {
    const icons: any = { GraduationCap, BookOpen, School, Briefcase, Moon, Star, Trophy, Library, Award, Lightbulb, Gamepad2, Users, Target };
    const IconTag = icons[name] || LayoutGrid;
    return <IconTag size={24} />;
  };

  const handleLessonOpen = (lesson: Lesson) => {
    setSelectedLessonDetail(lesson);
    if (onLessonSelect) onLessonSelect(lesson);
  };

  const handleStartCustomQuiz = () => {
    if (!customTopic.trim()) return alert("টপিকের নাম লিখুন");
    handleStartQuiz(customTopic.trim(), false, false, 0, undefined, undefined, examMode === 'written');
    setShowCustomPrompt(false);
    setCustomTopic('');
  };

  const MODES = [
    { id: 'mock', label: 'MOCK' },
    { id: 'written', label: 'WRITTEN' },
    { id: 'live', label: 'LIVE' },
    { id: 'paid', label: 'PAID' },
    { id: 'special', label: 'SPECIAL' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'lesson', label: 'LESSON' },
    { id: 'fun', label: 'FUN' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Section */}
      <div className="bg-[#0f172a] pt-14 pb-14 px-6 rounded-b-[50px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter">পরীক্ষা কেন্দ্র</h2>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-white"><Trophy size={22} /></div>
        </div>

        {/* Resume Quiz Card */}
        {resumeData && (
          <div className="mb-6 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[30px] animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-400 text-amber-900 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20">
                <PlayCircle size={24} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">অসমাপ্ত পরীক্ষা</p>
                <h4 className="text-white font-black text-sm truncate">{resumeData.subject}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={clearResumeData} className="p-2 bg-white/10 text-white rounded-xl hover:bg-red-500/20 transition-colors"><X size={18} /></button>
                <button onClick={handleResumeQuiz} className="bg-white text-emerald-800 px-4 py-2 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">চালিয়ে যান</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex bg-black/20 p-1.5 rounded-2xl overflow-x-auto no-scrollbar gap-1 backdrop-blur-md">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setExamMode(m.id as any); setSelectedMockCategory(null); }} 
              className={`flex-1 min-w-[85px] py-2.5 rounded-xl font-black text-[10px] uppercase transition-all duration-300 ${examMode === m.id ? 'bg-white text-emerald-800 shadow-lg scale-105' : 'text-white/50 hover:text-white'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-6 flex-1">
        <AdRenderer placementId="exam_top" />

        {/* Mock & Written Section */}
        {(examMode === 'mock' || examMode === 'written') && (
          <div className="space-y-6">
            {!selectedMockCategory ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowCustomPrompt(true)} className={`col-span-2 bg-gradient-to-br ${examMode === 'written' ? 'from-emerald-600 to-teal-800' : 'from-indigo-600 to-emerald-700'} p-8 rounded-[40px] shadow-xl text-white text-left relative overflow-hidden group active:scale-95 transition-all`}>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">{examMode === 'written' ? <FileSignature size={32} /> : <Brain size={32} />}</div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">AI {examMode === 'written' ? 'WRITTEN' : 'MOCK'}</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight">{examMode === 'written' ? 'লিখিত পরীক্ষার টপিক' : 'কাস্টম টপিকে কুইজ'}</h3>
                  <p className="text-[10px] opacity-70 font-bold mt-1 uppercase tracking-widest">{examMode === 'written' ? 'AI আপনার উত্তর মূল্যায়ন করবে' : 'আপনার পছন্দমতো টপিক লিখে দিন'}</p>
                </button>
                {dynamicCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedMockCategory(cat.label)} className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-emerald-200">
                    <div className={`w-16 h-16 ${cat.color || 'bg-emerald-500'} text-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all overflow-hidden`}>
                      {cat.thumbnailUrl ? <img src={cat.thumbnailUrl} className="w-full h-full object-cover" alt="" /> : getLucideIcon(cat.iconName)}
                    </div>
                    <span className="font-black text-slate-800 text-[11px] text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <button onClick={() => setSelectedMockCategory(null)} className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest mb-2 bg-emerald-50 px-5 py-2.5 rounded-full w-max shadow-sm active:scale-90 transition-all"><ArrowLeft size={14} /> ফিরে যান</button>
                <div className="grid grid-cols-1 gap-3">
                  {(examMode === 'written' ? adminWrittenQuizzes : adminMockQuizzes).filter(q => q.category === selectedMockCategory).map(quiz => (
                    <button key={quiz.id} onClick={() => handleStartQuiz(quiz.title, false, quiz.isPaid || quiz.entryFee > 0, quiz.entryFee || 0, quiz.id, examMode === 'written' ? 'written_quizzes' : 'mock_quizzes', examMode === 'written')} className="w-full p-6 bg-white rounded-[32px] border border-slate-50 text-left font-black shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all active:scale-95">
                      <div className="min-w-0 flex-grow pr-4">
                        <p className="text-sm text-slate-800 mb-1 leading-tight truncate">{quiz.title}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-[9px] ${examMode === 'written' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'} px-2.5 py-0.5 rounded-md uppercase font-black`}>{quiz.subject}</span>
                          {quiz.duration && <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-tighter"><Clock size={10} /> {quiz.duration} মিনিট</div>}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weekly / Paid / Live / Special Quizzes */}
        {(examMode === 'paid' || examMode === 'live' || examMode === 'special' || examMode === 'weekly') && (
          <div className="space-y-6 pb-10">
            {(
              examMode === 'paid' ? paidQuizzes : 
              examMode === 'live' ? liveQuizzes : 
              examMode === 'weekly' ? adminWeeklyQuizzes : 
              specialQuizzes
            ).map(quiz => (
              <div key={quiz.id} className="bg-white rounded-[44px] shadow-md border border-slate-100 overflow-hidden group">
                <div className="p-8 pb-4 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 pr-8">
                      <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{quiz.title}</h3>
                      <span className="inline-block text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase">{quiz.subject || 'সাপ্তাহিক পরীক্ষা'}</span>
                    </div>
                    {examMode === 'weekly' ? <Calendar size={20} className="text-blue-500" /> : <Star size={20} className="text-emerald-500" fill="currentColor" />}
                  </div>
                  <div className="bg-slate-50/80 rounded-[32px] p-6 grid grid-cols-2 gap-4 border border-slate-100 mb-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">পুরস্কার</p>
                      <span className="text-xl font-black text-emerald-700">৳{quiz.prizePool || 0}</span>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase">এন্ট্রি ফি</p>
                      <span className="text-xl font-black text-slate-800">৳{quiz.entryFee || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <button onClick={() => handleStartQuiz(
                    quiz.title, 
                    examMode === 'live', 
                    (quiz.entryFee > 0), 
                    quiz.entryFee || 0, 
                    quiz.id, 
                    examMode === 'paid' ? 'paid_quizzes' : 
                    examMode === 'live' ? 'live_quizzes' : 
                    examMode === 'weekly' ? 'admin_weekly_quizzes' : 
                    'admin_special_quizzes'
                  )} className="w-full bg-[#111827] text-white py-4.5 rounded-[20px] font-black text-sm uppercase shadow-xl active:scale-95 transition-all">অংশ নিন</button>
                </div>
              </div>
            ))}
            {(examMode === 'weekly' && adminWeeklyQuizzes.length === 0) && (
                <div className="text-center py-20 opacity-40">
                    <Calendar size={48} className="mx-auto mb-4" />
                    <p className="font-black text-sm uppercase">এই সপ্তাহে কোনো পরীক্ষা নেই</p>
                </div>
            )}
          </div>
        )}

        {/* Lessons Section */}
        {examMode === 'lesson' && (
          <div className="space-y-6 pb-20">
            {loading ? (
              <div className="flex flex-col items-center py-20 opacity-20"><Loader2 className="animate-spin" size={40} /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {lessons.map(lesson => (
                  <button key={lesson.id} onClick={() => handleLessonOpen(lesson)} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 text-left active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><BookOpen size={20} /></div>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{lesson.category}</span>
                    </div>
                    <h3 className="text-md font-black text-slate-900 leading-tight mb-2 line-clamp-1">{lesson.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed opacity-70 mb-4">{lesson.content}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase"><Clock size={12} /> {lesson.timestamp ? new Date(lesson.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'আজ'}</div>
                      <div className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1">পড়ুন <ArrowUpRight size={14} /></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {examMode === 'fun' && <div className="min-h-full"><PuzzlesTab /></div>}
        <AdRenderer placementId="exam_bottom" className="mt-10" />
      </div>

      {/* Lesson View Modal */}
      {selectedLessonDetail && (
        <div className="fixed inset-0 bg-white z-[3000] flex flex-col font-hind overflow-y-auto">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 flex justify-between items-center border-b border-slate-100">
            <button onClick={() => setSelectedLessonDetail(null)} className="p-2 bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={20} /></button>
            <span className="font-black text-[10px] uppercase text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">{selectedLessonDetail.category}</span>
          </div>
          <div className="p-8">
            <h1 className="text-2xl font-black text-slate-900 mb-6 leading-tight">{selectedLessonDetail.title}</h1>
            <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-loose text-lg whitespace-pre-wrap">{selectedLessonDetail.content}</div>
          </div>
          <div className="p-8 mt-10 border-t border-slate-100 bg-slate-50">
            <button onClick={() => setSelectedLessonDetail(null)} className="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black shadow-xl">আমি পড়েছি</button>
          </div>
        </div>
      )}

      {/* AI Prompt */}
      {showCustomPrompt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-2xl relative">
            <button onClick={() => setShowCustomPrompt(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 p-1"><X size={24} /></button>
            <h3 className="text-2xl font-black text-slate-900 text-center mb-3">{examMode === 'written' ? 'AI রিটেন মাস্টার' : 'AI কুইজ ম্যাজিক'}</h3>
            <div className="space-y-6 mt-8">
              <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="টপিক লিখুন" className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[28px] font-black outline-none focus:bg-white focus:border-emerald-200 transition-all text-slate-800" autoFocus />
              <button onClick={handleStartCustomQuiz} className={`w-full ${examMode === 'written' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white py-5 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all`}>শুরু করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
