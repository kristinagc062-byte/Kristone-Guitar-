import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({ variable: '--font-display', subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'] });
const sans = Montserrat({ variable: '--font-sans-brand', subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Kristone Premium Acoustic Guitar | Find Your Sound',
  description: 'Premium acoustic tone and craftsmanship at a special launch price. FREE DELIVERY IN KATHMANDU, with outside-Valley delivery confirmed by location. Cash on Delivery available.',
  openGraph: {
    title: 'Kristone Guitars — Find Your Sound.',
    description: 'Premium Acoustic Guitar. FREE DELIVERY IN KATHMANDU, with outside-Valley delivery confirmed by location. Cash on Delivery available.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Kristone Guitars — Find Your Sound.' }],
  },
  twitter: { card: 'summary_large_image', title: 'Kristone Guitars — Find Your Sound.', description: 'Premium acoustic guitar with FREE DELIVERY IN KATHMANDU.', images: ['/og.png'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable} antialiased`}>{children}</body></html>;
}
