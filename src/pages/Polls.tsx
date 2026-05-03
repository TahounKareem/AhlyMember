import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const Polls = () => {
  const { isRegisteredUser, userData } = useAuth();
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pastPolls, setPastPolls] = useState<any[]>([]);

  const fetchPolls = async () => {
    const actSnap = await getDocs(query(collection(db, "polls"), where("isActive", "==", true)));
    if (!actSnap.empty) {
      setActivePoll({ id: actSnap.docs[0].id, ...actSnap.docs[0].data() });
    }

    const pastSnap = await getDocs(query(collection(db, "polls"), where("isActive", "==", false)));
    const pastData = pastSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    pastData.sort((a: any, b: any) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
    setPastPolls(pastData);
  };

  useEffect(() => { fetchPolls(); }, []);

  const handleVote = async (option: string) => {
    if (!isRegisteredUser || !userData || !activePoll) return;
    const pRef = doc(db, 'polls', activePoll.id);
    const uRef = doc(db, 'users', userData.uid);
    try {
      await updateDoc(pRef, {
        [`options.${option}`]: increment(1),
        [`userVotes.${userData.uid}`]: true
      });
      await updateDoc(uRef, { points: increment(5) });
      fetchPolls();
    } catch(e) {
      console.error(e);
    }
  };

  const renderPollSection = (poll: any, isActive: boolean) => {
    const totalVotes = Object.values(poll.options).reduce((s: any, v: any) => s + v, 0) as number;
    const hasVoted = poll.userVotes && userData && poll.userVotes[userData.uid];

    return (
      <div className="w-full">
        <h4 className="text-xl font-bold mb-4">{poll.question}</h4>
        <div className="space-y-3">
          {Object.entries(poll.options).map(([o, v]: [string, any]) => {
            const p = totalVotes > 0 ? ((v / totalVotes) * 100).toFixed(1) : 0;
            return (
              <div key={o} className="poll-option-wrapper">
                {isActive ? (
                  <button 
                    onClick={() => handleVote(o)}
                    className={`w-full text-right p-3 border rounded-lg transition-colors ${(!isRegisteredUser || hasVoted) ? 'cursor-not-allowed bg-gray-50' : 'hover:bg-red-50'}`}
                    disabled={!isRegisteredUser || hasVoted}
                  >
                    {o}
                  </button>
                ) : (
                  <div className="flex justify-between items-center text-sm font-bold mb-1">
                     <span className="text-gray-700">{o}</span>
                     <span>{p}%</span>
                  </div>
                )}
                
                {(!isActive || hasVoted) && (
                  <div className="relative mt-1 h-4 md:h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute top-0 right-0 h-full brand-bg-red" style={{ width: `${p}%` }}></div>
                    {isActive && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-white">{p}%</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {isActive && hasVoted && <p className="mt-4 text-center text-green-600 font-bold">شكراً لمشاركتك!</p>}
        {isActive && !isRegisteredUser && <p className="mt-4 text-center text-gray-500 font-bold">للتصويت، يرجى تسجيل الدخول.</p>}
      </div>
    );
  };

  return (
    <>
      <h2 className="text-3xl md:text-4xl font-extrabold mb-8 brand-red">الاستطلاعات</h2>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          {activePoll ? renderPollSection(activePoll, true) : <p className="text-center text-gray-500 font-bold">لا يوجد استطلاع فعال حالياً.</p>}
        </div>

        <h3 className="text-2xl md:text-3xl font-bold mb-6 border-r-4 border-red-600 pr-4">نتائج الاستطلاعات السابقة</h3>
        <div className="space-y-4">
          {pastPolls.length > 0 ? pastPolls.map(poll => (
             <div key={poll.id} className="bg-white p-6 rounded-lg shadow-sm">
                {renderPollSection(poll, false)}
             </div>
          )) : <p className="text-center text-gray-500 font-bold">لا توجد استطلاعات مؤرشفة.</p>}
        </div>
      </div>
    </>
  );
};
