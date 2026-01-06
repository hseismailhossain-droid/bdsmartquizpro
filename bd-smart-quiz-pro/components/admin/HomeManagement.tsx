
import React, { useState, useEffect } from 'react';
import { BarChart3, Image as ImageIcon, Plus, Trash2, Save, Loader2, X, Send, Camera, Music, Headphones } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

const HomeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poll' | 'notice' | 'audio'>('poll');
  const [isSaving, setIsSaving] = useState(false);
  
  // Poll States
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [polls, setPolls] = useState<any[]>([]);

  // Notice States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImage, setNoticeImage] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);

  // Audio States
  const [audioTitle, setAudioTitle] = useState('');
  const [audioArtist, setAudioArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audios, setAudios] = useState<any[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, type: 'poll' | 'notice' | 'audio', id: string, title: string}>({
    show: false, type: 'poll', id: '', title: ''
  });

  useEffect(() => {
    const unsubPolls = onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc')), (snap) => {
      setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc')), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAudios = onSnapshot(query(collection(db, 'admin_mind_relax_audio'), orderBy('timestamp', 'desc')), (snap) => {
      setAudios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPolls(); unsubNotices(); unsubAudios(); };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) return alert("১ এমবি-র ছোট ছবি দিন।");
      const reader = new FileReader();
      reader.onloadend = () => setNoticeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return alert("সবগুলো অপশন পূরণ করুন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'admin_polls'), {
        question: pollQuestion.trim(),
        options: pollOptions.map(o => ({ text: o.trim(), votes: 0 })),
        active: true,
        votedBy: [],
        timestamp: serverTimestamp()
      });
      setPollQuestion(''); 
      setPollOptions(['', '']);
      alert("পোল সফলভাবে তৈরি হয়েছে!");
    } catch (e) { alert("পোল পোস্ট করা সম্ভব হয়নি।"); }
    finally { setIsSaving(false); }
  };

  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return alert("টাইটেল ও কন্টেন্ট দিন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'admin_notices'), {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        image: noticeImage,
        active: true,
        timestamp: serverTimestamp()
      });
      setNoticeTitle(''); 
      setNoticeContent(''); 
      setNoticeImage(null);
      alert("নোটিশ সফলভাবে পাবলিশ হয়েছে!");
    } catch (e) { alert("নোটিশ পোস্ট করা সম্ভব হয়নি।"); }
    finally { setIsSaving(false); }
  };

  const handleSaveAudio = async () => {
    if (!audioTitle.trim() || !audioUrl.trim()) return alert("সূরা ও অডিও লিঙ্ক দিন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'admin_mind_relax_audio'), {
        title: audioTitle.trim(),
        artist: audioArtist.trim() || 'বিখ্যাত ক্বারী',
        url: audioUrl.trim(),
        timestamp: serverTimestamp()
      });
      setAudioTitle(''); setAudioArtist(''); setAudioUrl('');
      alert("অডিও সফলভাবে যুক্ত হয়েছে!");
    } catch (e) { alert("অডিও সেভ করা সম্ভব হয়নি।"); }
    finally { setIsSaving(false); }
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    const { type, id } = deleteConfirm;
    setDeleteConfirm(prev => ({ ...prev, show: false, id: '', title: '' }));
    try {
      const col = type === 'poll' ? 'admin_polls' : type === 'notice' ? 'admin_notices' : 'admin_mind_relax_audio';
      await deleteDoc(doc(db, col, id));
    } catch (e) { alert("মুছে ফেলা যায়নি।"); }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="ডিলিট নিশ্চিত করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" মুছে ফেলতে চান?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm(prev => ({ ...prev, show: false, id: '', title: '' }))}
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">হোম ম্যানেজমেন্ট</h2>
          <p className="text-slate-400 font-bold text-sm">অ্যাপের হোম কন্টেন্ট আপডেট করুন</p>
        </div>
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('poll')} className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'poll' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>পোল তৈরি</button>
          <button onClick={() => setActiveTab('notice')} className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'notice' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>নোটিশ বোর্ড</button>
          <button onClick={() => setActiveTab('audio')} className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'audio' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>অডিও ম্যানেজমেন্ট</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'poll' ? (
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl"><BarChart3 size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900">নতুন পোল তৈরি করুন</h3>
               </div>
               <div className="space-y-6">
                  <textarea value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="পোলের প্রশ্ন লিখুন..." className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold outline-none h-24 focus:bg-white transition-all" />
                  <div className="space-y-4">
                    {pollOptions.map((opt, i) => (
                      <input key={i} type="text" value={opt} onChange={(e) => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} placeholder={`Option ${i+1}`} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none focus:bg-white" />
                    ))}
                    {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-emerald-700 font-black text-xs flex items-center gap-2 mt-2"><Plus size={14}/> অপশন যোগ করুন</button>}
                  </div>
                  <button onClick={handleSavePoll} disabled={isSaving} className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <><Send size={22} /> পোল সেভ করুন</>}</button>
               </div>
            </div>
          ) : activeTab === 'notice' ? (
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl"><ImageIcon size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900">নোটিশ বোর্ড আপডেট</h3>
               </div>
               <div className="space-y-6">
                  <input type="text" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="নোটিশ টাইটেল" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black outline-none focus:bg-white" />
                  <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="বিস্তারিত লিখুন..." className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold outline-none h-40 focus:bg-white" />
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase px-2">ছবি (ঐচ্ছিক)</label>
                     <button onClick={() => document.getElementById('notice-img')?.click()} className="flex items-center gap-2 px-6 py-4 bg-slate-100 rounded-2xl text-slate-600 font-black text-xs uppercase"><Camera size={18}/> {noticeImage ? 'পরিবর্তন করুন' : 'ছবি আপলোড'}</button>
                     <input type="file" id="notice-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     {noticeImage && <div className="mt-4 w-full h-40 rounded-3xl overflow-hidden border"><img src={noticeImage} className="w-full h-full object-cover" alt="preview" /></div>}
                  </div>
                  <button onClick={handleSaveNotice} disabled={isSaving} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <><Send size={22} /> নোটিশ পাবলিশ করুন</>}</button>
               </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-bottom duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl"><Music size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900">মাইন্ড রিল্যাক্স অডিও যোগ করুন</h3>
               </div>
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input type="text" value={audioTitle} onChange={(e) => setAudioTitle(e.target.value)} placeholder="সূরার নাম" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black outline-none" />
                     <input type="text" value={audioArtist} onChange={(e) => setAudioArtist(e.target.value)} placeholder="ক্বারীর নাম" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black outline-none" />
                  </div>
                  <input type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="অডিও ডাইরেক্ট লিঙ্ক (MP3 URL)" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black outline-none" />
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                     <Headphones size={18} className="text-blue-500 mt-1" />
                     <p className="text-[10px] text-blue-700 font-bold leading-relaxed">টিপস: কপিরাইট এড়িয়ে চলতে 'No Copyright' বা অনুমোদিত এমপি৩ লিঙ্ক ব্যবহার করুন। গুগল ড্রাইভ বা ড্রপবক্স ডাইরেক্ট লিঙ্কও কাজ করবে।</p>
                  </div>
                  <button onClick={handleSaveAudio} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <><Save size={22} /> অডিও সেভ করুন</>}</button>
               </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <h4 className="font-black text-slate-900 text-lg px-2">পূর্বের পোস্টসমূহ</h4>
           <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
              {activeTab === 'poll' ? (
                polls.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4">
                     <div className="flex justify-between items-start"><h5 className="font-black text-slate-800 text-sm leading-tight pr-4">{p.question}</h5><button onClick={() => setDeleteConfirm({ show: true, type: 'poll', id: p.id, title: p.question })} className="text-rose-500 shrink-0"><Trash2 size={16}/></button></div>
                     <div className="space-y-2">{p.options.map((o: any, i: number) => (<div key={i} className="flex justify-between text-[10px] font-bold text-slate-400"><span>{o.text}</span><span>{o.votes} ভোট</span></div>))}</div>
                  </div>
                ))
              ) : activeTab === 'notice' ? (
                notices.map(n => (
                  <div key={n.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4">
                     <div className="flex justify-between items-start"><div><h5 className="font-black text-slate-800 text-sm leading-tight">{n.title}</h5><p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1">{n.content}</p></div><button onClick={() => setDeleteConfirm({ show: true, type: 'notice', id: n.id, title: n.title })} className="text-rose-500 shrink-0"><Trash2 size={16}/></button></div>
                     {n.image && <img src={n.image} className="w-full h-24 object-cover rounded-xl" alt=""/>}
                  </div>
                ))
              ) : (
                audios.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Music size={18}/></div>
                        <div><h5 className="font-black text-slate-800 text-xs">{a.title}</h5><p className="text-[9px] text-slate-400 font-bold uppercase">{a.artist}</p></div>
                     </div>
                     <button onClick={() => setDeleteConfirm({ show: true, type: 'audio', id: a.id, title: a.title })} className="text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                  </div>
                ))
              )}
              {(activeTab === 'poll' ? polls : activeTab === 'notice' ? notices : audios).length === 0 && <div className="p-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest border border-dashed rounded-[32px]">কোনো ডাটা নেই</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HomeManagement;
