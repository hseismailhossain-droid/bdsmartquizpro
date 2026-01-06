import React, { useState, useRef, useEffect, memo } from 'react';
import { Ghost, MessageSquare, Share2, Camera, Film, Send, X, Loader2, Plus, Trash2, ThumbsUp, Eye, Edit3, Mic, Square, Volume2, User as UserIcon, Shield } from 'lucide-react';
import { Post, Comment, UserProfile } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, where, limit, increment, arrayRemove, orderBy } from 'firebase/firestore';

// Memoized Post Card for speed
const AnonPostCard = memo(({ post, currentUserId, onLike, onComment, onDelete, onShare }: any) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-indigo-50 overflow-hidden mb-4">
       <div className="p-4 flex justify-between items-center bg-indigo-50/20">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <UserIcon size={18} />
             </div>
             <div>
                <h4 className="font-black text-indigo-900 text-xs">বেনামী ইউজার</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{post.time}</p>
             </div>
          </div>
          {post.uid === currentUserId && (
            <button onClick={() => onDelete(post.id)} className="p-2 text-rose-500"><Trash2 size={14}/></button>
          )}
       </div>

       <div className="p-5">
          <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap mb-3 font-medium">{post.content}</p>
          
          {post.audio && (
            <div className="mb-3 bg-slate-50 p-3 rounded-2xl border flex items-center gap-2">
               <Volume2 size={16} className="text-indigo-500"/>
               <audio src={post.audio} preload="none" controls className="flex-grow h-8" />
            </div>
          )}

          {post.image && (
            <div className="rounded-2xl overflow-hidden border mb-3">
               <img src={post.image} loading="lazy" className="w-full max-h-60 object-contain" alt="" />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
             <div className="flex items-center gap-4">
                <button onClick={() => onLike(post)} className={`flex items-center gap-1.5 font-black text-xs ${post.likedBy?.includes(currentUserId) ? 'text-indigo-600' : 'text-slate-400'}`}>
                   <ThumbsUp size={14} fill={post.likedBy?.includes(currentUserId) ? 'currentColor' : 'none'} /> {post.likes || 0}
                </button>
                <button onClick={() => onComment(post)} className="flex items-center gap-1.5 text-slate-400 font-black text-xs">
                   <MessageSquare size={14} /> {post.comments?.length || 0}
                </button>
             </div>
             <button onClick={() => onShare(post)} className="text-slate-300"><Share2 size={16}/></button>
          </div>
       </div>
    </div>
  );
});

const AnonymousTab: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullComposer, setShowFullComposer] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    // Simplified query without server-side orderBy to avoid index requirements.
    const qPosts = query(
      collection(db, 'posts'), 
      where('isAnonymous', '==', true),
      limit(50) 
    );

    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 20);
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Anon Posts Error:", err);
      setLoading(false);
    });

    return () => unsubPosts();
  }, []);

  const handleLike = async (post: any) => {
    const uid = auth.currentUser?.uid; if (!uid) return;
    const isLiked = post.likedBy?.includes(uid);
    await updateDoc(doc(db, 'posts', post.id), {
      likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
      likes: increment(isLiked ? -1 : 1)
    });
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isPublishing) return;
    setIsPublishing(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userName: "Anonymous", uid: auth.currentUser?.uid, content: newPostContent.trim(),
        isAnonymous: true, likes: 0, likedBy: [], comments: [], timestamp: serverTimestamp(),
        time: "এখন মাত্র"
      });
      setNewPostContent(''); setShowFullComposer(false);
    } catch (e) { alert("Error"); } finally { setIsPublishing(false); }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32 font-hind">
      <div className="bg-indigo-900 px-6 pt-10 pb-14 rounded-b-[40px] shadow-lg">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Ghost className="text-indigo-300" size={24} /> অনুভব কর্নার
        </h2>
        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest opacity-70">আপনার পরিচয় গোপন থাকবে</p>
      </div>

      <div className="px-4 -mt-6">
        <button onClick={() => setShowFullComposer(true)} className="w-full bg-white p-4 rounded-2xl shadow-md font-black text-indigo-700 text-xs border border-indigo-50 mb-6">
           কি ভাবছেন? গোপন পোস্ট করুন...
        </button>

        {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div> : (
          posts.map(p => (
            <AnonPostCard 
              key={p.id} post={p} currentUserId={auth.currentUser?.uid} 
              onLike={handleLike} onComment={setActiveCommentPost} 
              onDelete={(id:string)=>deleteDoc(doc(db,'posts',id))} 
              onShare={()=>{}}
            />
          ))
        )}
      </div>

      {showFullComposer && (
        <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
           <div className="p-4 border-b flex justify-between items-center bg-indigo-900 text-white">
              <button onClick={() => setShowFullComposer(false)}><X/></button>
              <h3 className="font-black text-sm uppercase">গোপন পোস্ট</h3>
              <button onClick={handleCreatePost} disabled={isPublishing} className="bg-white text-indigo-900 px-4 py-1.5 rounded-lg font-black text-[10px]">
                {isPublishing ? '...' : 'পোস্ট'}
              </button>
           </div>
           <textarea 
             className="flex-grow p-6 text-lg outline-none resize-none" 
             placeholder="আপনার মনের কথা লিখুন..." 
             autoFocus value={newPostContent} 
             onChange={e => setNewPostContent(e.target.value)}
           />
        </div>
      )}

      {activeCommentPost && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-end">
           <div className="bg-white w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom">
              <div className="flex justify-between mb-4"><h4 className="font-black">মতামত</h4><button onClick={()=>setActiveCommentPost(null)}><X/></button></div>
              <div className="max-h-60 overflow-y-auto mb-4">
                 {activeCommentPost.comments?.map((c:any, i:number) => (
                   <div key={i} className="bg-slate-50 p-3 rounded-xl mb-2 text-xs font-medium">{c.text}</div>
                 ))}
              </div>
              <div className="flex gap-2">
                 <input type="text" className="flex-grow bg-slate-100 p-3 rounded-xl outline-none" placeholder="লিখুন..." value={commentText} onChange={e=>setCommentText(e.target.value)}/>
                 <button onClick={async ()=>{
                    if(!commentText.trim()) return;
                    await updateDoc(doc(db,'posts',activeCommentPost.id), { comments: arrayUnion({ text: commentText, uid: auth.currentUser?.uid }) });
                    setCommentText(''); setActiveCommentPost(null);
                 }} className="bg-indigo-600 text-white p-3 rounded-xl"><Send size={20}/></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnonymousTab;