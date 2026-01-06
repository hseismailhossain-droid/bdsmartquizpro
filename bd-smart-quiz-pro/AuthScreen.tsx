
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, X, Send, CheckCircle2, Info } from 'lucide-react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Language } from '../services/translations';

interface AuthScreenProps {
  onLogin: (email: string) => void;
  lang: Language;
  toggleLanguage: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, lang, toggleLanguage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        onLogin(cleanEmail);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
        onLogin(cleanEmail);
      }
    } catch (err: any) {
      let message = 'দুঃখিত, একটি সমস্যা হয়েছে।';
      if (err.code === 'auth/invalid-credential') message = 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
      else if (err.code === 'auth/email-already-in-use') message = 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।';
      else if (err.code === 'auth/too-many-requests') message = 'অনেকবার ভুল চেষ্টা করেছেন। কিছুক্ষণ পর ট্রাই করুন।';
      setError({ message, code: err.code });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsResetting(true);
    setError(null);
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: true,
      };
      
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase(), actionCodeSettings);
      setResetSent(true);
    } catch (err: any) {
      let message = 'রিসেট লিঙ্ক পাঠানো যায়নি।';
      if (err.code === 'auth/user-not-found') message = 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
      else if (err.code === 'auth/invalid-email') message = 'সঠিক ইমেইল এড্রেস দিন।';
      else if (err.code === 'auth/too-many-requests') message = 'কিছুক্ষণ পর আবার চেষ্টা করুন।';
      setError({ message, code: err.code });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 font-['Hind_Siliguri']">
      <div className="w-full max-w-md bg-white rounded-[44px] p-8 md:p-12 shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="mb-10 text-center flex flex-col items-center relative">
          <button 
            onClick={toggleLanguage}
            className="absolute -top-4 -right-4 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200 font-black text-xs active:scale-90 transition-all z-10 shadow-sm"
          >
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>
          
          <div className="w-20 h-20 bg-emerald-700 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-700/20 mb-6 rotate-3">
             <span className="text-white text-3xl font-black -rotate-3">SQ</span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-1 leading-none tracking-tight">Smart Quiz Pro</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">Elite Quiz Platform</p>
        </div>

        <div className="w-full mb-8 flex p-1.5 bg-slate-100 rounded-[24px]">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 py-4 rounded-[20px] text-sm font-black transition-all ${isLogin ? 'bg-white text-emerald-700 shadow-lg' : 'text-slate-500'}`}
          >
            লগইন
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 py-4 rounded-[20px] text-sm font-black transition-all ${!isLogin ? 'bg-white text-emerald-700 shadow-lg' : 'text-slate-500'}`}
          >
            রেজিস্ট্রেশন
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && !showResetModal && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[13px] font-bold text-rose-600 flex items-start gap-3 animate-pulse">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          )}

          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="আপনার নাম" 
                className="w-full bg-slate-50 p-5 pl-14 rounded-2xl outline-none font-bold text-slate-900 border border-transparent focus:border-emerald-500 focus:bg-white transition-all shadow-inner" 
                required 
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ইমেইল এড্রেস" 
              className="w-full bg-slate-50 p-5 pl-14 rounded-2xl outline-none font-bold text-slate-900 border border-transparent focus:border-emerald-500 focus:bg-white transition-all shadow-inner" 
              required 
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="পাসওয়ার্ড" 
              className="w-full bg-slate-50 p-5 px-14 rounded-2xl outline-none font-bold text-slate-900 border border-transparent focus:border-emerald-500 focus:bg-white transition-all shadow-inner" 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {isLogin && (
            <div className="text-right">
              <button 
                type="button" 
                onClick={() => { setShowResetModal(true); setResetSent(false); setError(null); }}
                className="text-xs font-black text-emerald-700 hover:underline underline-offset-4"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
          )}

          <div className="pt-4">
            <button 
              disabled={isLoading} 
              className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] border-t pt-8">
          Smart Quiz Pro Team © ২০২৫
        </p>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[44px] p-10 animate-in zoom-in-95 duration-200 shadow-2xl relative border border-white/20">
            {!resetSent && (
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-all"
              >
                <X size={20} />
              </button>
            )}
            
            <div className={`w-20 h-20 ${resetSent ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} rounded-[28px] flex items-center justify-center mb-8 mx-auto shadow-sm`}>
              {resetSent ? <CheckCircle2 size={40} /> : <Lock size={40} />}
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight text-center">
              {resetSent ? 'মেইল পাঠানো হয়েছে!' : 'পাসওয়ার্ড উদ্ধার'}
            </h3>
            <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed text-center px-2">
              {resetSent 
                ? 'আপনার ইমেইলে একটি গোপন রিসেট লিঙ্ক পাঠানো হয়েছে। ইনবক্সে না পেলে অবশ্যই "Spam" বা "Junk" ফোল্ডারটি চেক করুন।' 
                : 'আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা একটি রিসেট লিঙ্ক পাঠিয়ে দেব যা দিয়ে আপনি নতুন পাসওয়ার্ড সেট করতে পারবেন।'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error.message}</span>
              </div>
            )}

            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder="আপনার ইমেইল এড্রেস" 
                    className="w-full bg-slate-50 p-5 pl-14 rounded-2xl outline-none font-bold text-slate-900 border border-transparent focus:border-emerald-500 focus:bg-white transition-all shadow-inner" 
                    required 
                  />
                </div>

                <button 
                  disabled={isResetting || !resetEmail.trim()}
                  className="w-full bg-emerald-700 text-white py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isResetting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> রিসেট লিঙ্ক পাঠান</>}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <div className="p-1 bg-amber-500 text-white rounded-full flex items-center justify-center"><Info size={14} /></div>
                  <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                    নিরাপত্তার স্বার্থে লিঙ্কটি মাত্র ১০ মিনিট কার্যকর থাকবে। মেইল না পেলে অবশ্যই স্প্যাম ফোল্ডার চেক করুন।
                  </p>
                </div>
                <button onClick={() => { setShowResetModal(false); setResetSent(false); }} className="w-full py-4 text-emerald-700 font-black text-xs uppercase tracking-widest">ফিরে যান</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
