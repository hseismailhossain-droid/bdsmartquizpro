
import { Home, Users, Edit, Bookmark, Trophy, Activity } from 'lucide-react';
import React from 'react';

interface BottomNavProps {
  activeTab: 'home' | 'community' | 'exam' | 'progress' | 'leaderboard' | 'history';
  setActiveTab: (tab: any) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'community', label: 'ফিড', icon: Users },
    { id: 'exam', label: 'পরীক্ষা', icon: Edit },
    { id: 'progress', label: 'প্রগ্রেস', icon: Activity },
    { id: 'leaderboard', label: 'র‍্যাংক', icon: Trophy },
    { id: 'history', label: 'হিস্ট্রি', icon: Bookmark },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center pt-3 pb-safe z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] rounded-t-[36px] safe-pb">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center gap-1 transition-all flex-1 py-1 relative"
          >
            <div className={`p-2.5 rounded-[20px] transition-all duration-300 ${isActive ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 scale-110' : 'text-slate-400'}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black tracking-tight ${isActive ? 'text-emerald-800' : 'text-slate-400 opacity-80'}`}>
              {item.label}
            </span>
            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-emerald-700 rounded-full"></div>}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
