
import React, { useState } from 'react';
import { Category } from '../types';
import { ChevronRight, GraduationCap, School, BookOpen, User, Moon, Briefcase } from 'lucide-react';
import { auth } from '../services/firebase';
import { Language } from '../services/translations';

interface SetupScreenProps {
  onComplete: (name: string, category: Category) => void;
  lang: Language;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, lang }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [name, setName] = useState(auth.currentUser?.displayName || '');

  const categories = [
    { id: Category.PRIMARY, icon: <School className="text-blue-500" />, sub: 'প্রাথমিক শিক্ষা' },
    { id: Category.JUNIOR, icon: <BookOpen className="text-purple-500" />, sub: 'মাধ্যমিক শিক্ষা' },
    { id: Category.SSC, icon: <GraduationCap className="text-orange-500" />, sub: 'মাধ্যমিক (৯-১০)' },
    { id: Category.HSC, icon: <GraduationCap className="text-emerald-500" />, sub: 'উচ্চ মাধ্যমিক' },
    { id: Category.ADMISSION, icon: <GraduationCap className="text-rose-500" />, sub: 'ভার্সিটি ভর্তি' },
    { id: Category.ISLAMIC, icon: <Moon className="text-indigo-500" />, sub: 'দ্বীন ও জ্ঞান' },
    { id: Category.JOB_PREP, icon: <Briefcase className="text-slate-600" />, sub: 'সরকারি ও ব্যাংক জব' },
    { id: Category.BCS, icon: <GraduationCap className="text-indigo-500" />, sub: 'বিসিএস প্রস্তুতি' },
  ];

  const hasDepartment = selectedCategory === Category.SSC || selectedCategory === Category.HSC;

  return (
    <div className="min-h-screen bg-white p-6 pb-32 flex flex-col max-w-md mx-auto font-['Hind_Siliguri']">
      <div className="mt-8 mb-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">SQ</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">BD Smart Quiz Pro</h1>
        <p className="text-gray-500 font-bold text-sm">সঠিক কন্টেন্ট পেতে আপনার তথ্যগুলো দিন</p>
      </div>

      <div className="space-y-6 flex-grow">
        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-3 block">আপনার নাম</label>
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
             <User size={18} className="text-emerald-700" />
             <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="নাম লিখুন..." 
              className="flex-grow outline-none font-bold text-slate-800"
             />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase px-2">আপনার ক্যাটাগরি নির্বাচন করুন</label>
          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id !== Category.SSC && cat.id !== Category.HSC) setSelectedDepartment('');
                }}
                className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'border-emerald-700 bg-emerald-50'
                    : 'border-gray-100 bg-gray-50 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    {cat.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 leading-tight">{cat.id}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{cat.sub}</p>
                  </div>
                </div>
                {selectedCategory === cat.id && <div className="w-6 h-6 bg-emerald-700 rounded-full flex items-center justify-center text-white"><ChevronRight size={16} /></div>}
              </button>
            ))}
          </div>
        </div>

        {hasDepartment && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            <p className="text-gray-900 font-black mb-4">আপনার বিভাগ নির্বাচন করুন</p>
            <div className="grid grid-cols-3 gap-2">
              {['Science', 'Commerce', 'Arts'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`py-3 rounded-2xl text-xs font-black transition-all ${
                    selectedDepartment === dept
                      ? 'bg-emerald-700 text-white shadow-lg'
                      : 'bg-white text-gray-500 border border-gray-100'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-50 max-w-md mx-auto z-10">
        <button
          onClick={() => selectedCategory && name.trim() && onComplete(name.trim(), selectedCategory)}
          disabled={!selectedCategory || !name.trim() || (hasDepartment && !selectedDepartment)}
          className={`w-full py-5 rounded-[24px] text-lg font-black shadow-xl transition-all active:scale-95 ${
            selectedCategory && name.trim() && (!hasDepartment || selectedDepartment)
              ? 'bg-emerald-700 text-white shadow-emerald-700/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          প্রবেশ করুন
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;