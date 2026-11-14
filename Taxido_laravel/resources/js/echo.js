import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

const realtime = window.dropa2zRealtimeConfig;
if (realtime?.enabled) window.Echo = new Echo({
    broadcaster: 'reverb',
    key: realtime.key,
    wsHost: realtime.host,
    wsPort: realtime.port,
    wssPort: realtime.port,
    forceTLS: realtime.tls,
    enabledTransports: ['ws', 'wss'],
});

console.log('✅ Echo JS Initialized:', window.Echo);
