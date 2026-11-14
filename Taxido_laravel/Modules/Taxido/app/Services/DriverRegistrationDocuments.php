<?php

namespace Modules\Taxido\Services;

use Exception;

class DriverRegistrationDocuments
{
    public static function validate(iterable $definitions, array $uploads): void
    {
        $definitions = collect($definitions);
        if ($definitions->isEmpty()) {
            throw new Exception('Driver registration documents are not configured. Please contact Dropa2z support.', 503);
        }
        $submitted = collect($uploads)->keyBy('slug');
        foreach ($definitions as $definition) {
            $slug = data_get($definition, 'slug');
            $name = data_get($definition, 'name', 'required document');
            $upload = $submitted->get($slug);
            if ((int) data_get($definition, 'is_required') === 1 && ! data_get($upload, 'file')) {
                throw new Exception('Please upload your ' . $name . '.', 422);
            }
            if (data_get($upload, 'file') && (int) data_get($definition, 'need_expired_date') === 1 && ! data_get($upload, 'expired_at')) {
                throw new Exception('Please enter the expiry date for ' . $name . '.', 422);
            }
        }
    }
}
