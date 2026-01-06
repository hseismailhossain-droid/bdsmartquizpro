
import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Save, Send, CheckCircle2, Clock, Palette, Sparkles, Loader2, Info, Trash2, BellOff, AlertTriangle, X, Eye, EyeOff, CreditCard, Landmark, Bitcoin } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Notification } from '../../types';
import ConfirmModal from './ConfirmModal';

interface PaymentConfig {
  number: string;
  active: boolean;
}

interface PaymentSettings {
  bkash: PaymentConfig;
  nagad: PaymentConfig;
  rocket: PaymentConfig;
  upay: PaymentConfig;
  bank: PaymentConfig;
  crypto: PaymentConfig;
}

interface SettingsManagerProps {
  onSendNotification: (title: string, message: string) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  notifications: Notification[];
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ onSendNotification, onDeleteNotification, notifications }) => {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Payment States
  const [payments, setPayments] = useState<PaymentSettings>({
    bkash: { number: '', active: true },
    nagad: { number: '', active: true },
    rocket: { number: '', active: false },
    upay: { number: '', active: false },
    bank: { number: '', active: false },
    crypto: { number: '', active: false }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payment_numbers'));
        if (snap.exists()) {
          const data = snap.data();
          setPayments({
            bkash: data.bkash || { number: '', active: true },
            nagad: data.nagad || { number: '', active: true },
            rocket: data.rocket || { number: '', active: false },
            upay: data.upay || { number: '', active: false },
            bank: data.bank || { number: '', active: false },
            crypto: data.crypto || { number: '', active: false }
          });
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'payment_numbers'), {
        ...payments,
        lastUpdated: Date.now()
      });
      alert("পেমেন্ট সেটিংস সফলভাবে সেভ করা হয়েছে!");
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePaymentActive = (method: keyof PaymentSettings) => {
    setPayments(prev => ({
      ...prev,
      [method]: { ...prev[method], active: !prev[method].active }
    }));
  };

  const updatePaymentNumber = (method: keyof PaymentSettings, num: string) => {
    setPayments(prev => ({
      ...prev,
      [method]: { ...prev[method], number: num }
    }));
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return alert("টাইটেল ও মেসেজ দিন");
    setIsSending(true);
    try {
      await onSendNotification(notifTitle, notifMessage);
      setShowSuccess(true);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setShowSuccess(false), 3000);
      alert("নোটিফিকেশন পাঠানো হয়েছে!");
    } catch (e) {
      alert("নোটিফিকেশন পাঠানো যায়নি।");
    } finally {
      setIsSending(false);
    }
  };

  const confirmDeleteNotif = async () => {
    if (!deleteConfirm.id) return;
    try {
      await onDeleteNotification(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="নোটিফিকেশন ডিলিট"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" নোটিফিকেশনটি ডিলিট করতে চান? এটি ইউজার ড্যাশবোর্ড থেকেও মুছে যাবে।`}
        onConfirm={confirmDeleteNotif}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সিস্টেম সেটিংস</h2>
          <p className="text-slate-400 font-bold text-sm">অ্যাপের পেমেন্ট ও নোটিফিকেশন নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 shadow-sm"><Smartphone size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">পেমেন্ট মেথডসমূহ</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payment Gateway Config</p>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
               <PaymentInput 
                 label="বিকাশ (BKASH)" 
                 value={payments.bkash.number} 
                 active={payments.bkash.active} 
                 onNumberChange={(v) => updatePaymentNumber('bkash', v)}
                 onToggle={() => togglePaymentActive('bkash')}
                 icon={<Smartphone size={16} />}
               />
               <PaymentInput 
                 label="নগদ (NAGAD)" 
                 value={payments.nagad.number} 
                 active={payments.nagad.active} 
                 onNumberChange={(v) => updatePaymentNumber('nagad', v)}
                 onToggle={() => togglePaymentActive('nagad')}
                 icon={<Smartphone size={16} />}
               />
               <PaymentInput 
                 label="রকেট (ROCKET)" 
                 value={payments.rocket.number} 
                 active={payments.rocket.active} 
                 onNumberChange={(v) => updatePaymentNumber('rocket', v)}
                 onToggle={() => togglePaymentActive('rocket')}
                 icon={<Smartphone size={16} />}
               />
               <PaymentInput 
                 label="উপায় (UPAY)" 
                 value={payments.upay.number} 
                 active={payments.upay.active} 
                 onNumberChange={(v) => updatePaymentNumber('upay', v)}
                 onToggle={() => togglePaymentActive('upay')}
                 icon={<Smartphone size={16} />}
               />
               <PaymentInput 
                 label="ব্যাংক কার্ড (BANK CARD)" 
                 value={payments.bank.number} 
                 active={payments.bank.active} 
                 onNumberChange={(v) => updatePaymentNumber('bank', v)}
                 onToggle={() => togglePaymentActive('bank')}
                 icon={<Landmark size={16} />}
               />
               <PaymentInput 
                 label="ক্রিপ্টোকারেন্সি (CRYPTO)" 
                 value={payments.crypto.number} 
                 active={payments.crypto.active} 
                 onNumberChange={(v) => updatePaymentNumber('crypto', v)}
                 onToggle={() => togglePaymentActive('crypto')}
                 icon={<Bitcoin size={16} />}
               />
            </div>

            <div className="mt-8">
              <button 
                onClick={handleSaveSettings} 
                disabled={isSaving} 
                className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Management */}
        <div className="space-y-8">
           <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 shadow-sm"><Bell size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">নোটিফিকেশন পাঠান</h3>
              </div>
              
              <div className="space-y-6 mb-10">
                 <input 
                  type="text" 
                  value={notifTitle} 
                  onChange={(e) => setNotifTitle(e.target.value)} 
                  placeholder="নোটিফিকেশন টাইটেল" 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[24px] font-bold outline-none focus:bg-white focus:border-blue-200 transition-all" 
                 />
                 <textarea 
                  value={notifMessage} 
                  onChange={(e) => setNotifMessage(e.target.value)} 
                  placeholder="আপনার মেসেজ..." 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold h-32 outline-none focus:bg-white focus:border-blue-200 transition-all" 
                 />
                 <button 
                  onClick={handleSendNotification} 
                  disabled={isSending || !notifTitle.trim()} 
                  className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                 >
                    {isSending ? <Loader2 className="animate-spin" /> : <><Send size={22} /> পাঠান</>}
                 </button>
              </div>

              {/* Sent Notifications List */}
              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                   <Clock size={16} /> পাঠানো নোটিফিকেশন লিস্ট
                </h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 group relative transition-all hover:bg-white hover:border-blue-100">
                       <button 
                        onClick={() => setDeleteConfirm({ show: true, id: n.id, title: n.title })}
                        className="absolute top-4 right-4 p-2.5 bg-white text-rose-500 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                       >
                         <Trash2 size={16} />
                       </button>
                       <h5 className="font-black text-slate-900 text-sm pr-10 leading-tight">{n.title}</h5>
                       <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 font-medium">{n.message}</p>
                       <div className="flex items-center gap-2 mt-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{n.time || 'পাঠানো হয়েছে'}</p>
                       </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-20 text-slate-300 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[40px]">
                       কোনো নোটিফিকেশন পাওয়া যায়নি
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface PaymentInputProps {
  label: string;
  value: string;
  active: boolean;
  onNumberChange: (v: string) => void;
  onToggle: () => void;
  icon?: React.ReactNode;
}

const PaymentInput: React.FC<PaymentInputProps> = ({ label, value, active, onNumberChange, onToggle, icon }) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center px-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-300">{icon}</span>}
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      </div>
      <button 
        type="button"
        onClick={onToggle}
        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-300 opacity-50'}`}
      >
        {active ? <Eye size={14}/> : <EyeOff size={14}/>}
      </button>
    </div>
    <div className="relative">
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onNumberChange(e.target.value)} 
        placeholder="নাম্বার বা অ্যাড্রেস..." 
        className={`w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:bg-white focus:border-emerald-200 transition-all shadow-inner ${!active && 'opacity-50 grayscale cursor-not-allowed'}`}
        disabled={!active}
      />
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${active ? 'text-emerald-500' : 'text-slate-200'}`}>
        <CheckCircle2 size={16} />
      </div>
    </div>
  </div>
);

export default SettingsManager;
