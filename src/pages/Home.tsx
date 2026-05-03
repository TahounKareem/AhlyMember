import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const defaultSliderData = [
  { id: '1', img: 'https://i.ibb.co/GW5KWz2/Banner.jpg', title: 'كن جزء من كتيب خصومات أعضاء الأهلي', subtitle: 'مع باقات إعلانية متنوعة', modalText: 'بادر بحجز مساحتك الإعلانية الأن', externalUrl: 'https://discounts.ahlymember.com/' },
  { id: '2', img: 'https://placehold.co/1200x500/000000/FFFFFF?text=Announcement', title: 'مسابقة جديدة للأعضاء', subtitle: 'توقع نتيجة المباراة القادمة واربح جوائز قيمة.', modalText: 'شارك الآن في مسابقة التوقعات واربح جوائز قيمة مقدمة من الرعاة.', externalUrl: '#' },
  { id: '3', img: 'https://placehold.co/1200x500/1a2a4c/FFFFFF?text=Community', title: 'مرحباً بك في منصة عضو الأهلي', subtitle: 'المكان الحصري لجماهير وأعضاء النادي العريق.', modalText: 'أهلاً بك في بيتك الثاني، شارك وتفاعل مع بقية الأعضاء.', externalUrl: '#' },
];

export const Home = ({ onOpenModal }: { onOpenModal: (payload: any) => void }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>(defaultSliderData);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slidesSnap = await getDocs(collection(db, 'slides'));
        if (!slidesSnap.empty) {
          let sData = slidesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          sData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          if (sData.length > 0) setSlides(sData);
        }

        const eventsSnap = await getDocs(collection(db, 'events'));
        let evData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        evData = evData.filter((e: any) => !e.isHidden);
        evData.sort((a: any, b: any) => {
          const oA = a.order || 0;
          const oB = b.order || 0;
          if (oA !== oB) return oA - oB;
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setEvents(evData.slice(0, 3));

        const postsSnap = await getDocs(collection(db, 'posts'));
        let ptData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        ptData = ptData.filter((p: any) => !p.isHidden);
        ptData.sort((a: any, b: any) => {
          const oA = a.order || 0;
          const oB = b.order || 0;
          if (oA !== oB) return oA - oB;
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setPosts(ptData.slice(0, 3));

        const usersSnap = await getDocs(collection(db, 'users'));
        setLeaderboard(
          usersSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((u: any) => u && u.points > 0 && u.displayName !== 'كريم شريف')
            .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
            .slice(0, 10)
        );

        const pollSnap = await getDocs(query(collection(db, 'polls'), where('isActive', '==', true)));
        if (!pollSnap.empty) {
          setActivePoll({ id: pollSnap.docs[0].id, ...pollSnap.docs[0].data() });
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="space-y-16">
      {/* Slider */}
      <div className="slider-container shadow-lg cursor-pointer mb-16" style={{ marginTop: '0' }} onClick={() => onOpenModal({ type: 'slider-promo', data: slide })}>
        <div className="slide fade w-full h-full">
          <img src={slide.img || slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
          <div className="slide-text">
            <h2 className="text-2xl md:text-5xl font-black">{slide.title}</h2>
            <p className="md:text-xl mt-2">{slide.subtitle}</p>
          </div>
        </div>
        <div className="absolute flex justify-center w-full bottom-2 space-x-2 space-x-reverse">
          {slides.map((_, i) => (
             <span key={i} onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }} className={`w-3 h-3 md:w-4 md:h-4 rounded-full cursor-pointer transition-colors ${currentSlide === i ? 'bg-red-600' : 'bg-gray-400 opacity-80 hover:bg-gray-500'}`}></span>
          ))}
        </div>
      </div>

      {/* Events Widget */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold border-r-4 border-red-600 pr-4">أحدث الفعاليات</h3>
          <Link to="/events" className="text-red-700 hover:text-red-900 font-bold">عرض الكل</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.length > 0 ? events.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col card-hover-effect">
               <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                   <img src={event.imageUrl || 'https://placehold.co/600x400/AE0101/FFFFFF?text=Event'} alt={event.title} className="absolute top-0 left-0 w-full h-full object-cover" />
               </div>
               <div className="p-4 flex-grow flex flex-col cursor-pointer">
                   <span className="text-sm font-semibold brand-bg-red text-white px-2 py-1 rounded-full self-start">{event.category || 'عام'}</span>
                   <h4 className="font-bold text-lg mt-2 mb-2 truncate">{event.title}</h4>
               </div>
            </Link>
          )) : (
            <p className="text-gray-500">لا توجد فعاليات معروضة حالياً.</p>
          )}
        </div>
      </section>

      {/* Posts Widget */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold border-r-4 border-red-600 pr-4">المنشورات</h3>
          <Link to="/posts" className="text-red-700 hover:text-red-900 font-bold">عرض الكل</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.length > 0 ? posts.map(post => {
            let d = '';
            if (post.postDate) {
              if (typeof post.postDate === 'string') d = new Date(post.postDate).toLocaleDateString('ar-EG');
              else if (post.postDate.seconds) d = new Date(post.postDate.seconds * 1000).toLocaleDateString('ar-EG');
            }
            return (
              <Link key={post.id} to={`/posts/${post.id}`} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col card-hover-effect">
                 {post.imageUrl ? (
                   <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                       <img src={post.imageUrl} alt={post.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                   </div>
                 ) : (
                   <div className="relative w-full bg-gray-200 flex items-center justify-center text-gray-500" style={{ paddingBottom: '56.25%' }}>
                       <span>لا توجد صورة</span>
                   </div>
                 )}
                 <div className="p-4 flex-grow flex flex-col cursor-pointer">
                     <span className="text-sm font-semibold brand-bg-red text-white px-2 py-1 rounded-full self-start">{post.category || 'عام'}</span>
                     <h4 className="font-bold text-lg mt-2 mb-2 truncate">{post.title}</h4>
                     {d && <p className="text-xs text-gray-500 mb-2">{d}</p>}
                 </div>
              </Link>
            )
          }) : (
            <p className="text-gray-500">لا توجد منشورات معروضة حالياً.</p>
          )}
        </div>
      </section>

      {/* Interactive Center */}
      <section>
        <h3 className="text-2xl md:text-3xl font-bold mb-6 border-r-4 border-red-600 pr-4">المركز التفاعلي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">الاستطلاع الحالي</h4>
                  <Link to="/polls" className="text-sm text-red-600 hover:underline">مزيد من الاستطلاعات</Link>
                </div>
                {activePoll ? (
                  <div>
                    <h5 className="font-bold mb-4">{activePoll.question}</h5>
                    <div className="space-y-2">
                       {Object.keys(activePoll.options).map(opt => (
                         <div key={opt} className="p-3 border rounded-lg bg-gray-50">{opt}</div>
                       ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4 text-center">قم بالتوجه لصفحة الاستطلاعات للمشاركة وتصويت!</p>
                  </div>
                ) : <p className="text-gray-500 text-center">لا يوجد استطلاع فعال حالياً.</p>}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-bold mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-yellow-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                 قائمة الشرف
              </h4>
              <ul className="space-y-3">
                 {leaderboard.map((user, index) => (
                    <li key={user.id} className={`flex items-center justify-between p-2 rounded ${index < 3 ? 'bg-yellow-50' : ''}`}>
                       <div className="flex items-center">
                          <span className="font-bold ml-3">{index + 1}.</span>
                          <img src={`https://placehold.co/40x40/AE0101/FFFFFF?text=${(user.displayName || 'A').charAt(0)}`} className="w-8 h-8 rounded-full ml-3" alt="Avatar" />
                          <span>{user.displayName || 'عضو'}</span>
                       </div>
                       <span className="font-bold brand-bg-gold text-white px-2 py-1 text-sm rounded-full">{user.points || 0} نقطة</span>
                    </li>
                 ))}
                 {leaderboard.length === 0 && <p className="text-gray-500 text-center">لا توجد بيانات حالياً.</p>}
              </ul>
            </div>
        </div>
      </section>

    </div>
  );
};
