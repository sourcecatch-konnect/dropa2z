<?php

namespace Modules\Taxido\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Taxido\Enums\RoleEnum;

class DriverPortalAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (! $user || $user?->role?->name !== RoleEnum::DRIVER) {
            Auth::logout();

            return redirect()
                ->route('driver.portal.login')
                ->with('error', 'Please sign in with an active driver account.');
        }

        if (! $user->status || ! $user->is_verified) {
            Auth::logout();

            return redirect()
                ->route('driver.portal.login')
                ->with('error', 'Your driver account is not active yet.');
        }

        return $next($request);
    }
}
