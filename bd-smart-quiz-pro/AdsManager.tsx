import React, { useState, useEffect } from 'react';
import { ImageIcon, MonitorPlay, Code, Save, Eye, Trash2, Loader2, Plus, ExternalLink, Upload } from 'lucide-react';
import { db, storage } from '../../services/firebase'; // storage ইম্পোর্ট নিশ্চিত করুন
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage এর ফাংশনসমূহ
import ConfirmModal from './ConfirmModal';

const AdsManager: React.FC = () => {
  const [adType, setAdType] = useState<'image' | 'video' | 'html'>('image');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // আপলোডিং স্টেট
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [adLabel, setAdLabel] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAds(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // সরাসরি ছবি আপলোড করার ফাংশন
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setMediaUrl(url); // আপলোড শেষে লিঙ্কটি স্টেট-এ সেভ হবে
      alert("ছবি আপলোড সফল হয়েছে!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("ছবি আপলোড করতে সমস্যা হয়েছে। স্টোরেজ রুলস চেক করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAd = async () => {
    if (adType === 'html') {
      if (!htmlCode.trim()) return alert("HTML কোড দিন");
    } else {
      if (!adLabel.trim() || !mediaUrl.trim()) return alert("লেবেল এবং ছবি/ভিডিও অবশ্যই প্রয়োজন");
    }

    setIsSaving(true);
    try {
      const adData: any = {
        type: adType,
        timestamp: serverTimestamp(),
      };

      if (adType === 'html') {
        adData.html = htmlCode;
      } else {
        adData.label = adLabel.trim();
        adData.mediaUrl = mediaUrl.trim();
        adData.targetUrl = targetUrl.trim() || "";
      }

      await addDoc(collection(db, 'ads'), adData);
      alert("বিজ্ঞাপনটি সফলভাবে যুক্ত হয়েছে!");
      setAdLabel(''); setMediaUrl(''); setTargetUrl(''); setHtmlCode('');
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, 'ads', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) {
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="বিজ্ঞাপন ডিলিট করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" বিজ্ঞাপনটি মুছে ফেলতে চান?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-black text-gray-900">বিজ্ঞাপন কন্ট্রোল</h2>
        <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setAdType('image')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${adType === 'image' ? 'bg-emerald-700 text-white' : 'text-gray-400'}`}>ব্যানার</button>
          <button onClick={() => setAdType('video')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${adType === 'video' ? 'bg-emerald-700 text-white' : 'text-gray-400'}`}>ভিডিও</button>
          <button onClick={() => setAdType('html')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${adType === 'html' ? 'bg-emerald-700 text-white' : 'text-gray-400'}`}>কোড</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <ImageIcon className="text-emerald-700" /> নতুন বিজ্ঞাপন যুক্ত করুন
            </h3>

            <div className="space-y-6">
              {adType === 'html' ? (
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block px-2">HTML/JS কোড</label>
                   <textarea 
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="w-full h-48 bg-slate-50 p-6 rounded-[24px] outline-none border border-slate-100 focus:bg-white" 
                    placeholder="<div id='ads'>...</div>" 
                   />
                </div>
              ) : (
                <>
                  <InputGroup label="বিজ্ঞাপনের নাম" placeholder="যেমন: নতুন বিসিএস কোর্স" value={adLabel} onChange={(e: any) => setAdLabel(e.target.value)} />
                  
                  {/* ইমেজ আপলোড অপশন */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-2">ছবি বা ভিডিও আপলোড</label>
                    <div className="flex gap-4">
                      <input 
                        type="file" 
                        accept={adType === 'image' ? "image/*" : "video/*"}
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="flex-grow flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-3xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                        {isUploading ? <Loader2 className="animate-spin text-emerald-700" /> : <Upload size={20} className="text-emerald-700" />}
                        <span className="text-sm font-bold text-slate-600">{mediaUrl ? "পরিবর্তন করুন" : "ফাইল সিলেক্ট করুন"}</span>
                      </label>
                    </div>
                  </div>

                  <InputGroup label="লিঙ্ক (URL)" placeholder="আপলোড করলে অটো পূর্ণ হবে" value={mediaUrl} onChange={(e: any) => setMediaUrl(e.target.value)} />
                  <InputGroup label="টার্গেট লিঙ্ক (Target URL)" placeholder="https://yourwebsite.com" value={targetUrl} onChange={(e: any) => setTargetUrl(e.target.value)} />
                </>
              )}
              
              <button onClick={handleSaveAd} disabled={isSaving || isUploading} className="w-full bg-emerald-700 text-white py-5 rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> বিজ্ঞাপন সেভ করুন</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-black text-gray-900 text-lg px-2 flex items-center gap-2">সক্রিয় অ্যাডসমূহ</h4>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden">
                  {ad.type === 'image' ? <img src={ad.mediaUrl} className="w-full h-full object-cover" alt="" /> : <MonitorPlay size={32} className="m-auto mt-6 text-emerald-300" />}
                </div>
                <p className="font-black text-slate-900 text-sm truncate px-2">{ad.label || 'HTML Ad'}</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm({show: true, id: ad.id, title: ad.label || 'Ad Item'})} className="w-full p-3 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center gap-2 font-bold text-xs"><Trash2 size={16} /> ডিলিট</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, placeholder, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase px-2">{label}</label>
    <input type="text" placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl outline-none font-bold focus:bg-white focus:border-emerald-200 transition-all" />
  </div>
);

export default AdsManager;
