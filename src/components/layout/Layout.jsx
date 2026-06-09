import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import VirtualAssistant from '@/components/VirtualAssistant';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Header />

      <main className="flex-1 pt-16 lg:pt-20 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Virtual Assistant — floating chatbot widget */}
      <VirtualAssistant />

      <Footer />

      <MobileNav />

      <Toaster
        position="top-right"
        gutter={8}
        containerClassName=""
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.2)',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.2)',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;
