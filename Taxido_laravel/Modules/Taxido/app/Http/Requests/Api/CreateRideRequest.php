<?php

namespace Modules\Taxido\Http\Requests\Api;

use App\Exceptions\ExceptionHandler;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;
use Modules\Taxido\Services\DeliveryBookingDetails;

class CreateRideRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules()
    {
        return [
            'locations' => ['required','array'],
            'rider_id' => ['exists:users,id,deleted_at,NULL', 'nullable'],
            'service_id' => ['required', Rule::exists('services', 'id')->whereNull('deleted_at')->where('status', 1)],
            'service_category_id' => ['nullable', Rule::exists('service_categories', 'id')->whereNull('deleted_at')->where('status', 1)->where('service_id', $this->input('service_id'))],
            'vehicle_type_id' => ['nullable', Rule::exists('vehicle_types', 'id')->whereNull('deleted_at')->where('status', 1)],
            'coupon' => ['nullable','exists:coupons,code,deleted_at,NULL'],
            'distance' => ['nullable'],
            'location_coordinates' => ['required'],
            'cargo_image_id' => ['nullable'],
            'description' => ['nullable'],
            'weight' => ['nullable', 'numeric', 'gt:0', function ($attribute, $value, $fail) {
                $vehicle=\Modules\Taxido\Models\VehicleType::find($this->input('vehicle_type_id'));
                $limit=$vehicle ? \Modules\Taxido\Services\DeliveryServiceCards::maxWeight($vehicle->slug) : null;
                if ($limit !== null && (float)$value > $limit) $fail('This vehicle accepts parcels up to '.$limit.' kg. Please choose a suitable vehicle.');
            }],
            'delivery_details' => ['nullable', 'array:goods_type,gstin,business_name,restricted_items_confirmed,vehicle_choice', 'required_array_keys:goods_type,restricted_items_confirmed'],
            'delivery_details.vehicle_choice' => ['prohibited'],
            'delivery_details.goods_type' => ['required_with:delivery_details', Rule::in(DeliveryBookingDetails::GOODS_TYPES)],
            'delivery_details.restricted_items_confirmed' => ['exclude_without:delivery_details', 'required', 'accepted'],
            'delivery_details.gstin' => ['nullable', 'string', function ($attribute, $value, $fail) {
                if (!DeliveryBookingDetails::validGstin((string) $value)) {
                    $fail('Enter a valid 15-character GSTIN.');
                }
            }],
            'delivery_details.business_name' => ['required_with:delivery_details.gstin', 'nullable', 'string', 'max:150'],
            'preferences.*' => ['nullable','exists:preferences,id,deleted_at,NULL'],
        ];
    }

    public function failedValidation(Validator $validator)
    {
        throw new ExceptionHandler($validator->errors()->first(), 422);
    }
}
