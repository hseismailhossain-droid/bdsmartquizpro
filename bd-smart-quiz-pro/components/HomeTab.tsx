
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, QuizResult, Question, Notification, Lesson } from '../types';
import { Bell, Edit3, Wallet, CreditCard, Megaphone, BarChart3, Star, ChevronRight, Zap, CheckCircle2, Music, Pause, Play, X, Headphones } from 'lucide-react';
import AdRenderer from './AdRenderer';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

interface HomeTabProps {
  user: UserProfile;
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
  notifications: Notification[];
  lessons: Lesson[];
  onShowNotifications: () => void;
  onLogout: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onEditProfile: (tab?: 'profile' | 'report' | 'privacy' | 'wallet') => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const DEFAULT_RECITATIONS = [
  { id: 'def-1', title: 'সূরা আর-রহমান', artist: 'মিশারি রাশিদ আল-আফাসি', url: 'https://server8.mp3quran.net/afs/055.mp3' },
  { id: 'def-2', title: 'সূরা আল-মূলক', artist: 'মিশারি রাশিদ আল-আফাসি', url: 'https://server8.mp3quran.net/afs/067.mp3' },
  { id: 'def-3', title: 'সূরা ইয়াসিন', artist: 'মিশারি রাশিদ আল-আফাসি', url: 'https://server8.mp3quran.net/afs/036.mp3' },
  { id: 'def-4', title: 'সূরা আল-কাহফ', artist: 'মিশারি রাশিদ আল-আফাসি', url: 'https://server8.mp3quran.net/afs/018.mp3' },
  { id: 'def-5', title: 'সূরা আল-ওয়াকিয়াহ', artist: 'মিশারি রাশিদ আল-আফাসি', url: 'https://server8.mp3quran.net/afs/056.mp3' }
];

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, history, notifications, lessons, onShowNotifications, onLogout, 
  onSubjectSelect, onLessonSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [dbRecitations, setDbRecitations] = useState<any[]>([]);
  
  const [currentAudio, setCurrentAudio] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(3)), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubPolls = onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc'), limit(1)), (snap) => {
      setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(5)), (snap) => {
      setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAudios = onSnapshot(query(collection(db, 'admin_mind_relax_audio'), orderBy('timestamp', 'desc')), (snap) => {
      setDbRecitations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubNotices(); unsubPolls(); unsubSpecial(); unsubAudios(); };
  }, []);

  const allRecitations = dbRecitations.length > 0 ? [...dbRecitations, ...DEFAULT_RECITATIONS] : DEFAULT_RECITATIONS;

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const poll = polls.find(p => p.id === pollId);
    if (poll.votedBy?.includes(uid)) return alert("আপনি ইতিমধ্যে ভোট দিয়েছেন।");
    const updatedOptions = [...poll.options];
    updatedOptions[optionIndex].votes += 1;
    await updateDoc(doc(db, 'admin_polls', pollId), {
      options: updatedOptions,
      votedBy: arrayUnion(uid)
    });
  };

  const playRecitation = async (recitation: any) => {
    if (!audioRef.current) return;
    const safePlay = async () => {
        try {
            await audioRef.current?.play();
            setIsPlaying(true);
        } catch (error: any) {
            if (error.name !== 'AbortError') console.error("Audio playback error:", error);
        }
    };
    if (currentAudio?.id === recitation.id) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
      else { await safePlay(); }
    } else {
      audioRef.current.pause();
      setCurrentAudio(recitation);
      audioRef.current.src = recitation.url;
      audioRef.current.load();
      await safePlay();
    }
  };

  const playRandom = () => {
    const randomIndex = Math.floor(Math.random() * allRecitations.length);
    playRecitation(allRecitations[randomIndex]);
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'ইউজার';

  return (
    <div className="p-5 animate-in fade-in duration-500 font-['Hind_Siliguri'] pb-32 no-scrollbar relative">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} preload="auto" />

      {currentAudio && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/95 backdrop-blur-2xl p-4 rounded-[32px] border border-white/10 shadow-2xl z-[1000] flex items-center justify-between animate-in slide-in-from-bottom-10 duration-500">
           <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}><Music size={22} /></div>
              <div className="min-w-0"><h4 className="text-white text-[13px] font-black truncate leading-tight">{currentAudio.title}</h4><p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest truncate">{currentAudio.artist}</p></div>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => playRecitation(currentAudio)} className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-all shadow-md">{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}</button>
              <button onClick={() => { audioRef.current?.pause(); setCurrentAudio(null); setIsPlaying(false); }} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all"><X size={18} /></button>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-lg">SQ</div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-800 leading-tight truncate">স্বাগতম, {displayName}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.category || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onShowNotifications} className="relative p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 active:scale-90 transition-all">
            <Bell size={20} />
            {notifications.filter(n => !n.isRead).length > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
          </button>
          <button onClick={() => onEditProfile('profile')} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 active:scale-90 transition-all">
            <Edit3 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <AdRenderer placementId="home_top" />

        <div className="bg-emerald-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div><p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">বর্তমান ব্যালেন্স</p><h3 className="text-4xl font-black tracking-tight">৳{user?.balance || 0}</h3></div>
            <button onClick={() => onEditProfile('wallet')} className="bg-white/20 p-4 rounded-[24px] backdrop-blur-md active:scale-95 transition-all"><Wallet size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onEditProfile('wallet')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Wallet size={18}/></div>
             <span className="font-black text-xs text-slate-700">রিচার্জ</span>
          </button>
          <button onClick={() => onEditProfile('wallet')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
             <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0"><CreditCard size={18}/></div>
             <span className="font-black text-xs text-slate-700">উত্তোলন</span>
          </button>
        </div>

        <AdRenderer placementId="home_after_actions" className="mb-2" />

        <div className="space-y-4">
           <div className="flex items-center gap-2 px-2"><Headphones size={16} className="text-indigo-600" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">মাইন্ড রিলেক্স (কুরআন তিলাওয়াত)</h3></div>
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 rounded-[40px] shadow-xl text-white relative overflow-hidden group active:scale-95 transition-all cursor-pointer" onClick={playRandom}>
              <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className="p-3.5 bg-white/20 rounded-[22px] backdrop-blur-md border border-white/20 shadow-inner">{isPlaying ? <Music size={26} className="animate-bounce" /> : <Music size={26}/>}</div>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-white'}`}></div>{isPlaying ? 'শুনছেন...' : 'শান্ত থাকুন'}</span>
              </div>
              <h3 className="text-xl font-black leading-tight relative z-10">মনকে শান্ত রাখতে কুরআন শুনুন</h3>
              <p className="text-[10px] opacity-80 font-bold mt-1.5 uppercase tracking-widest relative z-10">ক্লিক করলেই চমৎকার তিলাওয়াত শুরু হবে</p>
           </div>
        </div>

        {notices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2"><Megaphone size={16} className="text-rose-500" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">নোটিশ বোর্ড</h3></div>
            {notices.map(notice => (
              <div key={notice.id} className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm relative overflow-hidden">
                 <h4 className="font-black text-slate-900 mb-2 leading-tight">{notice.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium mb-3">{notice.content}</p>
                 {notice.image && <div className="rounded-2xl overflow-hidden border border-slate-50 shadow-inner"><img src={notice.image} className="w-full h-auto max-h-64 object-contain" alt=""/></div>}
              </div>
            ))}
          </div>
        )}

        <AdRenderer placementId="home_middle" />

        {polls.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2"><BarChart3 size={16} className="text-indigo-600" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">জনমত জরিপ</h3></div>
            {polls.map(poll => {
              const hasVoted = poll.votedBy?.includes(auth.currentUser?.uid);
              const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
              return (
                <div key={poll.id} className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm space-y-5">
                   <h4 className="font-black text-slate-900 text-sm leading-relaxed">{poll.question}</h4>
                   <div className="space-y-3">
                      {poll.options.map((opt: any, idx: number) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                        return (
                          <button key={idx} disabled={hasVoted} onClick={() => handleVote(poll.id, idx)} className={`w-full relative h-12 rounded-2xl overflow-hidden border transition-all ${hasVoted ? 'border-indigo-100 bg-slate-50' : 'border-slate-100 hover:border-indigo-300'}`}>
                             {hasVoted && <div className="absolute inset-0 bg-indigo-50 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>}
                             <div className="absolute inset-0 px-5 flex justify-between items-center z-10"><span className={`text-[11px] font-black ${hasVoted ? 'text-indigo-900' : 'text-slate-600'}`}>{opt.text}</span>{hasVoted && <span className="text-[10px] font-black text-indigo-500">{percentage}%</span>}</div>
                          </button>
                        );
                      })}
                   </div>
                   {hasVoted && <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">ভোট দেওয়ার জন্য ধন্যবাদ!</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2"><Star size={16} className="text-amber-500" fill="currentColor" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">স্পেশাল কুইজ</h3></div>
          <div className="space-y-4">
            {specialQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all" onClick={() => onSubjectSelect(quiz.title, false, true, quiz.entryFee, quiz.id, 'admin_special_quizzes')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner"><Zap size={24} fill="currentColor" /></div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm leading-tight">{quiz.title}</h4>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">পুরস্কার: ৳{quiz.prizePool}</span><span className="text-[9px] font-black text-slate-400 uppercase">এন্ট্রি: ৳{quiz.entryFee}</span></div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            ))}
            {specialQuizzes.length === 0 && <div className="py-10 text-center bg-white rounded-[32px] border border-dashed border-slate-100"><p className="text-slate-300 font-black uppercase text-[9px] tracking-widest">কোনো স্পেশাল কুইজ নেই</p></div>}
          </div>
        </div>

        <AdRenderer placementId="home_bottom" />
        <div className="pt-8 text-center pb-6"><p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">BD Smart Quiz Pro v2.5</p></div>
      </div>
    </div>
  );
};

export default HomeTab;