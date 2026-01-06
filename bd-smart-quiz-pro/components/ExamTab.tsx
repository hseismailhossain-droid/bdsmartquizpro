
import React, { useState, useEffect } from 'react';
import { Wallet, Loader2, Zap, ChevronRight, GraduationCap, School, Briefcase, Moon, Sparkles, Star, LayoutGrid, ArrowLeft, Send, AlertCircle, Cpu, BookOpen, PlusCircle, ArrowUpRight, X, CheckCircle2, Clock, Calendar, PenTool, Brain, FileText, Bookmark, FileSignature, Library, Award, Lightbulb, Gamepad2, Users, Target, Trophy } from 'lucide-react';
import { UserProfile, ExamCategory, Lesson } from '../types';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, query, doc, where, orderBy, limit } from 'firebase/firestore';
import PuzzlesTab from './PuzzlesTab';
import AdRenderer from './AdRenderer';

interface ExamTabProps {
  user: UserProfile;
  onSubjectSelect: (subject: string, isLive: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string, isWritten?: boolean) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const ExamTab: React.FC<ExamTabProps> = ({ user, onSubjectSelect, onLessonSelect, onSubmitDeposit, onSubmitWithdraw }) => {
  const [examMode, setExamMode] = useState<'mock' | 'live' | 'paid' | 'special' | 'lesson' | 'written' | 'fun'>('mock');
  const [selectedMockCategory, setSelectedMockCategory] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);
  
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  const [paidQuizzes, setPaidQuizzes] = useState<any[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminMockQuizzes, setAdminMockQuizzes] = useState<any[]>([]);
  const [adminWrittenQuizzes, setAdminWrittenQuizzes] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubs = [
      onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (snap) => setDynamicCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)))),
      onSnapshot(query(collection(db, 'paid_quizzes'), where('status', '==', 'active'), limit(20)), (snap) => setPaidQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'live_quizzes'), where('status', '==', 'active'), limit(20)), (snap) => setLiveQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(20)), (snap) => setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'mock_quizzes'), limit(50)), (snap) => {
         const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         list.sort((a:any, b:any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
         setAdminMockQuizzes(list);
      }),
      onSnapshot(query(collection(db, 'written_quizzes'), limit(50)), (snap) => {
         const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         list.sort((a:any, b:any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
         setAdminWrittenQuizzes(list);
      }),
      onSnapshot(query(collection(db, 'lessons'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
        setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
        setLoading(false);
      })
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  const getLucideIcon = (name: string) => {
    switch (name) {
      case 'GraduationCap': return <GraduationCap size={24} />;
      case 'BookOpen': return <BookOpen size={24} />;
      case 'School': return <School size={24} />;
      case 'Briefcase': return <Briefcase size={24} />;
      case 'Moon': return <Moon size={24} />;
      case 'Star': return <Star size={24} />;
      case 'Trophy': return <Trophy size={24} />;
      case 'Library': return <Library size={24} />;
      case 'Award': return <Award size={24} />;
      case 'Lightbulb': return <Lightbulb size={24} />;
      case 'Gamepad2': return <Gamepad2 size={24} />;
      case 'Users': return <Users size={24} />;
      case 'Target': return <Target size={24} />;
      default: return <LayoutGrid size={24} />;
    }
  };

  const handleStartCustomQuiz = () => {
    if (!customTopic.trim()) return alert("টপিকের নাম লিখুন");
    onSubjectSelect(customTopic.trim(), false, false, 0, undefined, undefined, examMode === 'written');
    setShowCustomPrompt(false);
    setCustomTopic('');
  };

  const formatDateTime = (dtStr?: string) => {
    if (!dtStr) return null;
    const dt = new Date(dtStr);
    return dt.toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const MODES = [
    { id: 'mock', label: 'MOCK', color: 'bg-indigo-600' },
    { id: 'written', label: 'WRITTEN', color: 'bg-emerald-600' },
    { id: 'live', label: 'LIVE', color: 'bg-rose-600' },
    { id: 'paid', label: 'PAID', color: 'bg-emerald-600' },
    { id: 'special', label: 'SPECIAL', color: 'bg-amber-50' },
    { id: 'lesson', label: 'LESSON', color: 'bg-blue-600' },
    { id: 'fun', label: 'FUN', color: 'bg-purple-600' },
  ];

  return (
    <div className="bg-slate-50 w-full font-hind overflow-x-hidden flex flex-col pb-32">
      <div className="bg-emerald-800 pt-10 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <h2 className="text-2xl font-black text-white mb-6 tracking-tight">পরীক্ষা কেন্দ্র</h2>
        <div className="flex bg-black/20 p-1.5 rounded-2xl overflow-x-auto no-scrollbar gap-1 backdrop-blur-md">
          {MODES.map((m) => (
            <button 
              key={m.id} 
              onClick={() => { setExamMode(m.id as any); setSelectedMockCategory(null); }} 
              className={`flex-1 min-w-[70px] py-2.5 rounded-xl font-black text-[10px] uppercase transition-all duration-300 ${examMode === m.id ? 'bg-white text-emerald-800 shadow-lg scale-105' : 'text-white/50 hover:text-white'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-6 flex-1">
        <AdRenderer placementId="exam_top" />
        
        {(examMode === 'mock' || examMode === 'written') && (
           <div className="space-y-6">
             {!selectedMockCategory ? (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowCustomPrompt(true)} className={`col-span-2 bg-gradient-to-br ${examMode === 'written' ? 'from-emerald-600 to-teal-800' : 'from-indigo-600 to-emerald-700'} p-8 rounded-[40px] shadow-xl text-white text-left relative overflow-hidden group active:scale-95 transition-all`}>
                     <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                           {examMode === 'written' ? <FileSignature size={32}/> : <Brain size={32}/>}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">AI {examMode === 'written' ? 'WRITTEN' : 'MOCK'}</span>
                     </div>
                     <h3 className="text-xl font-black leading-tight">{examMode === 'written' ? 'লিখিত পরীক্ষার টপিক' : 'কাস্টম টপিকে কুইজ'}</h3>
                     <p className="text-[10px] opacity-70 font-bold mt-1 uppercase tracking-widest">{examMode === 'written' ? 'AI আপনার উত্তর মূল্যায়ন করবে' : 'আপনার পছন্দমতো টপিক লিখে দিন'}</p>
                  </button>
                  {dynamicCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedMockCategory(cat.label)} className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-emerald-200">
                       <div className={`w-20 h-20 ${cat.color} text-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all overflow-hidden`}>
                         {cat.thumbnailUrl ? (
                           <img src={cat.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                         ) : (
                           getLucideIcon(cat.iconName)
                         )}
                       </div>
                       <span className="font-black text-slate-800 text-[11px] text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
             ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                   <button onClick={() => setSelectedMockCategory(null)} className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest mb-2 bg-emerald-50 px-5 py-2.5 rounded-full w-max shadow-sm active:scale-90 transition-all"><ArrowLeft size={14}/> ফিরে যান</button>
                   <div className="grid grid-cols-1 gap-3">
                      {(examMode === 'written' ? adminWrittenQuizzes : adminMockQuizzes).filter(q => q.category === selectedMockCategory).map(quiz => (
                        <button key={quiz.id} onClick={() => onSubjectSelect(quiz.title, false, quiz.isPaid || quiz.entryFee > 0, quiz.entryFee || 0, quiz.id, examMode === 'written' ? 'written_quizzes' : 'mock_quizzes', examMode === 'written')} className="w-full p-7 bg-white rounded-[32px] border border-slate-50 text-left font-black shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all active:scale-95">
                           <div className="min-w-0 flex-grow pr-4">
                              <p className="text-sm text-slate-800 mb-1 leading-tight truncate">{quiz.title}</p>
                              <div className="flex flex-wrap items-center gap-3">
                                 <span className={`text-[9px] ${examMode === 'written' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'} px-2.5 py-0.5 rounded-md uppercase font-black`}>{quiz.subject}</span>
                                 {quiz.duration && <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-tighter"><Clock size={10}/> {quiz.duration} মিনিট</div>}
                                 {quiz.entryFee > 0 && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">PAID: ৳{quiz.entryFee}</span>}
                              </div>
                           </div>
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all"><ChevronRight size={18}/></div>
                        </button>
                      ))}
                   </div>
                </div>
             )}
           </div>
        )}

        {(examMode === 'paid' || examMode === 'live' || examMode === 'special') && (
           <div className="space-y-8 pb-10 animate-in fade-in duration-500">
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).map(quiz => (
                <div key={quiz.id} className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="p-8 pb-4 relative">
                        <div className="flex justify-between items-start mb-4">
                           <div className="min-w-0 pr-8">
                              <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{quiz.title}</h3>
                              <span className="inline-block text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">{quiz.subject}</span>
                           </div>
                           <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-500 shadow-sm border border-emerald-100 shrink-0"><Star size={20} fill="currentColor"/></div>
                        </div>
                        <div className="bg-slate-50/80 backdrop-blur-sm rounded-[32px] p-6 grid grid-cols-2 gap-4 border border-slate-100 mb-6">
                           <div className="text-center space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">পুরস্কার</p>
                              <div className="flex items-center justify-center gap-1"><span className="text-xl font-black text-emerald-700 leading-none">৳</span><span className="text-xl font-black text-emerald-700 leading-none">{quiz.prizePool}</span></div>
                           </div>
                           <div className="text-center space-y-1 border-l border-slate-200">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">এন্ট্রি ফি</p>
                              <div className="flex items-center justify-center gap-1"><span className="text-xl font-black text-slate-800 leading-none">৳</span><span className="text-xl font-black text-slate-800 leading-none">{quiz.entryFee}</span></div>
                           </div>
                        </div>
                        {(quiz.startTime || quiz.endTime) && (
                          <div className="flex items-center justify-center gap-6 mb-2">
                             {quiz.startTime && <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Clock size={10}/> শুরু: <span className="text-slate-600">{formatDateTime(quiz.startTime)}</span></div>}
                             {quiz.duration && <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Clock size={10}/> সময়: <span className="text-slate-600">{quiz.duration}m</span></div>}
                          </div>
                        )}
                    </div>
                    <div className="px-8 pb-8">
                       <button onClick={() => onSubjectSelect(quiz.title, examMode === 'live', true, quiz.entryFee, quiz.id, examMode === 'paid' ? 'paid_quizzes' : examMode === 'live' ? 'live_quizzes' : 'admin_special_quizzes')} className="w-full bg-[#111827] text-white py-4.5 rounded-[20px] font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-slate-800">অংশ নিন</button>
                    </div>
                </div>
             ))}
           </div>
        )}

        {examMode === 'lesson' && (
           <div className="space-y-6 pb-20 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 gap-4">
                 {lessons.map(lesson => (
                   <button 
                    key={lesson.id} 
                    onClick={() => onLessonSelect(lesson)}
                    className="bg-white p-7 rounded-[44px] shadow-sm border border-slate-100 text-left group active:scale-[0.98] transition-all hover:border-blue-200"
                   >
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                         </div>
                         <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">{lesson.category}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-2">{lesson.title}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed opacity-70 mb-4">{lesson.content}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase">
                            <Clock size={12}/> {lesson.timestamp ? new Date(lesson.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এখন'}
                         </div>
                         <div className="text-blue-600 font-black text-[10px] uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            বিস্তারিত পড়ুন <ArrowUpRight size={14}/>
                         </div>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        )}

        {examMode === 'fun' && <div className="min-h-full"><PuzzlesTab /></div>}

        <AdRenderer placementId="exam_bottom" className="mt-10" />
      </div>

      {showCustomPrompt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[2000] flex items-center justify-center p-6 font-hind">
           <div className="bg-white w-full max-w-sm rounded-[50px] p-10 animate-in zoom-in-95 duration-300 shadow-2xl relative border border-white/20">
              <button onClick={() => setShowCustomPrompt(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors p-1"><X size={24}/></button>
              <div className={`w-20 h-20 ${examMode === 'written' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ${examMode === 'written' ? 'ring-emerald-50/50' : 'ring-indigo-50/50'}`}>
                 {examMode === 'written' ? <FileSignature size={40} className="animate-pulse" /> : <Brain size={40} className="animate-pulse" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-3">{examMode === 'written' ? 'AI রিটেন মাস্টার' : 'AI কুইজ ম্যাজিক'}</h3>
              <p className="text-[11px] text-slate-400 font-bold text-center mb-10 px-4 leading-relaxed uppercase tracking-widest">
                {examMode === 'written' ? 'টপিকের নাম লিখুন, AI আপনার উত্তর মূল্যায়ন করবে!' : 'টপিকের নাম লিখুন, AI প্রশ্ন তৈরি করবে!'}
              </p>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block px-2">সাবজেক্ট / টপিক</label>
                    <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="যেমন: বাংলাদেশের মুক্তিযুদ্ধ বা পরিবেশ" className={`w-full bg-slate-50 border-2 border-slate-50 p-5.5 rounded-[28px] font-black outline-none focus:bg-white ${examMode === 'written' ? 'focus:border-emerald-200' : 'focus:border-indigo-200'} transition-all shadow-inner text-slate-800`} autoFocus />
                 </div>
                 <button onClick={handleStartCustomQuiz} className={`w-full ${examMode === 'written' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white py-5.5 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3`}>
                    পরীক্ষা শুরু করুন <ChevronRight size={22}/>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
