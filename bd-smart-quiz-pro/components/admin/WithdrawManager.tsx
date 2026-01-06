
import React, { useState } from 'react';
import { CreditCard, Check, X, Clock, User, Phone, Wallet, AlertCircle, Trash2 } from 'lucide-react';
import { WithdrawRequest } from '../../types';
import ConfirmModal from './ConfirmModal';

interface WithdrawManagerProps {
  requests: WithdrawRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

const WithdrawManager: React.FC<WithdrawManagerProps> = ({ requests, onApprove, onReject, onDelete }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, title: string}>({
    show: false, id: '', title: ''
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-['Hind_Siliguri'] pb-20">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="রিকোয়েস্ট ডিলিট করুন"
        message={`আপনি কি নিশ্চিতভাবে এই উইথড্র রিকোয়েস্টটি ডিলিট করতে চান?`}
        onConfirm={() => {
          onDelete(deleteConfirm.id);
          setDeleteConfirm({ show: false, id: '', title: '' });
        }}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">উইথড্র ম্যানেজমেন্ট</h2>
          <p className="text-slate-400 font-bold text-sm">ইউজারদের টাকা উত্তোলনের রিকোয়েস্ট ম্যানেজ করুন</p>
        </div>
        <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full font-black text-xs uppercase tracking-widest border border-emerald-100">
          পেন্ডিং রিকোয়েস্ট: {pendingRequests.length}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">পেন্ডিং রিকোয়েস্টসমূহ</h3>
        <div className="grid grid-cols-1 gap-6">
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-50 transition-colors">
                    <CreditCard size={32} />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-slate-300" />
                      <h4 className="font-black text-slate-900 text-lg leading-tight">{req.userName}</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        <Wallet size={12}/> ৳{req.amount}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        <Phone size={12}/> {req.method}: {req.accountNumber}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={12}/> {req.timestamp ? new Date(req.timestamp.seconds * 1000).toLocaleString('bn-BD') : 'এইমাত্র'}
                      </div>
                    </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => onReject(req.id)}
                  className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <X size={18} /> রিজেক্ট
                </button>
                <button 
                  onClick={() => onApprove(req.id)}
                  className="px-6 py-4 bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18} /> অ্যাপ্রুভ
                </button>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && (
            <div className="py-24 text-center bg-white rounded-[50px] border border-dashed border-slate-200">
               <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
               </div>
               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">কোনো পেন্ডিং উইথড্র রিকোয়েস্ট নেই</p>
            </div>
          )}
        </div>

        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2 pt-10">আগের রেকর্ডসমূহ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherRequests.map(req => (
            <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{req.userName}</p>
                  <p className="text-[10px] font-bold text-slate-400">৳{req.amount} • {req.status.toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setDeleteConfirm({ show: true, id: req.id, title: req.userName })}
                className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WithdrawManager;
