
import React, { useState } from 'react';
import { SUBJECTS } from '../constants';

const Exams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mock' | 'practice'>('mock');

  return (
    <div className="pb-24 bg-slate-50 min-h-screen font-['Hind_Siliguri']">
      {/* আধুনিক গ্লাস-মর্ফিজম ইফেক্ট সহ ট্যাব */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 p-2 shadow-sm">
        <div className="flex bg-slate-100/50 rounded-2xl p-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('mock')}
            className={`flex-1 py-3.5 font-black text-sm rounded-xl transition-all duration-300 ${
              activeTab === 'mock' 
              ? 'bg-white text-primary-green shadow-lg shadow-green-900/5' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            মক পরীক্ষা
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-3.5 font-black text-sm rounded-xl transition-all duration-300 ${
              activeTab === 'practice' 
              ? 'bg-white text-primary-green shadow-lg shadow-green-900/5' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            দ্রুত General Knowledge
          </button>
        </div>
      </div>

      <div className="p-5 max-w-md mx-auto">
        {/* সেকশন হেডার */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="font-black text-2xl text-slate-800">বিষয় ভিত্তিক</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Select Your Subject</p>
          </div>
          <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
             <span className="text-primary-green text-[10px] font-black uppercase tracking-widest">Premium Quiz</span>
          </div>
        </div>
        
        {/* মডার্ন সাবজেক্ট গ্রিড */}
        <div className="grid grid-cols-2 gap-4">
          {SUBJECTS.map((subject) => (
            <button
              key={subject.id}
              className="group flex flex-col gap-4 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-1.5 transition-all duration-500 text-left relative overflow-hidden active:scale-95"
            >
              {/* ব্যাকগ্রাউন্ড ডেকোরেশন */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[4rem] -mr-6 -mt-6 opacity-40 transition-all group-hover:scale-125 group-hover:bg-green-50" />
              
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-white transition-colors duration-500" style={{ color: subject.color }}>
                {subject.icon}
              </div>
              
              <div className="space-y-1 z-10">
                <span className="text-[14px] font-black text-slate-700 leading-tight block">{subject.title}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase group-hover:text-primary-green transition-colors">প্রস্তুতি শুরু করি</span>
              </div>

              {/* অ্যারো ইন্ডিকেটর */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                 <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
              </div>
            </button>
          ))}
        </div>

        {/* প্রিসেট এক্সাম সেকশন (শুধুমাত্র মক ট্যাব এর জন্য) */}
        {activeTab === 'mock' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center mt-16 mb-8">
               <div className="w-1.5 h-1.5 bg-primary-green rounded-full mb-4 animate-bounce" />
               <h3 className="font-black text-xl text-slate-800">পপুলার ক্যাটাগরি</h3>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['BCS Preli', 'Primary Teacher', 'NTRCA Preparation', 'Bank Jobs', 'SSC GK', 'HSC GK'].map((preset) => (
                <button 
                  key={preset} 
                  className="bg-white border border-slate-100 px-7 py-3.5 rounded-[1.2rem] text-sm font-black text-slate-600 shadow-sm hover:border-primary-green hover:text-primary-green hover:shadow-md transition-all active:scale-95"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* ইন্সপিরেশনাল কার্ড */}
            <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-2">প্রতিদিন নতুন কুইজ!</h4>
                  <p className="text-xs text-green-100 font-medium leading-relaxed opacity-80">আপনার জ্ঞানকে যাচাই করতে প্রতিদিন নতুন নতুন General Knowledge আপডেট করা হয়।</p>
                  <button className="mt-6 bg-white text-emerald-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">
                    কুইজ দেখি
                  </button>
               </div>
            </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Exams;
