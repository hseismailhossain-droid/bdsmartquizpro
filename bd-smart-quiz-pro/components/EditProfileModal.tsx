import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Check, Loader2, User, ShieldAlert, Send, FileText, MessageSquare, Info, ShieldCheck, Wallet, ArrowUpCircle, ArrowDownCircle, Smartphone, Copy, RotateCcw, LogOut, AlertTriangle } from 'lucide-react';
import { Category, UserProfile } from '../types';
import { db, auth, refreshFirestore } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  onLogout?: () => void | Promise<void>;
  initialTab?: 'profile' | 'report' | 'privacy' | 'wallet';
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate, onLogout, initialTab = 'profile' }) => {
  const [tab, setTab] = useState<'profile' | 'report' | 'privacy' | 'wallet'>(initialTab);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fix: Added missing fileInputRef definition
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallet/Report States
  const [reportMsg, setReportMsg] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [walletMode, setWalletMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentNumbers, setPaymentNumbers] = useState<any>(null);

  useEffect(() => {
    const fetchAdminNumbers = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payment_numbers'));
        if (snap.exists()) setPaymentNumbers(snap.data());
      } catch (e) { console.error("Error fetching payment numbers:", e); }
    };
    fetchAdminNumbers();
  }, []);

  const safeCopy = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert("নাম্বারটি কপি হয়েছে!");
      } else {
        throw new Error();
      }
    } catch (e) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert("নাম্বারটি কপি হয়েছে!");
      } catch (err) {
        alert("কপি করা সম্ভব হয়নি। নাম্বারটি হলো: " + text);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate({ name: name.trim(), avatarUrl: selectedAvatar });
      onClose();
    } catch (e: any) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally { setIsSaving(false); }
  };

  const handleFinalLogout = async () => {
    if (!onLogout || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
      onClose();
    } catch (e) {
      alert("লগআউট করা সম্ভব হয়নি।");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportMsg.trim()) return alert("আপনার অভিযোগটি লিখুন।");
    setIsSendingRequest(true);
    try {
      await addDoc(collection(db, 'user_reports'), {
        uid: auth.currentUser?.uid,
        userName: user.name,
        category: user.category || 'General',
        message: reportMsg.trim(),
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert("রিপোর্ট পাঠানো হয়েছে!");
      onClose();
    } catch (e: any) {
      alert("রিপোর্ট পাঠানো ব্যর্থ হয়েছে।");
    } finally { setIsSendingRequest(false); }
  };

  const handleWalletSubmit = async () => {
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) return alert("সঠিক পরিমাণ দিন।");
    if (walletMode === 'deposit' && !trxId.trim()) return alert("TrxID দিন।");
    if (walletMode === 'withdraw') {
      if (!accountNumber.trim()) return alert("অ্যাকাউন্ট নাম্বার দিন।");
      if (numAmount > user.balance) return alert("ব্যালেন্স অপর্যাপ্ত।");
      if (numAmount < 20) return alert("সর্বনিম্ন ২০ টাকা উইথড্র করা যাবে।");
    }

    setIsSendingRequest(true);
    try {
      const data: any = {
        uid: auth.currentUser?.uid,
        userName: user.name,
        amount: numAmount,
        method,
        status: 'pending',
        timestamp: serverTimestamp()
      };

      if (walletMode === 'deposit') {
        data.trxId = trxId.trim();
        await addDoc(collection(db, 'deposit_requests'), data);
        alert("রিচার্জ রিকোয়েস্ট পাঠানো হয়েছে।");
      } else {
        data.accountNumber = accountNumber.trim();
        await addDoc(collection(db, 'withdraw_requests'), data);
        alert("উইথড্র রিকোয়েস্ট পাঠানো হয়েছে।");
      }
      onClose();
    } catch (e) {
      alert("রিকোয়েস্ট ব্যর্থ হয়েছে।");
    } finally { setIsSendingRequest(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-md rounded-t-[44px] p-8 animate-in slide-in-from-bottom-24 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar relative safe-pb">
        
        {showLogoutConfirm ? (
          <div className="py-10 text-center animate-in zoom-in-95">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">লগআউট কনফার্ম করুন</h3>
             <p className="text-slate-400 font-bold mb-10 px-6">আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?</p>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleFinalLogout}
                  disabled={isLoggingOut}
                  className="w-full bg-rose-600 text-white py-5 rounded-[28px] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? <Loader2 className="animate-spin" size={18}/> : <LogOut size={18}/>}
                  {isLoggingOut ? 'লগআউট হচ্ছে...' : 'হ্যাঁ, লগআউট করুন'}
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="w-full bg-slate-100 text-slate-500 py-5 rounded-[28px] font-black text-sm active:scale-95"
                >
                  বাতিল করুন
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 pt-4">
              <h3 className="text-xl font-black text-slate-900 uppercase">
                {tab === 'profile' ? 'সেটিং' : tab === 'wallet' ? 'ওয়ালেট' : tab === 'report' ? 'অভিযোগ' : 'নীতিমালা'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { if(confirm("অ্যাপ লোড হতে সমস্যা হলে এটি ট্রাই করুন। পেজ রিফ্রেশ হবে।")) refreshFirestore(); }} className="p-2 bg-amber-50 rounded-full text-amber-600 active:scale-90"><RotateCcw size={20}/></button>
                <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90"><X size={24} /></button>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
               {['profile', 'wallet', 'report', 'privacy'].map((t) => (
                 <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>
                   {t === 'profile' ? 'প্রোফাইল' : t === 'wallet' ? 'ওয়ালেট' : t === 'report' ? 'রিপোর্ট' : 'প্রাইভেসি'}
                 </button>
               ))}
            </div>

            {tab === 'profile' && (
              <div className="space-y-8 animate-in fade-in pb-10">
                <div className="flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-[44px] border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl">
                      <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-3 rounded-2xl border-4 border-white shadow-lg active:scale-90 transition-all"><Camera size={18}/></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setSelectedAvatar(ev.target?.result as string); r.readAsDataURL(f); } }} />
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 w-full justify-center">
                    {PRESET_AVATARS.map((av, idx) => (
                      <button key={idx} onClick={() => setSelectedAvatar(av)} className={`shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${selectedAvatar === av ? 'border-emerald-500 scale-110 shadow-lg ring-4 ring-emerald-50' : 'border-transparent opacity-50'}`}><img src={av} className="w-full h-full object-cover" alt="" /></button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">আপনার নাম</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 p-5 rounded-[24px] font-black outline-none border border-slate-100 focus:bg-white focus:border-emerald-100 shadow-inner" />
                </div>
                
                <div className="pt-4 space-y-4">
                  <button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : 'সব আপডেট করুন'}
                  </button>
                  
                  {onLogout && (
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full bg-rose-50 text-rose-600 py-5 rounded-[24px] font-black text-sm uppercase flex items-center justify-center gap-2 border border-rose-100 active:scale-95 transition-all"
                    >
                      <LogOut size={18} /> লগআউট করুন
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === 'wallet' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
                 <div className="bg-emerald-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden mb-4">
                    <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">বর্তমান ব্যালেন্স</p>
                    <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button onClick={() => setWalletMode('deposit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${walletMode === 'deposit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>রিচার্জ</button>
                    <button onClick={() => setWalletMode('withdraw')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${walletMode === 'withdraw' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>উইথড্র</button>
                 </div>
                 {walletMode === 'deposit' && (
                   <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">এডমিন {method} নাম্বার</span>
                        <button onClick={() => safeCopy(paymentNumbers?.[method]?.number || '')} className="p-2 bg-white rounded-xl shadow-sm text-emerald-700 active:scale-90"><Copy size={14}/></button>
                      </div>
                      <p className="text-2xl font-black text-emerald-900 tracking-wider">{paymentNumbers?.[method]?.number || '...'}</p>
                   </div>
                 )}
                 <div className="space-y-4">
                    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="পরিমাণ (৳)" className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100 outline-none" />
                    <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100">
                       <option value="bkash">bKash (বিকাশ)</option>
                       <option value="nagad">Nagad (নগদ)</option>
                    </select>
                    {walletMode === 'deposit' ? 
                      <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="TrxID দিন" className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100 outline-none" /> :
                      <input type="tel" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="অ্যাকাউন্ট নাম্বার" className="w-full bg-slate-50 p-4 rounded-xl font-bold border border-slate-100 outline-none" />
                    }
                 </div>
                 <button onClick={handleWalletSubmit} disabled={isSendingRequest} className={`w-full py-6 rounded-2xl font-black text-lg text-white active:scale-95 transition-all ${walletMode === 'deposit' ? 'bg-emerald-700' : 'bg-rose-600'} disabled:opacity-50`}>
                    {isSendingRequest ? <Loader2 className="animate-spin mx-auto" /> : (walletMode === 'deposit' ? 'রিচার্জ পাঠান' : 'উইথড্র পাঠান')}
                 </button>
              </div>
            )}

            {tab === 'report' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
                 <textarea value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="আপনার অভিযোগ এখানে বিস্তারিত লিখুন..." className="w-full bg-slate-50 p-6 rounded-[32px] h-48 font-bold border border-slate-100 outline-none focus:bg-white transition-all" />
                 <button onClick={handleReportSubmit} disabled={isSendingRequest} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
                    {isSendingRequest ? <Loader2 className="animate-spin" /> : <><Send size={20} /> মেসেজ পাঠান</>}
                 </button>
              </div>
            )}

            {tab === 'privacy' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
                 <div className="bg-blue-50 p-8 rounded-[32px] text-blue-800 text-xs font-bold leading-relaxed space-y-3">
                   <p>১. আপনার তথ্য আমাদের কাছে নিরাপদ।</p>
                   <p>২. ট্রানজেকশন আইডি ভেরিফাই করতে ১০-৩০ মিনিট সময় লাগতে পারে।</p>
                   <p>৩. ভুল তথ্য দিলে অ্যাকাউন্ট সাময়িক স্থগিত হতে পারে।</p>
                   <p>৪. অভিযোগ পাওয়ার ২৪ ঘণ্টার মধ্যে সমাধান করা হয়।</p>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;