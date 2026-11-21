import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function suppressHmrWebSocketPlugin() {
  return {
    name: 'suppress-hmr-websocket-errors',
    transformIndexHtml: {
      order: 'pre' as const,
      handler() {
        return [
          {
            tag: 'script',
            attrs: { type: 'text/javascript' },
            children: `(function(){if(typeof window==='undefined')return;var OWS=window.WebSocket;if(OWS){window.WebSocket=function(url,proto){var isHmr=false;try{var u=String(url||'');if(proto==='vite-hmr'||(Array.isArray(proto)&&proto.indexOf('vite-hmr')!==-1)||u.indexOf('token=')!==-1||u.indexOf('/@vite')!==-1||u.indexOf('vite-hmr')!==-1){isHmr=true;}}catch(_){}if(isHmr){var L={};var d={url:String(url),readyState:1,protocol:'vite-hmr',extensions:'',bufferedAmount:0,binaryType:'blob',send:function(){},close:function(c,r){d.readyState=3;var ev={type:'close',wasClean:true,code:c||1000,reason:r||'Normal closure'};(L['close']||[]).forEach(function(fn){try{fn(ev)}catch(_){}});},addEventListener:function(t,fn){if(!L[t])L[t]=[];L[t].push(fn);if(t==='open'){setTimeout(function(){try{fn({type:'open',target:d})}catch(_){}},0);}},removeEventListener:function(t,fn){if(L[t]){L[t]=L[t].filter(function(cb){return cb!==fn;});}},dispatchEvent:function(e){(L[e.type]||[]).forEach(function(fn){try{fn(e)}catch(_){}});return true;}};setTimeout(function(){if(typeof d.onopen==='function'){try{d.onopen({type:'open',target:d})}catch(_){}}},0);return d;}return new OWS(url,proto);};window.WebSocket.prototype=OWS.prototype;window.WebSocket.CONNECTING=0;window.WebSocket.OPEN=1;window.WebSocket.CLOSING=2;window.WebSocket.CLOSED=3;}var oErr=console.error;console.error=function(){var args=Array.prototype.slice.call(arguments);var txt=args.map(function(a){if(!a)return '';if(a instanceof Error)return (a.message||'')+' '+(a.stack||'');return String(a);}).join(' ');if(txt.indexOf('WebSocket closed without opened')!==-1||(txt.indexOf('[vite]')!==-1&&txt.indexOf('websocket')!==-1)){return;}return oErr.apply(console,args);};window.addEventListener('unhandledrejection',function(e){var r=e.reason;var m=(r&&(r.message||String(r)))||'';if(m.indexOf('WebSocket')!==-1||m.indexOf('vite')!==-1){e.preventDefault();e.stopImmediatePropagation();}},true);window.addEventListener('error',function(e){var m=(e.message||'')+'';if(m.indexOf('WebSocket')!==-1||m.indexOf('vite')!==-1){e.preventDefault();e.stopImmediatePropagation();return true;}},true);})();`,
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      suppressHmrWebSocketPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'playstore-icon-512x512.png',
          'playstore-feature-graphic-1024x500.png',
        ],
        manifest: {
          id: '/',
          name: 'Global Job & Career Radar',
          short_name: 'TalentRadar',
          description:
            '3D Geospatial Career Intelligence, Market Analytics & Salary Trends, StealthNet Zero-Knowledge Network, and Executive Compensation Engine.',
          theme_color: '#0f1720',
          background_color: '#0a0f14',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['business', 'finance', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB to cache Three.js and Recharts chunks
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          globIgnores: ['**/assets/aistudio/**'],
          runtimeCaching: [
            {
              // Critical Career Salary Data & Market Analytics: Network-First with 3s timeout and 7-day offline fallback
              urlPattern: /^\/api\/(salary|career|jobs).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'career-salary-cache-v1',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days offline availability
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Market News Snippets & Tactical Intel Briefs: Network-First with 3s timeout and 7-day offline fallback
              urlPattern: /^\/api\/news.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'news-snippets-cache-v1',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days offline availability
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket closed errors and flickering
      hmr: false,
      watch: null,
    },
  };
});

