<?php

return [
    // The browser/phone endpoint may differ from Laravel's loopback publishing endpoint.
    'host' => env('DROPA2Z_REVERB_PUBLIC_HOST'),
    'port' => (int) env('DROPA2Z_REVERB_PUBLIC_PORT', 443),
    'tls' => true,
];
