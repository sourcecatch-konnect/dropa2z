<?php

namespace App\Http\Requests\Api;

use App\Exceptions\ExceptionHandler;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        $user = $this->user('sanctum');
        $id = $user->getKey();
        $emailRules = ['sometimes', 'email'];
        $phoneRules = ['sometimes', 'nullable'];

        // Existing role-specific accounts can share an identity. Re-saving that
        // identity must not fail because another role already uses it.
        if (strcasecmp(trim((string) $this->input('email')), trim((string) $user->email)) !== 0) {
            $emailRules[] = Rule::unique('users', 'email')->ignore($id)->whereNull('deleted_at');
        }
        if ((string) $this->input('phone') !== (string) $user->phone) {
            $phoneRules[] = 'digits_between:6,15';
            if (!empty($user->phone)) {
                $phoneRules[] = 'required';
            }
            $phoneRules[] = Rule::unique('users', 'phone')->ignore($id)->whereNull('deleted_at');
        }
        return [
            'name'  => ['max:255'],
            'email' => $emailRules,
            'phone' => $phoneRules,
        ];
    }

    public function messages()
    {
        return [
            'address.*.type.in' => 'Address type can be either shipping or billing',
        ];
    }

    public function failedValidation(Validator $validator)
    {
        throw new ExceptionHandler($validator->errors()->first(), 422);
    }
}
