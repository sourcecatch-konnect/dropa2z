<?php

return [
    // Credentials stay on the server. SID templates must already be approved
    // and mapped to the appropriate sender / DLT details in AuthKey.
    'enabled' => env('AUTHKEY_SMS_ENABLED', false),
    'api_key' => env('AUTHKEY_API_KEY', ''),
    'otp_sid' => env('AUTHKEY_OTP_SID', ''),
    'otp_variable' => env('AUTHKEY_OTP_VARIABLE', 'otp'),
    'notification_sid' => env('AUTHKEY_NOTIFICATION_SID', ''),
    'message_variable' => env('AUTHKEY_MESSAGE_VARIABLE', 'message'),
    'country_code' => '91',
];
