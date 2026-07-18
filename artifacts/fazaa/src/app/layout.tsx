import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'فزعة - FAZAA',
  description: 'أشهر بطاقات الخصومات في الإمارات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col w-full bg-[#f5f5f5]">
            <Header />
            <main className="flex-1 w-full pb-12">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
