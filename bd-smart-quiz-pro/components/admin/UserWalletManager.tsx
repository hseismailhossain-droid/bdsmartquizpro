import React, { useState, useEffect } from 'react';
import { CheckCircle, Wallet, Check, X, Search, User, Edit3, Loader2, Save, ShieldCheck, Trash2, Trophy } from 'lucide-react';
import { DepositRequest, UserProfile, Category } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

interface UserWalletManagerProps {
  requests: DepositRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const UserWalletManager: React.FC<UserWalletManagerProps> = ({ requests }) => {
  const [view, setView] = useState<'users' | 'requests'>('requests');
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (view === 'users') {
      setIsLoadingUsers(true);
      const q = query(collection(db, 'users'));
      const unsub = onSnapshot(q, (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setIsLoadingUsers(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setIsLoadingUsers(false);
      });
      return unsub;
    }
  }, [view]);

  const executeApprove = async (req: DepositRequest) => {
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', req.uid);
      batch.update(userRef, { balance: increment(req.amount) });
      const reqRef = doc(db, 'deposit_requests', req.id);
      batch.update(reqRef, { status: 'approved', processedAt: serverTimestamp() });
      const logRef = doc(collection(db, 'transactions'));
      batch.set(logRef, {
        uid: req.uid,
        userName: req.userName,
        amount: req.amount,
        type: 'deposit',
        method: req.method,
        status: 'success',
        timestamp: serverTimestamp()
      });
      await batch.commit();
      alert("ডিপোজিট সফলভাবে অ্যাপ্রুভ করা হয়েছে!");
    } catch (e) {
      alert("অপারেশন ব্যর্থ হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeReject = async (id: string) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'deposit_requests', id), { 
        status: 'rejected', 
        processedAt: serverTimestamp() 
      });
      alert("রিকোয়েস্ট রিজেক্ট করা হয়েছে।");
    } catch (e) {
      alert("অপারেশন ব্যর্থ হয়েছে।");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'deposit_requests', id));
      alert("রেকর্ডটি ডিলিট করা হয়েছে।");
    } catch (e) {
      alert("ডিলিট ব্যর্থ হয়েছে।");
    }
  };

  const handleApproveRequest = (req: DepositRequest) => {
    setConfirmState({
      show: true,
      title: 'অ্যাপ্রুভ নিশ্চিত করুন',
      message: `আপনি কি নিশ্চিতভাবে ৳${req.amount} ডিপোজিট রিকোয়েস্টটি অ্যাপ্রুভ করতে চান?`,
      onConfirm: () => executeApprove(req),
    });
  };

  const handleRejectRequest = (id: string) => {
    setConfirmState({
      show: true,
      title: 'রিজেক্ট নিশ্চিত করুন',
      message: 'আপনি কি নিশ্চিতভাবে এই ডিপোজিট রিকোয়েস্টটি রিজেক্ট করতে চান?',
      onConfirm: () => executeReject(id),
    });
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setConfirmState({
      show: true,
      title: 'ডিলিট নিশ্চিত করুন',
      message: `আপনি কি নিশ্চিতভাবে "${name}" এর এই ডিপোজিট রেকর্ডটি ডিলিট করতে চান?`,
      onConfirm: () => executeDelete(id),
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        name: editingUser.name,
        balance: Number(editingUser.balance),
        category: editingUser.category,
        totalPoints: Number(editingUser.totalPoints || 0)
      });
      alert("ইউজারের তথ্য সফলভাবে আপডেট হয়েছে!");
      setEditingUser(null);
    } catch (e) {
      alert("আপডেট ব্যর্থ হয়েছে।");
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-['Hind_Siliguri'] pb-20">
      <ConfirmModal 
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))}
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ইউজার ও ওয়ালেট</h2>
          <p className="text-slate-400 font-bold text-sm">সব ইউজারের তথ্য নিয়ন্ত্রণ করুন</p>
        </div>
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm self-start">
          <button onClick={() => setView('requests')} className={`px-8 py-3 rounded-[18px] font-black text-xs transition-all uppercase tracking-widest ${view === 'requests' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>রিকোয়েস্ট ({pendingRequests.length})</button>
          <button onClick={() => setView('users')} className={`px-8 py-3 rounded-[18px] font-black text-xs transition-all uppercase tracking-widest ${view === 'users' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>ইউজার লিস্ট ({users.length})</button>
        </div>
      </div>

      {view === 'requests' ? (
        <div className="bg-white rounded-[44px] overflow-hidden shadow-sm border border-slate-100">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-6">ইউজার</th>
                  <th className="px-8 py-6">পরিমাণ</th>
                  <th className="px-8 py-6">Trx ID</th>
                  <th className="px-8 py-6 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-900">{req.userName}</td>
                    <td className="px-8 py-6 font-black text-emerald-700">৳{req.amount} <span className="text-[10px] uppercase ml-1 opacity-50">{req.method}</span></td>
                    <td className="px-8 py-6 font-mono text-xs">{req.trxId}</td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button disabled={isProcessing} onClick={() => handleDeleteRequest(req.id, req.userName)} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                      <button disabled={isProcessing} onClick={() => handleRejectRequest(req.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><X size={20}/></button>
                      <button disabled={isProcessing} onClick={() => handleApproveRequest(req)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Check size={20}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pendingRequests.length === 0 && <div className="p-20 text-center text-slate-300 font-black">কোনো পেন্ডিং রিকোয়েস্ট নেই</div>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..." 
              className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[32px] font-bold outline-none shadow-sm focus:border-emerald-300 transition-all" 
            />
          </div>
          <div className="bg-white rounded-[44px] overflow-hidden border border-slate-100 shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[750px] table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-6 w-[40%]">প্রোফাইল</th>
                    <th className="px-8 py-6 w-[20%] text-center">ব্যালেন্স</th>
                    <th className="px-8 py-6 w-[20%] text-center">পয়েন্ট</th>
                    <th className="px-8 py-6 w-[20%] text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoadingUsers ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" /></td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-emerald-50/20 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-10 h-10 rounded-xl bg-slate-100 object-cover shrink-0" alt="" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-sm leading-tight truncate">{u.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-emerald-700 text-center whitespace-nowrap">৳{u.balance || 0}</td>
                      <td className="px-8 py-6 font-black text-slate-600 text-center whitespace-nowrap">{u.totalPoints || 0}</td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => setEditingUser(u)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-emerald-700 shadow-sm hover:bg-emerald-700 hover:text-white transition-all"><Edit3 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && !isLoadingUsers && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs">কোনো ইউজার পাওয়া যায়নি</div>}
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[44px] p-8 animate-in zoom-in-95 duration-200 shadow-2xl relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700"><User size={28}/></div>
              <h4 className="text-xl font-black text-slate-900">ইউজার ডাটা এডিটর</h4>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2">ইউজার নেম</label>
                 <input 
                  type="text" 
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
                  className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white transition-all" 
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">ব্যালেন্স (৳)</label>
                    <input 
                      type="number" 
                      value={editingUser.balance} 
                      onChange={(e) => setEditingUser({...editingUser, balance: e.target.value})} 
                      className="w-full bg-emerald-50 p-4 rounded-2xl font-black text-emerald-800 outline-none border border-emerald-100 focus:bg-white transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-400 uppercase px-2">মোট পয়েন্ট</label>
                    <input 
                      type="number" 
                      value={editingUser.totalPoints || 0} 
                      onChange={(e) => setEditingUser({...editingUser, totalPoints: e.target.value})} 
                      className="w-full bg-indigo-50 p-4 rounded-2xl font-black text-indigo-800 outline-none border border-indigo-100 focus:bg-white transition-all" 
                    />
                  </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-2">ক্লাস / ক্যাটাগরি</label>
                 <select 
                  value={editingUser.category} 
                  onChange={(e) => setEditingUser({...editingUser, category: e.target.value})} 
                  className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none border border-slate-100 transition-all"
                 >
                   {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
               </div>
               
               <div className="pt-4 space-y-3">
                 <button 
                  onClick={handleUpdateUser} 
                  disabled={isUpdating} 
                  className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isUpdating ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> সেভ করুন</>}
                 </button>
                 <button onClick={() => setEditingUser(null)} className="w-full py-4 text-slate-400 font-black text-sm uppercase">বাতিল করুন</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWalletManager;
