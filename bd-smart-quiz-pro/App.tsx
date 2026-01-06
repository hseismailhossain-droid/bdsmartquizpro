
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db, refreshFirestore } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp, where, limit, writeBatch } from 'firebase/firestore';
import { UserProfile, QuizResult, Notification, Question, Category } from './types';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'error'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{
    exams: QuizResult[];
    mistakes: Question[];
    marked: Question[];
  }>({ exams: [], mistakes: [], marked: [] });

  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<{ 
    numQuestions: number; 
    timePerQuestion: number; 
    isLive?: boolean; 
    isPaid?: boolean;
    quizId?: string;
    entryFee?: number;
    collection?: string;
  } | null>(null);
  
  const firestoreUnsubscribers = useRef<(() => void)[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        firestoreUnsubscribers.current.forEach(unsub => unsub());
        firestoreUnsubscribers.current = [];

        if (firebaseUser) {
          const isUserAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

          // Notifications Listener
          const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
          });
          firestoreUnsubscribers.current.push(unsubNotifs);

          // Mistakes Listener
          const unsubMistakes = onSnapshot(
            query(collection(db, 'mistakes_practice'), where('uid', '==', firebaseUser.uid), limit(100)),
            (snap) => {
              setHistory(prev => ({ ...prev, mistakes: snap.docs.map(d => ({ id: d.id, ...d.data() } as any)) }));
            }
          );
          firestoreUnsubscribers.current.push(unsubMistakes);

          const unsubExams = onSnapshot(
            query(collection(db, 'quiz_attempts'), where('uid', '==', firebaseUser.uid), limit(100)),
            (snap) => {
              const list = snap.docs.map(d => {
                const data = d.data();
                return { 
                  id: d.id, ...data, 
                  date: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এইমাত্র'
                } as QuizResult;
              });
              list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
              setHistory(prev => ({ ...prev, exams: list }));
            }
          );
          firestoreUnsubscribers.current.push(unsubExams);

          const unsubMarked = onSnapshot(
            query(collection(db, 'bookmarks'), where('uid', '==', firebaseUser.uid), limit(100)),
            (snap) => {
              setHistory(prev => ({ ...prev, marked: snap.docs.map(d => ({ id: d.id, ...d.data() } as any)) }));
            }
          );
          firestoreUnsubscribers.current.push(unsubMarked);

        } else {
          setUser(null);
          setView('auth');
        }
      } catch (err) {
        setView('auth');
      }
    });

    return () => {
      unsubscribeAuth();
      firestoreUnsubscribers.current.forEach(unsub => unsub());
    };
  }, []);

  const handleFinishQuiz = async (res: QuizResult & { mistakes?: Question[]; timeTaken?: number }) => {
    if (!auth.currentUser) { setView('main'); return; }
    try {
      const uid = auth.currentUser.uid;
      const batch = writeBatch(db);
      
      // Save Attempt
      const attemptRef = doc(collection(db, 'quiz_attempts'));
      batch.set(attemptRef, {
        uid, userName: user?.name || 'User', quizId: res.quizId || 'mock',
        subject: res.subject, score: res.score, total: res.total,
        timeTaken: res.timeTaken || 0, timestamp: serverTimestamp()
      });

      // Update Points
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, { totalPoints: increment(Math.max(0, Math.floor(res.score * 10))), streak: increment(1) });

      // Save Mistakes for Practice
      if (res.mistakes && res.mistakes.length > 0) {
        res.mistakes.forEach(m => {
          const mRef = doc(collection(db, 'mistakes_practice'));
          batch.set(mRef, { ...m, uid, timestamp: serverTimestamp() });
        });
      }

      await batch.commit();
    } catch (err) { console.error(err); }
    setView('main');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('auth');
  };

  const handleSendNotification = async (title: string, message: string) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        timestamp: serverTimestamp(),
        isRead: false,
        time: 'এখন'
      });
    } catch (e) {
      console.error("Error sending notification:", e);
      throw e;
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error("Error deleting notification:", e);
      throw e;
    }
  };

  const handleDeleteQuiz = async (id: string, type: string) => {
    try {
      const colName = type === 'paid' ? 'paid_quizzes' : 
                      type === 'live' ? 'live_quizzes' : 
                      type === 'special' ? 'admin_special_quizzes' : 
                      type === 'lesson' ? 'lessons' : 
                      type === 'written' ? 'written_quizzes' : 'mock_quizzes';
      await deleteDoc(doc(db, colName, id));
    } catch (e) {
      console.error("Error deleting quiz:", e);
      throw e;
    }
  };

  if (view === 'loading') return <div className="min-h-screen items-center justify-center bg-white flex flex-col font-hind"><div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">লোড হচ্ছে...</p></div>;

  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;

  if (view === 'setup') return <SetupScreen lang={lang} onComplete={async (name, category) => { if (!auth.currentUser) return; await setDoc(doc(db, 'users', auth.currentUser.uid), { uid: auth.currentUser.uid, name, email: auth.currentUser.email, category, balance: 0, totalPoints: 0, streak: 1, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` }); }} />;

  if (view === 'quiz' && activeSubject && quizConfig) return <QuizScreen subject={activeSubject} numQuestions={quizConfig.numQuestions} timePerQuestion={quizConfig.timePerQuestion} isPaid={quizConfig.isPaid} quizId={quizConfig.quizId} collectionName={quizConfig.collection} lang={lang} onClose={() => setView('main')} onFinish={handleFinishQuiz} />;

  if (view === 'admin') return (
    <AdminLayout 
      onExit={() => setView('main')}
      onLogout={handleLogout}
      onSendNotification={handleSendNotification}
      onDeleteNotification={handleDeleteNotification}
      onDeleteQuiz={handleDeleteQuiz}
      notifications={notifications}
    />
  );

  return <MainLayout user={user!} history={history} notifications={notifications} lessons={[]} setNotifications={setNotifications} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} isAdmin={user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()} onAdminSwitch={() => setView('admin')} onUpdateProfile={async (data) => { if (auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), data); }} onSubmitDeposit={() => {}} onSubmitWithdraw={() => {}} onLogout={handleLogout} onSubjectSelect={(subject, config) => { setActiveSubject(subject); setQuizConfig(config); setView('quiz'); }} />;
};

export default App;
