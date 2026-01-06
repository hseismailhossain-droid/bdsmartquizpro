
import React, { useState, useEffect } from 'react';
import { Bookmark, AlertCircle, CheckCircle2, Trophy, Clock, HelpCircle, ArrowRight, XCircle, FileSignature, ChevronRight, ArrowLeft, Star, MessageSquare, Info, X, Trash2, AlertTriangle } from 'lucide-react';
import { QuizResult, Question, WrittenSubmission } from '../types';
import AdRenderer from './AdRenderer';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface HistoryTabProps {
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const [activeSubTab, setActiveSubTab] = useState<'marked' | 'mistakes' | 'exams' | 'written'>('exams');
  const [writtenSubmissions, setWrittenSubmissions] = useState<WrittenSubmission[]>([]);
  const [selectedWritten, setSelectedWritten] = useState<WrittenSubmission | null>(null);
  
  // Delete States
  const [itemToDelete, setItemToDelete] = useState<{id: string, title: string, type: 'mcq' | 'written'} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'written' && auth.currentUser) {
      const q = query(collection(db, 'written_submissions'), where('uid', '==', auth.currentUser.uid));
      const unsub = onSnapshot(q, (snap) => {
        setWrittenSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WrittenSubmission)));
      });
      return unsub;
    }
  }, [activeSubTab]);

  const removeMistake = async (id: string) => {
    try { await deleteDoc(doc(db, 'mistakes_practice', id)); } catch(e) {}
  };

  const removeBookmark = async (id: string) => {
    try { await deleteDoc(doc(db, 'bookmarks', id)); } catch(e) {}
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const collectionName = itemToDelete.type === 'mcq' ? 'quiz_attempts' : 'written_submissions';
      await deleteDoc(doc(db, collectionName, itemToDelete.id));
      setItemToDelete(null);
    } catch (e) {
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (activeSubTab === 'mistakes') {
      return (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in duration-500">
           <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 mb-4">
              <h4 className="font-black text-rose-700 text-xs uppercase flex items-center gap-2"><AlertCircle size={14}/> ভুলগুলো সংশোধন করুন</h4>
              <p className="text-[10px] text-rose-400 font-bold mt-1">এখানে আপনার ভুল করা শেষ ১০০টি প্রশ্ন জমা আছে।</p>
           </div>
           {history.mistakes.map((q: any) => (
             <div key={q.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 relative group">
                <button onClick={() => removeMistake(q.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={18}/></button>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed">{q.question}</h4>
                <div className="grid grid-cols-2 gap-2">
                   {q.options.map((opt: string, i: number) => (
                     <div key={i} className={`p-3 rounded-xl text-[10px] font-bold ${i === q.correctAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>{opt}</div>
                   ))}
                </div>
                {q.explanation && (
                  <div className="p-3 bg-blue-50 rounded-xl text-[10px] font-bold text-blue-600 border border-blue-100">
                     ব্যাখ্যা: {q.explanation}
                  </div>
                )}
             </div>
           ))}
           {history.mistakes.length === 0 && <EmptyState label="এখনো কোনো ভুল প্রশ্ন নেই" icon={<CheckCircle2 size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'marked') {
      return (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in duration-500">
           {history.marked.map((q: any) => (
             <div key={q.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 relative group">
                <button onClick={() => removeBookmark(q.id)} className="absolute top-4 right-4 text-rose-500 bg-rose-50 p-2 rounded-xl active:scale-90 transition-all"><Trash2 size={16}/></button>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed pr-8">{q.question}</h4>
                <div className="grid grid-cols-2 gap-2">
                   {q.options.map((opt: string, i: number) => (
                     <div key={i} className={`p-3 rounded-xl text-[10px] font-bold ${i === q.correctAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>{opt}</div>
                   ))}
                </div>
                {q.explanation && <div className="p-3 bg-amber-50 rounded-xl text-[10px] font-bold text-amber-700 border border-amber-100">নোট: {q.explanation}</div>}
             </div>
           ))}
           {history.marked.length === 0 && <EmptyState label="আপনার বুকমার্ক করা কোনো প্রশ্ন নেই" icon={<Bookmark size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'exams') {
      return (
        <div className="space-y-4 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <AdRenderer placementId="history_top" />
          {history.exams.map((res) => (
            <div key={res.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all relative overflow-hidden">
              <div className="flex gap-5 items-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black shadow-inner"><Trophy size={28} /></div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm mb-1 truncate max-w-[150px]">{res.subject}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-700 leading-none">{res.score}/{res.total}</p>
                </div>
                <button 
                  onClick={() => setItemToDelete({ id: res.id || '', title: res.subject, type: 'mcq' })}
                  className="p-2.5 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {history.exams.length === 0 && <EmptyState label="আপনি এখনো কোনো পরীক্ষা দেননি" icon={<HelpCircle size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'written') {
      return (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in duration-500">
           {writtenSubmissions.map(sub => (
             <div key={sub.id} className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group transition-all">
                <button onClick={() => setSelectedWritten(sub)} className="flex items-center gap-5 flex-1 text-left active:scale-95 transition-transform overflow-hidden">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><FileSignature size={28}/></div>
                   <div className="min-w-0"><h4 className="font-black text-slate-800 text-sm truncate">{sub.quizTitle}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{sub.status}</p></div>
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setItemToDelete({ id: sub.id, title: sub.quizTitle, type: 'written' })}
                    className="p-2.5 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
             </div>
           ))}
           {writtenSubmissions.length === 0 && <EmptyState label="আপনি কোনো লিখিত পরীক্ষা দেননি" icon={<FileSignature size={32} />} />}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white font-hind overflow-hidden relative">
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center animate-in zoom-in-95 shadow-2xl border border-white/20 relative">
            <button onClick={() => setItemToDelete(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">ডিলিট নিশ্চিত করুন?</h4>
            <p className="text-sm text-slate-400 font-bold mb-10 leading-relaxed px-4">
              আপনি কি নিশ্চিতভাবে এটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব হবে না।
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="w-full bg-rose-600 text-white py-6 rounded-[28px] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'হ্যাঁ, ডিলিট করুন'}
              </button>
              <button 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="w-full bg-slate-100 text-slate-500 py-6 rounded-[28px] font-black text-sm active:scale-95"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedWritten && (
        <div className="bg-white px-4 pt-8 pb-4 shrink-0 shadow-sm border-b">
          <h2 className="text-2xl font-black text-slate-900 mb-6 px-4">আপনার অগ্রগতি</h2>
          <div className="flex justify-around bg-slate-50 p-1.5 rounded-[22px] mx-2 shadow-inner border overflow-x-auto no-scrollbar gap-1">
            <HistorySubTab label="MCQ" active={activeSubTab === 'exams'} onClick={() => setActiveSubTab('exams')} />
            <HistorySubTab label="লিখন" active={activeSubTab === 'written'} onClick={() => setActiveSubTab('written')} />
            <HistorySubTab label="ভুল" active={activeSubTab === 'mistakes'} onClick={() => setActiveSubTab('mistakes')} />
            <HistorySubTab label="বুকমার্ক" active={activeSubTab === 'marked'} onClick={() => setActiveSubTab('marked')} />
          </div>
        </div>
      )}
      <div className="flex-grow overflow-y-auto no-scrollbar">{renderContent()}</div>
    </div>
  );
};

const HistorySubTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex-1 min-w-[70px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>{label}</button>
);

const EmptyState = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 h-full opacity-80 min-h-[300px]">
    <div className="bg-slate-50 w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 shadow-inner text-slate-200">{icon}</div>
    <p className="text-slate-300 font-black text-[11px] uppercase tracking-widest">{label}</p>
  </div>
);

export default HistoryTab;
