import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const Navbar = ({ onOpenModal }: { onOpenModal: (id: string) => void }) => {
  const { userData, isRegisteredUser, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center py-3">
          <NavLink to="/" className="flex items-center space-x-4 cursor-pointer rtl:space-x-reverse">
            <img 
              src="https://i.postimg.cc/T1jBDCxZ/AhlyLogo.png" 
              alt="شعار منصة عضو الأهلي" 
              className="h-14 w-auto" 
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black brand-red">منصة عضو الأهلي</h1>
              <p className="text-sm text-gray-500 font-bold">AhlyMember.com</p>
            </div>
          </NavLink>

          <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse text-md">
            <NavLink to="/" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>الرئيسية</NavLink>
            <NavLink to="/events" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>الفعاليات</NavLink>
            <NavLink to="/posts" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>المنشورات</NavLink>
            <NavLink to="/forums" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>المنتديات</NavLink>
            <button onClick={() => onOpenModal('discounts')} className="nav-btn">كتيب الخصومات</button>
            <NavLink to="/polls" className={({isActive}) => `nav-btn ${isActive ? 'active' : ''}`}>استطلاعات</NavLink>
            {isAdmin && <NavLink to="/admin" className={({isActive}) => `nav-btn brand-bg-gold text-white ${isActive ? 'bg-yellow-600' : ''}`}>إدارة</NavLink>}
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {!isRegisteredUser ? (
              <>
                <button onClick={() => onOpenModal('login')} className="brand-bg-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">تسجيل الدخول</button>
                <button onClick={() => onOpenModal('register')} className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg transition-colors">إنشاء حساب</button>
              </>
            ) : (
             <div className="flex items-center space-x-3 rtl:space-x-reverse">
                 <span className="font-bold text-sm hidden md:block">مرحباً, {userData?.displayName}</span>
                 <button onClick={handleSignOut} className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg transition-colors">خروج</button>
             </div>
            )}
          </div>

          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-800 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
        </nav>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-red-100 nav-btn">الرئيسية</NavLink>
          <NavLink to="/events" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-red-100 nav-btn">الفعاليات</NavLink>
          <NavLink to="/posts" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-red-100 nav-btn">المنشورات</NavLink>
          <NavLink to="/forums" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-red-100 nav-btn">المنتديات</NavLink>
          <button onClick={() => { onOpenModal('discounts'); setIsMobileMenuOpen(false); }} className="block w-full text-right py-2 px-4 text-sm hover:bg-red-100 nav-btn">كتيب الخصومات</button>
          <NavLink to="/polls" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-red-100 nav-btn">استطلاعات</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-4 text-sm font-bold bg-yellow-100 hover:bg-yellow-200 nav-btn">لوحة تحكم الأدمن</NavLink>}
        </div>
      )}
    </header>
  );
};
