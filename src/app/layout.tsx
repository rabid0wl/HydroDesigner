import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ProjectDataProvider } from '@/context/ProjectDataContext';

export const metadata: Metadata = {
  title: 'HydroDesign Toolkit',
  description: 'A modern, sleek web application for civil engineers to perform hydraulic and infrastructure design calculations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased dark-reader-ignore">
        <ProjectDataProvider>
          {children}
        </ProjectDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
