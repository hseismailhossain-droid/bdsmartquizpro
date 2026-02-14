import React, { useState, useEffect } from 'react';
import { UserProfile, Notification } from '../types';
import { 
  Bell, Edit3, Wallet, CreditCard, Megaphone, Star, 
  ChevronRight, Zap, X, Send, Loader2, ShieldLock, 
  MessageSquareWarning, User as UserIcon 
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';

interface HomeTabProps {
  user: UserProfile;
  notifications: Notification[];
  onShowNotifications: () => void;
  onEditProfile: (tab?: 'profile' | 'wallet' | 'report' | 'privacy') => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, onShowNotifications, onEditProfile, onSubjectSelect 
}) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  
  // Modal & Tabs State
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
    return () => { unsubNotices(); unsubSpecial(); };
  }, []);

  // --- রিপোর্ট পাঠানোর ফাংশন (Admin App-এর জন্য) ---
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.message) return alert("মেসেজ লিখুন");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'user_reports'), {
        uid: auth.currentUser?.uid,
        userName: user.name,
        type: reportData.type,
        message: reportData.message,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert("রিপোর্ট অ্যাডমিনের কাছে পাঠানো হয়েছে!");
      setReportData({ type: 'Problem', message: '' });
    } catch (error) { alert("ব্যর্থ হয়েছে!"); }
    finally { setIsSubmitting(false); }
  };

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
      alert("ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে!");
      setDepositData({ amount: '', method: 'bkash', trxId: '' });
    } catch (error) { alert("ব্যর্থ হয়েছে!"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-5 font-['Hind_Siliguri'] pb-32">
      
      {/* --- Settings Modal with 4 Tabs --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter"><Edit3 size={18}/> সেটিংস ও প্রোফাইল</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={20}/></button>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-2 gap-1 bg-slate-100/50 mx-6 mt-4 rounded-2xl">
              {[
                { id: 'profile', label: 'প্রোফাইল', icon: UserIcon },
                { id: 'wallet', label: 'ওয়ালেট', icon: Wallet },
                { id: 'report', label: 'রিপোর্ট', icon: MessageSquareWarning },
                { id: 'privacy', label: 'প্রাইভেসি', icon: ShieldLock },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>
                  <tab.icon size={18} />
                  <span className="text-[10px] font-black mt-1 uppercase">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {/* 1. Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-emerald-700"><UserIcon size={40}/></div>
                  <div><h4 className="font-black text-xl">{user.name}</h4><p className="text-slate-400 text-sm">{user.email}</p></div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">ব্যালেন্স</p><p className="font-black text-emerald-700">৳{user.balance}</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center"><p className="text-[10px] font-black text-slate-400 uppercase">ক্যাটাগরি</p><p className="font-black text-slate-700">{user.category}</p></div>
                  </div>
                </div>
              )}

              {/* 2. Wallet Tab */}
              {activeTab === 'wallet' && (
                <form onSubmit={submitDeposit} className="space-y-4">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button type="button" onClick={() => setDepositData({...depositData, method: 'bkash'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${depositData.method === 'bkash' ? 'bg-white text-pink-600' : 'text-slate-400'}`}>বিকাশ</button>
                    <button type="button" onClick={() => setDepositData({...depositData, method: 'nagad'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${depositData.method === 'nagad' ? 'bg-white text-orange-600' : 'text-slate-400'}`}>নগদ</button>
                  </div>
                  <input required type="number" placeholder="টাকার পরিমাণ" value={depositData.amount} onChange={(e) => setDepositData({...depositData, amount: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none border border-slate-100" />
                  <input required type="text" placeholder="Transaction ID (TrxID)" value={depositData.trxId} onChange={(e) => setDepositData({...depositData, trxId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100" />
                  <button disabled={isSubmitting} className="w-full py-4 bg-emerald-700 text-white rounded-xl font-black shadow-lg">রিচার্জ রিকোয়েস্ট</button>
                </form>
              )}

              {/* 3. Report Tab */}
              {activeTab === 'report' && (
                <form onSubmit={submitReport} className="space-y-4">
                  <select value={reportData.type} onChange={(e) => setReportData({...reportData, type: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none border border-slate-100">
                    <option value="Problem">সমস্যা (Problem)</option>
                    <option value="Suggestion">পরামর্শ (Suggestion)</option>
                    <option value="Withdraw">পেমেন্ট সমস্যা</option>
                  </select>
                  <textarea required rows={4} placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন..." value={reportData.message} onChange={(e) => setReportData({...reportData, message: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100"></textarea>
                  <button disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin"/> : <><Send size={16}/> রিপোর্ট পাঠান</>}
                  </button>
                </form>
              )}

              {/* 4. Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl"><p className="text-xs text-blue-700 font-bold leading-relaxed">আপনার তথ্য আমাদের কাছে সুরক্ষিত। আমরা তৃতীয় কোনো পক্ষের কাছে আপনার ডাটা শেয়ার করি না।</p></div>
                  <button onClick={() => alert("শীঘ্রই আসছে...")} className="w-full p-4 bg-slate-50 text-slate-700 font-black rounded-xl text-left flex justify-between">পাসওয়ার্ড পরিবর্তন <ChevronRight size={18}/></button>
                  <button className="w-full p-4 bg-rose-50 text-rose-600 font-black rounded-xl text-left">অ্যাকাউন্ট ডিলিট করুন</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Main UI Content --- */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-black">SQ</div>
          <h2 className="text-xl font-black text-slate-800">হ্যালো, {user.name.split(' ')[0]}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowNotifications} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400"><Bell size={20}/></button>
          <button onClick={() => setShowSettingsModal(true)} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-emerald-700"><Edit3 size={20}/></button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Balance Card */}
        <div className="bg-emerald-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div><p className="text-emerald-300 text-[10px] font-black uppercase mb-1">ব্যালেন্স</p><h3 className="text-4xl font-black">৳{user.balance}</h3></div>
            <button onClick={() => {setShowSettingsModal(true); setActiveTab('wallet');}} className="bg-white/20 p-4 rounded-2xl backdrop-blur-md"><Wallet size={20}/></button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => {setShowSettingsModal(true); setActiveTab('wallet');}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Wallet size={18}/></div>
            <span className="font-black text-xs">রিচার্জ</span>
          </button>
          <button onClick={() => {setShowSettingsModal(true); setActiveTab('report');}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><MessageSquareWarning size={18}/></div>
            <span className="font-black text-xs">রিপোর্ট</span>
          </button>
        </div>

        {/* Special Quizzes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2"><Star size={16} className="text-amber-500" fill="currentColor"/><h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">স্পেশাল কুইজ</h3></div>
          {specialQuizzes.map((quiz) => (
            <div key={quiz.id} onClick={() => onSubjectSelect(quiz.title, false, true, quiz.entryFee, quiz.id, 'admin_special_quizzes')} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><Zap size={24} fill="currentColor" /></div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{quiz.title}</h4>
                  <p className="text-[9px] font-black text-emerald-600 uppercase">পুরস্কার: ৳{quiz.prizePool}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </div>

        {/* Notice Board */}
        {notices.map(notice => (
          <div key={notice.id} className="bg-white p-6 rounded-[36px] border border-slate-100">
             <div className="flex items-center gap-2 mb-2 text-rose-500"><Megaphone size={16}/><h4 className="font-black text-slate-900 leading-tight">{notice.title}</h4></div>
             <p className="text-xs text-slate-500 font-medium">{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeTab;
