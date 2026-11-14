<?php

namespace Modules\Taxido\Emails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DriverLoginOtp extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $token)
    {
    }

    public function build(): self
    {
        return $this->subject('Your Dropa2z Driver verification code')
            ->view('taxido::emails.driver-login-otp');
    }
}
