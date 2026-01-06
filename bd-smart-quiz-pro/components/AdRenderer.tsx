
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AdUnit } from '../types';

interface AdRendererProps {
  placementId: string;
  className?: string;
}

const AdRenderer: React.FC<AdRendererProps> = ({ placementId, className = "" }) => {
  const [ads, setAds] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAds([]);
    setLoading(true);
    if (containerRef.current) {
        containerRef.current.innerHTML = '';
    }

    const q = query(
      collection(db, 'ad_units'), 
      where('placementId', '==', placementId),
      where('active', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allAds = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdUnit));
      const sorted = allAds.sort((a, b) => (a.order || 0) - (b.order || 0));
      setAds(sorted);
      setLoading(false);
    }, (err) => {
      console.error(`Ad Load Error for ${placementId}:`, err);
      setLoading(false);
    });

    return () => {
        unsub();
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    };
  }, [placementId]);

  if (loading || ads.length === 0) return null;

  return (
    <div ref={containerRef} className={`flex flex-col gap-2 w-full animate-in fade-in duration-500 ${className}`}>
      {ads.map(ad => (
        <AdItem key={`${placementId}-${ad.id}`} ad={ad} />
      ))}
    </div>
  );
};

const AdItem: React.FC<{ ad: AdUnit }> = ({ ad }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    if (ad.adType === 'script' && adRef.current) {
      adRef.current.innerHTML = "";
      try {
        const range = document.createRange();
        const frag = range.createContextualFragment(ad.content);
        adRef.current.appendChild(frag);
        
        adRef.current.querySelectorAll("script").forEach(oldScript => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach((attr: Attr) => newScript.setAttribute(attr.name, attr.value));
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });
      } catch (e) {}
    }

    if (ad.adType === 'id' && !pushed) {
      const timer = setTimeout(() => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setPushed(true);
        } catch (e) {}
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ad, pushed]);

  return (
    <div ref={adRef} className="w-full flex justify-center items-center overflow-hidden transparent">
      {ad.adType === 'image' ? (
        <a href={ad.link || "#"} target="_blank" rel="noreferrer" className="w-full block">
          <img 
            src={ad.content} 
            alt={ad.label} 
            className="w-full h-auto rounded-[24px] shadow-sm border border-slate-100 object-cover" 
          />
        </a>
      ) : ad.adType === 'video' ? (
        <div className="w-full rounded-[24px] overflow-hidden shadow-sm bg-black aspect-video relative">
           {ad.content.includes('youtube.com') || ad.content.includes('youtu.be') ? (
             <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ad.content.includes('v=') ? ad.content.split('v=')[1]?.split('&')[0] : ad.content.split('/').pop()}`} frameBorder="0" allowFullScreen></iframe>
           ) : (
             <video src={ad.content} controls className="w-full h-full object-contain" />
           )}
        </div>
      ) : ad.adType === 'id' ? (
        <div className="w-full flex justify-center">
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%' }}
               data-ad-client="ca-pub-3064118239935067"
               data-ad-slot={ad.content}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      ) : null}
    </div>
  );
};

export default AdRenderer;
