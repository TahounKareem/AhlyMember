import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Footer = ({ onOpenModal }: { onOpenModal: (id: string) => void }) => {
  const { userData, isRegisteredUser, isAdmin } = useAuth();
  
  return (
    <footer className="brand-bg-red text-white pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-yellow-400 pb-2 inline-block">عن المنصة</h3>
            <p className="text-gray-200">
              هنا صوت جمهور الأهلي. منصة حصرية لأعضاء النادي لمشاركة الآراء، والفعاليات. معاً نصنع مجتمعاً أقوى.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-yellow-400 pb-2 inline-block">روابط سريعة</h3>
            <ul className="space-y-2">
              <li><button onClick={() => onOpenModal('about')} className="hover:text-yellow-400 transition-colors">من نحن</button></li>
              <li><button onClick={() => onOpenModal('contact')} className="hover:text-yellow-400 transition-colors">اتصل بنا</button></li>
              <li><button onClick={() => onOpenModal('advertise')} className="hover:text-yellow-400 transition-colors">أضف إعلانك</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-yellow-400 pb-2 inline-block">تابعنا</h3>
            <div className="flex justify-center md:justify-start space-x-4 space-x-reverse mt-2">
               <a href="https://facebook.com/groups/AhlyNewCairo" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-facebook-f"></i></a>
               <a href="https://www.instagram.com/ahlymember" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-instagram"></i></a>
               <a href="https://www.whatsapp.com/channel/0029Va5chYK35fM2cPXE2e43" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-whatsapp"></i></a>
               <a href="https://telegram.me/ahlymembers" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-telegram"></i></a>
               <a href="https://www.tiktok.com/@ahlymember" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-tiktok"></i></a>
               <a href="https://www.youtube.com/playlist?list=PL9QAhGeiqV1utpClpH7G8eDb_Gs6_2A6g" target="_blank" rel="noreferrer" className="text-2xl hover:text-yellow-400 transition-transform hover:scale-110"><i className="fab fa-youtube"></i></a>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 pt-6 border-t border-red-500">
          <p>&copy; 2025 منصة عضو الأهلي. كل الحقوق محفوظة.</p>
          <div className="mt-2 text-sm text-gray-300">
             {!isRegisteredUser ? (
                 <p>أنت تتصفح كزائر.</p>
             ) : (
                 <p>المستخدم: <span className="font-bold">{userData?.displayName}</span> ({isAdmin ? 'أدمن' : 'عضو'})</p>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
};
