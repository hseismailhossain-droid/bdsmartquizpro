import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Edit3, Wallet, CreditCard, Megaphone, Star, 
  ChevronRight, Zap, X, Send, Loader2, ShieldLock, 
  MessageSquareWarning, User as UserIcon, Music, Play, Pause, Headphones, BookOpen
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';

// --- Interfaces ---
interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnail?: string;
}

interface UserProfile {
  name: string;
  email: string;
  balance: number;
  category?: string;
}

interface Notification {
  id: string;
  isRead: boolean;
  title: string;
}

interface HomeTabProps {
  user: UserProfile;
  notifications: Notification[];
  lessons: Lesson[]; // লেসন প্রপস যুক্ত করা হয়েছে
  onShowNotifications: () => void;
  onLessonSelect: (lesson: Lesson) => void; // লেসন সিলেক্ট ফাংশন
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
}

const DEFAULT_RECITATIONS = [
  { id: 'def-1', title: 'সূরা আর-রহমান', artist: 'মিশারি রাশিদ', url: 'https://server8.mp3quran.net/afs/055.mp3' },
  { id: 'def-2', title: 'সূরা আল-মূলক', artist: 'মিশারি রাশিদ', url: 'https://server8.mp3quran.net/afs/067.mp3' }
];

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, lessons, onShowNotifications, onLessonSelect, onSubjectSelect 
}) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [dbRecitations, setDbRecitations] = useState<any[]>([]);
  
  // Audio State
  const [currentAudio, setCurrentAudio] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Settings Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'report' | 'privacy'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [reportData, setReportData] = useState({ type: 'Problem', message: '' });
  const [depositData, setDepositData] = useState({ amount: '', method: 'bkash', trxId: '' });

  useEffect(() => {
    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(3)), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(5)), (snap) => {
      setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAudios = onSnapshot(query(collection(db, 'admin_mind_relax_audio'), orderBy('timestamp', 'desc')), (snap) => {
      setDbRecitations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubNotices(); unsubSpecial(); unsubAudios(); };
  }, []);

  // --- Audio Logic ---
  const allRecitations = dbRecitations.length > 0 ? [...dbRecitations, ...DEFAULT_RECITATIONS] : DEFAULT_RECITATIONS;

  const playRecitation = async (recitation: any) => {
    if (!audioRef.current) return;
    if (currentAudio?.id === recitation.id) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
      else { audioRef.current.play(); setIsPlaying(true); }
    } else {
      audioRef.current.pause();
      setCurrentAudio(recitation);
      audioRef.current.src = recitation.url;
      audioRef.current.play().catch(e => console.log("Playback error"));
      setIsPlaying(true);
    }
  };

  // --- Submission Logic ---
  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositData.amount || !depositData.trxId) return alert("সব তথ্য দিন");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'deposit_requests'), {
        uid: auth.currentUser?.uid,
        userName: user.name,
        amount: Number(depositData.amount),
        method: depositData.method,
        trxId: depositData.trxId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert("রিকোয়েস্ট পাঠানো হয়েছে!");
      setShowSettingsModal(false);
    } catch (e) { alert("ব্যর্থ হয়েছে"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-5 font-['Hind_Siliguri'] pb-32 animate-in fade-in duration-500">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} preload="auto" />

      {/* Settings Modal (প্রোফাইল, ওয়ালেট, রিপোর্ট, প্রাইভেসি) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter"><Edit3 size={18}/> সেটিংস</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={20}/></button>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-2 gap-1 bg-slate-100/50 mx-6 mt-4 rounded-2xl">
              {['profile', 'wallet', 'report', 'privacy'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 rounded-xl transition-all text-[10px] font-black uppercase ${activeTab === t ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>
                  {t === 'profile' ? 'প্রোফাইল' : t === 'wallet' ? 'ওয়ালেট' : t === 'report' ? 'রিপোর্ট' : 'প্রাইভেসি'}
                </button>
              ))}
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {activeTab === 'profile' && (
                <div className="space-y-4 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-emerald-700"><UserIcon size={40}/></div>
                  <h4 className="font-black text-xl">{user.name}</h4>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
              )}

              {activeTab === 'wallet' && (
                <form onSubmit={submitDeposit} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button type="button" onClick={() => setDepositData({...depositData, method: 'bkash'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${depositData.method === 'bkash' ? 'bg-white text-pink-600' : 'text-slate-400'}`}>বিকাশ</button>
                    <button type="button" onClick={() => setDepositData({...depositData, method: 'nagad'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${depositData.method === 'nagad' ? 'bg-white text-orange-600' : 'text-slate-400'}`}>নগদ</button>
                  </div>
                  <input required type="number" placeholder="টাকার পরিমাণ" value={depositData.amount} onChange={(e) => setDepositData({...depositData, amount: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none border border-slate-100" />
                  <input required type="text" placeholder="TrxID" value={depositData.trxId} onChange={(e) => setDepositData({...depositData, trxId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100" />
                  <button disabled={isSubmitting} className="w-full py-4 bg-emerald-700 text-white rounded-xl font-black">{isSubmitting ? 'পাঠানো হচ্ছে...' : 'সাবমিট'}</button>
                </form>
              )}
              {/* Report ও Privacy ট্যাবগুলো আগের মতোই থাকবে */}
            </div>
          </div>
        </div>
      )}

      {/* --- Main UI Content --- */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">SQ</div>
          <h2 className="text-xl font-black text-slate-800 leading-tight truncate">হ্যালো, {user?.name?.split(' ')[0]}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowNotifications} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400"><Bell size={20}/></button>
          <button onClick={() => setShowSettingsModal(true)} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-emerald-700"><Edit3 size={20}/></button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Balance Card */}
        <div className="bg-emerald-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">বর্তমান ব্যালেন্স</p>
          <h3 className="text-4xl font-black tracking-tight">৳{user.balance}</h3>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => {setActiveTab('wallet'); setShowSettingsModal(true);}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3">
            <Wallet className="text-blue-600" size={18}/>
            <span className="font-black text-xs">রিচার্জ</span>
          </button>
          <button onClick={() => {setActiveTab('report'); setShowSettingsModal(true);}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3">
            <MessageSquareWarning className="text-rose-600" size={18}/>
            <span className="font-black text-xs">রিপোর্ট</span>
          </button>
        </div>

        {/* --- Audio Player (Mind Relax) --- */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-2"><Headphones size={16} className="text-indigo-600" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">শান্ত থাকতে কুরআন শুনুন</h3></div>
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 rounded-[40px] shadow-xl text-white relative overflow-hidden active:scale-95 transition-all cursor-pointer" onClick={() => playRecitation(allRecitations[0])}>
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className="p-3.5 bg-white/20 rounded-[22px] backdrop-blur-md border border-white/20">{isPlaying ? <Music size={26} className="animate-bounce" /> : <Music size={26}/>}</div>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-2 rounded-full border border-white/20">{isPlaying ? 'শুনছেন...' : 'প্লে করুন'}</span>
              </div>
              <h3 className="text-xl font-black leading-tight relative z-10">সূরা আর-রহমান (তিলাওয়াত)</h3>
           </div>
        </div>

        {/* --- Lessons Section --- */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2"><BookOpen size={16} className="text-emerald-600" /><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">আপনার লেসনসমূহ</h3></div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} onClick={() => onLessonSelect(lesson)} className="min-w-[200px] bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer">
                <div className="w-full h-24 bg-slate-50 rounded-2xl mb-3 flex items-center justify-center text-slate-300"><Play size={30} fill="currentColor"/></div>
                <h4 className="font-black text-slate-800 text-xs line-clamp-1">{lesson.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1">শুরু করতে ক্লিক করুন</p>
              </div>
            ))}
          </div>
        </div>

        {/* Special Quizzes & Notices... (আগের কোড মতোই থাকবে) */}
      </div>
    </div>
  );
};

export default HomeTab;
