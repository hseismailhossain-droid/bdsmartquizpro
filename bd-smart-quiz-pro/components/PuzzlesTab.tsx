
import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Check, Sparkles, Brain, ChevronLeft, Loader2, Star, Zap, Gamepad2, Lightbulb, HelpCircle, ArrowRight, Coffee, Wind } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";

// Generating 200 levels with diverse types
const GAMES_LIST = Array.from({ length: 200 }, (_, i) => {
  const level = i + 1;
  const types = ["ধাঁধা (Riddle)", "Math Puzzle", "Logic Test", "গ্রামবাংলার ধাঁধা", "Mind Relaxing", "Brain Boost"];
  const type = types[i % types.length];
  
  return {
    id: level,
    name: `${type} - লেভেল ${level}`,
    type: type,
    desc: level % 10 === 0 ? "মহা চ্যালেঞ্জ: এটি একটি উচ্চস্তরের বুদ্ধির পরীক্ষা।" : "আপনার বুদ্ধিকে আরও ধারালো করতে এই চ্যালেঞ্জটি পূরণ করুন।",
    points: 20 + (Math.floor(level / 10) * 5)
  };
});

const PuzzlesTab: React.FC = () => {
  const [gameState, setGameState] = useState<'map' | 'loading' | 'playing'>('map');
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [userStats, setUserStats] = useState({ points: 0, levelsCleared: 0 });
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserStats({
          points: data.totalPoints || 0,
          levelsCleared: data.levelsCleared || 0
        });
      }
    });
    return unsub;
  }, []);

  const startLevel = async (idx: number) => {
    const levelInfo = GAMES_LIST[idx];
    setActiveLevel(levelInfo.id);
    setGameState('loading');
    
    try {
      // Always initialize with named parameters and direct process.env.API_KEY as per @google/genai guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      let systemPrompt = "";
      if (levelInfo.type === "Mind Relaxing") {
        systemPrompt = "Act as a wellness and mindfulness coach. Generate a 'Mind Relaxing' challenge for a student. It should be a creative, soothing, or philosophical question about happiness, nature, or positive thinking. Provide 4 positive options.";
      } else {
        systemPrompt = `Act as an educational game host for Level ${levelInfo.id}. Game Type: ${levelInfo.type}.`;
      }

      const prompt = `${systemPrompt} Language: Bengali.
      Task: Generate 1 high-quality challenge. 
      If 'গ্রামবাংলার ধাঁধা', use traditional Bangladeshi folk riddles.
      If 'Mind Relaxing', create a deep and positive thought-provoking question.
      Provide:
      - question: The problem text in Bengali.
      - options: exactly 4 unique Bengali options.
      - correctAnswer: index (0-3).
      - explanation: Brief Bengali explanation/moral.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      });

      // Extract generated text using the .text property as per @google/genai guidelines.
      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      
      setCurrentChallenge(JSON.parse(text));
      setGameState('playing');
    } catch (e) {
      console.error("Level Generation Error:", e);
      alert("AI চ্যালেঞ্জ তৈরি করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      setGameState('map');
    }
  };

  const handleAnswer = async (idx: number) => {
    if (isAnswering || !currentChallenge || !activeLevel) return;
    setIsAnswering(true);

    if (idx === currentChallenge.correctAnswer) {
      const levelInfo = GAMES_LIST[activeLevel - 1];
      alert(`অসাধারণ! সঠিক উত্তর।\n\nব্যাখ্যা: ${currentChallenge.explanation || ''}`);
      
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { 
          totalPoints: increment(levelInfo.points),
          levelsCleared: Math.max(userStats.levelsCleared, activeLevel)
        });
      }
      setGameState('map');
      setActiveLevel(null);
    } else {
      alert("ভুল উত্তর! আবার চেষ্টা করুন।");
    }
    setIsAnswering(false);
  };

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 font-['Hind_Siliguri']">
        <div className="relative mb-8">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[36px] flex items-center justify-center animate-pulse">
              <Sparkles size={48} className="text-amber-500" />
           </div>
           <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="animate-spin text-indigo-600" size={20}/>
           </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800">লেভেল {activeLevel}</h3>
        <p className="text-xs text-slate-400 font-black uppercase mt-2 tracking-[0.2em] animate-pulse">AI চ্যালেঞ্জ জেনারেট হচ্ছে...</p>
      </div>
    );
  }

  if (gameState === 'playing' && currentChallenge) {
    const levelInfo = GAMES_LIST[activeLevel! - 1];
    const isRelaxMode = levelInfo.type === "Mind Relaxing";
    
    return (
      <div className={`p-6 ${isRelaxMode ? 'bg-emerald-50/50' : 'bg-indigo-50/30'} min-h-screen font-['Hind_Siliguri'] animate-in zoom-in-95`}>
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => setGameState('map')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-colors"><ChevronLeft size={24}/></button>
           <div className="text-center">
              <span className={`text-[10px] font-black ${isRelaxMode ? 'text-emerald-600 bg-emerald-100' : 'text-indigo-600 bg-indigo-100'} px-4 py-2 rounded-full uppercase tracking-widest`}>Level {activeLevel}</span>
           </div>
           <div className="w-10"></div>
        </div>

        <div className="bg-white p-10 rounded-[44px] shadow-xl shadow-indigo-900/5 mb-10 border border-indigo-100 text-center relative overflow-hidden">
           <div className={`w-14 h-14 ${isRelaxMode ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm`}>
              {isRelaxMode ? <Wind size={28} /> : <Lightbulb size={28} />}
           </div>
           <h3 className="text-2xl font-black text-slate-800 leading-relaxed mb-6">{currentChallenge.question}</h3>
           <p className={`text-[11px] ${isRelaxMode ? 'text-emerald-500' : 'text-indigo-400'} font-black uppercase tracking-[0.2em]`}>{levelInfo.type}</p>
        </div>

        <div className="space-y-4">
          {currentChallenge.options.map((opt: string, i: number) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(i)}
              disabled={isAnswering}
              className={`w-full p-6 bg-white border-2 border-slate-50 rounded-[32px] text-left font-black text-slate-700 shadow-sm active:scale-95 transition-all hover:border-indigo-300 ${isRelaxMode ? 'hover:border-emerald-300' : ''}`}
            >
              <div className="flex items-center gap-4">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${isRelaxMode ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{i+1}</div>
                 {opt}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-['Hind_Siliguri']">
      <div className="bg-indigo-900 pt-16 pb-28 px-8 rounded-b-[70px] relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-800/50 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full -ml-32 -mb-32 blur-[80px]"></div>
         
         <div className="relative z-10 flex justify-between items-center mb-10">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">গেম জোন</h2>
              <p className="text-[11px] text-indigo-300 font-black uppercase tracking-[0.3em] mt-2">Unlimited Levels • AI Enabled</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-[28px] border border-white/20 flex items-center gap-3 shadow-2xl">
               <div className="p-2 bg-amber-400 rounded-xl shadow-lg shadow-amber-400/30"><Trophy size={20} className="text-white" /></div>
               <span className="text-2xl font-black text-white">{userStats.points}</span>
            </div>
         </div>
         
         <div className="relative z-10 bg-white/5 backdrop-blur-md p-8 rounded-[40px] border border-white/10 shadow-inner">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">মোট অগ্রগতি (Progress)</span>
               <span className="text-[11px] font-black text-emerald-400">{userStats.levelsCleared}/200+</span>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
               <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1500 ease-out shadow-[0_0_15px_rgba(52,211,153,0.5)]" style={{ width: `${Math.min((userStats.levelsCleared / 200) * 100, 100)}%` }}></div>
            </div>
         </div>
      </div>

      <div className="px-8 -mt-14 relative z-20 grid grid-cols-4 gap-y-12 gap-x-5">
        {GAMES_LIST.slice(0, userStats.levelsCleared + 20).map((game, idx) => {
          const isLocked = game.id > userStats.levelsCleared + 1;
          const isCleared = game.id <= userStats.levelsCleared;
          const isCurrent = game.id === userStats.levelsCleared + 1;

          return (
            <div key={game.id} className="flex flex-col items-center gap-2 group">
              <button 
                disabled={isLocked}
                onClick={() => startLevel(idx)}
                className={`w-16 h-16 rounded-[26px] flex items-center justify-center relative transition-all active:scale-90 shadow-xl border-b-4 ${
                  isCleared ? 'bg-emerald-500 text-white border-emerald-700 shadow-emerald-500/20' :
                  isCurrent ? 'bg-indigo-600 text-white border-indigo-800 ring-4 ring-indigo-200 shadow-indigo-600/30 scale-110' :
                  'bg-white text-slate-200 border-slate-100 shadow-slate-200/40 opacity-50 grayscale'
                }`}
              >
                {isLocked ? <Lock size={20} /> : <span className="text-xl font-black">{game.id}</span>}
                {isCleared && <div className="absolute -top-1.5 -right-1.5 bg-white text-emerald-600 rounded-full p-1 border-2 border-emerald-500 scale-90 shadow-md"><Check size={10} strokeWidth={5} /></div>}
                {isCurrent && <div className="absolute -top-12 bg-rose-500 text-white text-[9px] px-3 py-1.5 rounded-full font-black animate-bounce shadow-lg shadow-rose-500/20 uppercase">Play Now!</div>}
              </button>
              <p className={`text-[8px] font-black uppercase text-center truncate w-full tracking-wider mt-1 ${isLocked ? 'text-slate-300' : 'text-slate-600'}`}>
                {game.type.split(' ')[0]}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="py-24 text-center">
        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
           <Gamepad2 size={40} className="text-indigo-200 animate-pulse" />
        </div>
        <p className="text-[11px] font-black text-indigo-900/20 uppercase tracking-[0.4em]">নতুন লেভেল আনলক হচ্ছে</p>
      </div>
    </div>
  );
};

export default PuzzlesTab;
