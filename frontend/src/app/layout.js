import './globals.css';
import ReduxProvider from '@/redux/ReduxProvider';

export const metadata = {
  title: 'Maaza International',
  description: 'Maaza International — Grow with purpose',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS via CDN */}
        <script src="https://cdn.tailwindcss.com" />

        {/* Custom harvest green color palette used across all 3 zones */}
        <script dangerouslySetInnerHTML={{
          __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  harvest: {
                    50:  '#f1f8ef',
                    100: '#e4f1df',
                    200: '#c8e4bf',
                    500: '#3b9b62',
                    600: '#218451',
                    700: '#176b43',
                    800: '#125638',
                    900: '#103f2c',
                  }
                },
                boxShadow: {
                  soft: '0 8px 30px rgba(24,61,42,.06)'
                }
              }
            }
          }
        `}} />
      </head>
      {/*
        No navbar/sidebar here — each zone (landing, dashboard, admin)
        has its own layout.jsx that adds the right chrome
      */}
      <body className="bg-slate-50 text-slate-800">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
