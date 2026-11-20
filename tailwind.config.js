/** Dipindahkan dari konfigurasi inline index.html (Tailwind v3.4.17). */
module.exports = Object.assign({
      darkMode: 'class',
      theme: { 
        extend: { 
          colors: { 
            brand: { 50:'#f0f9ff', 100:'#e0f2fe', 200:'#bae6fd', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 800:'#075985', 900:'#0c4a6e' },
            bankDark: { bg: '#0f172a', card: '#1e293b', border: '#334155' }
          },
          fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
          animation: {
            'blob': 'blob 7s infinite',
            'float': 'float 6s ease-in-out infinite',
          },
          keyframes: {
            blob: {
              '0%': { transform: 'translate(0px, 0px) scale(1)' },
              '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
              '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
              '100%': { transform: 'translate(0px, 0px) scale(1)' },
            },
            float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-10px)' },
            }
          }
        } 
      }
    }, {
  content: ['./index.html','./app.js','./dak-interact.js'],
  // Kelas yang dibentuk dinamis di app.js (mis. `bg-${color}-100`) tidak terdeteksi pemindai, jadi di-safelist:
  safelist: [{ pattern: /^(bg|text|border|ring|from|to|via)-(blue|emerald|indigo|violet|rose|red|amber|orange|pink|teal|purple|slate|green|yellow|sky|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)(\/\d+)?$/, variants: ['dark','hover'] }]
});
