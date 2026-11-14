<?php

namespace Modules\Taxido\Emails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RiderLoginOtp extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $token)
    {
    }

    public function build(): self
    {
        return $this->subject('Your Dropa2z sign-in code')
            ->view('taxido::emails.rider-login-otp');
    }
}
