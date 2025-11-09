import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr({
      // SVG를 React 컴포넌트로 import 가능하게 설정
      svgrOptions: {
        icon: true,
      },
      // ReactComponent로 export 가능하게 설정
      exportAsDefault: false,
    }),
  ],
})
