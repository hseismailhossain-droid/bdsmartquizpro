
import React from 'react';
import { Flame, Trophy, BookOpen, Activity, Medal, GraduationCap, Award, Crown, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { QuizResult, Question, UserProfile } from '../types';

interface ProgressTabProps {
  user: UserProfile;
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
}

const ProgressTab: React.FC<ProgressTabProps> = ({ user, history }) => {
  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const chartData = days.map(day => {
    // Added safety check for e.date before calling includes()
    const dayExams = history.exams.filter(e => e.date && e.date.includes(day));
    const dayPoints = dayExams.reduce((sum, e) => sum + (e.score * 10), 0);
    return { day, points: dayPoints || Math.floor(Math.random() * 30) }; // Demo data if empty
  });

  const totalPoints = history.exams.reduce((sum, e) => sum + (e.score * 10), 0);

  const ACHIEVEMENTS = [
    { id: '1', name: 'শিক্ষানবিশ', icon: <GraduationCap size={32} />, desc: 'প্রথম কুইজ শেষ করার জন্য', unlocked: true, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: '2', name: 'কুইজ মাস্টার', icon: <Crown size={32} />, desc: '১০টি কুইজ সম্পন্ন করেছেন', unlocked: history.exams.length >= 10, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: '3', name: 'স্কলার', icon: <Brain size={32} />, desc: '১০০০ পয়েন্ট অর্জন করেছেন', unlocked: totalPoints >= 1000, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: '4', name: 'অদম্য', icon: <Flame size={32} />, desc: 'টানা ৭ দিন পড়াশোনা করেছেন', unlocked: (user.streak || 0) >= 7, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-6 space-y-8 bg-white min-h-full pb-24 font-['Hind_Siliguri']">
       <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-[24px] border-2 border-emerald-500 overflow-hidden shadow-sm">
            <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="avatar" />
          </div>
          <div>
            <h3 className="font-black text-xl text-gray-900 leading-tight">{user?.name || 'ইউজার'}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.category || 'STUDENT'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 bg-gray-50 p-6 rounded-[44px] border border-gray-100 shadow-inner">
        <StatItem icon={<Trophy className="text-yellow-500" size={18}/>} value={totalPoints.toString()} label="পয়েন্ট" />
        <StatItem icon={<BookOpen className="text-blue-500" size={18}/>} value={history.exams.length.toString()} label="পরীক্ষা" />
        <StatItem icon={<Activity className="text-emerald-500" size={18}/>} value="৫ম" label="র‍্যাংক" />
        <StatItem icon={<Flame className="text-orange-500" size={18}/>} value={user.streak?.toString() || "১"} label="স্ট্রিক" />
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
        <h4 className="font-black text-gray-900 flex items-center gap-2 mb-8">দৈনিক অগ্রগতি</h4>
        <div className="h-40 w-full min-w-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="points" radius={[8, 8, 8, 8]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.points > 100 ? '#047857' : '#e2e8f0'} />
                ))}
              </Bar>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h4 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-2">
           <Medal size={22} className="text-amber-500" /> অ্যাচিভমেন্ট ব্যাজ
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((item) => (
            <div key={item.id} className={`p-6 rounded-[36px] border transition-all flex flex-col items-center text-center gap-4 ${item.unlocked ? 'bg-white border-emerald-100 shadow-lg shadow-emerald-700/5' : 'bg-gray-50 border-gray-100 opacity-40 grayscale'}`}>
               <div className={`p-5 rounded-[28px] ${item.unlocked ? `${item.bg} ${item.color}` : 'bg-gray-100 text-gray-300'}`}>
                 {item.icon}
               </div>
               <div>
                 <h5 className="font-black text-slate-800 text-sm leading-tight">{item.name}</h5>
                 <p className="text-[9px] text-gray-400 font-bold mt-1 leading-tight">{item.desc}</p>
               </div>
               {item.unlocked && <span className="text-[8px] bg-emerald-700 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest">Unlocked</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="mb-1">{icon}</div>
    <span className="font-black text-base text-gray-900 leading-none">{value}</span>
    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">{label}</span>
  </div>
);

export default ProgressTab;
