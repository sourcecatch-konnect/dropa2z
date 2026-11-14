<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AuthkeySms
{
    public const ENDPOINT = 'https://console.authkey.io/restapi/requestjson.php';

    public static function fields(): array
    {
        return [
            'authkey_api_key' => ['type' => 'password', 'label' => 'AuthKey API key (leave blank to keep saved key)'],
            'authkey_otp_sid' => ['type' => 'text', 'label' => 'Approved OTP template SID'],
            'authkey_otp_variable' => ['type' => 'text', 'label' => 'OTP variable name (usually otp)'],
            'authkey_notification_sid' => ['type' => 'text', 'label' => 'Approved notification template SID (optional)'],
            'authkey_message_variable' => ['type' => 'text', 'label' => 'Notification message variable (usually message)'],
        ];
    }

    public static function gateway(): array
    {
        return [
            'name' => 'AuthKey',
            'slug' => 'authkey',
            'image' => url('images/authkey-sms.svg'),
            'status' => (bool) config('authkey.enabled', false),
            'configs' => [],
            'fields' => self::fields(),
            'title' => 'SMS verification using your approved AuthKey templates',
        ];
    }

    public static function validVariable(string $name): bool
    {
        return (bool) preg_match('/^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/D', $name)
            && ! in_array(strtolower($name), [
                'authkey', 'authorization', 'mobile', 'country_code', 'sid', 'sms',
                'sender', 'pe_id', 'template_id', 'eid', 'wid', 'voice', 'fb1voice',
                'email', 'to', 'from', 'is_unicode',
            ], true);
    }

    public function send(string $sendTo, string $message): array
    {
        if (! config('authkey.enabled', false)) {
            throw new RuntimeException('SMS verification is not enabled. Please use email verification for now.', 503);
        }

        // Dropa2z currently operates in India. Accept local or E.164 Indian
        // numbers, never guess a different country's dialing prefix.
        $number = preg_replace('/[\s()\-]/', '', trim($sendTo));
        if (preg_match('/^\+?91([6-9][0-9]{9})$/D', $number, $match)) {
            $number = $match[1];
        }
        if (! preg_match('/^[6-9][0-9]{9}$/D', $number)) {
            throw new RuntimeException('Enter a valid Indian mobile number with country code +91.', 422);
        }

        $otp = (bool) preg_match('/^[0-9]{4,8}$/D', $message);
        $sid = trim((string) config($otp ? 'authkey.otp_sid' : 'authkey.notification_sid'));
        $variable = trim((string) config($otp ? 'authkey.otp_variable' : 'authkey.message_variable'));
        $apiKey = trim((string) config('authkey.api_key'));
        if ($apiKey === '' || ! preg_match('/^[0-9]+$/D', $sid) || ! self::validVariable($variable)) {
            throw new RuntimeException($otp
                ? 'SMS verification is not configured yet. Please use email verification for now.'
                : 'An approved SMS notification template has not been configured.', 503);
        }

        try {
            // No retry: a timeout can occur after the provider has accepted the
            // SMS. An automatic retry could charge twice and send duplicate OTPs.
            $response = Http::asJson()->acceptJson()
                ->withHeaders(['Authorization' => 'Basic '.$apiKey])
                ->connectTimeout(5)->timeout(15)->withoutRedirecting()
                ->post(self::ENDPOINT, [
                    'country_code' => '91',
                    'mobile' => $number,
                    'sid' => $sid,
                    $variable => $message,
                ]);
        } catch (ConnectionException $e) {
            // Do not attach the original request/exception; it contains secrets.
            throw new RuntimeException('We could not confirm SMS delivery. Please wait before requesting another code, or use email.', 503);
        }

        $body = $response->json();
        // HTTP 200 by itself is not acceptance. This receipt shape is published
        // in AuthKey's official Postman collection. Acceptance is not handset DLR.
        if (! $response->successful() || ! is_array($body)
            || ! is_string($body['LogID'] ?? null) || trim($body['LogID']) === ''
            || strcasecmp(trim((string) ($body['Message'] ?? '')), 'Submitted Successfully') !== 0
            || ! empty($body['error'])
            || (isset($body['status']) && ! in_array($body['status'], [true, 'Success', 'success'], true))) {
            Log::warning('AuthKey did not accept an SMS request.', ['http_status' => $response->status()]);
            throw new RuntimeException('The SMS provider could not send your message. Please use email or try again later.', 503);
        }

        return ['success' => true, 'message_id' => $body['LogID']];
    }
}
