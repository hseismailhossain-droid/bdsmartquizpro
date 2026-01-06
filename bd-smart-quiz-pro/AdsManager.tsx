
import React, { useState, useEffect } from 'react';
import { ImageIcon, MonitorPlay, Code, Save, Eye, Trash2, Loader2, Plus, ExternalLink } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

const AdsManager: React.FC = () => {
  const [adType, setAdType] = useState<'image' | 'video' | 'html'>('image');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSaveAd = async () => {
    if (adType === 'html') {
      if (!htmlCode.trim()) return alert("HTML কোড দিন");
    } else {
      if (!adLabel.trim() || !mediaUrl.trim()) return alert("লেবেল এবং মিডিয়া ইউআরএল অবশ্যই প্রয়োজন");
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
        <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
          <button onClick={() => setAdType('image')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${adType === 'image' ? 'bg-emerald-700 text-white shadow-lg' : 'text-gray-400'}`}>ব্যানার</button>
          <button onClick={() => setAdType('video')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${adType === 'video' ? 'bg-emerald-700 text-white shadow-lg' : 'text-gray-400'}`}>ভিডিও</button>
          <button onClick={() => setAdType('html')} className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${adType === 'html' ? 'bg-emerald-700 text-white shadow-lg' : 'text-gray-400'}`}>কোড</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 md:p-10 rounded-[50px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black mb-10 flex items-center gap-3">
              <ImageIcon className="text-emerald-700" /> নতুন বিজ্ঞাপন যুক্ত করুন
            </h3>

            <div className="space-y-8">
              {adType === 'html' ? (
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block px-2">HTML/JS কোড</label>
                   <textarea 
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="w-full h-48 bg-slate-50 p-6 rounded-[24px] outline-none font-mono text-sm border border-slate-100 focus:bg-white" 
                    placeholder="<div id='ads'>...</div>" 
                   />
                </div>
              ) : (
                <>
                  <InputGroup label="বিজ্ঞাপনের নাম" placeholder="যেমন: নতুন বিসিএস কোর্স" value={adLabel} onChange={(e: any) => setAdLabel(e.target.value)} />
                  <InputGroup label={adType === 'image' ? 'ছবির লিঙ্ক (Image URL)' : 'ভিডিও লিঙ্ক (Video URL)'} placeholder="https://example.com/ad.jpg" value={mediaUrl} onChange={(e: any) => setMediaUrl(e.target.value)} />
                  <InputGroup label="টার্গেট লিঙ্ক (Target URL)" placeholder="https://yourwebsite.com" value={targetUrl} onChange={(e: any) => setTargetUrl(e.target.value)} />
                </>
              )}
              
              <button onClick={handleSaveAd} disabled={isSaving} className="w-full bg-emerald-700 text-white py-5 rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> বিজ্ঞাপন সেভ করুন</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-black text-gray-900 text-lg px-2 flex items-center gap-2">সক্রিয় অ্যাডসমূহ</h4>
          <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="w-full h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                    {ad.type === 'image' ? (
                      <img src={ad.mediaUrl} className="w-full h-full object-cover" alt="Ad" />
                    ) : <MonitorPlay size={32} className="text-emerald-300" />}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm truncate">{ad.label || 'HTML Ad Item'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{ad.type}</p>
                </div>
                <div className="flex gap-2">
                  {ad.targetUrl && (
                    <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="flex-grow py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-1">
                      <ExternalLink size={12} /> ভিউ
                    </a>
                  )}
                  <button onClick={() => setDeleteConfirm({show: true, id: ad.id, title: ad.label || 'Ad Item'})} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={16} /></button>
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
