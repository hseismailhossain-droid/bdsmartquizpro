
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Save, Loader2, Power, Code, Hash, 
  ImageIcon, ExternalLink, Trash2, Video, 
  MonitorPlay, Link as LinkIcon, Info, Settings, 
  ChevronRight, Eye, PlayCircle, Sparkles, AlertCircle, Plus, List, ArrowDownNarrowWide, CheckCircle2, XCircle, Upload, X
} from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AdUnit } from '../../types';
import ConfirmModal from './ConfirmModal';

const PLACEMENT_OPTIONS = [
  { id: 'home_top', label: 'হোম পেজ (উপরে)' },
  { id: 'home_middle', label: 'হোম পেজ (মাঝখানে)' },
  { id: 'home_bottom', label: 'হোম পেজ (নিচে)' },
  { id: 'feed_top', label: 'ফিড পেজ (উপরে)' },
  { id: 'feed_middle', label: 'ফিড পেজ (মাঝখানে)' },
  { id: 'exam_top', label: 'পরীক্ষা পেজ (উপরে)' },
  { id: 'exam_bottom', label: 'পরীক্ষা পেজ (নিচে)' },
  { id: 'history_top', label: 'হিস্ট্রি পেজ (উপরে)' },
  { id: 'leaderboard_top', label: 'র‍্যাংক পেজ (উপরে)' },
  { id: 'quiz_start', label: 'কুইজ শুরুর আগে' },
  { id: 'quiz_end', label: 'কুইজ শেষ হলে' }
];

const AdsManager: React.FC = () => {
  const [ads, setAds] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAd, setEditingAd] = useState<Partial<AdUnit> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, label: string}>({
    show: false, id: '', label: ''
  });

  // Form State
  const [formData, setFormData] = useState<Partial<AdUnit>>({
    label: '',
    placementId: 'home_middle',
    network: 'custom',
    adType: 'image',
    content: '',
    link: '',
    active: true,
    order: 1
  });

  useEffect(() => {
    const q = query(collection(db, 'ad_units'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdUnit));
      data.sort((a, b) => {
        const pCompare = (a.placementId || '').localeCompare(b.placementId || '');
        if (pCompare !== 0) return pCompare;
        return (a.order || 0) - (b.order || 0);
      });
      setAds(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `ads/${timestamp}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Upload failed:", error);
          alert("আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData({ ...formData, content: downloadURL });
          setUploadProgress(null);
        }
      );
    } catch (error) {
      console.error("Upload initialization failed:", error);
      setUploadProgress(null);
    }
  };

  const handleToggleStatus = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ad_units', adId), { active: !currentStatus });
    } catch (e) {
      alert("স্টেটাস পরিবর্তন করা যায়নি।");
    }
  };

  const handleSave = async () => {
    if (!formData.label?.trim() || !formData.content?.trim()) return alert("সব তথ্য সঠিকভাবে পূরণ করুন।");
    setIsSaving(true);
    try {
      const finalData = {
        ...formData,
        order: Number(formData.order) || 0,
        updatedAt: Date.now()
      };

      if (view === 'edit' && editingAd?.id) {
        await updateDoc(doc(db, 'ad_units', editingAd.id), finalData);
        alert("বিজ্ঞাপন আপডেট হয়েছে!");
      } else {
        await addDoc(collection(db, 'ad_units'), {
          ...finalData,
          timestamp: serverTimestamp()
        });
        alert("নতুন বিজ্ঞাপন যোগ হয়েছে!");
      }
      setView('list');
      resetForm();
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      placementId: 'home_middle',
      network: 'custom',
      adType: 'image',
      content: '',
      link: '',
      active: true,
      order: 1
    });
    setEditingAd(null);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'ad_units', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', label: '' });
    } catch (e) { alert("ডিলিট ব্যর্থ হয়েছে।"); }
  };

  const startEdit = (ad: AdUnit) => {
    setEditingAd(ad);
    setFormData(ad);
    setView('edit');
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" /></div>;

  return (
    <div className="space-y-10 pb-20 font-['Hind_Siliguri'] max-w-6xl mx-auto px-4">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="বিজ্ঞাপন ডিলিট"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.label}" বিজ্ঞাপনটি মুছে ফেলতে চান?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', label: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Ad Placement Manager</h2>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">ELITE MODE</div>
          </div>
          <p className="text-slate-400 font-bold text-sm italic">যে স্লটে অ্যাড দিবেন সেটি শুধুমাত্র সেই পেইজের সেই জায়গাতেই দেখাবে।</p>
        </div>
        
        {view === 'list' ? (
          <button 
            onClick={() => { resetForm(); setView('create'); }}
            className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-700/20 active:scale-95 transition-all"
          >
            <Plus size={20} /> নতুন বিজ্ঞাপন
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
          >
            <List size={20} /> লিস্টে ফিরে যান
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
           {ads.map(ad => (
             <div key={ad.id} className={`bg-white p-6 rounded-[40px] border-2 transition-all group relative overflow-hidden ${ad.active ? 'border-emerald-100 shadow-emerald-100/50 shadow-xl' : 'border-slate-100 grayscale-[0.5] opacity-80 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl flex items-center gap-2 ${ad.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      {ad.adType === 'image' ? <ImageIcon size={20}/> : ad.adType === 'video' ? <Video size={20}/> : <Code size={20}/>}
                   </div>
                   <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleToggleStatus(ad.id, ad.active)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${ad.active ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                         <Power size={16}/>
                      </button>
                      <button onClick={() => startEdit(ad)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-700 rounded-xl transition-colors"><Settings size={16}/></button>
                      <button onClick={() => setDeleteConfirm({show: true, id: ad.id, label: ad.label})} className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 size={16}/></button>
                   </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{ad.label}</h4>
                  <div className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 uppercase inline-block mt-2">
                    {PLACEMENT_OPTIONS.find(p=>p.id === ad.placementId)?.label || ad.placementId}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider border-t pt-4">
                   <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md ${ad.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {ad.network}
                      </span>
                      <span className="text-slate-300">Order: {ad.order}</span>
                   </div>
                   <div className={`flex items-center gap-1 ${ad.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {ad.active ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {ad.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-sm border border-slate-100 space-y-10 animate-in slide-in-from-bottom-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">বিজ্ঞাপনের নাম</label>
                <input 
                  type="text" value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})} 
                  placeholder="যেমন: হোম পেজ ব্যানার ২"
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">কোথায় দেখাবে (Placement Slot)</label>
                <select 
                  value={formData.placementId} 
                  onChange={e => setFormData({...formData, placementId: e.target.value})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  {PLACEMENT_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">অ্যাড নেটওয়ার্ক</label>
                <select 
                  value={formData.network} 
                  onChange={e => setFormData({...formData, network: e.target.value as any})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  <option value="custom">নিজের বিজ্ঞাপন (Custom Banner)</option>
                  <option value="adsense">Google AdSense</option>
                  <option value="admob">Google AdMob</option>
                  <option value="adsterra">Adsterra</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">ধরন</label>
                <select 
                  value={formData.adType} 
                  onChange={e => setFormData({...formData, adType: e.target.value as any})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  <option value="image">ছবি (File/URL)</option>
                  <option value="video">ভিডিও (File/URL)</option>
                  <option value="script">কোড (HTML Script)</option>
                  <option value="id">স্লট আইডি (Slot ID)</option>
                </select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">কন্টেন্ট বা কোড</label>
              <div className="flex flex-col gap-6">
                 {(formData.adType === 'image' || formData.adType === 'video') && (
                    <div className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden group">
                       {formData.content ? (
                          <>
                             {formData.adType === 'image' ? <img src={formData.content} className="w-full h-full object-contain" /> : <video src={formData.content} className="w-full h-full object-contain" controls />}
                             <button onClick={() => setFormData({...formData, content: ''})} className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X/></button>
                          </>
                       ) : uploadProgress !== null ? (
                          <div className="text-center">
                             <Loader2 className="animate-spin mx-auto text-emerald-600 mb-2" />
                             <p className="text-xl font-black text-emerald-700">{uploadProgress}%</p>
                             <p className="text-[10px] font-black tracking-widest uppercase">আপলোড হচ্ছে...</p>
                          </div>
                       ) : (
                          <label className="cursor-pointer flex flex-col items-center p-10">
                             <Upload size={40} className="text-slate-300 mb-4" />
                             <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Click to Upload Media</span>
                             <input type="file" className="hidden" accept={formData.adType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileUpload} />
                          </label>
                       )}
                    </div>
                 )}
                 <textarea 
                   value={formData.content} 
                   onChange={e => setFormData({...formData, content: e.target.value})}
                   placeholder={formData.adType === 'script' ? '<script>...</script>' : formData.adType === 'id' ? 'Slot ID Number' : 'অথবা ডিরেক্ট লিঙ্ক লিখুন...'}
                   className="w-full h-40 bg-slate-50 p-6 rounded-[32px] font-mono text-xs border border-slate-100 outline-none focus:bg-white transition-all shadow-inner"
                 />
              </div>
           </div>

           <button 
            onClick={handleSave} 
            disabled={isSaving || uploadProgress !== null}
            className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> {view === 'edit' ? 'আপডেট করুন' : 'পাবলিশ করুন'}</>}
           </button>
        </div>
      )}
    </div>
  );
};

export default AdsManager;
