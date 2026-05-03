import React from 'react';
import { Tag, Megaphone, ArrowLeft, BookOpen } from 'lucide-react';

export const AdBanners = () => {
  return (
    <div className="mt-12 space-y-6">
      {/* Discount Booklet Banner */}
      <a 
        href="https://discounts.ahlymember.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-yellow-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:20px_20px]"></div>
        <div className="relative p-6 md:p-8 flex items-center justify-between z-10 text-white">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner border border-white/30 hidden sm:block">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black mb-1 md:mb-2 text-white drop-shadow-md tracking-wide">
                كتيب خصومات جروب أعضاء النادي الأهلي
              </h3>
              <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                اكتشف أحدث العروض والخصومات الحصرية لك
              </p>
            </div>
          </div>
          <div className="bg-white text-red-600 p-3 rounded-full shadow-lg transform group-hover:-translate-x-2 transition-transform duration-300 shrink-0">
             <ArrowLeft className="w-6 h-6" />
          </div>
        </div>
      </a>

      {/* Ads Banner */}
      <a 
        href="https://Ads.ahlymember.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative overflow-hidden rounded-2xl shadow-md border-2 border-dashed border-gray-300 transition-all duration-300 hover:border-red-500 hover:shadow-xl group bg-gray-50 hover:bg-gray-100/80"
      >
        <div className="relative p-6 md:p-8 flex items-center justify-center gap-4 z-10 text-gray-600 group-hover:text-red-600 transition-colors">
          <Megaphone className="w-8 h-8 md:w-10 md:h-10 transform group-hover:-rotate-12 transition-transform duration-300" />
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">لإضافة إعلانك هنا</h3>
        </div>
      </a>
    </div>
  );
};
