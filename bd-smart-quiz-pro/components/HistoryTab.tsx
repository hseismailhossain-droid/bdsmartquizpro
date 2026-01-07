
import React, { useState, useEffect } from 'react';
import { Bookmark, AlertCircle, CheckCircle2, Trophy, Clock, HelpCircle, ArrowRight, XCircle, FileSignature, ChevronRight, ArrowLeft, Star, MessageSquare, Info, X, Trash2, Loader2 } from 'lucide-react';
import { QuizResult, Question, WrittenSubmission } from '../types';
import AdRenderer from './AdRenderer';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import ConfirmModal from './admin/ConfirmModal';

interface HistoryTabProps {
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const [activeSubTab, setActiveSubTab] = useState<'marked' | 'mistakes' | 'exams' | 'written'>('exams');
  const [writtenSubmissions, setWrittenSubmissions] = useState<WrittenSubmission[]>([]);
  const [selectedWritten, setSelectedWritten] = useState<WrittenSubmission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, collection: string}>({ show: false, id: '', collection: '' });

  useEffect(() => {
    if (activeSubTab === 'written' && auth.currentUser) {
      const q = query(collection(db, 'written_submissions'), where('uid', '==', auth.currentUser.uid));
      const unsub = onSnapshot(q, (snap) => {
        setWrittenSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WrittenSubmission)));
      });
      return unsub;
    }
  }, [activeSubTab]);

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteDoc(doc(db, deleteConfirm.collection, deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', collection: '' });
    } catch (e) {
      alert("মুছে ফেলা সম্ভব হয়নি।");
    }
  };

  const renderContent = () => {
    if (activeSubTab === 'written') {
      return (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in duration-500">
           {writtenSubmissions.map(sub => (
             <div key={sub.id} className="relative group">
               <button onClick={() => setSelectedWritten(sub)} className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center active:scale-95 transition-all">
                  <div className="flex items-center gap-5">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><FileSignature size={28}/></div>
                     <div className="text-left"><h4 className="font-black text-slate-800 text-sm leading-tight">{sub.quizTitle}</h4><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{sub.status}</p></div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300"/>
               </button>
               <button onClick={() => setDeleteConfirm({ show: true, id: sub.id!, collection: 'written_submissions' })} className="absolute -top-2 -right-2 p-2 bg-white text-rose-500 rounded-full shadow-lg border border-rose-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={14}/></button>
             </div>
           ))}
           {writtenSubmissions.length === 0 && <EmptyState label="আপনি এখনো কোনো লিখিত পরীক্ষা দেননি" icon={<FileSignature size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'exams') {
      return (
        <div className="space-y-4 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <AdRenderer placementId="history_top" />
          {history.exams.map((res) => (
            <div key={res.id} className="relative group">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center transition-all">
                <div className="flex gap-5 items-center">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black shadow-inner"><Trophy size={28} /></div>
                  <div><h4 className="font-black text-slate-800 text-sm mb-1">{res.subject}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.date}</p></div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <p className="text-2xl font-black text-emerald-700 leading-none">{res.score}/{res.total}</p>
                  <button onClick={() => setDeleteConfirm({ show: true, id: res.id!, collection: 'quiz_attempts' })} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
          {history.exams.length === 0 && <EmptyState label="আপনি এখনো কোনো পরীক্ষা দেননি" icon={<HelpCircle size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'mistakes') {
      return (
        <div className="space-y-4 p-5 pb-24">
          {history.mistakes.map((q, i) => (
            <div key={q.id || i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-bold text-slate-800 text-sm pr-10">{q.question}</h4>
                 <button onClick={() => setDeleteConfirm({ show: true, id: q.id!, collection: 'mistakes_practice' })} className="p-2 text-rose-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16}/></button>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase mb-1">সঠিক উত্তর:</p>
                <p className="text-xs font-bold text-rose-800">{q.options[q.correctAnswer]}</p>
              </div>
            </div>
          ))}
          {history.mistakes.length === 0 && <EmptyState label="কোনো ভুল উত্তরের হিস্ট্রি নেই" icon={<CheckCircle2 size={32} />} />}
        </div>
      );
    }

    if (activeSubTab === 'marked') {
      return (
        <div className="space-y-4 p-5 pb-24">
          {history.marked.map((q, i) => (
            <div key={q.id || i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-bold text-slate-800 text-sm pr-10">{q.question}</h4>
                 <button onClick={() => setDeleteConfirm({ show: true, id: q.id!, collection: 'bookmarks' })} className="p-2 text-rose-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16}/></button>
              </div>
              <div className="space-y-2">
                 {q.options.map((opt, idx) => (
                   <div key={idx} className={`p-2.5 rounded-lg text-[11px] font-bold ${idx === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>{opt}</div>
                 ))}
              </div>
            </div>
          ))}
          {history.marked.length === 0 && <EmptyState label="বুকমার্ক করা কোনো প্রশ্ন নেই" icon={<Bookmark size={32} />} />}
        </div>
      );
    }

    return null;
  };

  if (selectedWritten) return (
    <div className="fixed inset-0 bg-white z-[1000] flex flex-col font-['Hind_Siliguri'] overflow-hidden">
       <div className="p-6 border-b flex items-center gap-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <button onClick={() => setSelectedWritten(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-all"><ArrowLeft size={24}/></button>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-none">{selectedWritten.quizTitle}</h3>
            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1.5">রেজাল্ট ও ইভালুয়েশন</p>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-20 space-y-8">
          <div className="bg-emerald-900 p-10 rounded-[44px] text-white shadow-xl relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <p className="text-[11px] font-black text-emerald-300 uppercase tracking-widest mb-2 opacity-80">আপনার মোট স্কোর</p>
             <h2 className="text-6xl font-black">{selectedWritten.totalScore}</h2>
             <div className="mt-8 flex items-center justify-center gap-3">
                <div className="px-5 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-[10px] font-black uppercase">{selectedWritten.status}</div>
             </div>
          </div>

          <div className="space-y-6">
             {selectedWritten.answers.map((ans, i) => (
               <div key={i} className="bg-slate-50 border border-slate-100 rounded-[40px] p-8 space-y-6">
                  <div className="flex justify-between items-start gap-4">
                     <h4 className="font-black text-slate-800 text-base leading-relaxed flex gap-3"><span className="text-emerald-700">প্রশ্ন {i+1}:</span> {ans.question}</h4>
                     <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-emerald-700 font-black text-sm shadow-sm">{ans.marksGained || 0}/{ans.maxMarks}</div>
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase px-2">আপনার উত্তর:</p>
                     <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-inner font-bold text-slate-600 italic leading-relaxed">"{ans.userAnswer}"</div>
                  </div>

                  {ans.modelAnswer && (
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-emerald-600 uppercase px-2 flex items-center gap-2"><CheckCircle2 size={12}/> সঠিক বা আদর্শ উত্তর:</p>
                       <div className="bg-emerald-50/50 p-6 rounded-[28px] border border-emerald-100 font-bold text-emerald-900 leading-relaxed">{ans.modelAnswer}</div>
                    </div>
                  )}

                  {ans.feedback && (
                    <div className="bg-indigo-600 p-6 rounded-[28px] text-white shadow-lg">
                       <p className="text-[10px] font-black text-indigo-200 uppercase mb-2 flex items-center gap-2"><MessageSquare size={12}/> অ্যাডমিন ফিডব্যাক:</p>
                       <p className="text-sm font-bold leading-relaxed">{ans.feedback}</p>
                    </div>
                  )}
               </div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white font-hind overflow-hidden relative">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="ডিলিট নিশ্চিত করুন"
        message="আপনি কি এই রেকর্ডটি স্থায়ীভাবে ডিলিট করতে চান?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', collection: '' })}
      />
      <div className="bg-white px-4 pt-8 pb-4 shrink-0 shadow-sm border-b">
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">আপনার অগ্রগতি</h2>
        <div className="flex justify-center bg-slate-100 p-1.5 rounded-[22px] mx-auto shadow-inner border max-w-sm gap-1">
          <HistorySubTab label="MCQ" active={activeSubTab === 'exams'} onClick={() => setActiveSubTab('exams')} />
          <HistorySubTab label="লিখন" active={activeSubTab === 'written'} onClick={() => setActiveSubTab('written')} />
          <HistorySubTab label="ভুল" active={activeSubTab === 'mistakes'} onClick={() => setActiveSubTab('mistakes')} />
          <HistorySubTab label="বুকমার্ক" active={activeSubTab === 'marked'} onClick={() => setActiveSubTab('marked')} />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto no-scrollbar">{renderContent()}</div>
    </div>
  );
};

const HistorySubTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex-1 min-w-[70px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${active ? 'bg-white text-emerald-700 shadow-sm scale-105' : 'text-slate-400'}`}>{label}</button>
);

const EmptyState = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 h-full opacity-80 min-h-[300px]">
    <div className="bg-slate-50 w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 shadow-inner text-slate-200">{icon}</div>
    <p className="text-slate-300 font-black text-[11px] uppercase tracking-widest">{label}</p>
  </div>
);

export default HistoryTab;
