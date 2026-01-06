
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, BookOpen, Star, Zap, Image as ImageIcon, Video, X, ChevronRight, LayoutGrid, FileText, Clock, Calendar, Sparkles, Eye, CheckCircle2, Info, Edit3, Save, RotateCcw, PenTool, Pencil, FileCode, CheckSquare, Link as LinkIcon, AlertTriangle, FileSignature, ClipboardList, Database, Hash, Upload } from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, limit, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { SUBJECTS } from '../../constants';
import { Question, ExamCategory } from '../../types';
import ConfirmModal from './ConfirmModal';

interface QuizManagerProps {
  onDeleteQuiz: any;
  forcedType?: 'mock' | 'paid' | 'live' | 'lesson' | 'special' | 'written';
}

const QuizManager: React.FC<QuizManagerProps> = ({ onDeleteQuiz, forcedType }) => {
  const [activeMode, setActiveMode] = useState<'create' | 'list'>('list');
  const [quizType, setQuizType] = useState<'mock' | 'paid' | 'live' | 'lesson' | 'special' | 'written'>(forcedType || 'mock');
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);
  const [subject, setSubject] = useState('');
  
  const [duration, setDuration] = useState('15');
  const [entryFee, setEntryFee] = useState('0');
  const [prizePool, setPrizePool] = useState('0');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [commonMediaUrl, setCommonMediaUrl] = useState('');
  const [commonMediaType, setCommonMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [commonUploadProgress, setCommonUploadProgress] = useState<number | null>(null);
  const [lessonContent, setLessonContent] = useState('');

  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const [currentQ, setCurrentQ] = useState('');
  const [qMarks, setQMarks] = useState('5');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [qUploadProgress, setQUploadProgress] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    if (forcedType) setQuizType(forcedType);
  }, [forcedType]);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (s) => {
      setDynamicCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)));
    });

    const colName = 
      quizType === 'paid' ? 'paid_quizzes' : 
      quizType === 'live' ? 'live_quizzes' : 
      quizType === 'special' ? 'admin_special_quizzes' : 
      quizType === 'lesson' ? 'lessons' : 
      quizType === 'written' ? 'written_quizzes' : 'mock_quizzes';

    const unsubList = onSnapshot(query(collection(db, colName), orderBy('timestamp', 'desc'), limit(50)), (s) => {
      setQuizzes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubCats(); unsubList(); };
  }, [quizType]);

  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isCommon: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setProgress = isCommon ? setCommonUploadProgress : setQUploadProgress;
    setProgress(0);

    const timestamp = Date.now();
    const storageRef = ref(storage, `quizzes/${timestamp}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(progress));
      }, 
      (error) => {
        console.error("Upload failed:", error);
        alert("আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
        setProgress(null);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        if (isCommon) {
          setCommonMediaUrl(downloadURL);
          setCommonMediaType(file.type.startsWith('video') ? 'video' : 'image');
        } else {
          setMediaUrl(downloadURL);
          setMediaType(file.type.startsWith('video') ? 'video' : 'image');
        }
        setProgress(null);
      }
    );
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return alert("টেক্সট বক্স ফাঁকা রাখা যাবে না।");
    const lines = bulkText.split('\n').filter(l => l.trim());
    const parsed: Question[] = [];
    lines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        parsed.push({
          question: parts[0],
          options: [parts[1], parts[2], parts[3], parts[4]],
          correctAnswer: parseInt(parts[5]) || 0,
          explanation: parts[6] || "",
          marks: quizType === 'written' ? Number(parts[7] || 5) : undefined
        });
      }
    });
    if (parsed.length === 0) return alert("সঠিক ফরম্যাটে প্রশ্ন লিখুন।");
    setManualQuestions([...manualQuestions, ...parsed]);
    setBulkText(''); setShowBulkInput(false);
  };

  const addQuestionToList = () => {
    if (!currentQ.trim()) return alert("প্রশ্নটি লিখুন!");
    const isWritten = quizType === 'written';
    if (!isWritten && (opts.some(o => !o.trim()) || correctIdx === null)) return alert("সবগুলো অপশন ও সঠিক উত্তর সিলেক্ট করুন!");

    const newQ: Question = { 
      question: currentQ.trim(), 
      options: isWritten ? [] : [...opts], 
      correctAnswer: isWritten ? 0 : (correctIdx || 0),
      explanation: explanation.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
      mediaType: mediaUrl.trim() ? (mediaType === 'none' ? 'image' : mediaType) : 'none',
      marks: isWritten ? Number(qMarks) : undefined
    };
    setManualQuestions([...manualQuestions, newQ]);
    setCurrentQ(''); setOpts(['', '', '', '']); setCorrectIdx(null); setMediaUrl(''); setMediaType('none'); setExplanation(''); setQMarks('5');
  };

  const handlePublish = async () => {
    if (!title.trim() || !subject.trim()) return alert("টাইটেল ও সাবজেক্ট দিন।");
    if (quizType === 'lesson' && !lessonContent.trim()) return alert("লিসন কন্টেন্ট দিন।");
    if (quizType !== 'lesson' && manualQuestions.length === 0) return alert("অন্তত একটি প্রশ্ন যোগ করুন।");

    setIsPublishing(true);
    const colName = quizType === 'paid' ? 'paid_quizzes' : quizType === 'live' ? 'live_quizzes' : quizType === 'special' ? 'admin_special_quizzes' : quizType === 'lesson' ? 'lessons' : quizType === 'written' ? 'written_quizzes' : 'mock_quizzes';

    try {
      const data: any = {
        title, subject: subject.trim(),
        category: selectedCategory || (dynamicCategories[0]?.label || ''),
        mediaUrl: commonMediaUrl.trim() || null,
        mediaType: commonMediaUrl.trim() ? commonMediaType : 'none',
        updatedAt: serverTimestamp()
      };

      if (quizType === 'lesson') { data.content = lessonContent; } 
      else {
        data.duration = Number(duration);
        data.manualQuestions = manualQuestions;
        data.questionsCount = manualQuestions.length;
        data.status = 'active';
        data.entryFee = Number(entryFee);
        data.prizePool = Number(prizePool);
        data.isPaid = Number(entryFee) > 0;
        if (['paid', 'live', 'written', 'special'].includes(quizType)) {
          data.startTime = startTime || null; data.endTime = endTime || null;
        }
      }

      if (editingId) { await updateDoc(doc(db, colName, editingId), data); } 
      else { data.timestamp = serverTimestamp(); await addDoc(collection(db, colName), data); }
      
      alert("সফলভাবে সম্পন্ন হয়েছে!");
      resetForm(); setActiveMode('list');
    } catch (e) { alert("ব্যর্থ হয়েছে!"); } finally { setIsPublishing(false); }
  };

  const resetForm = () => {
    setTitle(''); setSubject(''); setManualQuestions([]); setLessonContent(''); setCommonMediaUrl(''); 
    setCommonMediaType('none'); setEditingId(null); setDuration('15'); setEntryFee('0'); 
    setPrizePool('0'); setStartTime(''); setEndTime('');
  };

  const executeDelete = async () => {
    try {
      await onDeleteQuiz(deleteConfirm.id, quizType);
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-8 pb-24 font-['Hind_Siliguri'] max-w-5xl mx-auto">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="ডিলিট নিশ্চিত করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" মুছে ফেলতে চান?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      {!forcedType && (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-4 block">কন্টেন্ট টাইপ নির্বাচন</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'mock', label: 'মক কুইজ', icon: <PenTool size={16}/> },
              { id: 'paid', label: 'পেইড কুইজ', icon: <Zap size={16}/> },
              { id: 'live', label: 'লাইভ এক্সাম', icon: <Clock size={16}/> },
              { id: 'lesson', label: 'লিসন', icon: <FileText size={16}/> },
              { id: 'special', label: 'স্পেশাল', icon: <Star size={16}/> },
            ].map(type => (
              <button key={type.id} onClick={() => { setQuizType(type.id as any); resetForm(); setActiveMode('list'); }} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all ${quizType === type.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          {quizType === 'written' ? <FileSignature size={28}/> : editingId ? <Pencil size={28}/> : <Plus size={28}/>} 
          {quizType === 'written' ? 'লিখিত পরীক্ষা' : quizType === 'lesson' ? 'লিসন তৈরি' : 'কুইজ তৈরি'}
        </h2>
        <div className="flex bg-slate-200/50 p-1.5 rounded-[22px] backdrop-blur-sm border border-slate-100 shadow-inner">
          <button 
            onClick={() => setActiveMode('create')} 
            className={`px-8 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'create' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
          >
            তৈরি
          </button>
          <button 
            onClick={() => { setActiveMode('list'); resetForm(); }} 
            className={`px-8 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'list' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
          >
            ম্যানেজ
          </button>
        </div>
      </div>

      {activeMode === 'create' ? (
        <div className="space-y-8 px-4 animate-in fade-in duration-500">
          <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 px-2 uppercase">টাইটেল</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: ৪৬তম বিসিএস স্পেশাল" className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100 focus:bg-white" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 px-2 uppercase">সাবজেক্ট</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="যেমন: সাধারণ বিজ্ঞান" className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100 focus:bg-white" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 px-2 uppercase">কার্ড ক্যাটাগরি</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100"><option value="">সিলেক্ট করুন</option>{dynamicCategories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">কাউন্টডাউন সময় (মিনিট)</label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border border-slate-100" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">এন্ট্রি ফি (৳) - ০ মানে ফ্রি</label>
                  <input type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="w-full bg-emerald-50 p-4 rounded-xl font-black outline-none border border-emerald-100" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-2">পুরস্কার (৳)</label>
                  <input type="number" value={prizePool} onChange={e => setPrizePool(e.target.value)} className="w-full bg-amber-50 p-4 rounded-xl font-black outline-none border border-amber-100" />
               </div>
            </div>

            <div className="space-y-4 bg-blue-50/30 p-8 rounded-[36px] border border-blue-100">
               <div className="flex items-center gap-3 mb-2"><ImageIcon className="text-blue-500" size={20}/><h4 className="font-black text-sm text-blue-900">মেইন মিডিয়া (ছবি বা ভিডিও আপলোড)</h4></div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="aspect-video bg-white rounded-3xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center relative overflow-hidden group">
                     {commonMediaUrl ? (
                        <>
                           {commonMediaType === 'image' ? <img src={commonMediaUrl} className="w-full h-full object-cover" /> : <video src={commonMediaUrl} className="w-full h-full object-cover" />}
                           <button onClick={() => setCommonMediaUrl('')} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"><X size={18}/></button>
                        </>
                     ) : commonUploadProgress !== null ? (
                        <div className="text-center">
                           <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
                           <p className="text-lg font-black text-blue-900">{commonUploadProgress}%</p>
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ফাইল আপলোড হচ্ছে...</p>
                        </div>
                     ) : (
                        <label className="cursor-pointer flex flex-col items-center p-6">
                           <Upload size={32} className="text-blue-300 mb-2" />
                           <span className="text-[10px] font-black uppercase text-blue-400">Media Upload (Img/Vid)</span>
                           <input type="file" className="hidden" accept="image/*,video/*" onChange={e => handleMediaFileUpload(e, true)} />
                        </label>
                     )}
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-blue-400 uppercase px-1">ডিরেক্ট লিঙ্ক (Optional)</label>
                        <input type="text" value={commonMediaUrl} onChange={e => setCommonMediaUrl(e.target.value)} placeholder="https://..." className="w-full bg-white p-4 rounded-2xl border border-blue-50 font-bold outline-none" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-blue-400 uppercase px-1">মিডিয়া ধরন</label>
                        <select value={commonMediaType} onChange={e => setCommonMediaType(e.target.value as any)} className="w-full bg-white p-4 rounded-2xl border border-blue-50 font-black text-xs">
                           <option value="none">No Media</option>
                           <option value="image">ছবি (Image)</option>
                           <option value="video">ভিডিও (Video)</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            {quizType === 'lesson' ? (
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 px-2 uppercase">লিসন কন্টেন্ট</label><textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="..." className="w-full h-80 bg-slate-50 p-8 rounded-[36px] font-bold outline-none border border-slate-100 shadow-inner" /></div>
            ) : (
              <>
                <div className="pt-10 border-t border-slate-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="text-xl font-black flex items-center gap-3"><LayoutGrid className="text-emerald-600" /> প্রশ্ন ব্যাংক ({manualQuestions.length})</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setShowBulkInput(!showBulkInput)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all"><ClipboardList size={16}/> {showBulkInput ? 'ম্যানুয়াল' : 'বাল্ক ইমপোর্ট'}</button>
                      <button onClick={() => setManualQuestions([])} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 rounded-xl font-black text-xs hover:bg-rose-600 hover:text-white border border-rose-100 transition-all"><RotateCcw size={16}/> সব মুছুন</button>
                    </div>
                  </div>

                  {showBulkInput ? (
                    <div className="bg-slate-900 p-8 rounded-[44px] space-y-6">
                       <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="প্রশ্ন? | অপশন ১ | অপশন ২ | অপশন ৩ | অপশন ৪ | সঠিক ইন্ডেক্স | ব্যাখ্যা | মার্কস(ঐচ্ছিক)" className="w-full h-64 bg-slate-800 border-2 border-slate-700 p-6 rounded-[32px] font-mono text-xs text-white outline-none" />
                       <button onClick={handleBulkImport} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg active:scale-95 transition-all">ইনসার্ট করুন</button>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-slate-50 p-8 rounded-[44px] border border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase px-2">প্রশ্নপত্র</label>
                           <textarea value={currentQ} onChange={e => setCurrentQ(e.target.value)} placeholder="প্রশ্নটি লিখুন..." className="w-full bg-white p-6 rounded-3xl font-bold outline-none h-24 border border-transparent focus:border-emerald-200 shadow-sm" />
                        </div>
                        {quizType === 'written' && (
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-emerald-600 uppercase px-2">মার্কস (Marks)</label>
                             <input type="number" value={qMarks} onChange={e => setQMarks(e.target.value)} className="w-full bg-white p-6 rounded-3xl font-black text-2xl text-center border-2 border-emerald-50 outline-none" />
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/50 p-6 rounded-[32px]">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase px-2">প্রশ্ন মিডিয়া (আপলোড)</label>
                           <div className="w-full aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                              {mediaUrl ? (
                                <>
                                  {mediaType === 'image' ? <img src={mediaUrl} className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" />}
                                  <button onClick={() => setMediaUrl('')} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                </>
                              ) : qUploadProgress !== null ? (
                                <div className="text-center">
                                  <Loader2 className="animate-spin mx-auto text-emerald-600 mb-1" size={20}/>
                                  <p className="text-[12px] font-black text-emerald-700">{qUploadProgress}%</p>
                                </div>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center">
                                  <Upload size={20} className="text-slate-300 mb-1" />
                                  <span className="text-[8px] font-black uppercase">File</span>
                                  <input type="file" className="hidden" accept="image/*,video/*" onChange={e => handleMediaFileUpload(e, false)} />
                                </label>
                              )}
                           </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase px-1">লিঙ্ক (ঐচ্ছিক)</label><input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." className="w-full bg-white p-3 rounded-xl text-xs font-bold outline-none border border-slate-100" /></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase px-1">মিডিয়া ধরন</label><select value={mediaType} onChange={e => setMediaType(e.target.value as any)} className="w-full bg-white p-3 rounded-xl text-xs font-black border border-slate-100"><option value="none">No Media</option><option value="image">ছবি</option><option value="video">ভিডিও</option></select></div>
                        </div>
                      </div>

                      {quizType !== 'written' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {opts.map((o, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 bg-white rounded-2xl border-2 ${correctIdx === i ? 'border-emerald-500' : 'border-transparent'}`}><button onClick={() => setCorrectIdx(i)} className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center ${correctIdx === i ? 'bg-emerald-50 text-white' : 'bg-slate-100 text-slate-400'}`}>{i+1}</button><input type="text" value={o} onChange={e => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder={`Option ${i+1}`} className="flex-grow font-bold text-sm bg-transparent outline-none" /></div>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase px-2">ব্যাখ্যা (বা উত্তর সংকেত)</label><input type="text" value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="..." className="w-full bg-white p-4 rounded-2xl font-bold outline-none shadow-sm" /></div>
                      <button onClick={addQuestionToList} disabled={qUploadProgress !== null} className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black text-sm uppercase shadow-xl disabled:opacity-50">তালিকায় যুক্ত করুন</button>
                    </div>
                  )}

                  {manualQuestions.length > 0 && (
                    <div className="mt-8 space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                       {manualQuestions.map((q, i) => (
                         <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 group">
                            <div className="flex items-center gap-5 min-w-0"><span className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{i+1}</span><div className="min-w-0"><p className="font-bold text-sm text-slate-700 truncate">{q.question}</p>{q.marks && <p className="text-[10px] text-emerald-600 font-black">Marks: {q.marks}</p>}</div></div>
                            <button onClick={() => setManualQuestions(manualQuestions.filter((_, idx)=>idx!==i))} className="p-3 text-rose-400 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18}/></button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <button onClick={handlePublish} disabled={isPublishing || commonUploadProgress !== null} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4">
              {isPublishing ? <Loader2 className="animate-spin" /> : <Sparkles size={24}/>} 
              {isPublishing ? 'পাবলিশ হচ্ছে...' : 'সফলভাবে পাবলিশ করুন'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-20">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group">
              <div>
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">{quizType}</span>
                   {q.entryFee > 0 ? (
                     <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">Paid: ৳{q.entryFee}</span>
                   ) : (
                     <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50">FREE</span>
                   )}
                 </div>
                 <h5 className="font-black text-slate-800 text-lg leading-tight mb-3 line-clamp-2">{q.title}</h5>
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <Clock size={14} className="text-slate-300"/> {q.duration || 15} মিনিট
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <LayoutGrid size={14} className="text-slate-300"/> {q.questionsCount || 0} টি প্রশ্ন
                    </div>
                 </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button 
                  onClick={() => { 
                    setEditingId(q.id); 
                    setTitle(q.title); 
                    setSubject(q.subject || ''); 
                    setManualQuestions(q.manualQuestions || []); 
                    setQuizType(q.type || quizType); 
                    setDuration(String(q.duration || '15')); 
                    setEntryFee(String(q.entryFee || '0')); 
                    setPrizePool(String(q.prizePool || '0')); 
                    setLessonContent(q.content || '');
                    setCommonMediaUrl(q.mediaUrl || '');
                    setCommonMediaType(q.mediaType || 'none');
                    setSelectedCategory(q.category || '');
                    setActiveMode('create'); 
                  }} 
                  className="flex-1 p-4.5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 font-black text-sm"
                >
                  <Edit3 size={18}/> এডিট
                </button>
                <button 
                  onClick={() => setDeleteConfirm({ show: true, id: q.id, title: q.title })} 
                  className="p-4.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
             <div className="col-span-full py-40 text-center bg-white rounded-[60px] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                   <LayoutGrid size={40}/>
                </div>
                <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">কোনো কুইজ পাওয়া যায়নি</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
