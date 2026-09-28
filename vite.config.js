import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Content Library / templates are saved to the browser's localStorage,
  // which is scoped per origin (protocol+host+port) — if `npm run dev` is
  // started while a previous instance still holds 5173, Vite's default
  // behavior is to silently move to the next free port (5174, 5175, ...).
  // That looks exactly like "my content library got wiped": it didn't,
  // it's just sitting under the old port's origin. `strictPort` fails
  // loudly instead, so a stale server left running gets noticed and
  // killed rather than silently starting a new, empty origin.
  server: {
    port: 5173,
    strictPort: true,
  },
})
