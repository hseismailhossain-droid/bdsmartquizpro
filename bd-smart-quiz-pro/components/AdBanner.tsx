import React, { useEffect } from 'react';

interface AdBannerProps {
  slot: string; // প্রতিটি বিজ্ঞাপনের জন্য আলাদা স্লট আইডি
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slot, format = 'auto', className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsbygoogle error:", e);
    }
  }, [slot]); // স্লট আইডি পরিবর্তন হলে আবার লোড হবে

  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-white flex justify-center items-center border border-slate-100 min-h-[100px] w-full ${className}`}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-3064118239935067" // আপনার পাবলিশার আইডি (একই থাকবে)
           data-ad-slot={slot} // এখানে আপনার নতুন নতুন আইডিগুলো বসবে
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;