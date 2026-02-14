import React, { useState, useEffect } from 'react';
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

// Types সরাসরি এখানে ডিফাইন করে দিচ্ছি যাতে ইমপোর্ট এরর না হয়
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
  onShowNotifications: () => void;
  onEditProfile?: (tab?: 'profile' | 'wallet' | 'report' | 'privacy') => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, onShowNotifications, onSubjectSelect 
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
      alert("রিপোর্ট পাঠানো হয়েছে!");
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
      
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter"><Edit3 size={18}/> সেটিংস</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={20}/></button>
            </div>

            <div className="flex p-2 gap-1 bg-slate-100/50 mx-6 mt-4 rounded-2xl">
              <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl transition-all text-[10px] font-black uppercase ${activeTab === 'profile' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>প্রোফাইল</button>
              <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-3 rounded-xl transition-all text-[10px] font-black uppercase ${activeTab === 'wallet' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>ওয়ালেট</button>
              <button onClick={() => setActiveTab('report')} className={`flex-1 py-3 rounded-xl transition-all text-[10px] font-black uppercase ${activeTab === 'report' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>রিপোর্ট</button>
              <button onClick={() => setActiveTab('privacy')} className={`flex-1 py-3 rounded-xl transition-all text-[10px] font-black uppercase ${activeTab === 'privacy' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>প্রাইভেসি</button>
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
                  <input required type="text" placeholder="Transaction ID" value={depositData.trxId} onChange={(e) => setDepositData({...depositData, trxId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100" />
                  <button disabled={isSubmitting} className="w-full py-4 bg-emerald-700 text-white rounded-xl font-black">{isSubmitting ? 'প্রসেসিং...' : 'সাবমিট করুন'}</button>
                </form>
              )}

              {activeTab === 'report' && (
                <form onSubmit={submitReport} className="space-y-4">
                  <select value={reportData.type} onChange={(e) => setReportData({...reportData, type: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black outline-none border border-slate-100">
                    <option value="Problem">সমস্যা</option>
                    <option value="Suggestion">পরামর্শ</option>
                  </select>
                  <textarea required rows={4} placeholder="বিস্তারিত লিখুন..." value={reportData.message} onChange={(e) => setReportData({...reportData, message: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100"></textarea>
                  <button disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black">{isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান'}</button>
                </form>
              )}

              {activeTab === 'privacy' && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-xs text-blue-700 font-bold leading-relaxed">আপনার ডাটা আমাদের কাছে নিরাপদ।</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-black">SQ</div>
          <h2 className="text-xl font-black text-slate-800">হ্যালো, {user?.name?.split(' ')[0]}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowNotifications} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400"><Bell size={20}/></button>
          <button onClick={() => setShowSettingsModal(true)} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-emerald-700"><Edit3 size={20}/></button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-emerald-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <p className="text-emerald-300 text-[10px] font-black uppercase mb-1">ব্যালেন্স</p>
          <h3 className="text-4xl font-black">৳{user.balance}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => {setShowSettingsModal(true); setActiveTab('wallet');}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3">
            <Wallet className="text-blue-600" size={18}/>
            <span className="font-black text-xs">রিচার্জ</span>
          </button>
          <button onClick={() => {setShowSettingsModal(true); setActiveTab('report');}} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-3">
            <MessageSquareWarning className="text-rose-600" size={18}/>
            <span className="font-black text-xs">রিপোর্ট</span>
          </button>
        </div>

        {specialQuizzes.map((quiz) => (
          <div key={quiz.id} onClick={() => onSubjectSelect(quiz.title, false, true, quiz.entryFee, quiz.id, 'admin_special_quizzes')} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <Zap className="text-amber-500" size={24} fill="currentColor" />
              <div>
                <h4 className="font-black text-slate-800 text-sm">{quiz.title}</h4>
                <p className="text-[9px] font-black text-emerald-600 uppercase">পুরস্কার: ৳{quiz.prizePool}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        ))}
        
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
