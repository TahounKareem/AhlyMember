import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Markdown from 'react-markdown';
import { AdBanners } from '../components/AdBanners';

const EventList = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data = data.filter((e: any) => !e.isHidden);
        data.sort((a: any, b: any) => {
          const oA = a.order || 0;
          const oB = b.order || 0;
          if (oA !== oB) return oA - oB;
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA; // desc
        });
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="text-center font-bold p-8">جاري التحميل...</div>;

  const filteredEvents = events.filter(e => {
    const matchesSearch = (e.title || '').includes(searchQuery) || (e.content || '').includes(searchQuery);
    const matchesCategory = categoryFilter ? e.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-extrabold brand-red mb-4 md:mb-0">الفعاليات والأنشطة</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="البحث في الفعاليات..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shadow appearance-none border rounded w-full sm:w-64 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="shadow border rounded w-full sm:w-48 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
          >
            <option value="">كل الأقسام</option>
            <option value="فعاليات عامة">فعاليات عامة</option>
            <option value="فعاليات فنية">فعاليات فنية</option>
            <option value="فعاليات رياضية">فعاليات رياضية</option>
            <option value="فعاليات ثقافية">فعاليات ثقافية</option>
            <option value="فعاليات رواد">فعاليات رواد</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.length > 0 ? filteredEvents.map(event => (
          <Link key={event.id} to={`/events/${event.id}`} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col card-hover-effect">
            <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <img src={event.imageUrl || 'https://placehold.co/600x400/AE0101/FFFFFF?text=Event'} alt={event.title} className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            </div>
            <div className="p-4 flex-grow flex flex-col cursor-pointer">
              <span className="text-sm font-semibold brand-bg-red text-white px-2 py-1 rounded-full self-start">{event.category || 'عام'}</span>
              <h4 className="font-bold text-lg mt-2 mb-2 truncate">{event.title}</h4>
            </div>
          </Link>
        )) : <p className="col-span-full text-center text-gray-500 py-10 font-bold">لا توجد فعاليات حالياً.</p>}
      </div>
    </>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        // Warning: his JS code used doc(db, 'news', eventId) inside renderEventDetail. Let's try both 'events' and 'news' or just 'events'.
        let snap = await getDoc(doc(db, 'events', id));
        if(!snap.exists()) {
           snap = await getDoc(doc(db, 'news', id));
        }
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="text-center font-bold p-8">جاري التحميل...</div>;
  if (!event) return <div className="text-center text-red-500 font-bold p-8">الفعالية غير موجودة.</div>;

  let eventDate = null;
  if (event.eventDateTime) {
    if (typeof event.eventDateTime === 'string') eventDate = new Date(event.eventDateTime);
    else if (event.eventDateTime.seconds) eventDate = new Date(event.eventDateTime.seconds * 1000);
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg">
      <div className="brand-bg-light-gold p-6 rounded-lg">
        <button onClick={() => navigate('/events')} className="mb-6 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"> &larr; العودة للفعاليات</button>
        <h1 className="text-3xl md:text-4xl font-extrabold my-4 text-center">{event.title}</h1>
        <img src={event.imageUrl || 'https://placehold.co/800x400/AE0101/FFFFFF?text=Event'} alt={event.title} className="w-full h-auto object-contain max-h-[70vh] rounded-lg mb-6 shadow-md bg-white p-2" />
        
        <div className="flex flex-col space-y-3 text-center md:text-right mb-6">
          <div className="flex items-center justify-center md:justify-start">
            <i className="fas fa-calendar-alt fa-fw ml-2 brand-red"></i>
            <b>الموعد:</b>
            <span className="mr-2">{eventDate ? eventDate.toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' }) : 'غير محدد'}</span>
          </div>
          <div className="flex items-center justify-center md:justify-start">
            <i className="fas fa-map-marker-alt fa-fw ml-2 brand-red"></i>
            <b>المكان:</b>
            <span className="mr-2">{event.location || 'غير محدد'}</span>
          </div>
          {event.subscriptionMethod && (
            <div className="flex items-center justify-center md:justify-start">
              <i className="fas fa-ticket-alt fa-fw ml-2 brand-red"></i>
              <b>طريقة الاشتراك:</b>
              <span className="mr-2">{event.subscriptionMethod}</span>
            </div>
          )}
        </div>

        <div className="prose prose-lg max-w-none text-right">
          <div className="markdown-body">
             <Markdown>{event.content || ''}</Markdown>
          </div>
        </div>
        
        <AdBanners />
      </div>
    </div>
  );
};

export const Events = () => {
  return (
    <Routes>
      <Route path="/" element={<EventList />} />
      <Route path="/:id" element={<EventDetail />} />
    </Routes>
  );
};
