import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
    title: 'Quick-Job — Фриланс-площадка с эскроу',
    description: 'Безопасная площадка для фриланса с эскроу-защитой платежей.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    richColors
                    closeButton
                    toastOptions={{
                        style: {
                            background: '#131316',
                            border: '1px solid rgba(255,255,255,0.06)',
                            fontFamily: 'Manrope, system-ui',
                        },
                    }}
                />
            </body>
        </html>
    );
}
