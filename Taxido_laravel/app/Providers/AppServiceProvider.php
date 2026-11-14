<?php

namespace App\Providers;

use App\Services\Guardian;

use App\Enums\RoleEnum;
use App\Facades\WMenu;
use App\Models\Plugin;
use App\Observers\PluginObserver;
use App\Services\BadgeResolver;
use App\Services\RealtimeManager;
use App\Services\SocketService;
use App\Services\WidgetManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Translatable\Facades\Translatable;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
    {
        $this->app->bind('Menu', function () {
            return new WMenu();
        });

        $this->app->singleton(WidgetManager::class, function () {
            return new WidgetManager();
        });

        $this->app->singleton(BadgeResolver::class, function () {
            return new BadgeResolver();
        });

        $this->app->singleton(SocketService::class, function () {
            return new SocketService();
        });

        $this->app->singleton(RealtimeManager::class, function () {
            return new RealtimeManager();
        });
    }


    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            if (!config('rate-limiting.enabled', true) || !config('rate-limiting.limiters.api.enabled', true)) {
                return null;
            }

            $limiterName = 'api';
            $limitType = 'ip';
            $authenticatedUser = $request->user();
            $subject = $authenticatedUser
                ? get_class($authenticatedUser) . ':' . $authenticatedUser->getAuthIdentifier()
                : 'ip:' . $request->ip();
            $key = "{$limiterName}:{$limitType}:{$subject}";

            $config = config("rate-limiting.limiters.{$limiterName}");
            // Ride tracking polls several API endpoints and Rider and Driver
            // may be used on the same network. Give each signed-in account its
            // own reasonable per-minute budget; unauthenticated calls remain
            // grouped by IP.
            $maxAttempts = $config['limits']['ip']['max_attempts'] ?? 240;

            $currentAttempts = RateLimiter::attempts($key);

            if ($currentAttempts >= $maxAttempts) {
                // Return the remaining window without increasing a penalty on
                // every retry. Repeated blocked polls must not extend the ban.
                $decay = max(1, RateLimiter::availableIn($key));
                $waitMinutes = max(1, ceil($decay / 60));
                $messageTemplate = config("rate-limiting.messages.{$limiterName}.{$limitType}")
                    ?? config('rate-limiting.messages.default', 'Too many attempts. Please wait :minutes minutes.');

                $message = str_replace(':minutes', (string)$waitMinutes, $messageTemplate);
                $suggestion = config("rate-limiting.suggestions.{$limiterName}")
                    ?? config('rate-limiting.suggestions.default', 'Please wait before trying again.');

                return response()->json([
                    'status' => 'error',
                    'message' => $message . ' ' . $suggestion,
                    'retry_after' => $decay,
                    'wait_minutes' => $waitMinutes
                ], 429);
            }

            // Normal hit
            RateLimiter::hit($key, 60);

            return null;
        });
        Guardian::bootApplication();
        Paginator::useBootstrap();
        Plugin::observe(PluginObserver::class);
        Translatable::fallback(fallbackAny: true, );
        JsonResource::withoutWrapping();
        Model::automaticallyEagerLoadRelationships();

        Gate::before(function ($user, $ability) {
            return $user->hasRole(RoleEnum::ADMIN) ? true : null;
        });
    }
}
