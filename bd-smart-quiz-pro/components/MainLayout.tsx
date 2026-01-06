
import React, { useState } from 'react';
import BottomNav from './BottomNav';
import HomeTab from './HomeTab';
import ExamTab from './ExamTab';
import HistoryTab from './HistoryTab';
import LeaderboardTab from './LeaderboardTab';
import CommunityTab from './CommunityTab';
import ProgressTab from './ProgressTab';
import QuizConfigModal from './QuizConfigModal';
import EditProfileModal from './EditProfileModal';
import WrittenExamScreen from './WrittenExamScreen';
import { UserProfile, QuizResult, Question, Notification, Lesson } from '../types';
import { X, ArrowLeft, BellOff, BookOpen, Clock, PlayCircle, CheckCircle2, ShieldCheck, Bell, Trash2, ArrowRight } from 'lucide-react';
import { Language } from '../services/translations';
import { db } from '../services/firebase';
import { doc, updateDoc, increment, writeBatch, serverTimestamp, collection } from 'firebase/firestore';

interface MainLayoutProps {
  user: UserProfile;
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
  notifications: Notification[];
  lessons: Lesson[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onSubjectSelect: (subject: string, config: { 
    numQuestions: number; 
    timePerQuestion: number; 
    isLive?: boolean; 
    isPaid?: boolean;
    entryFee?: number;
    quizId?: string;
    collection?: string;
    isWritten?: boolean;
    payoutNumber?: string;
  }) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
  onLogout: () => void | Promise<void>;
  lang: Language;
  toggleLanguage: () => void;
  isAdmin?: boolean;
  onAdminSwitch?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  user, history, notifications, lessons, setNotifications, onSubjectSelect, onUpdateProfile, onSubmitDeposit, onSubmitWithdraw, onLogout, lang, toggleLanguage, isAdmin, onAdminSwitch 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'community' | 'exam' | 'progress' | 'leaderboard' | 'history'>('home');
  const [showConfig, setShowConfig] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileModal, setProfileModal] = useState<{show: boolean, tab: 'profile' | 'report' | 'privacy' | 'wallet'}>({show: false, tab: 'profile'});
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPaidMode, setIsPaidMode] = useState(false);
  const [isWrittenMode, setIsWrittenMode] = useState(false);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeWrittenData, setActiveWrittenData] = useState<{subject: string, quizId?: string} | null>(null);

  const handleSubjectClick = (subject: string, isLive: boolean = false, isPaid: boolean = false, fee: number = 0, quizId?: string, collectionName?: string, isWritten: boolean = false) => {
    setSelectedSubject(subject);
    setIsLiveMode(isLive);
    setIsPaidMode(isPaid);
    setIsWrittenMode(isWritten);
    setEntryFee(Number(fee) || 0);
    setSelectedQuizId(quizId || null);
    setSelectedCollection(collectionName);
    setShowConfig(true);
  };

  const handleStartExam = async (config: { numQuestions: number; timePerQuestion: number; payoutNumber?: string }) => {
    if (!user || !user.uid || !selectedSubject) {
      alert("দুঃখিত, তথ্য লোড হতে সমস্যা হয়েছে।");
      return;
    }

    if (isPaidMode && entryFee > 0) {
      if (user.balance < entryFee) {
        alert("আপনার ব্যালেন্স অপর্যাপ্ত। দয়া করে রিচার্জ করুন।");
        return;
      }

      try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, { balance: increment(-entryFee) });
        const logRef = doc(collection(db, 'transactions'));
        batch.set(logRef, {
          uid: user.uid,
          userName: user.name || 'User',
          amount: entryFee,
          type: 'exam_fee',
          payoutNumber: config.payoutNumber || '',
          subject: selectedSubject,
          quizId: selectedQuizId || 'custom',
          timestamp: serverTimestamp()
        });
        await batch.commit();
      } catch (e) {
        alert("পেমেন্ট সম্পন্ন করা যায়নি।");
        return;
      }
    }

    setShowConfig(false);
    if (isWrittenMode) {
      setActiveWrittenData({ subject: selectedSubject, quizId: selectedQuizId || undefined });
    } else {
      onSubjectSelect(selectedSubject, { 
        ...config, 
        isLive: isLiveMode, 
        isPaid: isPaidMode, 
        entryFee: entryFee,
        quizId: selectedQuizId || undefined, 
        collection: selectedCollection,
        isWritten: isWrittenMode
      });
    }
  };

  const renderTab = () => {
    return (
      <div key={activeTab} className="page-transition overflow-y-auto no-scrollbar flex-1 min-h-0">
        {activeTab === 'home' && (
          <HomeTab 
            user={user} history={history} notifications={notifications} lessons={lessons} 
            onShowNotifications={() => setShowNotifications(true)} onLogout={onLogout} 
            onSubjectSelect={handleSubjectClick} onLessonSelect={(l) => setActiveLesson(l)} 
            onEditProfile={(tab = 'profile') => setProfileModal({show: true, tab})}
            onSubmitDeposit={onSubmitDeposit} onSubmitWithdraw={onSubmitWithdraw}
          />
        )}
        {activeTab === 'community' && <CommunityTab user={user} />}
        {activeTab === 'exam' && (
          <ExamTab 
            user={user} 
            onSubjectSelect={handleSubjectClick} 
            onLessonSelect={(l) => setActiveLesson(l)}
            onSubmitDeposit={onSubmitDeposit} 
            onSubmitWithdraw={onSubmitWithdraw} 
          />
        )}
        {activeTab === 'progress' && <ProgressTab user={user} history={history} />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto relative border-x border-gray-100 bg-slate-50 overflow-hidden">
      {isAdmin && onAdminSwitch && (
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 flex items-center justify-between z-[200] shrink-0">
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Admin Mode</span>
           </div>
           <button onClick={onAdminSwitch} className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter hover:bg-emerald-500 transition-colors">Admin Panel</button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">{renderTab()}</div>
      <div className="shrink-0"><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></div>
      
      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-[2000] flex justify-end font-hind animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNotifications(false)}></div>
           <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
              <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-lg">
                       <Bell size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">নোটিফিকেশন</h3>
                 </div>
                 <button onClick={() => setShowNotifications(false)} className="p-2 bg-white rounded-full text-slate-400 active:scale-90 shadow-sm">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                 {notifications.length > 0 ? (
                   notifications.map((n) => (
                     <div key={n.id} className="p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm relative group hover:border-emerald-200 transition-all">
                        <div className="flex items-start gap-4">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                           <div>
                              <h4 className="font-black text-slate-800 text-sm leading-tight mb-1.5">{n.title}</h4>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-3 flex items-center gap-1.5">
                                 <Clock size={10}/> {n.time || 'এখন'}
                              </p>
                           </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center mb-6">
                         <BellOff size={40} />
                      </div>
                      <h4 className="text-slate-900 font-black mb-1">কোনো নোটিফিকেশন নেই</h4>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">নতুন আপডেট আসলে আপনি এখানে দেখতে পাবেন।</p>
                   </div>
                 )}
              </div>
              
              <div className="p-6 border-t bg-slate-50">
                 <button onClick={() => setShowNotifications(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-lg">বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}

      {activeWrittenData && (
        <WrittenExamScreen 
          subject={activeWrittenData.subject} 
          quizId={activeWrittenData.quizId}
          onClose={() => setActiveWrittenData(null)} 
          lang={lang} 
        />
      )}

      {showConfig && selectedSubject && (
        <QuizConfigModal 
          subject={selectedSubject} isLive={isLiveMode} isPaid={isPaidMode} isWritten={isWrittenMode} entryFee={entryFee}
          onClose={() => setShowConfig(false)} 
          onStart={handleStartExam}
        />
      )}
      {profileModal.show && <EditProfileModal user={user} initialTab={profileModal.tab} onClose={() => setProfileModal({...profileModal, show: false})} onUpdate={onUpdateProfile} onLogout={onLogout} />}
    </div>
  );
};

export default MainLayout;
