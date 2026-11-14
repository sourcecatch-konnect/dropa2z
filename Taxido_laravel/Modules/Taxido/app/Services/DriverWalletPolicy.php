<?php

namespace Modules\Taxido\Services;

final class DriverWalletPolicy
{
    /** Null means the configured negative-balance allowance removes the wallet gate. */
    public static function minimumRequired(array $settings): ?float
    {
        if (filter_var($settings['activation']['allow_negative_balance'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return null;
        }

        return max(0.0, (float) ($settings['wallet']['driver_min_wallet_balance'] ?? 0));
    }
}
