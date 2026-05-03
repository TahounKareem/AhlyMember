import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Markdown from 'react-markdown';

const ForumList = () => {
  const [forums, setForums] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchForums = async () => {
      const snap = await getDocs(query(collection(db, 'forums'), orderBy('createdAt', 'desc')));
      setForums(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchForums();
  }, []);

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-extrabold mb-8 brand-red">المنتديات</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums.map(f => (
          <Link key={f.id} to={`/forums/${f.id}`} className="block bg-white p-6 rounded-lg shadow-md card-hover-effect">
            <h3 className="text-2xl font-bold brand-red">{f.name}</h3>
            <p className="text-gray-600 mt-2">{f.description}</p>
          </Link>
        ))}
        {forums.length === 0 && <p className="text-gray-500 font-bold">لا توجد منتديات حالياً.</p>}
      </div>
    </>
  );
};

const ThreadList = () => {
  const { forumId } = useParams();
  const { isRegisteredUser, isAdmin } = useAuth();
  const [forum, setForum] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { userData } = useAuth();

  const fetchData = async () => {
    if (!forumId) return;
    const fSnap = await getDoc(doc(db, 'forums', forumId));
    if (fSnap.exists()) setForum({ id: fSnap.id, ...fSnap.data() });
    
    const tSnap = await getDocs(query(collection(db, `forums/${forumId}/threads`), orderBy('createdAt', 'desc')));
    setThreads(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, [forumId]);

  const handleDelete = async (threadId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموضوع وكل ردوده؟')) {
      await deleteDoc(doc(db, `forums/${forumId}/threads`, threadId));
      fetchData();
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isRegisteredUser || !userData) return;
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    
    await addDoc(collection(db, `forums/${forumId}/threads`), {
      title, content, authorId: userData.uid, authorName: userData.displayName, createdAt: new Date(), replyCount: 0
    });
    await updateDoc(doc(db, 'users', userData.uid), { points: increment(20) });
    setShowForm(false);
    fetchData();
  };

  if (!forum) return <div className="p-8 text-center">جاري تحميل المنتدى...</div>;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-extrabold brand-red">{forum.name}</h2>
        {isRegisteredUser ? (
          <button onClick={() => setShowForm(!showForm)} className="brand-bg-gold hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            {showForm ? 'إلغاء' : 'أضف موضوعاً جديداً'}
          </button>
        ) : (
          <button disabled className="bg-gray-300 text-gray-500 font-bold py-2 px-6 rounded-lg cursor-not-allowed">أضف موضوعاً (سجل دخولك أولاً)</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-md mb-8">
           <input name="title" placeholder="عنوان الموضوع" className="shadow w-full py-2 px-3 border rounded mb-4" required />
           <textarea name="content" rows={5} placeholder="محتوى الموضوع (ماركداون)" className="shadow w-full py-2 px-3 border rounded mb-4" required></textarea>
           <button type="submit" className="brand-bg-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">نشر الموضوع</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {threads.length > 0 ? threads.map(t => (
            <div key={t.id} className="flex items-start justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 rounded-md">
              <div className="flex-grow">
                <Link to={`/forums/${forumId}/${t.id}`} className="text-lg font-bold brand-red hover:underline">{t.title}</Link>
                <p className="text-sm text-gray-500 mt-1">
                  بواسطة: {t.authorName} - {t.createdAt ? new Date((t.createdAt.seconds || 0) * 1000).toLocaleDateString('ar-EG') : ''}
                </p>
              </div>
              <div className="text-center mx-4 flex-shrink-0">
                <span className="font-bold text-xl text-gray-700">{t.replyCount || 0}</span>
                <p className="text-sm text-gray-500">ردود</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 font-bold">حذف</button>
              )}
            </div>
          )) : (
            <p className="text-center text-gray-500 py-8 font-bold">لا توجد مواضيع حالياً. كن أول من يبدأ نقاشاً!</p>
          )}
        </div>
      </div>
    </>
  );
};

const ThreadDetail = () => {
  const { forumId, threadId } = useParams();
  const navigate = useNavigate();
  const { isRegisteredUser, userData } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');

  const fetchData = async () => {
    if (!forumId || !threadId) return;
    const tRef = doc(db, `forums/${forumId}/threads`, threadId);
    const tSnap = await getDoc(tRef);
    if (!tSnap.exists()) return;
    setThread({ id: tSnap.id, ...tSnap.data() });

    const rSnap = await getDocs(query(collection(db, `forums/${forumId}/threads/${threadId}/replies`), orderBy('createdAt', 'asc')));
    setReplies(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, [forumId, threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisteredUser || !userData || !replyContent.trim()) return;

    await addDoc(collection(db, `forums/${forumId}/threads/${threadId}/replies`), {
      content: replyContent, authorId: userData.uid, authorName: userData.displayName, createdAt: new Date()
    });
    await updateDoc(doc(db, `forums/${forumId}/threads`, threadId!), { replyCount: increment(1) });
    await updateDoc(doc(db, 'users', userData.uid), { points: increment(5) });
    setReplyContent('');
    fetchData();
  };

  if (!thread) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
     <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg rtl">
        <button onClick={() => navigate(`/forums/${forumId}`)} className="mb-6 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"> &larr; العودة للمنتدى</button>
        <h1 className="text-3xl md:text-4xl font-extrabold my-4">{thread.title}</h1>
        <p className="text-gray-500 mb-6 font-bold">بواسطة: {thread.authorName} - {thread.createdAt ? new Date((thread.createdAt.seconds || 0) * 1000).toLocaleString('ar-EG') : ''}</p>
        
        <div className="prose prose-lg max-w-none mb-10 pb-10 border-b-2 text-right">
           <Markdown>{thread.content}</Markdown>
        </div>

        <h3 className="text-2xl font-bold mb-6">الردود ({replies.length})</h3>
        <div className="space-y-6 mb-8">
          {replies.map(r => (
            <div key={r.id} className="p-4 bg-gray-50 rounded-lg border">
              <p className="font-bold">{r.authorName}</p>
              <p className="text-xs text-gray-500 mb-2">{r.createdAt ? new Date((r.createdAt.seconds || 0) * 1000).toLocaleString('ar-EG') : ''}</p>
              <div className="prose text-right"><Markdown>{r.content}</Markdown></div>
            </div>
          ))}
        </div>

        {isRegisteredUser ? (
          <form onSubmit={handleReply}>
             <h4 className="text-xl font-bold mb-4">أضف ردك</h4>
             <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required></textarea>
             <button type="submit" className="mt-4 brand-bg-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">إضافة الرد</button>
          </form>
        ) : (
          <div className="text-center p-4 bg-gray-100 rounded-lg font-bold">لإضافة رد، يرجى تسجيل الدخول أولاً.</div>
        )}
     </div>
  );
};

export const Forums = () => {
  return (
    <Routes>
      <Route path="/" element={<ForumList />} />
      <Route path="/:forumId" element={<ThreadList />} />
      <Route path="/:forumId/:threadId" element={<ThreadDetail />} />
    </Routes>
  );
};
