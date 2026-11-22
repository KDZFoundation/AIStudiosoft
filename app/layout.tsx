import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Podróżówka · Centrum Agentów Marketingowych',
  description:
    'System 8 agentów marketingowych dla podrozowka.pl oparty na wiedzy ze szkolenia wraz z generatorem prezentacji projektu zaliczeniowego.',
  openGraph: {
    title: 'Podróżówka · Centrum Agentów Marketingowych',
    description:
      'System 8 agentów marketingowych dla podrozowka.pl oparty na wiedzy ze szkolenia wraz z generatorem prezentacji projektu zaliczeniowego.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podróżówka · Centrum Agentów Marketingowych',
    description:
      'System 8 agentów marketingowych dla podrozowka.pl oparty na wiedzy ze szkolenia wraz z generatorem prezentacji projektu zaliczeniowego.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#FFFBEF] text-[#121926]">
        {children}
      </body>
    </html>
  );
}
