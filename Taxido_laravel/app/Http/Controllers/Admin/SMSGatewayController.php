<?php

namespace App\Http\Controllers\Admin;

use Exception;
use Illuminate\Http\Request;
use Nwidart\Modules\Facades\Module;
use App\Http\Controllers\Controller;
use Jackiedo\DotenvEditor\Facades\DotenvEditor;
use App\Services\AuthkeySms;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

class SMSGatewayController extends Controller
{
    public function index()
    {
        $smsGateways = getSMSGatewayConfigs();
        return view('admin.sms-gateways.index', ['smsGateways' => $smsGateways]);
    }

    public function update(Request $request, $sms)
    {
        if ($sms === 'authkey') {
            return $this->updateAuthkey($request);
        }

        try {

            $smsGateways = getSMSGatewayConfigs();
            $configs = null;
            foreach ($smsGateways as $smsGateway) {
                if ($smsGateway['slug'] == $sms) {
                    $configs = $smsGateway;
                }
            }

            if ($configs) {
                DotenvEditor::addEmpty();
                foreach ($configs['fields'] as $fieldKey => $fieldAttributes) {
                    $envKey = strtoupper($fieldKey);
                    $newValue = $request->$fieldKey;
                    DotenvEditor::setKey($envKey, $newValue);
                    DotenvEditor::save();
                }

                return to_route('admin.sms-gateway.index');
            }

            return redirect()->back()->with('error', __('static.sms_gateways.config_file_not_found'));

        } catch (Exception $e) {

            return redirect()->back()->with('error', __('static.sms_gateways.something_went_wrong'));
        }
    }

    public function status(Request $request, $sms)
    {
        if ($sms === 'authkey') {
            if (! in_array($request->input('status'), [0, 1, '0', '1', false, true], true)) {
                return response()->json(['error' => 'Choose a valid gateway status.'], 422);
            }
            $enabled = (bool) $request->input('status');
            if ($enabled && (! config('authkey.api_key') || ! preg_match('/^[0-9]+$/D', (string) config('authkey.otp_sid'))
                || ! AuthkeySms::validVariable((string) config('authkey.otp_variable')))) {
                return response()->json(['error' => 'Save your AuthKey API key, approved OTP template SID and OTP variable before enabling SMS.'], 422);
            }
            try {
                DotenvEditor::setKey('AUTHKEY_SMS_ENABLED', $enabled ? 'true' : 'false');
                DotenvEditor::save();
                Artisan::call('config:clear');
                Artisan::call('queue:restart');
                return response()->json(['success' => true, 'message' => 'AuthKey SMS gateway '.($enabled ? 'enabled' : 'disabled').'.']);
            } catch (Exception $e) {
                return response()->json(['error' => 'AuthKey settings could not be saved.'], 500);
            }
        }

        try {

            $smsGateways = getSMSGatewayConfigs();
            foreach ($smsGateways as $smsGateway) {
                if ($smsGateway['slug'] == $sms) {
                    if (Module::has($smsGateway['name'])) {
                        if ((int) $request->status) {
                            Module::enable($smsGateway['name']);
                        } else {
                            Module::disable($smsGateway['name']);
                        }

                        return response()->json([
                            'message' => __('static.sms_gateways.updated_msg', ['name' => $smsGateway['name']]),
                            'success' => true,
                        ], 200);
                    }
                }
            }

            return response()->json(['error' => __('static.sms_gateways.invalid_msg')], 400);

        } catch (Exception $e) {

            return response()->json(['error' => __('static.something_went_wrong')], 500);
        }
    }

    private function updateAuthkey(Request $request)
    {
        $variableRule = static function ($attribute, $value, $fail) {
            if (! AuthkeySms::validVariable((string) $value)) {
                $fail('Use a template variable name such as otp or message; reserved API parameters cannot be used.');
            }
        };
        $validator = Validator::make($request->all(), [
            'authkey_api_key' => ['nullable', 'string', 'max:512', 'regex:/^[a-zA-Z0-9._~+\/=\-]+$/D'],
            'authkey_otp_sid' => ['nullable', 'string', 'max:40', 'regex:/^[0-9]+$/D'],
            'authkey_otp_variable' => ['required', 'string', $variableRule],
            'authkey_notification_sid' => ['nullable', 'string', 'max:40', 'regex:/^[0-9]+$/D'],
            'authkey_message_variable' => ['required', 'string', $variableRule],
        ]);
        if ($validator->fails()) {
            // Never flash the API key into session old-input or rendered HTML.
            return redirect()->back()->withErrors($validator)->withInput($request->except('authkey_api_key'));
        }
        $values = $validator->validated();
        if (config('authkey.enabled') && (empty($values['authkey_otp_sid'])
            || (empty($values['authkey_api_key']) && ! config('authkey.api_key')))) {
            return redirect()->back()->with('error', 'Disable AuthKey before clearing its required configuration.');
        }
        try {
            foreach (AuthkeySms::fields() as $key => $field) {
                $value = $values[$key] ?? '';
                if ($key === 'authkey_api_key' && $value === '') {
                    continue; // A blank password field preserves the saved key.
                }
                DotenvEditor::setKey(strtoupper($key), $value);
            }
            DotenvEditor::save();
            Artisan::call('config:clear');
            Artisan::call('queue:restart');
            return to_route('admin.sms-gateway.index')->with('success', 'AuthKey settings saved. Select AuthKey as the default SMS gateway when you are ready.');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'AuthKey settings could not be saved.');
        }
    }
}
