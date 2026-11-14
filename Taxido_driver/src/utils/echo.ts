import Echo from 'laravel-echo';
import { getValue } from './localstorage';
import { URL } from '../api/config';


// @ts-ignore
const PusherClient = require('pusher-js/react-native').Pusher || require('pusher-js/react-native');

PusherClient.logToConsole = false;

// @ts-ignore
window.Pusher = PusherClient;

let echoInstance: any = null;
let cachedToken: string | null = null;
let publicConfig: any = null;
let configCheckedAt = 0;
let configRequest: Promise<any> | null = null;
const loadPublicConfig = async () => {
  if (Date.now() - configCheckedAt < 30000) return publicConfig;
  if (configRequest) return configRequest;
  configRequest = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${URL}/api/realtime-config`, {
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const config = response.ok ? await response.json() : null;
      publicConfig = config?.enabled && config?.key && config?.host && config?.tls === true
        ? config : null;
    } catch (_) { publicConfig = null; }
    finally { clearTimeout(timer); configCheckedAt = Date.now(); configRequest = null; }
    return publicConfig;
  })();
  return configRequest;
};

const noOpChannel: any = {
  subscribed: () => noOpChannel,
  listen: () => noOpChannel,
  error: () => noOpChannel,
  on: () => noOpChannel,
  here: () => noOpChannel,
  joining: () => noOpChannel,
  leaving: () => noOpChannel,
};

const disabledEcho = {
  private: () => noOpChannel,
  join: () => noOpChannel,
  leave: () => undefined,
  disconnect: () => undefined,
  socketId: () => null,
  connector: {
    pusher: {
      connection: {
        bind: () => undefined,
      },
    },
  },
};

const getEchoInstance = async () => {
  const token = await getValue('token');

  const config = await loadPublicConfig();
  if (!config) return disabledEcho;

  if (echoInstance && cachedToken === token) {
    return echoInstance;
  }

  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.error("Error disconnecting stale Echo instance:", e);
    }
  }

  cachedToken = token;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: config.key,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: true,
    disableStats: true,
    cluster: config.cluster,
    enabledTransports: ['ws', 'wss'],
    Pusher: PusherClient,
    authEndpoint: `${URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  if (echoInstance.connector.pusher) {
    echoInstance.connector.pusher.connection.bind('state_change', (states: any) => {
      console.log(`[Echo] Connection state changed from ${states.previous} to ${states.current}`);
    });
    echoInstance.connector.pusher.connection.bind('error', (err: any) => {
      console.error('[Echo] Connection error:', err);
      if (err?.error?.data?.code === 4004) {
        console.error('[Echo] Critical: Pusher app not found or wrong credentials.');
      }
    });
    echoInstance.connector.pusher.connection.bind('connected', () => {
      console.log('[Echo] Connected! Socket ID:', echoInstance.socketId());
    });
    echoInstance.connector.pusher.connection.bind('disconnected', () => {
      console.log('[Echo] Disconnected.');
    });
  }

  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

export default getEchoInstance;
