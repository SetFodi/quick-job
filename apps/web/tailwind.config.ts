import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#b9e0fe',
                    300: '#7cc8fd',
                    400: '#36adf9',
                    500: '#0c93ea',
                    600: '#0074c8',
                    700: '#015ca2',
                    800: '#064f86',
                    900: '#0b426f',
                    950: '#072a4a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
