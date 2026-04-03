import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import AmbientPlayer from './AmbientPlayer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      <AmbientPlayer />
    </div>
  );
}
