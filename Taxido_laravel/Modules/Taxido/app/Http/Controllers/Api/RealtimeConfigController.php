<?php

namespace Modules\Taxido\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class RealtimeConfigController extends Controller
{
    public function __invoke()
    {
        $connection = config('broadcasting.default');
        if (!in_array($connection, ['pusher', 'reverb'], true)) {
            return response()->json(['enabled' => false]);
        }
        $settings = config("broadcasting.connections.{$connection}", []);
        $options = $settings['options'] ?? [];
        $cluster = $options['cluster'] ?? 'mt1';
        // Pusher's publishing host (api-*) differs from its websocket host (ws-*).
        $host = $options['host'] ?? '';
        if ($connection === 'reverb' && config('dropa2z_realtime.host')) {
            $host = config('dropa2z_realtime.host');
            $options['port'] = config('dropa2z_realtime.port', 443);
            $options['scheme'] = 'https';
        }
        if ($connection === 'pusher' && (!$host || str_ends_with($host, '.pusher.com'))) {
            $host = "ws-{$cluster}.pusher.com";
        }
        $key = $settings['key'] ?? '';
        $publicHost = preg_match('/^[a-z0-9.-]+$/i', $host)
            && str_contains($host, '.')
            && !filter_var($host, FILTER_VALIDATE_IP)
            && !str_ends_with($host, '.local')
            && !str_ends_with($host, '.localhost');
        $tls = ($options['scheme'] ?? 'https') === 'https';
        if (!$key || !$publicHost || !$tls) {
            return response()->json(['enabled' => false]);
        }
        // Only publish connection details that are intended for clients. Never secrets.
        return response()->json([
            'enabled' => true,
            'key' => $key,
            'host' => $host,
            'port' => (int) ($options['port'] ?? 443),
            'cluster' => $cluster,
            'tls' => true,
        ]);
    }
}
