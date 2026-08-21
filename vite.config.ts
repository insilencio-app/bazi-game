import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8787';
  // Vercel's Supabase integration injects non-VITE public values for server
  // and build contexts. Expose only the Project URL and publishable key to
  // the client bundle; never map SUPABASE_SECRET_KEY or any service secret.
  const publicSupabaseUrl = env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const publicSupabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(publicSupabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publicSupabasePublishableKey),
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
})
