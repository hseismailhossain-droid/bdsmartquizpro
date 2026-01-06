
import React, { useState } from 'react';
import { X, Settings, Play, Wallet, Smartphone, ShieldCheck, CheckCircle2, FileSignature, Loader2, AlertCircle, Coins } from 'lucide-react';

interface QuizConfigModalProps {
  subject: string;
  isLive?: boolean;
  isPaid?: boolean;
  isWritten?: boolean;
  entryFee?: number;
  onClose: () => void;
  onStart: (config: { numQuestions: number; timePerQuestion: number; payoutNumber?: string }) => Promise<void> | void;
}

const QuizConfigModal: React.FC<QuizConfigModalProps> = ({ subject, isLive, isPaid, isWritten, entryFee, onClose, onStart }) => {
  const [numQuestions, setNumQuestions] = useState(isLive || isPaid ? 25 : 10);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customNum, setCustomNum] = useState('10');
  const [timePerQuestion, setTimePerQuestion] = useState(isLive || isPaid ? 15 : 20);
  const [payoutNumber, setPayoutNumber] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const bgColor = isPaid ? 'bg-amber-500' : isLive ? 'bg-rose-600' : 'bg-emerald-700';

  const handleStart = async () => {
    let finalNum = showCustomInput ? parseInt(customNum) : numQuestions;
    if (isNaN(finalNum) || finalNum < 1) finalNum = 1;
    if (finalNum > 1000) finalNum = 1000;

    if (isPaid && !payoutNumber.trim()) return alert("পুরস্কার পাওয়ার জন্য একটি মোবাইল নাম্বার দিন।");
    if (isPaid && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsStarting(true);
    try {
      await onStart({ numQuestions: finalNum, timePerQuestion, payoutNumber });
    } catch (e) {
      alert("দুঃখিত, শুরু করতে সমস্যা হয়েছে।");
      setShowConfirm(false);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[44px] p-8 md:p-10 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar border border-white/20">
        
        {!isStarting && (
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all z-20 hover:bg-rose-50 hover:text-rose-500"
          >
            <X size={20} />
          </button>
        )}

        {showConfirm ? (
          <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-amber-50/50">
                <Coins size={40} className="animate-bounce" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">আপনি কি নিশ্চিত?</h3>
             <p className="text-sm text-slate-500 font-bold mb-8 px-2 leading-relaxed">
                এই পরীক্ষায় অংশ নিতে আপনার ব্যালেন্স থেকে <span className="text-emerald-700">৳{entryFee}</span> টাকা কেটে নেওয়া হবে।
             </p>
             
             <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><Smartphone size={20}/></div>
                <div className="text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">পেমেন্ট নাম্বার</p>
                   <p className="font-black text-slate-800 tracking-wider">{payoutNumber}</p>
                </div>
             </div>

             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleStart} 
                  disabled={isStarting}
                  className="w-full bg-emerald-700 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isStarting ? <Loader2 className="animate-spin" size={24}/> : <><CheckCircle2 size={24} /> পেমেন্ট ও শুরু</>}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)} 
                  disabled={isStarting}
                  className="w-full py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  ফিরে যান
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-8 pt-2">
               <div className={`w-16 h-16 ${bgColor} text-white rounded-[24px] flex items-center justify-center mb-4 shadow-xl shadow-emerald-700/10 transition-transform duration-500 hover:rotate-6`}>
                  {isWritten ? <FileSignature size={32} /> : <Settings size={32} />}
               </div>
               <h3 className="text-2xl font-black text-gray-900 leading-tight">
                  {isWritten ? 'রিটেন পরীক্ষা' : isPaid ? 'পেইড কুইজ' : 'কুইজ সেটআপ'}
               </h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 px-4 truncate w-full">{subject}</p>
            </div>

            <div className="space-y-8">
              {!isWritten && (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                       <ShieldCheck size={12} /> প্রশ্ন সংখ্যা (১-১০০০)
                    </label>
                    {showCustomInput ? (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                         <input 
                          type="number" value={customNum} onChange={e => setCustomNum(e.target.value)}
                          className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black outline-none focus:border-emerald-200 focus:bg-white shadow-inner" 
                          placeholder="৫০০" min="1" max="1000" autoFocus
                         />
                         <button onClick={() => setShowCustomInput(false)} className="px-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500">X</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 25, 50].map((num) => (
                          <button key={num} onClick={() => setNumQuestions(num)} className={`py-4 rounded-xl font-black text-sm transition-all ${numQuestions === num ? `${bgColor} text-white shadow-lg` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{num}</button>
                        ))}
                        <button onClick={() => setShowCustomInput(true)} className="col-span-3 py-3.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">কাস্টম সংখ্যা দিন</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">সময় (প্রতি প্রশ্ন)</label>
                     <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 30, 60].map(s => (
                          <button key={s} onClick={() => setTimePerQuestion(s)} className={`py-3.5 rounded-xl font-black text-xs transition-all ${timePerQuestion === s ? `${bgColor} text-white` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{s}s</button>
                        ))}
                     </div>
                  </div>
                </>
              )}

              {isPaid && (
                <div className="space-y-3 p-5 bg-amber-50/50 rounded-3xl border border-amber-100 animate-in slide-in-from-bottom-2">
                   <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Smartphone size={12} /> পুরস্কার পাওয়ার নাম্বার
                   </label>
                   <input 
                    type="tel" 
                    value={payoutNumber} 
                    onChange={e => setPayoutNumber(e.target.value)} 
                    placeholder="বিকাশ/নগদ নাম্বার দিন" 
                    className="w-full bg-white border border-amber-200 p-4 rounded-2xl font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-200 shadow-sm"
                   />
                   <div className="flex items-start gap-2 px-1">
                      <AlertCircle size={10} className="text-amber-500 mt-0.5" />
                      <p className="text-[8px] font-bold text-amber-500 leading-tight uppercase">ভুল নাম্বার দিলে পুরস্কার পাঠানো সম্ভব হবে না।</p>
                   </div>
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={handleStart} 
                  disabled={isStarting} 
                  className={`w-full ${bgColor} text-white py-6 rounded-[28px] font-black text-lg shadow-2xl shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-3`}
                >
                  {isStarting ? <Loader2 className="animate-spin" size={24}/> : <><Play size={24} fill="currentColor" /> শুরু করুন</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizConfigModal;
