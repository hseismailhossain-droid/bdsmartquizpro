import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, 
  addDoc, deleteDoc, increment, serverTimestamp, where, limit, writeBatch 
} from 'firebase/firestore';
import { UserProfile, QuizResult, Notification, Question } from './types';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'error'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [history, setHistory] = useState<{
    exams: QuizResult[];
    mistakes: Question[];
    marked: Question[];
  }>({ exams: [], mistakes: [], marked: [] });

  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<{ 
    numQuestions: number; 
    timePerQuestion: number; 
    isPaid?: boolean;
    quizId?: string;
    collection?: string;
  } | null>(null);
  
  const firestoreUnsubscribers = useRef<(() => void)[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // ক্লিনিং ওল্ড লিসেনারস
        firestoreUnsubscribers.current.forEach(unsub => unsub());
        firestoreUnsubscribers.current = [];

        if (firebaseUser) {
          const isUserAdmin = firebaseUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

          // ইউজার ডাটা লিসেনার
          const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const userData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
              setUser(userData);
              if (view === 'loading' || view === 'auth' || view === 'setup') {
                setView(isUserAdmin ? 'admin' : 'main');
              }
            } else {
              if (isUserAdmin) setView('admin');
              else setView('setup');
            }
          });
          firestoreUnsubscribers.current.push(unsubUser);

          // নোটিফিকেশন লিসেনার
          const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(20)), (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
          });
          firestoreUnsubscribers.current.push(unsubNotifs);

          // এক্সাম হিস্ট্রি এবং মিস্টেক্স লিসেনার
          const unsubExams = onSnapshot(
            query(collection(db, 'quiz_attempts'), where('uid', '==', firebaseUser.uid), limit(50)),
            (snap) => {
              const list = snap.docs.map(d => ({ 
                id: d.id, ...d.data(),
                date: d.data().timestamp ? new Date(d.data().timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এখন'
              } as QuizResult));
              setHistory(prev => ({ ...prev, exams: list.sort((a: any, b: any) => b.timestamp - a.timestamp) }));
            }
          );
          firestoreUnsubscribers.current.push(unsubExams);

        } else {
          setUser(null);
          setView('auth');
        }
      } catch (err) {
        console.error("Auth Error:", err);
        setView('auth');
      }
    });

    return () => {
      unsubscribeAuth();
      firestoreUnsubscribers.current.forEach(unsub => unsub());
    };
  }, [view]);

  // কুইজ ফিনিশ এবং সাবমিট লজিক (সংশোধিত)
  const handleFinishQuiz = async (res: QuizResult & { mistakes?: Question[]; timeTaken?: number }) => {
    if (!auth.currentUser) { setView('main'); return; }
    
    try {
      const uid = auth.currentUser.uid;
      const batch = writeBatch(db);
      
      // ১. রেজাল্ট সেভ করা
      const attemptRef = doc(collection(db, 'quiz_attempts'));
      batch.set(attemptRef, {
        uid,
        userName: user?.name || 'User',
        quizId: res.quizId || 'practice',
        subject: res.subject,
        score: res.score,
        total: res.total,
        timeTaken: res.timeTaken || 0,
        timestamp: serverTimestamp()
      });

      // ২. ইউজারের পয়েন্ট এবং ব্যালেন্স আপডেট
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        totalPoints: increment(Math.max(0, Math.floor(res.score * 10))),
        streak: increment(1),
        lastPlayed: serverTimestamp()
      });

      // ৩. ভুল প্রশ্নগুলো প্র্যাকটিসের জন্য সেভ করা
      if (res.mistakes && res.mistakes.length > 0) {
        res.mistakes.slice(0, 10).forEach(m => { // পারফরম্যান্সের জন্য প্রথম ১০টি
          const mRef = doc(collection(db, 'mistakes_practice'));
          batch.set(mRef, { ...m, uid, timestamp: serverTimestamp() });
        });
      }

      await batch.commit();
      console.log("Quiz data saved successfully!");
    } catch (err) {
      console.error("Firestore Save Error:", err);
      alert("রেজাল্ট সেভ করতে সমস্যা হয়েছে, তবে আপনার স্কোর পয়েন্টে যোগ করা হতে পারে।");
    } finally {
      setView('main');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('auth');
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col font-hind">
        <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-xs uppercase">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (view === 'auth') {
    return <AuthScreen onLogin={() => setView('loading')} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;
  }

  if (view === 'setup') {
    return (
      <SetupScreen 
        lang={lang} 
        onComplete={async (name, category) => { 
          if (!auth.currentUser) return; 
          await setDoc(doc(db, 'users', auth.currentUser.uid), { 
            uid: auth.currentUser.uid, name, email: auth.currentUser.email, 
            category, balance: 0, totalPoints: 0, streak: 1, 
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` 
          }); 
        }} 
      />
    );
  }

  if (view === 'quiz' && activeSubject && quizConfig) {
    return (
      <QuizScreen 
        subject={activeSubject} 
        numQuestions={quizConfig.numQuestions} 
        timePerQuestion={quizConfig.timePerQuestion} 
        isPaid={quizConfig.isPaid} 
        quizId={quizConfig.quizId} 
        collectionName={quizConfig.collection} 
        lang={lang} 
        onClose={() => setView('main')} 
        onFinish={handleFinishQuiz} 
      />
    );
  }

  if (view === 'admin') {
    return (
      <AdminLayout 
        onExit={() => setView('main')}
        onLogout={handleLogout}
        onSendNotification={async (t, m) => { await addDoc(collection(db, 'notifications'), { title: t, message: m, timestamp: serverTimestamp() }); }}
        onDeleteNotification={async (id) => { await deleteDoc(doc(db, 'notifications', id)); }}
        onDeleteQuiz={async (id, col) => { await deleteDoc(doc(db, col, id)); }}
        notifications={notifications}
      />
    );
  }

  return (
    <MainLayout 
      user={user!} 
      history={history} 
      notifications={notifications} 
      lessons={[]} 
      setNotifications={setNotifications} 
      lang={lang} 
      toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} 
      isAdmin={user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()} 
      onAdminSwitch={() => setView('admin')} 
      onUpdateProfile={async (data) => { if (auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), data); }} 
      onLogout={handleLogout} 
      onSubjectSelect={(subject, config) => { 
        setActiveSubject(subject); 
        setQuizConfig(config); 
        setView('quiz'); 
      }} 
      onSubmitDeposit={() => {}} 
      onSubmitWithdraw={() => {}} 
    />
  );
};

export default App;
