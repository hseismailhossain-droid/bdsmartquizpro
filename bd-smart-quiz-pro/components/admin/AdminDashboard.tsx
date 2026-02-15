
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Wallet, Trophy, Loader2, AlertTriangle, CheckCircle2, TrendingUp, Star, Trash2, Zap, Settings, ShieldCheck, MailCheck, MessageSquare, CreditCard, FileSignature } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, limit, orderBy, doc, deleteDoc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

interface AdminDashboardProps {
  onNavigate: (tab: any) => void;
  requests: any[]; // deposit requests
  onApprove: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, requests, onApprove }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalRevenue: 0,
    pendingDeposits: 0,
    pendingWithdraws: 0,
    pendingReports: 0,
    pendingWritten: 0,
    loading: true,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      let revenue = 0;
      const usersList: any[] = [];
      snap.docs.forEach(d => {
   const data = d.data();
   revenue += (Number(data.balance) || 0);
   usersList.push({ id: d.id, ...data });
});
      setRecentUsers(usersList.slice(0, 5));
      setStats(prev => ({ ...prev, totalUsers: snap.size, totalRevenue: revenue, loading: false }));
    });

    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(5)), (snap) => {
      setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStats(prev => ({ ...prev, totalQuizzes: snap.size }));
    });

    const unsubWithdraws = onSnapshot(collection(db, 'withdraw_requests'), (snap) => {
       setStats(prev => ({ ...prev, pendingWithdraws: snap.docs.filter(d => d.data().status === 'pending').length }));
    });

    const unsubReports = onSnapshot(collection(db, 'user_reports'), (snap) => {
       setStats(prev => ({ ...prev, pendingReports: snap.docs.filter(d => d.data().status === 'pending').length }));
    });

    const unsubWritten = onSnapshot(collection(db, 'written_submissions'), (snap) => {
       setStats(prev => ({ ...prev, pendingWritten: snap.docs.filter(d => d.data().status === 'pending').length }));
    });

    return () => { 
      unsubUsers(); unsubSpecial(); unsubWithdraws(); unsubReports(); unsubWritten();
    };
  }, []);

  const handleDeleteSpecial = async () => {
    try {
      await deleteDoc(doc(db, 'admin_special_quizzes', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) { alert("ডিলিট করতে সমস্যা হয়েছে।"); }
  };

  const pendingDepositsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="কুইজ ডিলিট করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" স্পেশাল কুইজটি ডিলিট করতে চান?`}
        onConfirm={handleDeleteSpecial}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সিস্টেম ড্যাশবোর্ড</h2>
          <p className="text-slate-400 font-bold text-sm">Smart Quiz Pro এর রিয়েল-টাইম পরিসংখ্যান</p>
        </div>
        <div className="bg-emerald-50 px-5 py-3 rounded-2xl flex items-center gap-2 text-emerald-700 font-black text-xs uppercase shadow-sm border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> সিস্টেম অনলাইন
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard onClick={() => onNavigate('users')} icon={<Users/>} label="মোট ইউজার" value={stats.totalUsers.toString()} color="bg-blue-600" />
        <StatCard onClick={() => onNavigate('written_eval')} icon={<FileSignature/>} label="রিটেন সাবমিশন" value={stats.pendingWritten.toString()} color="bg-emerald-600" />
        <StatCard onClick={() => onNavigate('withdraws')} icon={<CreditCard/>} label="পেন্ডিং উইথড্র" value={stats.pendingWithdraws.toString()} color="bg-rose-600" />
        <StatCard onClick={() => onNavigate('users')} icon={<Wallet/>} label="পেন্ডিং রিচার্জ" value={pendingDepositsCount.toString()} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" size={20} /> স্পেশাল কুইজ লিস্ট
            </h3>
            <button onClick={() => onNavigate('quizzes')} className="text-xs font-black text-emerald-700 uppercase">ম্যানেজ করুন</button>
          </div>
          <div className="space-y-4">
            {specialQuizzes.map(q => (
              <div key={q.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-50 group hover:border-amber-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                    <Zap size={18} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-tight">{q.title}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{q.questionsCount || 0}টি প্রশ্ন</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDeleteConfirm({ show: true, id: q.id, title: q.title })}
                  className="p-3 bg-white text-rose-500 rounded-xl shadow-sm hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-xl text-slate-900">সাম্প্রতিক ইউজার</h3>
            <button onClick={() => onNavigate('users')} className="text-xs font-black text-emerald-700 uppercase">সব দেখুন</button>
          </div>
          <div className="space-y-4">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-50 hover:border-emerald-100 transition-all">
                <div className="flex items-center gap-4">
                  <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-11 h-11 rounded-xl bg-white object-cover" alt="" />
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-tight">{u.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{u.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-700 text-sm">৳{u.balance || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6 hover:translate-y-[-4px] transition-all text-left w-full group">
    <div className={`w-14 h-14 ${color} text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
    </div>
  </button>
);

export default AdminDashboard;
