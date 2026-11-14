<?php

namespace Tests\Unit;

use Modules\Taxido\Services\DriverRegistrationDocuments;
use PHPUnit\Framework\TestCase;

class DriverRegistrationDocumentsTest extends TestCase
{
    private array $licence = ['slug'=>'driving-licence', 'name'=>'Driving Licence', 'is_required'=>1, 'need_expired_date'=>1];

    public function test_missing_admin_configuration_does_not_allow_registration_without_documents(): void
    {
        $this->expectExceptionCode(503);
        DriverRegistrationDocuments::validate([], []);
    }

    public function test_required_licence_cannot_be_omitted(): void
    {
        $this->expectExceptionMessage('Please upload your Driving Licence.');
        DriverRegistrationDocuments::validate([$this->licence], []);
    }

    public function test_file_without_required_expiry_is_rejected(): void
    {
        $this->expectExceptionMessage('Please enter the expiry date for Driving Licence.');
        DriverRegistrationDocuments::validate([$this->licence], [['slug'=>'driving-licence','file'=>new \stdClass()]]);
    }

    public function test_configured_required_licence_and_expiry_are_accepted(): void
    {
        DriverRegistrationDocuments::validate([$this->licence], [['slug'=>'driving-licence','file'=>new \stdClass(),'expired_at'=>'2030-01-01']]);
        $this->addToAssertionCount(1);
    }

    public function test_admin_optional_document_is_not_made_mandatory(): void
    {
        DriverRegistrationDocuments::validate([array_merge($this->licence,['is_required'=>0])], []);
        $this->addToAssertionCount(1);
    }
}
