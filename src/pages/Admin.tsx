import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_width = 800;
        if (width > max_width) {
          height = Math.round((height * max_width) / width);
          width = max_width;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
};

export const Admin = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forums, setForums] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
     try {
       const fSnap = await getDocs(collection(db, 'forums'));
       setForums(fSnap.docs.map(d => ({id: d.id, ...d.data()})));
     } catch (e) { console.error("Error fetching forums", e); }
     
     try {
       const pSnap = await getDocs(collection(db, 'polls'));
       setPolls(pSnap.docs.map(d => ({id: d.id, ...d.data()})));
     } catch (e) { console.error("Error fetching polls", e); }

     try {
       const eSnap = await getDocs(collection(db, 'events'));
       setEvents(eSnap.docs.map(d => ({id: d.id, ...d.data()})));
     } catch (e) { console.error("Error fetching events", e); }

     try {
       const sSnap = await getDocs(collection(db, 'slides'));
       setSlides(sSnap.docs.map(d => ({id: d.id, ...d.data()})));
     } catch (e) { console.error("Error fetching slides", e); }

     try {
       const postsSnap = await getDocs(collection(db, 'posts'));
       setPosts(postsSnap.docs.map(d => ({id: d.id, ...d.data()})));
     } catch (e) { console.error("Error fetching posts", e); }
  };

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const desc = (form.elements.namedItem('desc') as HTMLTextAreaElement).value;
    await addDoc(collection(db, 'forums'), { name, description: desc, createdAt: new Date() });
    form.reset();
    fetchData();
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = (document.getElementById('poll-question') as HTMLInputElement).value;
    const validOptions = pollOptions.filter(Boolean);
    if (!question || validOptions.length < 2) return;

    const optionsMap = validOptions.reduce((acc: any, o) => { acc[o] = 0; return acc; }, {});
    const batch = writeBatch(db);
    
    const activePolls = await getDocs(query(collection(db, "polls"), where("isActive", "==", true)));
    activePolls.forEach(d => batch.update(d.ref, { isActive: false }));
    
    batch.set(doc(collection(db, 'polls')), {
      question, options: optionsMap, userVotes: {}, isActive: true, createdAt: new Date()
    });
    
    await batch.commit();
    setPollOptions(['', '']);
    (document.getElementById('poll-question') as HTMLInputElement).value = '';
    fetchData();
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const img = (form.elements.namedItem('img') as HTMLInputElement).value;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const subtitle = (form.elements.namedItem('subtitle') as HTMLInputElement).value;
    const modalText = (form.elements.namedItem('modalText') as HTMLInputElement).value;
    const externalUrl = (form.elements.namedItem('externalUrl') as HTMLInputElement).value;
    const buttonText = (form.elements.namedItem('buttonText') as HTMLInputElement).value || 'الذهاب إلى العرض';
    const order = parseInt((form.elements.namedItem('order') as HTMLInputElement).value) || 0;
    
    if (editingSlide) {
      await updateDoc(doc(db, 'slides', editingSlide.id), { img, title, subtitle, modalText, externalUrl, buttonText, order });
      setEditingSlide(null);
    } else {
      await addDoc(collection(db, 'slides'), { img, title, subtitle, modalText, externalUrl, buttonText, order, createdAt: new Date() });
    }
    
    form.reset();
    fetchData();
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const date = (form.elements.namedItem('date') as HTMLInputElement).value;
    const location = (form.elements.namedItem('location') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const subMethod = (form.elements.namedItem('subMethod') as HTMLInputElement).value;
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const order = parseInt((form.elements.namedItem('order') as HTMLInputElement).value) || 0;
    const imageUrlStr = (form.elements.namedItem('imageUrlStr') as HTMLInputElement).value;
    
    const fileInput = form.elements.namedItem('image') as HTMLInputElement;
    let imageUrl = imageUrlStr || (editingEvent?.imageUrl || '');
    
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const oldText = submitBtn.innerText;
    submitBtn.innerText = 'جاري الحفظ...';
    submitBtn.disabled = true;

    try {
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await resizeImage(fileInput.files[0]);
      }

      const payload = {
        title,
        eventDateTime: date,
        location,
        content,
        subscriptionMethod: subMethod,
        category,
        order,
        imageUrl,
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), payload);
        setEditingEvent(null);
      } else {
        await addDoc(collection(db, 'events'), {
          ...payload,
          isHidden: false,
          createdAt: new Date()
        });
      }

      form.reset();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الفعالية');
    } finally {
      submitBtn.innerText = oldText;
      submitBtn.disabled = false;
    }
  };

  const handleToggleHideEvent = async (id: string, isHidden: boolean) => {
    await updateDoc(doc(db, 'events', id), { isHidden: !isHidden });
    fetchData();
  };

  const handleToggleOrderEvent = async (id: string, newOrder: number) => {
      await updateDoc(doc(db, 'events', id), { order: newOrder });
      fetchData();
  };

  const handleDelete = async (coll: string, id: string) => {
    if (confirm('تأكيد الحذف؟')) {
      await deleteDoc(doc(db, coll, id));
      fetchData();
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const date = (form.elements.namedItem('date') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const order = parseInt((form.elements.namedItem('order') as HTMLInputElement).value) || 0;
    const imageUrlStr = (form.elements.namedItem('imageUrlStr') as HTMLInputElement).value;
    
    const fileInput = form.elements.namedItem('image') as HTMLInputElement;
    let imageUrl = imageUrlStr || (editingPost?.imageUrl || '');
    
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const oldText = submitBtn.innerText;
    submitBtn.innerText = 'جاري الحفظ...';
    submitBtn.disabled = true;

    try {
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await resizeImage(fileInput.files[0]);
      }

      const payload = {
        title,
        postDate: date,
        content,
        category,
        order,
        imageUrl,
      };

      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), payload);
        setEditingPost(null);
      } else {
        await addDoc(collection(db, 'posts'), {
          ...payload,
          isHidden: false,
          createdAt: new Date()
        });
      }

      form.reset();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المنشور');
    } finally {
      submitBtn.innerText = oldText;
      submitBtn.disabled = false;
    }
  };

  const handleToggleHidePost = async (id: string, isHidden: boolean) => {
    await updateDoc(doc(db, 'posts', id), { isHidden: !isHidden });
    fetchData();
  };

  const handleToggleOrderPost = async (id: string, newOrder: number) => {
      await updateDoc(doc(db, 'posts', id), { order: newOrder });
      fetchData();
  };

  if (!isAdmin) return null;

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-extrabold mb-8 brand-red">لوحة تحكم الأدمن</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Events Management */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4">إدارة الفعاليات</h3>
          <form onSubmit={handleSaveEvent} className="space-y-4 bg-gray-50 p-4 rounded-lg border" id="event-form">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-lg">{editingEvent ? 'تعديل الفعالية' : 'إضافة فعالية جديدة'}</h4>
               {editingEvent && (
                 <button type="button" onClick={() => { setEditingEvent(null); (document.getElementById('event-form') as HTMLFormElement).reset(); }} className="text-sm text-gray-500 hover:text-gray-800">إلغاء التعديل</button>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="title" defaultValue={editingEvent?.title} placeholder="عنوان الفعالية" className="shadow w-full p-2 border rounded" required />
               <input name="date" type="datetime-local" defaultValue={editingEvent?.eventDateTime} placeholder="الموعد" className="shadow w-full p-2 border rounded" required />
               <input name="location" defaultValue={editingEvent?.location} placeholder="المكان" className="shadow w-full p-2 border rounded" required />
               <input name="order" type="number" defaultValue={editingEvent?.order || 0} placeholder="ترتيب الظهور (مثال: 1, 2...)" className="shadow w-full p-2 border rounded" required />
               <input name="image" type="file" accept="image/*" className="shadow w-full p-2 border rounded bg-white" />
               <input name="imageUrlStr" defaultValue={editingEvent?.imageUrl} placeholder="أو رابط مباشر لصورة (مرفقات)" className="shadow w-full p-2 border rounded" />
               <input name="subMethod" defaultValue={editingEvent?.subscriptionMethod} placeholder="طريقة الاشتراك" className="shadow w-full p-2 border rounded" required />
               <select name="category" defaultValue={editingEvent?.category || ''} className="shadow w-full p-2 border rounded bg-white" required>
                 <option value="">اختر نوع الفعالية...</option>
                 <option value="فعاليات عامة">فعاليات عامة</option>
                 <option value="فعاليات فنية">فعاليات فنية</option>
                 <option value="فعاليات رياضية">فعاليات رياضية</option>
                 <option value="فعاليات ثقافية">فعاليات ثقافية</option>
                 <option value="فعاليات رواد">فعاليات رواد</option>
               </select>
             </div>
             <textarea name="content" defaultValue={editingEvent?.content} rows={4} placeholder="الوصف (يدعم ماركداون)" className="shadow w-full p-2 border rounded" required></textarea>
             <button type="submit" className="brand-bg-red text-white font-bold py-2 px-6 rounded w-full md:w-auto">
               {editingEvent ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
             </button>
          </form>

          <hr className="my-6" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-right table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">الترتيب</th>
                  <th className="border p-2">العنوان</th>
                  <th className="border p-2">الموعد</th>
                  <th className="border p-2">الحالة</th>
                  <th className="border p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {events.sort((a,b) => (a.order || 0) - (b.order || 0)).map(e => {
                  let d = '';
                  if (e.eventDateTime) {
                    if (typeof e.eventDateTime === 'string') d = new Date(e.eventDateTime).toLocaleString('ar-EG');
                    else if (e.eventDateTime.seconds) d = new Date(e.eventDateTime.seconds * 1000).toLocaleString('ar-EG');
                  }
                  return (
                    <tr key={e.id} className={e.isHidden ? "bg-red-50 text-gray-500" : ""}>
                      <td className="border p-2 text-center w-24">
                        <input 
                          type="number" 
                          defaultValue={e.order || 0} 
                          className="w-16 p-1 border rounded text-center" 
                          onBlur={(ev) => {
                             const val = parseInt(ev.target.value);
                             if (!isNaN(val) && val !== e.order) handleToggleOrderEvent(e.id, val);
                          }}
                        />
                      </td>
                      <td className="border p-2 font-bold max-w-[200px] truncate">{e.title}</td>
                      <td className="border p-2">{d}</td>
                      <td className="border p-2 text-sm">{e.isHidden ? 'مخفية' : 'ظاهرة'}</td>
                      <td className="border p-2 space-x-2 space-x-reverse min-w-[170px]">
                        <button onClick={() => {
                          setEditingEvent(e);
                          window.scrollTo({ top: document.getElementById('event-form')?.offsetTop || 0, behavior: 'smooth' });
                        }} className="text-green-600 font-bold hover:underline">تعديل</button>
                        <button onClick={() => handleToggleHideEvent(e.id, !!e.isHidden)} className="text-blue-600 font-bold hover:underline">
                          {e.isHidden ? 'إظهار' : 'إخفاء'}
                        </button>
                        <button onClick={() => handleDelete('events', e.id)} className="text-red-500 font-bold hover:underline">حذف</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {events.length === 0 && <p className="text-gray-500 font-bold p-4 text-center">لا توجد فعاليات معروضة.</p>}
          </div>
        </div>

        {/* Posts Management */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4">إدارة المنشورات</h3>
          <form onSubmit={handleSavePost} className="space-y-4 bg-gray-50 p-4 rounded-lg border" id="post-form">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-lg">{editingPost ? 'تعديل المنشور' : 'إضافة منشور جديد'}</h4>
               {editingPost && (
                 <button type="button" onClick={() => { setEditingPost(null); (document.getElementById('post-form') as HTMLFormElement).reset(); }} className="text-sm text-gray-500 hover:text-gray-800">إلغاء التعديل</button>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="title" defaultValue={editingPost?.title} placeholder="عنوان المنشور" className="shadow w-full p-2 border rounded" required />
               <input name="date" type="datetime-local" defaultValue={editingPost?.postDate} placeholder="تاريخ المنشور" className="shadow w-full p-2 border rounded" required />
               <input name="order" type="number" defaultValue={editingPost?.order || 0} placeholder="ترتيب الظهور (مثال: 1, 2...)" className="shadow w-full p-2 border rounded" required />
               <input name="image" type="file" accept="image/*" className="shadow w-full p-2 border rounded bg-white" />
               <input name="imageUrlStr" defaultValue={editingPost?.imageUrl} placeholder="أو رابط مباشر لصورة (مرفقات)" className="shadow w-full p-2 border rounded" />
               <select name="category" defaultValue={editingPost?.category || ''} className="shadow w-full p-2 border rounded bg-white" required>
                 <option value="">اختر نوع المنشور...</option>
                 <option value="خبر">خبر</option>
                 <option value="مقال">مقال</option>
                 <option value="مشاركة الأعضاء">مشاركة الأعضاء</option>
               </select>
             </div>
             <textarea name="content" defaultValue={editingPost?.content} rows={4} placeholder="الوصف (يدعم ماركداون)" className="shadow w-full p-2 border rounded" required></textarea>
             <button type="submit" className="brand-bg-red text-white font-bold py-2 px-6 rounded w-full md:w-auto">
               {editingPost ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
             </button>
          </form>

          <hr className="my-6" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-right table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">الترتيب</th>
                  <th className="border p-2">العنوان</th>
                  <th className="border p-2">تاريخ المنشور</th>
                  <th className="border p-2">القسم</th>
                  <th className="border p-2">الحالة</th>
                  <th className="border p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {posts.sort((a,b) => (a.order || 0) - (b.order || 0)).map(p => {
                  let d = '';
                  if (p.postDate) {
                    if (typeof p.postDate === 'string') d = new Date(p.postDate).toLocaleString('ar-EG');
                    else if (p.postDate.seconds) d = new Date(p.postDate.seconds * 1000).toLocaleString('ar-EG');
                  }
                  return (
                    <tr key={p.id} className={p.isHidden ? "bg-red-50 text-gray-500" : ""}>
                      <td className="border p-2 text-center w-24">
                        <input 
                          type="number" 
                          defaultValue={p.order || 0} 
                          className="w-16 p-1 border rounded text-center" 
                          onBlur={(ev) => {
                             const val = parseInt(ev.target.value);
                             if (!isNaN(val) && val !== p.order) handleToggleOrderPost(p.id, val);
                          }}
                        />
                      </td>
                      <td className="border p-2 font-bold max-w-[200px] truncate">{p.title}</td>
                      <td className="border p-2">{d}</td>
                      <td className="border p-2">{p.category}</td>
                      <td className="border p-2 text-sm">{p.isHidden ? 'مخفي' : 'ظاهر'}</td>
                      <td className="border p-2 space-x-2 space-x-reverse min-w-[170px]">
                        <button onClick={() => {
                          setEditingPost(p);
                          window.scrollTo({ top: document.getElementById('post-form')?.offsetTop || 0, behavior: 'smooth' });
                        }} className="text-green-600 font-bold hover:underline">تعديل</button>
                        <button onClick={() => handleToggleHidePost(p.id, !!p.isHidden)} className="text-blue-600 font-bold hover:underline">
                          {p.isHidden ? 'إظهار' : 'إخفاء'}
                        </button>
                        <button onClick={() => handleDelete('posts', p.id)} className="text-red-500 font-bold hover:underline">حذف</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {posts.length === 0 && <p className="text-gray-500 font-bold p-4 text-center">لا توجد منشورات.</p>}
          </div>
        </div>

        {/* Slides Management */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6 lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4">إدارة واجهة الموقع (السلايدر)</h3>
          <form onSubmit={handleSaveSlide} className="space-y-4 bg-gray-50 p-4 rounded-lg border" id="slide-form">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-lg">{editingSlide ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}</h4>
               {editingSlide && (
                 <button type="button" onClick={() => { setEditingSlide(null); (document.getElementById('slide-form') as HTMLFormElement).reset(); }} className="text-sm text-gray-500 hover:text-gray-800">إلغاء التعديل</button>
               )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="img" defaultValue={editingSlide?.img || editingSlide?.imageUrl} placeholder="رابط الصورة" className="shadow w-full p-2 border rounded" required />
               <input name="title" defaultValue={editingSlide?.title} placeholder="العنوان الرئيسي" className="shadow w-full p-2 border rounded" required />
               <input name="subtitle" defaultValue={editingSlide?.subtitle} placeholder="العنوان الفرعي" className="shadow w-full p-2 border rounded" required />
               <input name="modalText" defaultValue={editingSlide?.modalText} placeholder="الرسالة (Modal Text)" className="shadow w-full p-2 border rounded" required />
               <input name="externalUrl" defaultValue={editingSlide?.externalUrl} placeholder="الرابط الخارجي (اختياري)" className="shadow w-full p-2 border rounded" />
               <input name="buttonText" defaultValue={editingSlide?.buttonText} placeholder="نص زر الرابط الخارجي (افتراضي: الذهاب إلى العرض)" className="shadow w-full p-2 border rounded" />
               <input name="order" type="number" defaultValue={editingSlide?.order || 0} placeholder="ترتيب الظهور" className="shadow w-full p-2 border rounded" required />
             </div>
             <button type="submit" className="brand-bg-red text-white font-bold py-2 px-6 rounded w-full md:w-auto">
               {editingSlide ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
             </button>
          </form>

          <hr className="my-6" />
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {slides.sort((a,b) => (a.order || 0) - (b.order || 0)).map(s => (
              <li key={s.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-4 w-3/4">
                  <span className="font-bold text-sm truncate">{s.title}</span>
                </div>
                <div className="space-x-2 space-x-reverse">
                  <button onClick={() => {
                    setEditingSlide(s);
                    window.scrollTo({ top: document.getElementById('slide-form')?.offsetTop || 0, behavior: 'smooth' });
                  }} className="text-blue-500 font-bold hover:underline">تعديل</button>
                  <button onClick={() => handleDelete('slides', s.id)} className="text-red-500 font-bold hover:underline">حذف</button>
                </div>
              </li>
            ))}
            {slides.length === 0 && <p className="text-gray-500 text-center p-4">لا يوجد شرائح.</p>}
          </ul>
        </div>

        {/* Forums Management */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">إدارة المنتديات</h3>
            <form onSubmit={handleCreateForum} className="space-y-4">
              <input name="name" placeholder="اسم المنتدى" className="shadow w-full p-2 border rounded" required />
              <textarea name="desc" placeholder="وصف قصير للمنتدى" className="shadow w-full p-2 border rounded" required></textarea>
              <button type="submit" className="brand-bg-red text-white font-bold py-2 px-4 rounded w-full">إنشاء منتدى جديد</button>
            </form>
            <hr className="my-4" />
            <ul className="space-y-2">
              {forums.map(f => (
                <li key={f.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-bold">{f.name}</span>
                  <button onClick={() => handleDelete('forums', f.id)} className="text-red-500 font-bold hover:underline">حذف</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Polls Management */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">إدارة الاستطلاعات</h3>
            <form onSubmit={handleCreatePoll} className="space-y-4">
               <p className="text-sm text-gray-500">ملاحظة: إنشاء استطلاع جديد سيقوم بأرشفة الاستطلاع الفعال حالياً.</p>
               <input id="poll-question" placeholder="سؤال الاستطلاع" className="shadow w-full p-2 border rounded" required />
               <div className="space-y-2">
                 {pollOptions.map((opt, i) => (
                    <input key={i} value={opt} onChange={(e) => {
                       const newOpts = [...pollOptions];
                       newOpts[i] = e.target.value;
                       setPollOptions(newOpts);
                    }} placeholder={`الخيار ${i + 1}`} className="shadow w-full p-2 border rounded" required={i < 2} />
                 ))}
               </div>
               <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="text-sm text-blue-600 font-bold hover:underline">إضافة خيار آخر</button>
               <button type="submit" className="brand-bg-red text-white font-bold py-2 px-4 rounded w-full">نشر استطلاع جديد</button>
            </form>
            <hr className="my-4" />
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {polls.map(p => (
                <li key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-bold text-sm truncate w-3/4">{p.question} {p.isActive && <span className="text-green-600">(فعال)</span>}</span>
                  <button onClick={() => handleDelete('polls', p.id)} className="text-red-500 font-bold hover:underline">حذف</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
      </div>
    </>
  );
};
