import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, LayoutGrid, Save, Loader2, Palette, 
  GraduationCap, BookOpen, Book, School, Briefcase, 
  Moon, Target, Star, ShieldCheck 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

// আইকন ম্যাপ তৈরি যাতে নাম অনুযায়ী কম্পোনেন্ট রেন্ডার করা যায়
const IconComponents: Record<string, any> = {
  GraduationCap, BookOpen, Book, School, Briefcase, 
  Moon, LayoutGrid, Target, Star, ShieldCheck
};

const ICONS = Object.keys(IconComponents);
const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-orange-500', 
  'bg-purple-500', 'bg-blue-500', 'bg-teal-600', 'bg-slate-600', 'bg-amber-600'
];

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  useEffect(() => {
    // collection name 'exam_categories' আপনার App.tsx এর সাথে মিল থাকতে হবে
    const q = query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAddCategory = async () => {
    if (!label.trim()) return alert("কার্ডের নাম দিন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'exam_categories'), {
        label: label.trim(),
        iconName: selectedIcon,
        color: selectedColor,
        timestamp: serverTimestamp()
      });
      setLabel('');
      alert("নতুন কার্ড যুক্ত হয়েছে!");
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, 'exam_categories', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', title: '' });
    } catch (e) {
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  // ডাইনামিক আইকন রেন্ডারার ফাংশন
  const RenderIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const Icon = IconComponents[name] || LayoutGrid;
    return <Icon size={size} />;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="কার্ড ডিলিট করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" কার্ডটি ডিলিট করতে চান? এর অধীনে থাকা কুইজগুলো ইউজাররা দেখতে পারবে না।`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">পরীক্ষা কার্ড ম্যানেজার</h2>
        <p className="text-slate-400 font-bold text-sm">ইউজার অ্যাপের এক্সাম ট্যাবে নতুন কার্ড যুক্ত করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ফর্ম সেকশন */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-black text-lg flex items-center gap-2 text-slate-800"><Plus className="text-emerald-700" /> নতুন কার্ড তৈরি</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">কার্ডের নাম (Label)</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="যেমন: Medical Admission" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black border border-slate-100 focus:bg-white" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">আইকন নির্বাচন</label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setSelectedIcon(icon)} className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${selectedIcon === icon ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>
                    <RenderIcon name={icon} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2">কালার থিম</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`w-8 h-8 rounded-full ${color} transition-all ${selectedColor === color ? 'ring-4 ring-slate-200' : 'opacity-60 hover:opacity-100'}`}></button>
                ))}
              </div>
            </div>

            <button onClick={handleAddCategory} disabled={isSaving} className="w-full py-5 bg-emerald-700 text-white rounded-[24px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> কার্ড সেভ করুন</>}
            </button>
          </div>
        </div>

        {/* লিস্ট সেকশন */}
        <div className="lg:col-span-2">
          {loading ? (
             <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-700" size={40} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${cat.color} text-white rounded-[20px] flex items-center justify-center shadow-lg`}>
                      <RenderIcon name={cat.iconName} size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{cat.label}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cat.iconName}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirm({ show: true, id: cat.id, title: cat.label })} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
