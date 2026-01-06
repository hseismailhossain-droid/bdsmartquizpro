
import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, Filter, Search, User, Trash2, AlertCircle, X } from 'lucide-react';
import { UserReport } from '../../types';
import ConfirmModal from './ConfirmModal';

interface ReportManagerProps {
  reports: UserReport[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReportManager: React.FC<ReportManagerProps> = ({ reports, onResolve, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, name: string}>({
    show: false, id: '', name: ''
  });

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.userName.toLowerCase().includes(search.toLowerCase()) || r.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="রিপোর্ট ডিলিট করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.name}" এর পাঠানো রিপোর্টটি ডিলিট করতে চান?`}
        onConfirm={() => {
          onDelete(deleteConfirm.id);
          setDeleteConfirm({ show: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">ইউজার রিপোর্ট ম্যানেজার</h2>
          <p className="text-slate-400 font-bold text-sm">ইউজারদের পাঠানো অভিযোগ ও ফিডব্যাক ম্যানেজ করুন</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          {['pending', 'resolved', 'all'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f as any)} 
              className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              {f === 'pending' ? 'পেন্ডিং' : f === 'resolved' ? 'সমাধানকৃত' : 'সব'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ইউজার বা মেসেজ খুঁজুন..." 
          className="w-full bg-white border border-slate-100 p-6 pl-16 rounded-[32px] font-bold text-slate-800 outline-none focus:border-blue-200 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all relative overflow-hidden">
             {report.status === 'pending' && (
               <div className="absolute top-0 right-0 w-24 h-2 bg-blue-500"></div>
             )}
             
             <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">{report.userName}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        Category: <span className="text-blue-600">{report.category}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {report.status === 'resolved' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {report.status}
                    </div>
                    <button 
                      onClick={() => setDeleteConfirm({ show: true, id: report.id, name: report.userName })}
                      className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                   <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{report.message}"</p>
                </div>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <Clock size={12} />
                  {report.timestamp ? new Date(report.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এখন মাত্র'}
                </div>
                {report.status === 'pending' && (
                  <button 
                    onClick={() => onResolve(report.id)}
                    className="px-8 py-3.5 bg-blue-600 text-white rounded-[20px] font-black text-xs flex items-center gap-2 shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
                  >
                    <CheckCircle size={14} /> Resolved মার্ক করুন
                  </button>
                )}
             </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="col-span-1 lg:col-span-2 py-24 text-center bg-white rounded-[50px] border border-slate-100 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
             </div>
             <p className="text-slate-300 font-black uppercase tracking-widest">কোনো রিপোর্ট পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManager;
