import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Markdown from 'react-markdown';
import { AdBanners } from '../components/AdBanners';

const PostList = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snap = await getDocs(collection(db, 'posts'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data = data.filter((p: any) => !p.isHidden);
        data.sort((a: any, b: any) => {
          const oA = a.order || 0;
          const oB = b.order || 0;
          if (oA !== oB) return oA - oB;
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA; // desc
        });
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="text-center font-bold p-8">جاري التحميل...</div>;

  const filteredPosts = posts.filter(p => {
    const matchesSearch = (p.title || '').includes(searchQuery) || (p.content || '').includes(searchQuery);
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-extrabold brand-red mb-4 md:mb-0">المنشورات</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="البحث في المنشورات..." 
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
            <option value="خبر">خبر</option>
            <option value="مقال">مقال</option>
            <option value="مشاركة الأعضاء">مشاركة الأعضاء</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.length > 0 ? filteredPosts.map(post => {
          let d = '';
          if (post.postDate) {
            if (typeof post.postDate === 'string') d = new Date(post.postDate).toLocaleDateString('ar-EG', { dateStyle: 'long' });
            else if (post.postDate.seconds) d = new Date(post.postDate.seconds * 1000).toLocaleDateString('ar-EG', { dateStyle: 'long' });
          }
          return (
            <Link key={post.id} to={`/posts/${post.id}`} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col card-hover-effect">
              {post.imageUrl ? (
                <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <img src={post.imageUrl} alt={post.title} className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
              ) : (
                <div className="relative w-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500" style={{ paddingBottom: '56.25%' }}>
                  <span>لا توجد صورة</span>
                </div>
              )}
              <div className="p-4 flex-grow flex flex-col cursor-pointer">
                <span className="text-sm font-semibold brand-bg-red text-white px-2 py-1 rounded-full self-start">{post.category || 'عام'}</span>
                <h4 className="font-bold text-lg mt-2 mb-2 truncate">{post.title}</h4>
                {d && <p className="text-sm text-gray-500">{d}</p>}
              </div>
            </Link>
          )
        }) : <p className="col-span-full text-center text-gray-500 py-10 font-bold">لا توجد منشورات حالياً.</p>}
      </div>
    </>
  );
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        let snap = await getDoc(doc(db, 'posts', id));
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="text-center font-bold p-8">جاري التحميل...</div>;
  if (!post) return <div className="text-center text-red-500 font-bold p-8">المنشور غير موجود.</div>;

  let postDateStr = '';
  if (post.postDate) {
    if (typeof post.postDate === 'string') postDateStr = new Date(post.postDate).toLocaleDateString('ar-EG', { dateStyle: 'long' });
    else if (post.postDate.seconds) postDateStr = new Date(post.postDate.seconds * 1000).toLocaleDateString('ar-EG', { dateStyle: 'long' });
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-lg shadow-lg">
      <div className="brand-bg-light-gold p-6 rounded-lg">
        <button onClick={() => navigate('/posts')} className="mb-6 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"> &larr; العودة للمنشورات</button>
        <h1 className="text-3xl md:text-4xl font-extrabold my-4 text-center">{post.title}</h1>
        {postDateStr && <p className="text-center text-gray-500 mb-6">{postDateStr}</p>}
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-contain max-h-[70vh] rounded-lg mb-6 shadow-md bg-white p-2" />
        )}
        
        <div className="prose prose-lg max-w-none text-right">
          <div className="markdown-body">
             <Markdown>{post.content || ''}</Markdown>
          </div>
        </div>

        <AdBanners />
      </div>
    </div>
  );
};

export const Posts = () => {
  return (
    <Routes>
      <Route path="/" element={<PostList />} />
      <Route path="/:id" element={<PostDetail />} />
    </Routes>
  );
};
