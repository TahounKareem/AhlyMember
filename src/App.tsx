import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Modals } from './components/Modals';

// Pages
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { Posts } from './pages/Posts';
import { Forums } from './pages/Forums';
import { Polls } from './pages/Polls';
import { Admin } from './pages/Admin';

function Layout() {
  const [activeModal, setActiveModal] = useState<string | { type: string; data?: any } | null>(null);

  const openModal = (payload: any) => setActiveModal(payload);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenModal={openModal} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home onOpenModal={openModal} />} />
          <Route path="/events/*" element={<Events />} />
          <Route path="/posts/*" element={<Posts />} />
          <Route path="/forums/*" element={<Forums />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer onOpenModal={openModal} />
      <Modals activeModal={activeModal} onClose={closeModal} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
