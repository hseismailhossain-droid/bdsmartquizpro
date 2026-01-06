
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Image as ImageIcon, 
  Users, Settings as SettingsIcon, LogOut, Menu, X, Trophy, LogIn, MessageSquare, CreditCard, LayoutGrid, Home as HomeIcon, FileSignature, FileCode, PenTool
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import QuizManager from './QuizManager';
import AdsManager from './AdsManager';
import UserWalletManager from './UserWalletManager';
import SettingsManager from './SettingsManager';
import ResultManager from './ResultManager';
import ReportManager from './ReportManager';
import WithdrawManager from './WithdrawManager';
import CategoryManager from './CategoryManager';
import HomeManagement from './HomeManagement';
import { DepositRequest, Notification, UserReport, WithdrawRequest } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const AdminLayout: React.FC<any> = ({ onExit, onLogout, onSendNotification, onDeleteNotification, onDeleteQuiz, notifications }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quizzes' | 'written_mgmt' | 'written_eval' | 'categories' | 'results' | 'ads' | 'users' | 'settings' | 'reports' | 'withdraws' | 'home_mgmt'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [pendingWritten, setPendingWritten] = useState(0);

  useEffect(() => {
    const unsubDeposits = onSnapshot(query(collection(db, 'deposit_requests'), orderBy('timestamp', 'desc')), (snap) => {
      setDepositRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest)));
    });
    const unsubWithdraws = onSnapshot(query(collection(db, 'withdraw_requests'), orderBy('timestamp', 'desc')), (snap) => {
      setWithdrawRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawRequest)));
    });
    const unsubWritten = onSnapshot(collection(db, 'written_submissions'), (snap) => {
      setPendingWritten(snap.docs.filter(d => d.data().status === 'pending').length);
    });

    return () => { unsubDeposits(); unsubWithdraws(); unsubWritten(); };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} requests={depositRequests} onApprove={()=>{}} />;
      case 'quizzes': return <QuizManager onDeleteQuiz={onDeleteQuiz} />;
      case 'written_mgmt': return <QuizManager forcedType="written" onDeleteQuiz={onDeleteQuiz} />;
      case 'written_eval': return <ResultManager activeSubTab="written" />;
      case 'categories': return <CategoryManager />;
      case 'results': return <ResultManager activeSubTab="mcq" />;
      case 'home_mgmt': return <HomeManagement />;
      case 'ads': return <AdsManager />;
      case 'users': return <UserWalletManager requests={depositRequests} onApprove={()=>{}} onReject={()=>{}} />;
      case 'withdraws': return <WithdrawManager requests={withdrawRequests} onApprove={()=>{}} onReject={()=>{}} onDelete={(id)=>deleteDoc(doc(db,'withdraw_requests',id))} />;
      case 'settings': return <SettingsManager onSendNotification={onSendNotification} onDeleteNotification={onDeleteNotification} notifications={notifications} />;
      case 'reports': return <ReportManager reports={[]} onResolve={()=>{}} onDelete={()=>{}} />;
      default: return <AdminDashboard onNavigate={setActiveTab} requests={depositRequests} onApprove={()=>{}} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'quizzes', label: 'কুইজ ও লিসন', icon: BookOpen },
    { id: 'written_mgmt', label: 'লিখিত পরীক্ষা', icon: PenTool },
    { id: 'written_eval', label: 'লিখিত উত্তরপত্র', icon: FileSignature, badge: pendingWritten },
    { id: 'categories', label: 'ক্যাটাগরি কার্ড', icon: LayoutGrid },
    { id: 'results', label: 'MCQ রেজাল্ট', icon: Trophy },
    { id: 'withdraws', label: 'উইথড্র রিকোয়েস্ট', icon: CreditCard, badge: withdrawRequests.filter(r=>r.status==='pending').length },
    { id: 'users', label: 'ইউজার ও ওয়ালেট', icon: Users },
    { id: 'home_mgmt', label: 'হোম সেটিংস', icon: HomeIcon },
    { id: 'ads', label: 'অ্যাড ম্যানেজমেন্ট', icon: ImageIcon },
    { id: 'settings', label: 'সিস্টেম সেটিংস', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-['Hind_Siliguri'] overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-72 bg-slate-900 text-white flex flex-col p-6 shadow-2xl lg:relative lg:translate-x-0`}>
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">SQ</div>
          <h1 className="text-xl font-black">BD Smart Admin</h1>
        </div>
        
        <nav className="flex-grow space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all relative ${isActive ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={20} /> 
                <span className="text-[13px]">{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-1 rounded-full">{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
          <button onClick={onExit} className="w-full flex items-center gap-4 px-5 py-3 text-slate-400 font-bold hover:text-white transition-all"><LogIn size={18} /><span className="text-sm">ইউজার মোড</span></button>
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3 text-rose-400 font-bold hover:text-rose-100 transition-all"><LogOut size={18} /><span className="text-sm">লগ আউট</span></button>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
          <div className="ml-auto flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">অ্যাডমিন প্যানেল</p>
                <p className="text-sm font-black text-slate-900 leading-none">Super Admin</p>
             </div>
          </div>
        </header>
        <div className="flex-grow overflow-y-auto p-6 md:p-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;