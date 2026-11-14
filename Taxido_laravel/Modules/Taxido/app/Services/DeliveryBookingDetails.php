<?php

namespace Modules\Taxido\Services;

final class DeliveryBookingDetails
{
    public const GOODS_TYPES = ['documents', 'food', 'clothing', 'electronics', 'household', 'spares', 'business-stock', 'healthcare', 'gifts', 'general', 'building-materials', 'events', 'ceramics', 'nonhazardous-paints', 'electrical', 'furniture', 'plastic', 'rubber', 'paper'];

    public static function validGstin(string $value): bool
    {
        $gstin = strtoupper(trim($value));
        if (!preg_match('/^(0[1-9]|[12][0-9]|3[0-8]|97|99)[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/', $gstin)) {
            return false;
        }
        $alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $sum = 0;
        $factor = 2;
        for ($index = 13; $index >= 0; $index--) {
            $product = strpos($alphabet, $gstin[$index]) * $factor;
            $sum += intdiv($product, 36) + $product % 36;
            $factor = $factor === 2 ? 1 : 2;
        }
        return $alphabet[(36 - $sum % 36) % 36] === $gstin[14];
    }
}
