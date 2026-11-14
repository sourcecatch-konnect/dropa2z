<?php

namespace Modules\Taxido\Http\Controllers\Api;

use Exception;
use App\Models\User;
use App\Exceptions\ExceptionHandler;
use App\Http\Controllers\Controller;
use App\Http\Traits\MessageTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Kreait\Firebase\Factory;
use Modules\Taxido\Emails\DriverLoginOtp;
use Modules\Taxido\Enums\RoleEnum;
use Modules\Taxido\Enums\ServicesEnum;
use Modules\Taxido\Http\Resources\Drivers\DriverSelfResource;
use Modules\Taxido\Http\Resources\FleetManagers\FleetSelfResource;
use Modules\Taxido\Http\Traits\ReferralTrait;
use Modules\Taxido\Models\Ambulance;
use Modules\Taxido\Models\Document;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Models\DriverDocument;
use Modules\Taxido\Models\FleetManager;
use Modules\Taxido\Models\PaymentAccount;
use Modules\Taxido\Models\VehicleInfo;


class DriverAuthController extends Controller
{
    use MessageTrait, ReferralTrait;

    public function updateProfile(Request $request)
    {
        try {
            $user_id = getCurrentUserId();
            $roleName = getCurrentRoleName();


            if ($roleName == RoleEnum::DRIVER) {
                $driver = Driver::findOrFail($user_id);

            } elseif ($roleName == RoleEnum::FLEET_MANAGER) {
                $driver = FLeetManager::findOrFail($user_id);
            }

            $request->validate([
                'profile_image' => [
                    'nullable',
                    'mimetypes:image/jpeg,image/png,image/gif',
                ],
            ], [
                'profile_image.mimetypes' => 'SVG files are not allowed.',
            ]);


            if (isset($request['profile_image_id'])) {
                $driver->profile_image()->associate($request['profile_image_id']);
            }

            if ($request->hasFile('profile_image')) {
                $attachments = createAttachment();
                $media = storeImage([$request->profile_image], $attachments, 'attachment');
                $driver->profile_image_id = head($media)?->id;
                $driver->profile_image()->associate(head($media)?->id);
                $driver->save();
            }

            return response()->json(['id' => $driver->id], 200);

        } catch (Exception $e) {
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function updatePhoneOrEmail(Request $request)
    {

        try {
            $driver_id = getCurrentUserId();
            $validator = Validator::make($request->all(), [
                'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driver_id)->whereNull('deleted_at')],
                'phone' => ['nullable', 'min:6', 'max:15', Rule::unique('users', 'phone')->ignore($driver_id)->whereNull('deleted_at')],
                'country_code' => ['nullable', Rule::requiredIf((bool) $request->phone)],
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            if (!$request->email && !$request->phone) {
                throw new Exception(__('Please provide either email or phone to update'), 422);
            }
          
            if ($request->email) {
                return $this->sendEmailToken($request->email);
            }

            if ($request->phone) {
                return $this->sendPhoneToken($request->country_code ?? null, $request->phone);
            }

            throw new Exception(__('Either email or phone not be empty.'), 422);
        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function verifyPhoneOrEmail(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'token' => 'required|string',
                'email_or_phone' => 'required|string',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $driver_id = getCurrentUserId();
            $driver = Driver::findOrFail($driver_id);
            $isEmail = filter_var($request->email_or_phone, FILTER_VALIDATE_EMAIL);

            $authToken = DB::table('auth_tokens')
                ->where('token', $request->token)
                ->where('created_at', '>', Carbon::now()->subHours(1));


        
            if ($isEmail) {
                $verify_otp = $authToken->where('email', $request->email_or_phone)->first();
            } else {
                $country_code = ltrim($request->country_code, '+');
                $verify_otp = $authToken->where('phone', '+' . $country_code . $request->email_or_phone)->first();
            }

            if (!$verify_otp) {
                throw new Exception(__('Invalid or expired token'), 400);
            }

            if ($isEmail) {
                $driver->email = $request->email_or_phone;
            } else {
                $driver->country_code = $request->country_code;
                $driver->phone = $request->email_or_phone;
            }

            $driver->save();
            DB::table('auth_tokens')
                ->where('token', $request->token)
                ->delete();

            return response()->json([
                'message' => __('Profile updated successfully'),
                'success' => true,
                'rider' => new DriverSelfResource($driver->refresh()),
            ], 200);

        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function self()
    {
        try {

            $user_id = getCurrentUserId();
            $roleName = getCurrentRoleName();
            if ($roleName == RoleEnum::DRIVER) {
                $driver = Driver::findOrFail($user_id);

                $driver->setAppends([
                    'total_driver_commission',
                    'total_pending_rides',
                    'total_complete_rides',
                    'total_cancel_rides',
                    'total_active_rides',
                ]);

                return new DriverSelfResource($driver);

            } elseif ($roleName == RoleEnum::FLEET_MANAGER) {

                $fleet_manager = FleetManager::findOrFail($user_id);
                return new FleetSelfResource($fleet_manager);
            }

            throw new Exception('Invalid access token for driver or fleet manager.', 400);
        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function login(Request $request)
    {
        try {

            $req = $request->validate([
                'email_or_phone' => 'required|string',
                'country_code' => 'nullable|required_if:email_or_phone,phone|string',
            ]);

            return filter_var($req['email_or_phone'], FILTER_VALIDATE_EMAIL)
                ? $this->sendEmailToken($req['email_or_phone'])
                : $this->sendPhoneToken($req['country_code'] ?? null, $req['email_or_phone']);

        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function socialLogin(Request $request)
    {
        try {
            $request->validate([
                'id_token' => 'required|string',
                'fcm_token' => 'nullable|string',
            ]);

            $identity = $this->verifyGoogleIdToken($request->id_token);
            $email = strtolower(trim($identity['email']));
            $account = $this->resolveDriverLoginIdentity($email);

            if (! $account) {
                return response()->json([
                    'success' => true,
                    'is_registered' => false,
                    'email' => $email,
                    'name' => $identity['name'] ?? '',
                ], 200);
            }

            if (! $account->hasRole(RoleEnum::DRIVER)) {
                if ($account->hasRole(RoleEnum::RIDER)) {
                    return response()->json([
                        'success' => true,
                        'is_registered' => false,
                        'email' => $email,
                        'name' => $identity['name'] ?? $account->name ?? '',
                    ], 200);
                }

                throw new Exception(__('This Google account is not registered for Driver access.'), 403);
            }

            $driver = Driver::findOrFail($account->id);
            if (! $driver->status) {
                throw new Exception(__('Account is disabled'), 403);
            }

            $driver->email_verified_at = $driver->email_verified_at ?? now();
            $driver->fcm_token = $request->fcm_token;
            $driver->save();

            $issuedToken = $driver->createToken('auth_token');
            $token = $issuedToken->plainTextToken;
            $driver->tokens()->whereKey($issuedToken->accessToken->getKey())->update(['role_type' => RoleEnum::DRIVER]);
            $taxidoSettings = getTaxidoSettings();
            $driverIsVerified = $driver->is_verified;
            if (! ($taxidoSettings['activation']['driver_verification'] ?? true)) {
                $driverIsVerified = 1;
            }

            return response()->json([
                'success' => true,
                'is_registered' => true,
                'id' => $driver->id,
                'access_token' => $token,
                'is_verified' => $driverIsVerified,
                'needs_mobile_update' => empty($driver->phone),
                'role' => RoleEnum::DRIVER,
            ], 200);
        } catch (Exception $e) {
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    private function verifyGoogleIdToken(string $idToken): array
    {
        $expectedClientId = config('services.google.client_id');
        if (! $expectedClientId) {
            throw new Exception(__('Google sign-in is not configured.'), 503);
        }

        $response = Http::timeout(10)->acceptJson()->get(
            'https://oauth2.googleapis.com/tokeninfo',
            ['id_token' => $idToken]
        );
        $identity = $response->json();

        if (! $response->successful()
            || ! is_array($identity)
            || ($identity['aud'] ?? null) !== $expectedClientId
            || ! in_array($identity['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
            || (int) ($identity['exp'] ?? 0) <= time()
            || ($identity['email_verified'] ?? null) !== 'true'
            || empty($identity['email'])
        ) {
            throw new Exception(__('Google sign-in could not be verified.'), 401);
        }

        return $identity;
    }

    /** Resolve the app identity before offering login or Driver registration. */
    private function resolveDriverLoginIdentity(string $identity, ?string $countryCode = null): ?User
    {
        $identity = trim($identity);
        $query = User::query()->whereNull('deleted_at');
        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $query->whereRaw('LOWER(email) = ?', [strtolower($identity)]);
        } else {
            $code = ltrim((string) $countryCode, '+');
            $query->where('phone', $identity)->whereIn('country_code', [$code, '+' . $code]);
        }

        // Historical staff/fleet records may share a contact. Prefer the app's
        // existing Driver, then an eligible Rider, instead of the first row.
        $account = (clone $query)->whereHas('roles', fn ($roles) => $roles->where('name', RoleEnum::DRIVER))->first()
            ?? (clone $query)->whereHas('roles', fn ($roles) => $roles->where('name', RoleEnum::RIDER))->first()
            ?? $query->first();
        if (! $account) {
            return null;
        }
        if ($account->hasRole('admin') || ! $account->hasAnyRole([RoleEnum::DRIVER, RoleEnum::RIDER])) {
            if ($account->hasRole(RoleEnum::FLEET_MANAGER) && ! $account->hasRole('admin')) {
                throw new Exception('This email or phone is registered for Fleet access. Please choose Fleet to sign in.', 403);
            }
            throw new Exception('This email or phone belongs to a staff account. Please use another email for Driver registration.', 403);
        }
        if (! $account->status) {
            throw new Exception('Account is disabled. Please contact support.', 403);
        }
        return $account;
    }

    private function sendEmailToken($email)
    {
        $email = strtolower(trim($email));
        $this->resolveDriverLoginIdentity($email);
        $isScopedTestLogin = isDropa2zScopedTestLogin($email);
        $token = $this->generateToken(null, null, $email, $isScopedTestLogin);

        if (! $isScopedTestLogin && !isDemoMode()) {
            try {
                Mail::to($email)->send(new DriverLoginOtp((string) $token));
            } catch (Exception $e) {
                DB::table('auth_tokens')->where('token', $token)->where('email', $email)->delete();
                Log::error('Driver login OTP email could not be delivered.', ['exception' => $e->getMessage()]);
                throw new Exception('We could not send the sign-in code. Please check your email address and try again.', 503);
            }
        }

        if ($isScopedTestLogin) {
            Log::notice('Scoped test login issued.', ['email' => $email, 'role' => RoleEnum::DRIVER]);
        }

        return response()->json([
            'message' => __('OTP sent successfully to your email!'),
            'success' => true,
            'test_bypass' => $isScopedTestLogin,
            'test_token' => $isScopedTestLogin ? $token : null,
        ], 200);
    }

    private function sendPhoneToken($country_code, $phone)
    {
        $country_code = ltrim((string) $country_code, '+');
        $phone = trim((string) $phone);
        $validPhone = $country_code === '91'
            ? preg_match('/^[6-9][0-9]{9}$/', $phone)
            : preg_match('/^[0-9]{6,15}$/', $phone);
        if (!preg_match('/^[1-9][0-9]{0,3}$/', $country_code) || !$validPhone) {
            throw new Exception('Enter a valid mobile number and country code.', 422);
        }
        if (!$country_code) {
            throw new Exception('Country code is required for login as a phone.', 422);
        }

        $token = $this->generateToken($country_code, $phone);

        if (!isDemoMode()) {
            try {
                sendSMS('+' . $country_code . $phone, $token);
            } catch (Exception $e) {
                DB::table('auth_tokens')->where('phone', '+' . $country_code . $phone)->where('token', $token)->delete();
                throw $e;
            }
        }

        return response()->json(['message' => __('OTP sent successfully to your phone!'), 'success' => true], 200);
    }

    public function generateToken($country_code = null, $phone = null, $email = null, $isScopedTestLogin = false)
    {
        $token = $isScopedTestLogin ? bin2hex(random_bytes(32)) : random_int(111111, 999999);

        if (! $isScopedTestLogin && isDemoMode()) {
            $token = 123456;
        }
        DB::table('auth_tokens')->insert([
            'token' => $token,
            'phone' => '+' . $country_code . $phone,
            'email' => $email,
            'created_at' => Carbon::now()
        ]);
        return $token;
    }

    public function verifyDriverToken(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required|string',
                'email_or_phone' => 'required|string',
                'fcm_token' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $isEmail = filter_var($request->email_or_phone, FILTER_VALIDATE_EMAIL);

            // Validate country code only if phone login
            if (! $isEmail && empty($request->country_code)) {
                throw new Exception(__('Country code is required for phone login'), 422);
            }

            $authTokenQuery = DB::table('auth_tokens')
                ->where('token', $request->token)
                ->where('created_at', '>', Carbon::now()->subMinutes(10));

            if ($isEmail) {
                $verify_otp = $authTokenQuery->where('email', $request->email_or_phone)->first();
            } else {
                $country_code = ltrim($request->country_code, '+');
                $verify_otp = $authTokenQuery->where('phone', '+' . $country_code . $request->email_or_phone)->first();
            }

            if (!$verify_otp) {
                throw new Exception(__('Invalid token'), 400);
            }

            $account = $this->resolveDriverLoginIdentity($request->email_or_phone, $request->country_code);
            $driver = $account && $account->hasRole(RoleEnum::DRIVER)
                ? Driver::findOrFail($account->id) : null;

            if ($driver) {
                if (!$driver->hasRole(RoleEnum::DRIVER)) {
                    throw new Exception(__('Only drivers can login'), 403);
                }

                if (!$driver->status) {
                    throw new Exception(__('Account is disabled'), 403);
                }

                $issuedToken = $driver->createToken('auth_token');
            $token = $issuedToken->plainTextToken;
                $driver->tokens()->whereKey($issuedToken->accessToken->getKey())->update([
                    'role_type' => RoleEnum::DRIVER,
                ]);

                $driver->fcm_token = $request->fcm_token;
                if ($isEmail && ! $driver->email_verified_at) {
                    $driver->email_verified_at = now();
                }
                $driver->save();

                $driver = $driver->fresh();
                $taxidoSettings = getTaxidoSettings();

                $driverIsVerified = $driver?->is_verified;
                if (!$taxidoSettings['activation']['driver_verification']) {
                    $driverIsVerified = 1;
                }

                return response()->json([
                    'id' => $driver?->id,
                    'access_token' => $token,
                    'is_registered' => true,
                    'is_verified' => $driverIsVerified,
                    'needs_mobile_update' => empty($driver->phone),
                    'success' => true,
                    'role' => RoleEnum::DRIVER,
                ], 200);
            }

            return response()->json([
                'message' => __('Token verified successfully'),
                'is_registered' => false,
                'success' => true,
                'role' => RoleEnum::DRIVER,
                'registration_proof' => [
                    'type' => $isEmail ? 'email' : 'phone',
                    'contact' => $request->email_or_phone,
                    'country_code' => $isEmail ? null : $country_code,
                    'token' => (string) $request->token,
                ],
            ], 200);

        } catch (Exception $e) {
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function verifyLogin(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'email' => ['nullable', Rule::requiredIf(!$request->phone), 'email'],
                'phone' => ['nullable', Rule::requiredIf(!$request->email)],
                'country_code' => ['nullable', Rule::requiredIf(!$request->email)],
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $driver = Driver::where('email', $request->email)->orWhere('phone', (string) $request->phone)?->first();
            if ($driver) {
                if (!$driver->status) {
                    throw new Exception(_('taxido::auth.disabled_account'), 400);
                }
            }

            return true;

        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function driverRegister(Request $request)
    {
        DB::beginTransaction();
        try {

            $referrerId = null;
            $verificationType = $request->input('verification_type');
            $requiresOtpProof = in_array($verificationType, ['email', 'phone'], true);
            if ($request->filled('email')) {
                $request->merge(['email' => strtolower(trim($request->email))]);
            }
            $existingDriverAccount = in_array($verificationType, ['email', 'google'], true) && $request->filled('email')
                ? $this->resolveDriverLoginIdentity($request->email) : null;
            if ($existingDriverAccount && $existingDriverAccount->hasRole(RoleEnum::DRIVER)) {
                throw new Exception('This account is already registered as a driver. Please sign in instead.', 409);
            }

            $validator = Validator::make($request->all(), [
                'name' => ['required', 'string', 'min:2', 'max:80', "regex:/^(?=(?:.*\\p{L}){2})[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*$/u"],
                'verification_type' => 'required|in:email,phone,google',
                'verification_token' => ['nullable', 'string', Rule::requiredIf($requiresOtpProof)],
                'google_id_token' => ['nullable', 'string', Rule::requiredIf($verificationType === 'google')],
                'email' => array_merge(['nullable', 'string', 'email', 'max:255'], $existingDriverAccount ? [] : [Rule::unique('users', 'email')->whereNull('deleted_at')]),
                'password' => ['nullable', 'string', 'min:8', 'confirmed'],
                'country_code' => ['nullable', Rule::requiredIf($verificationType === 'phone')],
                'phone' => ['nullable', 'string', 'min:6', 'max:15', Rule::requiredIf($verificationType === 'phone'), Rule::unique('users', 'phone')->whereNull('deleted_at')->ignore($existingDriverAccount?->id)],
                'referral_code' => 'nullable|string',
                'documents' => 'required|array|min:1|max:30',
                'documents.*.slug' => ['required', 'string', 'distinct', Rule::exists('documents', 'slug')->whereNull('deleted_at')->where('status', 1)->whereIn('type', ['driver', 'vehicle'])],
                'documents.*.file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240',
                'documents.*.expired_at' => 'nullable|date|after_or_equal:today',
                'service_id' => 'required|exists:services,id,deleted_at,NULL',
                'service_category_id' => 'nullable|exists:service_categories,id,deleted_at,NULL',
                'preferences.*' => 'nullable|exists:preferences,id,deleted_at,NULL',
                'vehicle' => 'nullable|array',
                'vehicle.plate_number' => ['nullable', 'required_with:vehicle', 'string', 'max:20', 'regex:/^(?:[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{0,3}[ -]?[0-9]{4}|[0-9]{2}[ -]?BH[ -]?[0-9]{4}[ -]?[A-Z]{1,2})$/i'],
                'per_day_charge' => 'nullable|numeric|min:0',
                'per_km_charge' => 'nullable|numeric|min:0',
                'per_hour_charge' => 'nullable|numeric|min:0',
                'experience' => [Rule::requiredIf(getServiceTypeById($request->service_id) == ServicesEnum::FINDDRIVER), 'nullable', 'numeric', 'min:0', 'max:100'],
                'price_type' => [Rule::requiredIf(getServiceTypeById($request->service_id) == ServicesEnum::FINDDRIVER), 'nullable', 'array'],
                'vehicle_type_id' => [Rule::requiredIf(getServiceTypeById($request->service_id) == ServicesEnum::FINDDRIVER), 'nullable', 'exists:vehicle_types,id,deleted_at,NULL'],
                'gear_type' => [Rule::requiredIf(getServiceTypeById($request->service_id) == ServicesEnum::FINDDRIVER), 'nullable','in:automatic,manual'],

            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            \Modules\Taxido\Services\DriverRegistrationDocuments::validate(
                Document::where('status', 1)->whereIn('type', ['driver', 'vehicle'])->get(),
                $request->documents ?? []
            );

            $verifiedEmail = false;
            $verifiedAuthToken = null;
            if (in_array($verificationType, ['email', 'google'], true)) {
                if (! $request->email) {
                    throw new Exception(__('A verified email address is required.'), 422);
                }

                if ($verificationType === 'google') {
                    $identity = $this->verifyGoogleIdToken($request->google_id_token);
                    if (strtolower(trim($identity['email'])) !== strtolower(trim($request->email))) {
                        throw new Exception(__('The Google account does not match the registration email.'), 422);
                    }

                    if ($existingDriverAccount && $existingDriverAccount->hasRole(RoleEnum::DRIVER)) {
                        throw new Exception(__('This account is already registered as a driver.'), 409);
                    }
                    if ($existingDriverAccount && ! $existingDriverAccount->hasRole(RoleEnum::RIDER)) {
                        throw new Exception(__('This account cannot be linked to a driver profile.'), 403);
                    }
                } else {
                    $verifiedAuthToken = DB::table('auth_tokens')
                        ->where('token', $request->verification_token)
                        ->where('email', strtolower(trim($request->email)))
                        ->where('created_at', '>', Carbon::now()->subHours(1))
                        ->first();

                    if (! $verifiedAuthToken) {
                        throw new Exception(__('Please verify your email before registering.'), 422);
                    }
                }

                $verifiedEmail = true;
            } else {
                $countryCode = ltrim((string) $request->country_code, '+');
                $verifiedAuthToken = DB::table('auth_tokens')
                    ->where('token', $request->verification_token)
                    ->where('phone', '+' . $countryCode . $request->phone)
                    ->where('created_at', '>', Carbon::now()->subMinutes(10))
                    ->first();

                if (! $verifiedAuthToken) {
                    throw new Exception(__('Please verify your mobile number before registering.'), 422);
                }
            }

            if ($request->referral_code) {
                $referrer = Driver::where('referral_code', $request->referral_code)
                    ->where('status', true)?->whereNull('deleted_at')?->first();

                if (!$referrer) {
                    throw new Exception('Invalid referral code or referrer not found.', 422);
                }

                if (!$referrer->hasRole(RoleEnum::DRIVER)) {
                    throw new Exception('Referral code belongs to a different user type.', 422);
                }
            }

            $taxidoSettings = getTaxidoSettings();
            $driverIsVerified = 0;
            if (!$taxidoSettings['activation']['driver_verification']) {
                $driverIsVerified = 1;
            }

            $driverAttributes = [
                'name' => $request->name,
                'email' => $request->email ?: null,
                'country_code' => $request->phone ? $request->country_code : ($existingDriverAccount?->country_code),
                'phone' => $request->phone ? (string) $request->phone : ($existingDriverAccount?->phone),
                'experience' => $request->experience,
                'can_accept_ride' => $request->can_accept_ride,
                'can_accept_parcel' => $request->can_accept_parcel,
                'service_id' => $request->service_id,
                'fcm_token' => $request?->fcm_token,
                'service_category_id' => $request->service_category_id,
                'password' => $request->password ? Hash::make($request->password) : null,
                'is_verified' => $driverIsVerified,
                'referral_code' => $existingDriverAccount?->referral_code ?: getReferralCodeByName($request->name ?? 'Driver'),
                'per_day_charge' => $request->per_day_charge,
                'per_km_charge' => $request->per_km_charge,
                'per_hour_charge' => $request->per_hour_charge,
                'price_type' => $request->price_type,
                'gear_type' => $request->gear_type,
                'vehicle_type_id' => $request->vehicle_type_id,
                'referred_by_id' => $referrerId,
            ];

            $driver = $existingDriverAccount
                ? Driver::withoutGlobalScope('roles')->whereKey($existingDriverAccount->id)->lockForUpdate()->firstOrFail()
                : new Driver();
            if ($existingDriverAccount) {
                if ($driver->hasRole(RoleEnum::DRIVER)) {
                    throw new Exception('This account is already registered as a driver. Please sign in instead.', 409);
                }
                if (! $driver->status || ! $driver->hasRole(RoleEnum::RIDER) || $driver->hasRole('admin')) {
                    throw new Exception('This account cannot be linked to a driver profile.', 403);
                }
                // Add Driver access only after the email proof above. Never
                // replace the Rider password or identity while linking roles.
                unset($driverAttributes['password'], $driverAttributes['email']);
            }
            $driver->fill($driverAttributes);
            $driver->save();

            if ($verifiedEmail) {
                $driver->email_verified_at = now();
                $driver->save();
            }

            $driver->assignRole(RoleEnum::DRIVER);
            $driver->wallet()->firstOrCreate([]);
            $driver->wallet;

            if (!empty($request->vehicle)) {
                $driver->vehicle_info()->create($request->vehicle);
            }

            if (!empty($request->ambulance)) {
                if (!empty($request->ambulance['name']) && !empty($request->ambulance['description'])) {
                    $driver->ambulance()->create($request->ambulance);
                }
            }

            if (!empty($request->preferences) && is_array($request->preferences)) {
                $driver->preferences()->sync($request->preferences ?? []);
            }

            if (!empty($request->documents) && is_array($request->documents)) {
                if (count($request->documents)) {
                    foreach ($request->documents as $document) {
                        if (is_array($document)) {
                            $attachmentObj = createAttachment();
                            $attachment_id = addMedia($attachmentObj, $document['file'])?->id;
                            $attachmentObj?->delete();
                            $doc = Document::where('slug', $document['slug'])->first();
                            $expired_at = $document['expired_at'] ?? null;
                            if ($doc?->need_expired_date) {
                                if (!$expired_at) {
                                    throw new Exception(__('taxido::auth.expired_date_required', ['name' => $doc?->name]), 422);
                                }
                            }

                            $driver->documents()?->create([
                                'document_id' => $doc?->id,
                                'document_image_id' => $attachment_id,
                                'expired_at' => $expired_at,
                            ]);
                        }
                    }
                }
            }
            DB::commit();
            if ($verifiedAuthToken) {
                DB::table('auth_tokens')->where('token', $verifiedAuthToken->token)->where('email', $verifiedAuthToken->email)->where('phone', $verifiedAuthToken->phone)->where('created_at', $verifiedAuthToken->created_at)->delete();
            }
            if ($request->referral_code) {
                $this->applyReferralCode($request->referral_code, $driver, 'driver');
            }

            $issuedToken = $driver->createToken('auth_token');
            $token = $issuedToken->plainTextToken;
            $driver->tokens()->whereKey($issuedToken->accessToken->getKey())->update([
                'role_type' => RoleEnum::DRIVER,
            ]);


            $needsMobileUpdate = empty($driver->phone);
            $driver = [
                'id' => $driver?->id,
                'name' => $driver?->name,
                'profile_image_url' => $driver?->profile_image?->original_url,
                'wallet_balance' => $driver?->wallet?->balance ?? 0.00,
                'rating_count' => $driver?->rating_count,
                'review_count' => $driver?->review_count,
                'model' => $driver?->vehicle_info?->model,
                'plate_number' => $driver?->vehicle_info?->plate_number,
                'access_token' => $token,
                'success' => true,
                'is_verified' => $driverIsVerified,
                'needs_mobile_update' => $needsMobileUpdate,
                'role' => RoleEnum::DRIVER,
                'is_on_ride' => '0',
                'experience' => $driver?->experience,
                'price_type' => $driver?->price_type,
                'per_day_charge' => $driver?->per_day_charge,
                'per_km_charge' => $driver?->per_km_charge,
                'per_hour_charge' => $driver?->per_hour_charge,
                'gear_type' => $driver?->gear_type,
                'vehicle_type_id' => $driver?->vehicle_type_id,
                'referral_code' => $request?->referral_code,


            ];

            return response()->json($driver, 201);

        } catch (Exception $e) {
            DB::rollback();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function updatePassword(Request $request)
    {
        DB::beginTransaction();
        try {

            $validator = Validator::make($request->all(), [
                'token' => 'required',
                'email' => 'required|email|max:255|strings',
                'password' => 'required|min:8|confirmed',
                'password_confirmation' => 'required',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $user = DB::table('password_resets')
                ->where('token', $request->token)
                ->where('email', $request->email)
                ->where('created_at', '>', Carbon::now()->subHours(1))
                ->first();

            if (!$user) {
                throw new Exception(__('taxido::auth.invalid_email_token'), 400);
            }

            User::where('email', $request->email)?->update(['password' => Hash::make($request->password)]);
            DB::table('password_resets')->where('email', $request->email)->delete();
            DB::commit();

            return [
                'message' => __('taxido::auth.password_changed'),
                'success' => true,
            ];

        } catch (Exception $e) {

            DB::rollback();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function updatePaymentAccount(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'bank_name' => 'nullable|string|max:255',
                'bank_holder_name' => 'nullable|string|max:255',
                'bank_account_no' => 'nullable|string|max:50',
                'routing_number' => 'nullable|string|max:20',
                'swift' => 'nullable|string|max:20',
                'paypal_email' => 'nullable|email',
                'default' => 'in:paypal,bank',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $paymentAccount = PaymentAccount::updateOrCreate(
                ['user_id' => auth()->id()],
                $request->only([
                    'bank_name',
                    'bank_holder_name',
                    'bank_account_no',
                    'routing_number',
                    'swift',
                    'paypal_email',
                    'default',
                ])
            );


            DB::commit();

            return response()->json(['id' => $paymentAccount?->id]);

        } catch (Exception $e) {

            DB::rollback();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function updateVehicle(Request $request)
    {
        DB::beginTransaction();
        try {

            $driver_id = getCurrentUserId();
            $driver = Driver::findOrFail($driver_id);

            if ($driver->is_verified) {
                throw new Exception('Once vehicle verified you cannot change.', 422);
            }

            $validator = Validator::make($request->all(), [
                'service' => 'required|integer|exists:services,id,deleted_at,NULL',
                'service_category' => 'nullable|exists:service_categories,id,deleted_at,NULL',
                'vehicle_type_id' => 'nullable|exists:vehicle_types,id,deleted_at,NULL',
                'vehicle_name' => 'nullable|max:255',
                'model' => 'nullable|max:255',
                'plate_number' => ['nullable', 'string', 'max:20', 'regex:/^(?:[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{0,3}[ -]?[0-9]{4}|[0-9]{2}[ -]?BH[ -]?[0-9]{4}[ -]?[A-Z]{1,2})$/i'],
                'seat' => 'nullable|min:1',
                'color' => 'nullable|max:50',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            DB::table('users')?->where('id', $driver_id)->update([
                'service_id' => $request->service,
                'service_category_id' => $request->service_category,
            ]);

            if ($request->ambulance) {
                Ambulance::updateOrCreate(['driver_id' => $driver_id], [
                    'name' => $request->ambulance['name'],
                    'description' => $request->ambulance['description'],
                    'driver_id' => $driver_id,
                ]);
            }

            $vehicle = VehicleInfo::updateOrCreate(
                ['driver_id' => $driver_id],
                $request->only([
                    'vehicle_type_id',
                    'vehicle_name',
                    'model',
                    'plate_number',
                    'seat',
                    'color',
                ])
            );

            DB::commit();
            return response()->json(['id' => $vehicle?->id]);

        } catch (Exception $e) {

            DB::rollback();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function updateDocument(Request $request)
    {
        DB::beginTransaction();
        $newMedia = [];
        try {
            $role = getCurrentRoleName();
            if (! auth()->id() || ! in_array($role, [RoleEnum::DRIVER, RoleEnum::FLEET_MANAGER], true)) {
                throw new Exception('Only signed-in drivers or fleet managers can update these documents.', 403);
            }
            $types = $role === RoleEnum::FLEET_MANAGER ? ['fleet_manager'] : ['driver', 'vehicle'];
            $validator = Validator::make($request->all(), [
                'documents' => 'required|array|min:1|max:30',
                'documents.*.slug' => ['required', 'string', 'distinct', Rule::exists('documents', 'slug')->whereNull('deleted_at')->where('status', 1)->whereIn('type', $types)],
                'documents.*.file' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:10240',
                'documents.*.expired_at' => 'nullable|date|after_or_equal:today',
            ]);
            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $driverId = auth()->id();
            $documentClass = $role === RoleEnum::FLEET_MANAGER ? \Modules\Taxido\Models\FleetDocument::class : DriverDocument::class;
            $ownerColumn = $role === RoleEnum::FLEET_MANAGER ? 'fleet_manager_id' : 'driver_id';
            $planned = [];
            // Validate every entry before writing any media. Updates are always
            // scoped to this token's owner, never a driver_id from the request.
            foreach ($request->documents as $doc) {
                $definition = Document::where('slug', $doc['slug'])->where('status', 1)->whereIn('type', $types)->firstOrFail();
                $existing = $documentClass::where($ownerColumn, $driverId)->where('document_id', $definition->id)->lockForUpdate()->first();
                $file = $doc['file'] ?? null;
                if (! $file && ! $existing?->document_image_id) {
                    throw new Exception('Please upload a file for ' . $definition->name . '.', 422);
                }
                $expiry = $doc['expired_at'] ?? $existing?->expired_at;
                if ($definition->need_expired_date && ! $expiry) {
                    throw new Exception(__('taxido::auth.expired_date_required', ['name' => $definition->name]), 422);
                }
                if ($expiry && Carbon::parse($expiry)->startOfDay()->lt(Carbon::today())) {
                    throw new Exception('Choose a current or future expiry date for ' . $definition->name . '.', 422);
                }
                $oldDate = $existing?->expired_at ? Carbon::parse($existing->expired_at)->toDateString() : null;
                $newDate = $expiry ? Carbon::parse($expiry)->toDateString() : null;
                if ($file || ! $existing || $oldDate !== $newDate) {
                    $planned[] = compact('definition', 'existing', 'file', 'newDate');
                }
            }

            foreach ($planned as $change) {
                $attachmentId = $change['existing']?->document_image_id;
                if ($change['file']) {
                    $media = addMedia(createAttachment(), $change['file']);
                    if (! $media?->id) {
                        throw new Exception('The document file could not be stored. Please try again.', 500);
                    }
                    $newMedia[] = $media;
                    $attachmentId = $media->id;
                }
                $values = [
                    $ownerColumn => $driverId,
                    'document_id' => $change['definition']->id,
                    'expired_at' => $change['newDate'],
                    'document_image_id' => $attachmentId,
                    'status' => 'pending',
                ];
                if ($change['existing']) {
                    $change['existing']->update($values);
                } else {
                    $documentClass::create($values);
                }
            }
            DB::commit();
            return ['success' => true, 'updated' => count($planned)];
        } catch (Exception $e) {
            foreach ($newMedia as $media) {
                try { $media->delete(); } catch (Exception $cleanupError) {
                    Log::warning('Failed document-upload cleanup.', ['media_id' => $media->id]);
                }
            }
            DB::rollBack();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function verifyFirebaseAuthToken(Request $request)
    {

        try {
            $validator = Validator::make($request->all(), [
                'country_code' => 'required',
                'phone' => 'required|min:6|max:15',
                'firebase_token' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                throw new Exception($validator->messages()->first(), 422);
            }

            $firebaseToken = $request->firebase_token;
            $firebaseAuth = (new Factory)->withServiceAccount(config('services.firebase.credentials'))?->createAuth();
            $verifiedToken = $firebaseAuth->verifyIdToken($firebaseToken);

            // SECURITY: verifyIdToken() only proves the token is valid for this Firebase
            // project - it does NOT prove the token belongs to the phone number being
            // claimed. Without this check, any valid token could be replayed with another
            // user's phone number to obtain their access token.
            $tokenPhone   = preg_replace('/\D/', '', (string) $verifiedToken->claims()->get('phone_number'));
            $claimedPhone = preg_replace('/\D/', '', $request->country_code . $request->phone);

            if ($tokenPhone === '' || $tokenPhone !== $claimedPhone) {
                throw new Exception("Token does not match the phone number", 403);
            }

            $driver = Driver::where('phone', $request->phone)?->where('country_code', $request->country_code)?->whereNull('deleted_at')?->first();
            if ($verifiedToken) {
                if (!$driver) {
                    return response()->json([
                        'is_registered' => false,
                        'success' => true,
                        'role' => RoleEnum::DRIVER,
                    ], 200);
                }

                $token = $driver->createToken('auth_token')?->plainTextToken;

                return response()->json([
                    'id' => $driver?->id,
                    'access_token' => $token,
                    'is_registered' => true,
                    'success' => true,
                    'role' => RoleEnum::DRIVER,
                ], 200);
            }

            throw new Exception('Token Not found', 422);
        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function deleteAccount()
    {
        DB::beginTransaction();
        try {

            $driver = Driver::findOrFail(auth('sanctum')->user()->id);
            $driver->delete();

            DB::commit();
            return [
                'message' => __('static.users.user_delete'),
            ];

        } catch (Exception $e) {

            DB::rollback();
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }
}

