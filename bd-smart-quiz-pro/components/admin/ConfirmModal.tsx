
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6 font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center animate-in zoom-in-95 shadow-2xl border border-white/20 relative">
        <button onClick={onCancel} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        
        <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400 font-bold mb-10 leading-relaxed px-4">
          {message}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className="w-full bg-rose-600 text-white py-6 rounded-[28px] font-black text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
          >
            হ্যাঁ, ডিলিট করুন
          </button>
          <button 
            onClick={onCancel}
            className="w-full bg-slate-100 text-slate-500 py-6 rounded-[28px] font-black text-sm active:scale-95 transition-all hover:bg-slate-200"
          >
            বাতিল করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
