
import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  Heart, MessageCircle, Globe, Send, Trash2, Edit3, Eye, X, 
  Ghost, Mic, Plus, Loader2, Share2, Youtube, Facebook, 
  Link as LinkIcon, Smile, MoreHorizontal, FileText,
  CheckCircle2, PlayCircle, MessageSquare, Sparkles, LayoutGrid,
  AtSign, Reply, ShieldAlert, MoreVertical, ThumbsUp, AlertTriangle, Upload, 
  MessagesSquare, HelpCircle, BookOpen, Volume2, FileDown, Download, Square, StopCircle, RefreshCw
} from 'lucide-react';
import { Post, UserProfile, Comment as CommentType } from '../types';
import { db, auth, storage } from '../services/firebase';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, 
  deleteDoc, doc, updateDoc, arrayUnion, where, limit, 
  increment, arrayRemove, orderBy, getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ADMIN_EMAIL } from '../constants';
import AdRenderer from './AdRenderer';

https://defiantenrage.com/r29staxe4?key=16f55b34cec622e9ffb37327506418bc

// --- Components ---

const CommunityConfirmModal = ({ show, title, message, onConfirm, onCancel, color = "rose", confirmText = "হ্যাঁ, নিশ্চিত করুন" }: any) => {
  if (!show) return null;
  const colorClass = color === "rose" ? "bg-rose-600 shadow-rose-600/20" : "bg-emerald-600 shadow-emerald-600/20";
  const iconBg = color === "rose" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6 font-hind">
      <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center animate-in zoom-in-95 shadow-2xl border border-white/20 relative">
        <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner`}>
          <AlertTriangle size={40} />
        </div>
        <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400 font-bold mb-10 leading-relaxed px-4">{message}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className={`w-full ${colorClass} text-white py-5 rounded-[28px] font-black text-sm shadow-xl active:scale-95 transition-all uppercase tracking-widest`}>{confirmText}</button>
          <button onClick={onCancel} className="w-full bg-slate-100 text-slate-500 py-5 rounded-[28px] font-black text-sm active:scale-95 transition-all">বাতিল করুন</button>
        </div>
      </div>
    </div>
  );
};

const PostCard = memo(({ post, onLike, onAddComment, onDeletePost, onDeleteComment, onShare, currentUserId }: any) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const isLiked = post.likedBy?.includes(currentUserId);
  const isOwner = post.uid === currentUserId || auth.currentUser?.email === ADMIN_EMAIL;
  const displayName = post.isAnonymous ? 'বেনামী ইউজার' : post.userName;
  const displayAvatar = post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`);

  useEffect(() => {
    if (showComments) {
      setLoadingComments(true);
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'), limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingComments(false);
      }, (err) => {
        console.error("Comments Fetch Error:", err);
        setLoadingComments(false);
      });
      return unsubscribe;
    }
  }, [showComments, post.id]);

  return (
    <div className={`bg-white shadow-sm border rounded-[36px] overflow-hidden mb-6 transition-all ${post.isAnonymous ? 'border-indigo-100 bg-indigo-50/5' : 'border-gray-100'}`}>
      <div className="p-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img src={displayAvatar} loading="lazy" className="w-12 h-12 rounded-2xl border bg-gray-50 object-cover shadow-sm ring-2 ring-slate-50" alt="" />
          <div>
            <h4 className="font-black text-[15px] font-hind flex items-center gap-1.5 text-slate-800 leading-tight">
              {displayName}
              {post.isAnonymous && <Ghost size={12} className="text-indigo-400" />}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 font-hind uppercase tracking-widest mt-0.5">
              {post.time || 'এখন'} • <Globe size={10} /> • <Eye size={10} /> {post.views || 0}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDeletePost(post.id)} className="p-3 text-rose-400 hover:bg-rose-50 rounded-2xl transition-colors"><Trash2 size={20} /></button>
        )}
      </div>

      {post.content && (
        <div className="px-6 pb-5 text-[15px] leading-relaxed font-hind text-slate-700 whitespace-pre-wrap font-medium">
          {post.content}
        </div>
      )}

      {post.audio && (
        <div className="px-6 pb-5">
           <div className="bg-emerald-50 p-4 rounded-[28px] border border-emerald-100 flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                 <Volume2 size={20} className="animate-pulse" />
              </div>
              <audio src={post.audio} controls className="w-full h-10 outline-none" preload="none" />
           </div>
        </div>
      )}

      {post.pdf && (
        <div className="px-6 pb-5">
           <a href={post.pdf} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-white hover:border-blue-200 transition-all group shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                 </div>
                 <div className="text-left">
                    <p className="font-black text-slate-800 text-xs">PDF ডকুমেন্ট</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">পড়ার জন্য ক্লিক করুন</p>
                 </div>
              </div>
              <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><Download size={20}/></div>
           </a>
        </div>
      )}

      <div className="px-6 py-4 flex justify-between text-slate-400 text-[10px] border-b mx-4 font-hind font-bold tracking-wider">
        <div className="flex items-center gap-2">
           <div className="flex -space-x-1">
              <div className="bg-blue-600 p-1 rounded-full ring-2 ring-white z-10"><ThumbsUp size={8} fill="white" className="text-white" /></div>
              <div className="bg-rose-500 p-1 rounded-full ring-2 ring-white z-0"><Heart size={8} fill="white" className="text-white" /></div>
           </div>
           <span className="text-slate-500">{post.likes || 0} লাইক</span>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-blue-600 transition-colors uppercase">
          {post.commentsCount || 0} মতামত
        </button>
      </div>

      <div className="flex px-4 py-2">
        <button onClick={() => onLike(post.id)} className={`flex-1 flex justify-center items-center gap-2 py-4 hover:bg-slate-50 rounded-2xl font-black text-[12px] transition-all ${isLiked ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
          <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} /> লাইক
        </button>
        <button onClick={() => setShowComments(!showComments)} className={`flex-1 flex justify-center items-center gap-2 py-4 hover:bg-slate-50 rounded-2xl font-black text-[12px] transition-all ${showComments ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
          <MessageCircle size={18} /> মতামত
        </button>
        <button onClick={() => onShare(post)} className="flex-1 flex justify-center items-center gap-2 py-4 hover:bg-slate-50 rounded-2xl text-slate-500 font-black text-[12px] transition-all">
          <Share2 size={18} /> শেয়ার
        </button>
      </div>

      {showComments && (
        <div className="px-6 pb-6 bg-slate-50/30 border-t animate-in slide-in-from-top-2 duration-300">
          <div className="pt-6 space-y-5 max-h-80 overflow-y-auto no-scrollbar">
            {loadingComments ? (
              <div className="py-8 text-center">
                 <Loader2 size={24} className="animate-spin mx-auto text-blue-500" />
                 <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">লোড হচ্ছে...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 animate-in fade-in group">
                  <img src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`)} className="w-9 h-9 rounded-2xl border object-cover shadow-sm bg-white" alt=""/>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-slate-100 rounded-3xl px-5 py-3.5 inline-block shadow-sm max-w-full relative">
                      <p className="font-black text-[10px] text-blue-900 mb-0.5 uppercase tracking-tighter">{post.isAnonymous ? 'বেনামী' : comment.userName}</p>
                      {comment.replyTo && (
                         <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 mb-2 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <Reply size={10} className="text-blue-500" />
                            <span className="truncate">@{comment.replyTo.userName} এর উত্তরে</span>
                         </div>
                      )}
                      <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-5 ml-2 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{comment.time || 'এখন'}</span>
                      <button onClick={() => { setReplyTo(comment); }} className="text-blue-600 hover:text-blue-800">রিপ্লাই</button>
                      {(comment.uid === currentUserId || isOwner) && (
                        <button onClick={() => onDeleteComment(post.id, comment.id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">ডিলিট</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">এখনো কোনো মতামত নেই</p>
              </div>
            )}
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onAddComment(post.id, commentText, replyTo); setCommentText(''); setReplyTo(null); } }} className="flex flex-col gap-3 mt-6">
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50 px-5 py-3 rounded-2xl text-[10px] text-blue-600 font-black animate-in slide-in-from-bottom-2 border border-blue-100">
                <span className="flex items-center gap-2"><Reply size={12}/> {post.isAnonymous ? 'ইউজার' : replyTo.userName} এর মন্তব্যে রিপ্লাই লিখছেন...</span>
                <button type="button" onClick={() => setReplyTo(null)} className="p-1.5 bg-white rounded-lg shadow-sm text-blue-600"><X size={12}/></button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="আপনার মতামত লিখুন..." className="flex-1 bg-white border border-slate-200 rounded-[24px] py-4 px-6 outline-none text-sm font-medium focus:border-blue-300 transition-all shadow-inner" />
              <button type="submit" disabled={!commentText.trim()} className="w-14 h-14 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-600/20 active:scale-90 transition-all disabled:opacity-50"><Send size={20} /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

// --- Main Component ---

const CommunityTab: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'public' | 'anonymous' | 'messages'>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const [showComposer, setShowComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showPublishOverlay, setShowPublishOverlay] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, id: any, type: 'post' | 'comment' | 'message', postId?: string} | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatReplyTo, setChatReplyTo] = useState<any>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const postInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'messages') {
        const qChat = query(collection(db, 'global_chat'), orderBy('timestamp', 'asc'), limit(100));
        const unsubChat = onSnapshot(qChat, (snap) => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        return unsubChat;
    }

    const isAnon = activeTab === 'anonymous';
    const qPosts = query(collection(db, 'posts'), where('isAnonymous', '==', isAnon), limit(50));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      data.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    
    return () => { unsubPosts(); };
  }, [activeTab]);

  const uploadToStorage = (file: File | Blob, folder: string, type: 'audio' | 'pdf'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const ext = type === 'audio' ? '.webm' : '.pdf';
      const fileName = file instanceof File ? file.name : `recorded_${timestamp}${ext}`;
      const cleanName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const storageRef = ref(storage, `${folder}/${timestamp}_${cleanName}`);
      
      const metadata = {
        contentType: file.type || (type === 'audio' ? 'audio/webm;codecs=opus' : 'application/pdf')
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Storage Error:", error);
          setUploadProgress(null);
          reject(new Error("ফাইল আপলোড করা যায়নি। ইন্টারনেট চেক করুন।"));
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(null);
          resolve(url);
        }
      );
    });
  };

  const performPublish = async (content: string, fileData: {type: 'audio' | 'pdf', file: File | Blob} | null) => {
    if (isPosting) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("পাবলিশ করার জন্য লগইন প্রয়োজন!");

    setIsPosting(true);
    try {
      let finalMediaUrl = null;
      if (fileData) {
        finalMediaUrl = await uploadToStorage(fileData.file, fileData.type === 'audio' ? 'audios' : 'pdfs', fileData.type);
      }

      const postData: any = { 
        uid: uid, 
        userName: activeTab === 'anonymous' ? "বেনামী ইউজার" : (user?.name || "ইউজার"), 
        userAvatar: activeTab === 'anonymous' ? "" : (user?.avatarUrl || ""), 
        content: content.trim(), 
        audio: fileData?.type === 'audio' ? finalMediaUrl : null, 
        pdf: fileData?.type === 'pdf' ? finalMediaUrl : null, 
        isAnonymous: activeTab === 'anonymous', 
        likes: 0, 
        likedBy: [], 
        commentsCount: 0, 
        views: 0, 
        timestamp: serverTimestamp(), 
        time: "এইমাত্র"
      };

      await addDoc(collection(db, 'posts'), postData);

      setPostContent(''); 
      setRecordedBlob(null);
      setShowPublishOverlay(false);
      setShowComposer(false);
      setToast("সফলভাবে পাবলিশ হয়েছে!");
    } catch (e: any) { 
      console.error("Publish Error:", e);
      alert(e.message || "পাবলিশ ব্যর্থ হয়েছে! দয়া করে আবার চেষ্টা করুন।");
    } finally { 
      setIsPosting(false); 
      setUploadProgress(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                       ? 'audio/webm;codecs=opus' 
                       : 'audio/webm';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        stream.getTracks().forEach(track => track.stop());
        if (audioBlob.size > 1000) {
           setRecordedBlob(audioBlob);
           setShowPublishOverlay(true);
        } else {
           alert("রেকর্ডিংটি খুব ছোট ছিল। দয়া করে আবার রেকর্ড করুন।");
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecDuration(0);
      timerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch (err) {
      alert("মাইক্রোফোন পারমিশন পাওয়া যায়নি।");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handlePublishPost = async () => {
    await performPublish(postContent, null);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendChat = async () => {
      const uid = auth.currentUser?.uid;
      if (!chatInput.trim() || !uid) return;
      const msg = {
          uid: uid,
          userName: user?.name || 'ইউজার',
          userAvatar: user?.avatarUrl || '',
          text: chatInput.trim(),
          timestamp: serverTimestamp(),
          replyTo: chatReplyTo ? { uid: chatReplyTo.uid, userName: chatReplyTo.userName, text: chatReplyTo.text } : null
      };
      await addDoc(collection(db, 'global_chat'), msg);
      setChatInput('');
      setChatReplyTo(null);
  };

  const handleLike = async (postId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.likedBy?.includes(uid);
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
        likes: increment(isLiked ? -1 : 1)
      });
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async (postId: string, text: string, replyTo: any = null) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !text.trim()) return;
    
    try {
      const comment: any = {
        uid: uid,
        userName: user?.name || 'ইউজার',
        userAvatar: user?.avatarUrl || '',
        text: text.trim(),
        timestamp: serverTimestamp(),
        time: 'এখন'
      };

      if (replyTo) {
        comment.replyTo = {
          uid: replyTo.uid,
          userName: replyTo.userName
        };
      }

      await addDoc(collection(db, 'posts', postId, 'comments'), comment);
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });
    } catch (e) { 
      console.error("Comment Error:", e);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, postId } = confirmDelete;
    setConfirmDelete(null);
    try {
      if (type === 'post') {
        await deleteDoc(doc(db, 'posts', id));
      } else if (type === 'comment' && postId) {
        await deleteDoc(doc(db, 'posts', postId, 'comments', id));
        await updateDoc(doc(db, 'posts', postId), {
          commentsCount: increment(-1)
        });
      } else if (type === 'message') {
        await deleteDoc(doc(db, 'global_chat', id));
      }
      setToast("মুছে ফেলা হয়েছে!");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full font-hind bg-slate-50 overflow-hidden relative">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[4000] bg-emerald-800 text-white px-8 py-4 rounded-[22px] text-[12px] font-black shadow-2xl animate-in slide-in-from-top-10 duration-500 border border-emerald-700/50 flex items-center gap-3">
           <CheckCircle2 size={16}/> {toast}
        </div>
      )}

      {/* Improved Confirmation Overlay with Loader */}
      {showPublishOverlay && recordedBlob && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[9000] flex items-center justify-center p-6 font-hind">
           <div className="bg-white w-full max-sm rounded-[48px] p-8 text-center animate-in zoom-in-95 shadow-2xl relative overflow-hidden">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
                 {isPosting ? <Loader2 size={32} className="animate-spin" /> : <Volume2 size={32} />}
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">{isPosting ? 'পাবলিশ হচ্ছে...' : 'রেকর্ডিং সম্পন্ন!'}</h4>
              <p className="text-sm text-slate-400 font-bold mb-8 leading-relaxed">
                 {isPosting 
                  ? (uploadProgress !== null ? `আপলোড হচ্ছে: ${uploadProgress}%` : 'অনুগ্রহ করে অপেক্ষা করুন...') 
                  : 'আপনি কি এই ভয়েস মেসেজটি পাবলিশ করতে চান? নিচে শুনে নিতে পারেন।'}
              </p>
              
              {!isPosting && (
                 <div className="mb-8 p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-3 shadow-inner">
                    <audio src={URL.createObjectURL(recordedBlob)} controls className="w-full h-8" />
                 </div>
              )}

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => performPublish("", { type: 'audio', file: recordedBlob })} 
                   disabled={isPosting}
                   className="w-full bg-emerald-700 text-white py-5 rounded-[28px] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-400"
                 >
                    {isPosting ? 'অপেক্ষা করুন...' : 'হ্যাঁ, পাবলিশ করুন'}
                 </button>
                 {!isPosting && (
                    <button 
                      onClick={() => { setShowPublishOverlay(false); setRecordedBlob(null); }} 
                      className="w-full bg-slate-100 text-slate-500 py-5 rounded-[28px] font-black text-sm active:scale-95 transition-all"
                    >
                       বাতিল করুন
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {isRecording && (
        <div className="fixed top-0 left-0 right-0 h-1.5 z-[7000] bg-slate-100">
           <div className="h-full bg-rose-500 animate-pulse w-full"></div>
        </div>
      )}

      <CommunityConfirmModal 
         show={confirmDelete?.show} title="মুছে ফেলতে চান?" message="এটি চিরতরে মুছে যাবে।" 
         onConfirm={executeDelete} onCancel={() => setConfirmDelete(null)}
      />

      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b flex h-16 shrink-0">
        <button onClick={() => setActiveTab('public')} className={`flex-1 flex items-center justify-center gap-3 font-black text-[11px] transition-all border-b-2 ${activeTab === 'public' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20' : 'border-transparent text-slate-400'}`}>
          <Globe size={18} /> ফিড
        </button>
        <button onClick={() => setActiveTab('anonymous')} className={`flex-1 flex items-center justify-center gap-3 font-black text-[11px] transition-all border-b-2 ${activeTab === 'anonymous' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-400'}`}>
          <Ghost size={18} /> বেনামী
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex-1 flex items-center justify-center gap-3 font-black text-[11px] transition-all border-b-2 ${activeTab === 'messages' ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-slate-400'}`}>
          <MessagesSquare size={18} /> মেসেজ
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className={`max-w-md mx-auto px-4 pb-32 ${activeTab === 'messages' ? 'h-full flex flex-col p-0' : ''}`}>
          
          {activeTab === 'messages' ? (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {messages.map((msg, i) => {
                        const isMe = msg.uid === auth.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} className="w-8 h-8 rounded-full border mt-1 shadow-sm shrink-0" alt="" />
                                    <div className="flex flex-col">
                                        <p className={`text-[9px] font-black text-slate-400 mb-1 uppercase px-2 ${isMe ? 'text-right' : 'text-left'}`}>{msg.userName}</p>
                                        <div 
                                          onDoubleClick={() => setChatReplyTo(msg)}
                                          className={`px-4 py-3 rounded-[24px] shadow-sm relative group cursor-pointer active:scale-95 transition-transform ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}
                                        >
                                            {msg.replyTo && (
                                                <div className={`mb-2 p-2 rounded-xl text-[10px] border ${isMe ? 'bg-blue-700/50 border-blue-500/50' : 'bg-white border-slate-200'} opacity-80 italic line-clamp-1`}>
                                                    @{msg.replyTo.userName}: {msg.replyTo.text}
                                                </div>
                                            )}
                                            <p className="text-[13px] font-medium leading-relaxed">{msg.text}</p>
                                            {isMe && <button onClick={() => setConfirmDelete({show: true, type: 'message', id: msg.id})} className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t sticky bottom-0 z-10">
                    {chatReplyTo && (
                        <div className="mb-3 bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom-2">
                           <div className="flex items-center gap-2 overflow-hidden">
                              <Reply size={14} className="text-blue-500" />
                              <p className="text-[11px] text-blue-800 truncate font-bold italic">@{chatReplyTo.userName} কে রিপ্লাই দিচ্ছেন...</p>
                           </div>
                           <button onClick={() => setChatReplyTo(null)} className="p-1 bg-white rounded-lg shadow-sm text-blue-500"><X size={14}/></button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <input 
                            type="text" value={chatInput} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                            onChange={e => setChatInput(e.target.value)} 
                            placeholder="মেসেজ লিখুন..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-[24px] py-4 px-6 outline-none text-sm font-medium focus:border-blue-300 shadow-inner" 
                        />
                        <button onClick={handleSendChat} disabled={!chatInput.trim()} className="w-14 h-14 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-50"><Send size={22} /></button>
                    </div>
                </div>
            </div>
          ) : (
            <>
              <AdRenderer placementId="feed_top" />
              
              <div className="mt-4 mb-8 p-8 rounded-[40px] bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                       <HelpCircle size={28} className="text-emerald-50" />
                    </div>
                    <h3 className="text-xl font-black mb-2 leading-tight">আপনার কোনো প্রশ্ন থাকলে করুন</h3>
                    <p className="text-emerald-100 text-xs font-medium leading-relaxed opacity-90">যার উত্তর জানা আছে উত্তর দিয়ে অন্যের সাথে জ্ঞান শেয়ার করুন। একসাথে শিখি, একসাথে বড় হই।</p>
                    <div className="mt-6 flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
                          জ্ঞানই শক্তি
                       </span>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-4 items-center mb-8 ring-2 ring-emerald-50/50">
                 <img src={activeTab === 'anonymous' ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=user")} className="w-12 h-12 rounded-2xl border-2 border-emerald-50 object-cover shadow-sm shrink-0" alt=""/>
                 <button onClick={() => setShowComposer(true)} className="flex-grow text-left py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl text-[13px] font-bold shadow-inner border border-slate-100">আপনার মনে কি চলছে?</button>
                 <button 
                  onClick={isRecording ? stopRecording : startRecording} 
                  className={`p-4 rounded-2xl active:scale-90 transition-all shadow-sm border ${isRecording ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'}`}
                 >
                  {isRecording ? <StopCircle size={22}/> : <Mic size={22}/>}
                 </button>
                 <input type="file" ref={postInputRef} className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; 
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      alert("দুঃখিত, ১০ মেগাবাইটের বেশি বড় ফাইল আপলোড করা যাবে না।");
                      return;
                    }
                    await performPublish("", { 
                      type: file.type === 'application/pdf' ? 'pdf' : 'audio', 
                      file: file 
                    });
                  }} />
              </div>

https://defiantenrage.com/f3597f8c957d468959ac3821c42527b0/invoke.js
              
              {isRecording && (
                <div className="mb-8 p-8 bg-rose-50 rounded-[44px] border border-rose-100 animate-in zoom-in-95 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse shadow-lg">
                        <Mic size={28}/>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-rose-600">{formatDuration(recDuration)}</p>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">রেকর্ডিং হচ্ছে...</p>
                    </div>
                    <button onClick={stopRecording} className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-all shadow-xl">
                        <Square size={20} fill="currentColor"/>
                    </button>
                </div>
              )}

              <div className="space-y-2">
                {loading ? (
                  <div className="py-24 text-center">
                     <Loader2 className="animate-spin mx-auto text-emerald-700" size={40}/>
                     <p className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-[0.2em]">ফিড লোড হচ্ছে...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} post={post} currentUserId={auth.currentUser?.uid}
                      onLike={handleLike} onAddComment={handleAddComment}
                      onDeletePost={(id: string) => setConfirmDelete({ show: true, type: 'post', id })}
                      onDeleteComment={(postId: string, commentId: string) => setConfirmDelete({ show: true, id: commentId, postId })}
                      onShare={(p:any) => navigator.share?.({ title: 'BD Smart Quiz Pro', text: p.content, url: window.location.origin })}
                    />
                  ))
                ) : (
                  <div className="py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
                     <Ghost size={48} className="mx-auto text-slate-100 mb-4" />
                     <p className="text-slate-300 font-black tracking-widest text-xs">কোনো পোস্ট নেই</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      https://defiantenrage.com/ad/04/16/ad0416f282833e1de4ea3abee28eb897.js

      {showComposer && (
        <div className="fixed inset-0 bg-white z-[6000] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
           <div className="p-4 border-b flex justify-between items-center bg-white/95 backdrop-blur-xl sticky top-0 safe-pt z-10 shrink-0">
              <button 
                onClick={() => { setShowComposer(false); setRecordedBlob(null); setPostContent(''); }} 
                className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90"
              >
                <X size={20}/>
              </button>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex-1 text-center">
                {activeTab === 'anonymous' ? 'গোপন পোস্ট' : 'নতুন পোস্ট'}
              </h3>
              <div className="w-[100px] flex justify-end">
                <button 
                  onClick={handlePublishPost} 
                  disabled={isPosting || !postContent.trim()} 
                  className="bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isPosting ? <Loader2 size={12} className="animate-spin" /> : null} 
                  {isPosting ? 'পাবলিশ...' : 'পাবলিশ'}
                </button>
              </div>
           </div>
          
            https://defiantenrage.com/d07e9336b60580af4a3b18734a7dfd59/invoke.jshttps://defiantenrage.com/f3597f8c957d468959ac3821c42527b0/invoke.js

          
           <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
              <textarea 
                className="w-full text-lg font-bold text-slate-800 placeholder-slate-300 outline-none resize-none min-h-[200px]" 
                placeholder="এখানে আপনার মনের কথাগুলো লিখুন..." 
                autoFocus 
                value={postContent} 
                onChange={e => setPostContent(e.target.value)} 
              />
           </div>
          
           https://defiantenrage.com/61/65/8c/61658ca0d6b568fc54ac8518d329592f.js
          
           <div className="p-6 bg-slate-50 border-t flex items-center justify-center safe-pb flex-col gap-4 shrink-0">
              <div className="flex gap-4 w-full">
                <button 
                  onClick={startRecording}
                  disabled={isPosting}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-[24px] font-black text-[11px] text-slate-600 shadow-sm active:scale-95 border border-slate-100 transition-all"
                >
                  <Mic size={20} className="text-emerald-600" /> রেকর্ড ও পোস্ট
                </button>
                <button 
                  onClick={() => { if (postInputRef.current) { postInputRef.current.setAttribute('accept', 'application/pdf'); postInputRef.current.click(); } }} 
                  disabled={isPosting}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-[24px] font-black text-[11px] text-slate-600 shadow-sm active:scale-95 border border-slate-100 transition-all"
                >
                  <FileText size={20} className="text-rose-600" /> PDF পোস্ট
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
