<?php

namespace Tests\Unit;

use Modules\Taxido\Services\DriverWalletPolicy;
use PHPUnit\Framework\TestCase;

class DriverWalletPolicyTest extends TestCase
{
    public function test_allowance_removes_wallet_gate_for_boolean_and_serialized_settings(): void
    {
        foreach ([true, 1, '1', 'true'] as $allow) {
            $this->assertNull(DriverWalletPolicy::minimumRequired(['activation'=>['allow_negative_balance'=>$allow], 'wallet'=>['driver_min_wallet_balance'=>10]]));
        }
    }

    public function test_disabled_allowance_preserves_the_configured_minimum(): void
    {
        foreach ([false, 0, '0', null] as $allow) {
            $this->assertSame(10.0, DriverWalletPolicy::minimumRequired(['activation'=>['allow_negative_balance'=>$allow], 'wallet'=>['driver_min_wallet_balance'=>10]]));
        }
        $this->assertSame(0.0, DriverWalletPolicy::minimumRequired([]));
        $this->assertSame(0.0, DriverWalletPolicy::minimumRequired(['wallet'=>['driver_min_wallet_balance'=>-10]]));
    }
}
