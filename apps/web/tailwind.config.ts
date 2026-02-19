import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                surface: {
                    DEFAULT: '#131316',
                    hover: '#1a1a1f',
                },
                gold: {
                    DEFAULT: '#f59e0b',
                    dim: '#d97706',
                    glow: 'rgba(245, 158, 11, 0.15)',
                },
                brand: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                    950: '#451a03',
                },
            },
            fontFamily: {
                display: ['Unbounded', 'system-ui', 'sans-serif'],
                sans: ['Manrope', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
