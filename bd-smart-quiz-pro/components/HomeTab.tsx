import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, QuizResult, Question, Notification, Lesson as LessonType } from '../types';
import { Bell, Edit3, Wallet, Star, ChevronRight, Zap, Music, Pause, Play, X, Headphones, BookOpen, Crown, Calendar, FileSignature, Layout, Smile, Youtube } from 'lucide-react';
import AdRenderer from './AdRenderer';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface HomeTabProps {
  user: UserProfile;
  notifications: Notification[];
  onShowNotifications: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
  onLessonSelect: (lesson: any) => void;
  onEditProfile: (tab?: 'profile' | 'report' | 'privacy' | 'wallet') => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, onShowNotifications, onSubjectSelect, onLessonSelect, onEditProfile 
}) => {
  // ৮টি ক্যাটাগরির স্টেট
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [mockQuizzes, setMockQuizzes] = useState<any[]>([]);
  const [writtenQuizzes, setWrittenQuizzes] = useState<any[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<any[]>([]);
  const [paidQuizzes, setPaidQuizzes] = useState<any[]>([]);
  const [weeklyQuizzes, setWeeklyQuizzes] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [funQuizzes, setFunQuizzes] = useState<any[]>([]);
  
  const [notices, setNotices] = useState<any[]>([]);
  const [dbRecitations, setDbRecitations] = useState<any[]>([]);
  const [currentAudio, setCurrentAudio] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // ১. স্পেশাল কুইজ
    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), limit(5)), (snap) => setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ২. মক কুইজ
    const unsubMock = onSnapshot(collection(db, 'mock_quizzes'), (snap) => setMockQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৩. রিটেন কুইজ
    const unsubWritten = onSnapshot(collection(db, 'written_quizzes'), (snap) => setWrittenQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৪. লাইভ কুইজ
    const unsubLive = onSnapshot(collection(db, 'live_quizzes'), (snap) => setLiveQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৫. পেইড কুইজ
    const unsubPaid = onSnapshot(collection(db, 'paid_quizzes'), (snap) => setPaidQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৬. উইকলি কুইজ
    const unsubWeekly = onSnapshot(collection(db, 'weekly_quizzes'), (snap) => setWeeklyQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৭. লেসন/ভিডিও
    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snap) => setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // ৮. ফান কুইজ
    const unsubFun = onSnapshot(collection(db, 'fun_quizzes'), (snap) => setFunQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), limit(3)), (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAudios = onSnapshot(collection(db, 'admin_mind_relax_audio'), (snap) => setDbRecitations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { 
      unsubSpecial(); unsubMock(); unsubWritten(); unsubLive(); unsubPaid(); unsubWeekly(); unsubLessons(); unsubFun(); unsubNotices(); unsubAudios(); 
    };
  }, []);

  const playRecitation = (recitation: any) => {
    if (!audioRef.current) return;
    if (currentAudio?.id === recitation.id) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    } else {
      audioRef.current.pause(); setCurrentAudio(recitation);
      audioRef.current.src = recitation.url; audioRef.current.load();
      audioRef.current.play(); setIsPlaying(true);
    }
  };

  return (
    <div className="p-5 animate-in fade-in duration-500 font-['Hind_Siliguri'] pb-32 no-scrollbar">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl">SQ</div>
          <h2 className="text-xl font-black text-slate-800">স্বাগতম, {user?.name?.split(' ')[0]}</h2>
        </div>
        <button onClick={onShowNotifications} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400"><Bell size={20}/></button>
      </div>

      <div className="space-y-8">
        {/* Balance Card */}
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">আপনার ব্যালেন্স</p>
            <h3 className="text-4xl font-black">৳{user?.balance || 0}</h3>
          </div>
          <button onClick={() => onEditProfile('wallet')} className="bg-emerald-500 p-4 rounded-2xl relative z-10"><Wallet size={20}/></button>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* ১. বিশেষ কুইজ (SPECIAL) */}
        <SectionHeader icon={<Star className="text-amber-500" fill="currentColor"/>} title="স্পেশাল কুইজ" />
        <div className="grid grid-cols-1 gap-3">
          {specialQuizzes.map(q => (
            <QuizCard key={q.id} title={q.title} subtitle={`পুরস্কার: ৳${q.prizePool}`} icon={<Zap size={20}/>} color="bg-amber-50 text-amber-600" onClick={() => onSubjectSelect(q.title, false, true, q.entryFee, q.id, 'admin_special_quizzes')} />
          ))}
        </div>

        {/* ২. লাইভ কুইজ (LIVE) */}
        <SectionHeader icon={<div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"/>} title="লাইভ কুইজ" />
        <div className="grid grid-cols-1 gap-3">
          {liveQuizzes.map(q => (
            <QuizCard key={q.id} title={q.title} subtitle="সরাসরি অংশগ্রহণ করুন" icon={<div className="w-2 h-2 bg-rose-600 rounded-full"/>} color="bg-rose-50 text-rose-600" onClick={() => onSubjectSelect(q.title, true, false, 0, q.id, 'live_quizzes')} />
          ))}
        </div>

        {/* ৩. পেইড কুইজ (PAID) */}
        <SectionHeader icon={<Crown className="text-emerald-500"/>} title="পেইড কুইজ" />
        <div className="grid grid-cols-1 gap-3">
          {paidQuizzes.map(q => (
            <QuizCard key={q.id} title={q.title} subtitle={`এন্ট্রি ফি: ৳${q.entryFee}`} icon={<Crown size={20}/>} color="bg-emerald-50 text-emerald-600" onClick={() => onSubjectSelect(q.title, false, true, q.entryFee, q.id, 'paid_quizzes')} />
          ))}
        </div>

        {/* ৪. মক টেস্ট (MOCK) */}
        <SectionHeader icon={<Layout className="text-blue-500"/>} title="মক টেস্ট" />
        <div className="grid grid-cols-2 gap-3">
          {mockQuizzes.map(q => (
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'mock_quizzes')} className="bg-white p-5 rounded-3xl border border-slate-100 text-left font-black text-slate-700 text-sm shadow-sm">{q.title}</button>
          ))}
        </div>

        {/* ৫. রিটেন কুইজ (WRITTEN) */}
        <SectionHeader icon={<FileSignature className="text-orange-500"/>} title="রিটেন কুইজ" />
        <div className="grid grid-cols-1 gap-3">
          {writtenQuizzes.map(q => (
            <QuizCard key={q.id} title={q.title} subtitle="লিখিত উত্তর প্রদান করুন" icon={<FileSignature size={20}/>} color="bg-orange-50 text-orange-600" onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'written_quizzes')} />
          ))}
        </div>

        {/* ৬. সাপ্তাহিক কুইজ (WEEKLY) */}
        <SectionHeader icon={<Calendar className="text-indigo-500"/>} title="উইকলি কুইজ" />
        <div className="grid grid-cols-1 gap-3">
          {weeklyQuizzes.map(q => (
            <div key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'weekly_quizzes')} className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-[32px] text-white flex justify-between items-center shadow-lg">
              <span className="font-black">{q.title}</span>
              <ChevronRight size={20}/>
            </div>
          ))}
        </div>

        {/* ৭. ভিডিও লেসন (LESSON) */}
        <SectionHeader icon={<Youtube className="text-rose-600"/>} title="ভিডিও লেসন" />
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {lessons.map(l => (
            <div key={l.id} onClick={() => onLessonSelect(l)} className="min-w-[200px] bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="aspect-video bg-slate-100 flex items-center justify-center"><Play fill="currentColor"/></div>
              <p className="p-3 font-black text-xs text-slate-700 truncate">{l.title}</p>
            </div>
          ))}
        </div>

        {/* ৮. ফান কুইজ (FUN) */}
        <SectionHeader icon={<Smile className="text-pink-500"/>} title="ফান কুইজ" />
        <div className="grid grid-cols-2 gap-3">
          {funQuizzes.map(q => (
            <QuizCard key={q.id} title={q.title} subtitle="মজায় মজায় শিখুন" icon={<Smile size={20}/>} color="bg-pink-50 text-pink-600" onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'fun_quizzes')} />
          ))}
        </div>

        <AdRenderer placementId="home_bottom" />
        <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest pb-10">BD Smart Quiz Pro v2.5</p>
      </div>
    </div>
  );
};

// Helper Components
const SectionHeader = ({ icon, title }: any) => (
  <div className="flex items-center gap-2 px-2">
    {icon}
    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">{title}</h3>
  </div>
);

const QuizCard = ({ title, subtitle, icon, color, onClick }: any) => (
  <button onClick={onClick} className="w-full bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>{icon}</div>
      <div className="text-left">
        <h4 className="font-black text-slate-800 text-sm leading-tight">{title}</h4>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300" />
  </button>
);

export default HomeTab;
