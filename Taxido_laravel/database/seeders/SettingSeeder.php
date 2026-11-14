<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\Language;
use App\Models\Currency;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    protected $baseName;
    protected $baseURL;

    public function __construct()
    {
        $this->baseName = config('app.name');
        $this->baseURL = config('app.url');
    }
    /**
     * Run the database seeds.
     *
     * @return void
     */

    public function run()
    {
        $currency_id = Currency::where('status', true)->first()->id;
        $language_id = Language::where('status', true)->first()->id;
        $values = [
            'general' => [
                'light_logo_image_id' => getAttachmentId('light.svg'),
                'dark_logo_image_id' => getAttachmentId('dark.svg'),
                'favicon_image_id' => getAttachmentId('favicon.svg'),
                'site_name' => $this->baseName,
                'site_url' => $this->baseURL,
                'default_timezone' => 'UTC',
                'default_currency_id' => $currency_id,
                'admin_site_language_direction' => 'ltr',
                'default_language_id' => $language_id,
                'default_sms_gateway' => 'twilio',
                'platform_fees' => 10,
                'mode' => 'light',
                'time_format' => 12,
                'copyright' => $this->baseName . ' theme by PixelStrap',
            ],
            'appearance' => [
                'font_family' => 'Inter',
                'primary_color' => '#199675',
                'sidebar_background_type' => 'gradient',
                'sidebar_solid_color' => '#199675',
                'sidebar_gradient_color_1' => '#199675',
                'sidebar_gradient_color_2' => '#212121',
                'front_font_family' => 'DM Sans',
                'preloader_image_id' => '',
            ],
            'activation' => [
                'platform_fees' => true,
                'social_login_enable' => true,
                'cash' => true,
                'default_credentials' => true,
                'demo_mode' => true,
                'preloader_enabled' => true,
            ],
            'email' => [
                'mail_host' => env('MAIL_HOST', ''),
                'mail_port' => 465,
                'mail_mailer' => 'smtp',
                'mail_username' => env('MAIL_USERNAME', ''),
                'mail_password' => env('MAIL_PASSWORD', ''),
                'mail_encryption' => 'ssl',
                'mail_from_name' => env('MAIL_FROM_NAME', ''),
                'mail_from_address' => env('MAIL_FROM_ADDRESS', ''),
                'mailgun_domain' => env('MAILGUN_DOMAIN', ''),
                'mailgun_secret' => env('MAILGUN_SECRET', ''),
                'system_test_mail' => true,
                'password_reset_mail' => true,
            ],
            'media_configuration' => [
                'media_disk' => 'public',
                'aws_access_key_id' => env('AWS_ACCESS_KEY_ID', ''),
                'aws_secret_access_key' => env('AWS_SECRET_ACCESS_KEY', ''),
                'aws_bucket' => env('AWS_BUCKET', ''),
                'aws_default_region' => env('AWS_DEFAULT_REGION', ''),
            ],
            'google_reCaptcha' => [
                'secret' => env('RECAPTCHA_SECRET', ''),
                'site_key' => env('RECAPTCHA_SITE_KEY', ''),
                'status' => false,
            ],
            'admin_commissions' => [
                'status' => '1',
                'min_withdraw_amount' => 500,
                'default_commission_rate' => 10,
            ],
            'analytics' => [
                'facebook_pixel' => [
                    'pixel_id' => 'YOUR_PIXEL_ID',
                    'status' => false,
                ],
                'google_analytics' => [
                    'measurement_id' => 'ENTER_YOUR_SECRET_KEY',
                    'status' => false,
                ]
            ],
            'maintenance' => [
                'maintenance_mode' => false,
                'content' => "",
            ],
            'readings' => [
                'status' => 1,
                'home_page' => null
            ],
            'firebase' => [
                'service_json' => null,
                'firebase_api_key' => null,
                'firebase_auth_domain' => null,
                'firebase_data_url' => null,
                'firebase_project_id' => null,
                'firebase_storage_bucket' => null,
                'firebase_messaging_sender_id' => null,
                'firebase_app_id' => null,
                'firebase_measurement_id' => null,
            ],
            'social_login' => [
                'google' => [
                    'client_id' => env('GOOGLE_CLIENT_ID', ''),
                    'client_secret' => env('GOOGLE_CLIENT_SECRET', ''),
                ],
                'facebook' => [
                    'client_id' => env('FACEBOOK_CLIENT_ID', ''),
                    'client_secret' => env('FACEBOOK_CLIENT_SECRET', ''),
                ],
                'apple' => [
                    'client_id' => env('APPLE_CLIENT_ID', ''),
                    'client_secret' => env('APPLE_CLIENT_SECRET', ''),
                ]
            ],

        ];

        Setting::updateOrCreate(['values' => $values]);
    }
}
