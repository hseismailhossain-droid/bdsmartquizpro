import React, { useState, useEffect } from 'react';
import { Trophy, Users, Search, ChevronRight, CheckCircle2, Star, Medal, ArrowLeft, Send, Sparkles, Loader2, Clock, Trash2, FileSignature, User, ExternalLink, MessageSquare, Save, X, Edit3, HelpCircle, AlertCircle, LayoutGrid, Zap, Timer, Calendar, Phone } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, limit } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';
import { WrittenSubmission, WrittenAnswer } from '../../types';

interface ResultManagerProps {
  activeSubTab?: 'mcq' | 'written';
}

const ResultManager: React.FC<ResultManagerProps> = ({ activeSubTab = 'mcq' }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [writtenSubmissions, setWrittenSubmissions] = useState<WrittenSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [gradingSubmission, setGradingSubmission] = useState<WrittenSubmission | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // MCQ Specific filtering
  const [mcqType, setMcqType] = useState<'paid' | 'live' | 'special' |'weekly'| 'mock'>('paid');

  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string, col: string}>({
    show: false, id: '', title: '', col: ''
  });

  // Helper function to get correct collection name
  const getQuizCol = (type: string) => {
    switch (type) {
      case 'paid': return 'paid_quizzes';
      case 'live': return 'live_quizzes';
      case 'weekly': return 'admin_weekly_quizzes';
      case 'special': return 'admin_special_quizzes';
      default: return 'mock_quizzes';
    }
  };

  useEffect(() => {
    let colName = activeSubTab === 'mcq' ? getQuizCol(mcqType) : 'written_quizzes';

    const unsubQuizzes = onSnapshot(query(collection(db, colName), orderBy('timestamp', 'desc')), (snapshot) => {
      setQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    }, (err) => {
      console.error("Quiz Fetch Error:", err);
      setIsLoading(false);
    });

    let unsubSubs = () => {};
    if (activeSubTab === 'written') {
      unsubSubs = onSnapshot(query(collection(db, 'written_submissions'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
        setWrittenSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WrittenSubmission)));
      });
    }

    return () => { unsubQuizzes(); unsubSubs(); };
  }, [activeSubTab, mcqType]);

  useEffect(() => {
    if (!selectedQuiz) return;
    
    const q = query(
      collection(db, 'quiz_attempts'), 
      where('quizId', '==', selectedQuiz.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      list.sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        const timeA = a.timeTaken || 999999;
        const timeB = b.timeTaken || 999999;
        if (timeA !== timeB) return timeA - timeB;
        return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
      });

      setParticipants(list);
    });
    
    return () => unsubscribe();
  }, [selectedQuiz]);

  const handlePublish = async () => {
    if (!selectedQuiz || participants.length === 0) return;
    setIsPublishing(true);
    
    try {
      const colName = getQuizCol(mcqType);
      await updateDoc(doc(db, colName, selectedQuiz.id), { status: 'ended' });
      
      const winner = participants[0];
      await addDoc(collection(db, 'winners'), {
        uid: winner.uid,
        userName: winner.userName,
        userPhone: winner.phoneNumber || 'N/A', // নম্বর ফিল্ড যুক্ত করা হলো
        quizTitle: selectedQuiz.title,
        quizId: selectedQuiz.id,
        quizType: mcqType,
        score: winner.score,
        total: winner.total,
        prize: selectedQuiz.prizePool || 0,
        rank: 1,
        timestamp: serverTimestamp(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.userName}`
      });

      await addDoc(collection(db, 'notifications'), {
        title: `ফলাফল প্রকাশিত: ${selectedQuiz.title}`,
        message: `${winner.userName} ১ম স্থান অধিকার করেছেন! পুরস্কারের জন্য ইউজারের সাথে যোগাযোগ করা হবে।`,
        time: 'এইমাত্র',
        timestamp: serverTimestamp(),
        isRead: false
      });

      setIsPublishing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedQuiz(null);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert("ফলাফল ঘোষণা করতে সমস্যা হয়েছে।");
      setIsPublishing(false);
    }
  };

  const formatTimeTaken = (seconds: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateAnswerField = (index: number, field: keyof WrittenAnswer, value: any) => {
    if (!gradingSubmission) return;
    const newAnswers = [...gradingSubmission.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setGradingSubmission({ ...gradingSubmission, answers: newAnswers });
  };

  const handleUpdateGrade = async () => {
    if (!gradingSubmission) return;
    setIsUpdating(true);
    try {
      const total = gradingSubmission.answers.reduce((sum, a) => sum + (Number(a.marksGained) || 0), 0);
      await updateDoc(doc(db, 'written_submissions', gradingSubmission.id), {
        answers: gradingSubmission.answers,
        totalScore: total,
        status: 'graded',
        gradedAt: serverTimestamp()
      });
      alert("সফলভাবে মূল্যায়ন ও রেজাল্ট প্রকাশ করা হয়েছে!");
      setGradingSubmission(null);
    } catch (e) { alert("সেভ করা সম্ভব হয়নি।"); }
    finally { setIsUpdating(false); }
  };

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, deleteConfirm.col, deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', title: '', col: '' });
    } catch (e) { alert("মুছে ফেলতে সমস্যা হয়েছে।"); }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" size={40} /></div>;

  if (activeSubTab === 'written' && !gradingSubmission) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
         <ConfirmModal show={deleteConfirm.show} title="ডিলিট নিশ্চিত করুন" message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" এর উত্তরপত্রটি মুছতে চান?`} onConfirm={executeDelete} onCancel={() => setDeleteConfirm({ show: false, id: '', title: '', col: '' })} />
        <div className="flex justify-between items-end">
           <div>
             <h2 className="text-3xl font-black text-slate-900 leading-tight">লিখিত উত্তরপত্র মূল্যায়ন</h2>
             <p className="text-slate-400 font-bold text-sm">স্টুডেন্টদের খাতা দেখে মার্কস ও পরামর্শ দিন</p>
           </div>
        </div>
        
        <div className="space-y-6">
           {writtenSubmissions.length > 0 ? (
             writtenSubmissions.map(sub => (
               <div key={sub.id} className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><User size={24} /></div>
                        <div>
                           <h4 className="font-black text-slate-900 text-lg leading-tight">{sub.userName || 'Unknown User'}</h4>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{sub.quizTitle}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{sub.status}</div>
                        <button onClick={() => setGradingSubmission(sub)} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Edit3 size={18} /></button>
                        <button onClick={() => setDeleteConfirm({ show: true, id: sub.id, title: sub.userName, col: 'written_submissions' })} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                     </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <div className="flex items-center gap-2"><Clock size={12}/> {sub.timestamp ? new Date(sub.timestamp.seconds * 1000).toLocaleString('bn-BD') : 'এখন'}</div>
                     <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-3 py-1 rounded-lg">মোট স্কোর: <span className="text-sm font-black">{sub.totalScore || 0}</span></div>
                  </div>
               </div>
             ))
           ) : (
             <div className="py-32 text-center bg-white rounded-[50px] border border-dashed border-slate-200">
               <FileSignature size={48} className="mx-auto text-slate-100 mb-4" />
               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">কোনো রিটেন সাবমিশন পাওয়া যায়নি</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (gradingSubmission) return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 font-['Hind_Siliguri'] pb-20">
       <div className="bg-white p-8 rounded-[44px] shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-10 border-b pb-8 border-slate-50">
             <div className="flex items-center gap-4">
                <button onClick={() => setGradingSubmission(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90"><ArrowLeft size={20}/></button>
                <div>
                   <h3 className="text-xl font-black text-slate-900 leading-tight">{gradingSubmission.userName}</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{gradingSubmission.quizTitle}</p>
                </div>
             </div>
             <button onClick={handleUpdateGrade} disabled={isUpdating} className="px-8 py-4 bg-emerald-700 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                {isUpdating ? <Loader2 className="animate-spin" /> : <Save size={20} />} রেজাল্ট প্রকাশ করুন
             </button>
          </div>

          <div className="space-y-16">
             {gradingSubmission.answers?.map((ans, i) => (
               <div key={i} className="p-8 rounded-[40px] bg-slate-50 border border-slate-200 space-y-8">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-4 items-start">
                        <span className="w-10 h-10 bg-white border border-slate-200 text-emerald-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">{i+1}</span>
                        <h4 className="font-black text-slate-800 text-lg leading-relaxed pt-1">{ans.question}</h4>
                     </div>
                     <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Marks: {ans.maxMarks}</span>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase px-2">ইউজার এর উত্তর</label>
                     <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-inner font-bold text-slate-700 leading-relaxed italic">"{ans.userAnswer}"</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase px-2">সঠিক উত্তর (Model Answer)</label>
                        <textarea value={ans.modelAnswer || ''} onChange={e => updateAnswerField(i, 'modelAnswer', e.target.value)} placeholder="অ্যাডমিন হিসেবে আদর্শ উত্তরটি দিন..." className="w-full h-32 bg-white border border-blue-100 p-4 rounded-2xl font-bold text-sm outline-none focus:border-blue-400" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase px-2">পরামর্শ / ফিডব্যাক</label>
                        <textarea value={ans.feedback || ''} onChange={e => updateAnswerField(i, 'feedback', e.target.value)} placeholder="কিভাবে আরও ভালো করা যায়? পরামর্শ দিন..." className="w-full h-32 bg-white border border-indigo-100 p-4 rounded-2xl font-bold text-sm outline-none focus:border-indigo-400" />
                     </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-100 w-max">
                     <label className="text-[10px] font-black text-emerald-600 uppercase whitespace-nowrap">প্রাপ্ত নম্বর:</label>
                     <input type="number" max={ans.maxMarks} value={ans.marksGained || 0} onChange={e => updateAnswerField(i, 'marksGained', Number(e.target.value))} className="w-20 bg-slate-50 p-2 rounded-lg font-black text-center text-emerald-800 outline-none" />
                     <span className="text-[10px] text-slate-300 font-black">/ {ans.maxMarks}</span>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );

  if (selectedQuiz) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-20 font-['Hind_Siliguri']">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedQuiz(null)}
            className="flex items-center gap-2 text-slate-400 font-black text-sm hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={18} /> ফিরে যান
          </button>
          <div className="text-right">
            <h3 className="text-xl font-black text-slate-900">{selectedQuiz.title}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">রেজাল্ট ম্যানেজমেন্ট ({mcqType.toUpperCase()})</p>
          </div>
        </div>

        {showSuccess ? (
          <div className="bg-white p-20 rounded-[50px] border border-emerald-100 text-center shadow-xl animate-in zoom-in-95">
             <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles size={48} />
             </div>
             <h4 className="text-2xl font-black text-slate-900 mb-2">ফলাফল প্রকাশিত হয়েছে!</h4>
             <p className="text-slate-400 font-bold">ইউজাররা এখন লিডারবোর্ডে বিজয়ীদের দেখতে পারবে।</p>
          </div>
        ) : (
          <div className="bg-white rounded-[44px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/30 gap-4">
               <div>
                  <h4 className="font-black text-slate-900 flex items-center gap-2">অংশগ্রহণকারী ({participants.length}) {selectedQuiz.collectNumber && <Phone size={14} className="text-emerald-500"/>}</h4>
                  <p className="text-xs text-slate-400 font-bold">অটো-সর্ট করা হয়েছে (স্কোর ও সময়)</p>
               </div>
               <button 
                onClick={handlePublish}
                disabled={isPublishing || participants.length === 0}
                className="bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 transition-all"
               >
                 {isPublishing ? <Loader2 className="animate-spin" /> : <><Send size={18} /> রেজাল্ট পাবলিশ করুন</>}
               </button>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ইউজার ও ফোন</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">স্কোর</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">সময়</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">র‍্যাংক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {participants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userName}`} alt=""/>
                            </div>
                            <div>
                               <p className="font-black text-slate-900 text-sm">{p.userName}</p>
                               <p className="text-[10px] text-emerald-600 font-black">{p.phoneNumber || 'N/A'}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-base font-black text-emerald-700">{p.score}/{p.total}</span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-1.5 text-slate-500 font-black text-xs">
                            <Timer size={14} className="text-slate-300"/> {formatTimeTaken(p.timeTaken)}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                              idx === 0 ? 'bg-amber-500 text-white shadow-lg' : 
                              idx === 1 ? 'bg-slate-300 text-slate-700' : 
                              idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                       <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase text-xs">এই কুইজে কেউ অংশগ্রহণ করেনি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show} 
        title="কুইজ মুছে ফেলুন" 
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" কুইজটি ডিলিট করতে চান? এটি চিরতরে মুছে যাবে।`} 
        onConfirm={executeDelete} 
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '', col: '' })} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ফলাফল সেন্টার</h2>
          <p className="text-slate-400 font-bold text-sm">MCQ কুইজের অংশগ্রহণকারী ও রেজাল্ট ম্যানেজ করুন</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[22px] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar gap-1">
           {[
             { id: 'paid', label: 'Paid', icon: <Zap size={14}/> },
             { id: 'live', label: 'Live', icon: <Clock size={14}/> },
             { id: 'special', label: 'Special', icon: <Star size={14}/> },
             { id: 'weekly', label: 'weekly', icon: <Calendar size={14}/> },
             { id: 'mock', label: 'Mock', icon: <LayoutGrid size={14}/> }
           ].map(t => (
             <button 
              key={t.id} 
              onClick={() => { setMcqType(t.id as any); setSelectedQuiz(null); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] font-black text-[10px] uppercase transition-all ${mcqType === t.id ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {t.icon} {t.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-all group relative">
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${quiz.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {quiz.status === 'active' ? 'Active' : 'Ended'}
                </span>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-300">Prize: ৳{quiz.prizePool || 0}</span>
                   <button 
                    onClick={() => setDeleteConfirm({ 
                      show: true, id: quiz.id, title: quiz.title, 
                      col: getQuizCol(mcqType) 
                    })}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{quiz.title}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span>{quiz.subject}</span>
                {quiz.collectNumber && <Phone size={12} className="text-emerald-500"/>}
              </div>
            </div>

            <button 
              onClick={() => setSelectedQuiz(quiz)}
              className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-700/20 active:scale-95 transition-all group-hover:-translate-y-1"
            >
              অংশগ্রহণকারী ও রেজাল্ট <ChevronRight size={18} />
            </button>
          </div>
        ))}
        {quizzes.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[50px] border border-dashed border-slate-200">
             <Trophy size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-slate-300 font-black uppercase tracking-widest text-xs">কোনো কুইজ পাওয়া যায়নি</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ResultManager;
