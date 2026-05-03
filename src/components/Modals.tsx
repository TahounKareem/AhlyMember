import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface ModalsProps {
  activeModal: string | { type: string; data?: any } | null;
  onClose: () => void;
}

export const Modals = ({ activeModal, onClose }: ModalsProps) => {
  const { isRegisteredUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!activeModal) return null;

  const modalType = typeof activeModal === "string" ? activeModal : activeModal.type;
  const modalData = typeof activeModal === "object" ? activeModal.data : null;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userRole = email.toLowerCase() === 'kareem@tahoun.live' ? 'admin' : 'member';
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: name,
        points: 0,
        role: userRole,
        createdAt: new Date()
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let content = null;
  let title = '';

  switch (modalType) {
    case 'login':
      title = 'تسجيل الدخول';
      content = (
        <form onSubmit={handleLogin}>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input name="email" type="email" placeholder="البريد الإلكتروني" className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-4" required />
          <input name="password" type="password" placeholder="كلمة المرور" className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-6" required />
          <button type="submit" disabled={loading} className="brand-bg-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50">
            {loading ? 'جاري التحميل...' : 'دخول'}
          </button>
        </form>
      );
      break;
    case 'register':
      title = 'إنشاء حساب جديد';
      content = (
        <form onSubmit={handleRegister}>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input name="name" type="text" placeholder="الاسم (الذي سيظهر للأعضاء)" className="shadow border rounded w-full py-2 px-3 mb-4" required />
          <input name="email" type="email" placeholder="البريد الإلكتروني" className="shadow border rounded w-full py-2 px-3 mb-4" required />
          <input name="password" type="password" placeholder="كلمة المرور" className="shadow border rounded w-full py-2 px-3 mb-6" required />
          <button type="submit" disabled={loading} className="brand-bg-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50">
           {loading ? 'جاري التحميل...' : 'إنشاء الحساب'}
          </button>
        </form>
      );
      break;
    case 'discounts':
      title = 'عرض حصري لأعضاء المنصة!';
      content = (
        <div className="text-center">
          <p className="text-lg text-gray-700 my-4">لا تفوّت فرصة الاستفادة من عشرات الخصومات والعروض الحصرية المقدمة فقط لأعضاء منصة الأهلي. اكتشف عالماً من التوفير الآن!</p>
          <a href="https://discounts.ahlymember.com" target="_blank" rel="noreferrer" className="mt-4 block brand-bg-gold hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg w-full">تصفح كتيب الخصومات الآن</a>
        </div>
      );
      break;
    case 'slider-promo':
      title = modalData?.title || '';
      content = (
        <div className="text-center">
          <p className="text-lg text-gray-700 my-4">{modalData?.modalText}</p>
          <a href={modalData?.externalUrl || '#'} target={modalData?.externalUrl !== '#' ? '_blank' : '_self'} rel="noreferrer" className="mt-4 block brand-bg-gold hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg w-full">{modalData?.buttonText || 'الذهاب إلى العرض'}</a>
        </div>
      );
      break;
    case 'about':
      title = 'من نحن';
      content = (
         <div className="text-center">
          <p className="text-lg text-gray-700 my-4">منصة حصرية تم إنشاؤها لخدمة أعضاء وجماهير النادي الأهلي، لتعزيز التواصل والمشاركة الفعالة في الأنشطة والفعاليات.</p>
          <button onClick={onClose} className="mt-4 inline-block brand-bg-gold hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">إغلاق</button>
         </div>
      );
      break;
    case 'contact':
      title = 'اتصل بنا';
      content = (
          <div className="text-center">
           <p className="text-lg text-gray-700 my-4">يمكنكم التواصل معنا عبر الواتساب للإستفسارات أو الدعم.</p>
           <a href="https://wa.me/201002642521?text=برجاء التواصل معي بهدف الاستفسار" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block brand-bg-gold hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">تواصل عبر واتساب</a>
          </div>
      );
      break;
    case 'advertise':
       title = 'أضف إعلانك';
       content = (
           <div className="text-center">
            <p className="text-lg text-gray-700 my-4">نحن نقدم خيارات إعلانية متنوعة تناسب احتياجاتك. تواصل معنا للحصول على الباقات الإعلانية.</p>
            <a href="https://wa.me/201002642521?text=برجاء التواصل معي بهدف إضافة إعلان" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block brand-bg-gold hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">إضافة إعلان (واتساب)</a>
           </div>
       );
       break;
    default:
      return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center rtl">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md z-10">
        <h2 className="text-2xl font-bold mb-6 text-center brand-red">{title}</h2>
        {content}
        <button onClick={onClose} className="absolute top-2 left-3 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
      </div>
    </div>
  );
};
