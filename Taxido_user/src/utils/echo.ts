import Echo from 'laravel-echo';
import { getValue } from './localstorage';
import { URL as API_URL } from '@src/api/config';

// @ts-ignore
const PusherClient = require('pusher-js/react-native').Pusher || require('pusher-js/react-native');

PusherClient.logToConsole = false;

// Laravel Echo expects Pusher on window globally in React Native
// @ts-ignore
window.Pusher = PusherClient;

let echoInstance: any = null;
let cachedToken: string | null = null;
const scopedConnections = new Map<string, {echo:any; token:string|null}>();
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
      const response = await fetch(`${API_URL}/api/realtime-config`, {
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

const getEchoInstance = async (scope = 'default') => {
  const token = await getValue('token');

  const config = await loadPublicConfig();
  if (!config) return disabledEcho;

  // The persistent booking observer owns a separate subscription. Screen-level
  // leave() calls must not remove its listeners (or the other way around).
  if (scope !== 'default') {
    const existing = scopedConnections.get(scope);
    if (existing?.token === token) {
      if(existing.echo.connector?.pusher?.connection?.state==='disconnected')existing.echo.connector.pusher.connect();
      return existing.echo;
    }
    existing?.echo.disconnect();
    const echo = new Echo({broadcaster:'pusher',key:config.key,wsHost:config.host,
      wsPort:config.port,wssPort:config.port,forceTLS:true,disableStats:true,
      cluster:config.cluster,enabledTransports:['ws','wss'],Pusher:PusherClient,
      authEndpoint:`${API_URL}/api/broadcasting/auth`,
      auth:{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}}});
    scopedConnections.set(scope,{echo,token});
    return echo;
  }

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
    authEndpoint: `${API_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });


  return echoInstance;
};

export default getEchoInstance;

export function releaseScopedEcho(scope:string,instance:any){
  instance?.disconnect();
  if(scopedConnections.get(scope)?.echo===instance)scopedConnections.delete(scope);
}
