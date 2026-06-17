// Add this right at the top of your js/app.js file:
window.APP_CONFIG = {
    BACKEND_URL: "http://localhost:8000",
    ADMIN_API_KEY: "super-secret-production-key"
};
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
            colors: {
                brand: {
                    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
                    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
                    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
                },
                surface: {
                    0: '#0a0a1a', 1: '#111127', 2: '#1a1a35', 3: '#232347', 4: '#2d2d5c'
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-down': 'slideDown 0.4s ease-out forwards',
                'pulse-slow': 'pulse 3s infinite',
                'shimmer': 'shimmer 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'progress': 'progressBar 2.5s ease-in-out',
                'scan-line': 'scanLine 2s ease-in-out infinite',
                'count-up': 'countUp 1s ease-out forwards',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { opacity: '0', transform: 'translateY(30px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                slideDown: { '0%': { opacity: '0', transform: 'translateY(-20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
                float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
                glow: { '0%': { boxShadow: '0 0 20px rgba(99,102,241,0.15)' }, '100%': { boxShadow: '0 0 40px rgba(99,102,241,0.3)' } },
                progressBar: { '0%': { width: '0%' }, '100%': { width: '100%' } },
                scanLine: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
                countUp: { '0%': { opacity: '0', transform: 'scale(0.5)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
            }
        }
    }
}
