<?php

namespace Modules\Taxido\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Modules\Taxido\Models\Ride;

class RideOtpNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Ride $ride) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(config('app.name') . ' ride OTP - #' . $this->ride->ride_number)
            ->greeting('Your driver accepted your ride')
            ->line('Your ride OTP is: ' . $this->ride->otp)
            ->line('Share this code with your driver when you are ready to start the trip.')
            ->line('Ride number: ' . $this->ride->ride_number);
    }
}
