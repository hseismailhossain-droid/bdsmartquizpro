
import React, { useState, useEffect } from 'react';
import { Trophy, Users, Search, ChevronRight, CheckCircle2, Star, Medal, ArrowLeft, Send, Sparkles, Loader2, Clock, Trash2 } from 'lucide-react';
import { PaidQuiz } from '../../types';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

const ResultManager: React.FC = () => {
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'paid_quizzes'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedQuiz) return;
    
    const q = query(
      collection(db, 'quiz_attempts'), 
      where('quizId', '==', selectedQuiz.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      list.sort((a: any, b: any) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const timeA = a.timestamp?.toMillis?.() || a.timestamp || 0;
        const timeB = b.timestamp?.toMillis?.() || b.timestamp || 0;
        return timeA - timeB;
      });

      setParticipants(list);
    });
    
    return () => unsubscribe();
  }, [selectedQuiz]);

  const handlePublish = async () => {
    if (!selectedQuiz || participants.length === 0) return;
    setIsPublishing(true);
    
    try {
      await updateDoc(doc(db, 'paid_quizzes', selectedQuiz.id), { status: 'ended' });
      
      const winner = participants[0];
      await addDoc(collection(db, 'winners'), {
        uid: winner.uid,
        userName: winner.userName,
        quizTitle: selectedQuiz.title,
        quizId: selectedQuiz.id,
        score: winner.score,
        total: winner.total,
        prize: selectedQuiz.prizePool || 100,
        rank: 1,
        timestamp: serverTimestamp(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.userName}`
      });

      await addDoc(collection(db, 'notifications'), {
        title: `ফলাফল প্রকাশিত: ${selectedQuiz.title}`,
        message: `বিজয়ীদের তালিকা এখন লিডারবোর্ডে এবং হোম স্ক্রিনে দেখা যাবে।`,
        time: 'এইমাত্র',
        timestamp: Date.now(),
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

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, 'paid_quizzes', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) {
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" size={40} /></div>;

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
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">রেজাল্ট ম্যানেজমেন্ট</p>
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
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div>
                  <h4 className="font-black text-slate-900">অংশগ্রহণকারী ({participants.length})</h4>
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
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ইউজার</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">স্কোর</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">সময়</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">সম্ভাব্য র‍্যাংক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {participants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <p className="font-black text-slate-900">{p.userName}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{p.uid.substring(0,8)}</p>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-base font-black text-emerald-700">{p.score}/{p.total}</span>
                      </td>
                      <td className="px-8 py-6 text-slate-400 font-bold text-xs">
                         <div className="flex items-center gap-1"><Clock size={12}/> {p.timeTaken}</div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                              idx === 0 ? 'bg-amber-500 text-white' : 
                              idx === 1 ? 'bg-slate-300 text-slate-700' : 
                              idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))}
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
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ফলাফল সেন্টার</h2>
          <p className="text-slate-400 font-bold text-sm">পেইড কুইজের ফলাফল পাবলিশ ও ম্যানেজ করুন</p>
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
                   <span className="text-[10px] font-black text-slate-300">Prize: ৳{quiz.prizePool}</span>
                   <button 
                    onClick={() => setDeleteConfirm({ show: true, id: quiz.id, title: quiz.title })}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{quiz.title}</h3>
              <p className="text-xs text-slate-400 font-bold">{quiz.subject}</p>
            </div>

            <button 
              onClick={() => setSelectedQuiz(quiz)}
              className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-700/20 active:scale-95 transition-all group-hover:-translate-y-1"
            >
              {quiz.status === 'active' ? 'অংশগ্রহণকারী ও রেজাল্ট' : 'ফলাফল পুনর্মূল্যায়ন'} <ChevronRight size={18} />
            </button>
          </div>
        ))}
        {quizzes.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[50px] border border-dashed border-slate-200">
             <Trophy size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-slate-300 font-black uppercase tracking-widest text-xs">কোনো পেইড কুইজ পাওয়া যায়নি</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ResultManager;
