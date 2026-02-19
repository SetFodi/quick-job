import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
    title: 'Quick-Job — Freelance Marketplace',
    description: 'A secure gig marketplace with escrow-protected payments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    richColors
                    closeButton
                />
            </body>
        </html>
    );
}
