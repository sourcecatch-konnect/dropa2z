<?php

namespace Modules\Taxido\Notifications;

use App\Models\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class GenericTemplateNotification extends Notification
{
    use Queueable;

    protected $slug;
    protected $placeholders;

    /**
     * Create a new notification instance.
     *
     * @param string $slug
     * @param array $placeholders
     */
    public function __construct($slug, $placeholders = [])
    {
        $this->slug = $slug;
        $this->placeholders = $placeholders;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $template = EmailTemplate::where('slug', $this->slug)->first();
        if ($template && isset($template->status) && !$template->status) {
            return [];
        }
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $template = EmailTemplate::where('slug', $this->slug)->first();

        if (in_array($this->slug, [
            'ride-status-rider-completed',
            'ride-status-driver-completed',
        ], true)) {
            $placeholders = $this->placeholders;
            $isDriver = $this->slug === 'ride-status-driver-completed';

            return (new MailMessage)
                ->subject(
                    ($isDriver ? 'Ride marked complete' : 'Your ride is complete') .
                    ' | #' . ($placeholders['ride_number'] ?? '') . ' | DropA2Z'
                )
                ->view([
                    'taxido::emails.ride-completed',
                    'taxido::emails.ride-completed-text',
                ], [
                    'rideNumber' => $placeholders['ride_number'] ?? '',
                    'recipientName' => $isDriver
                        ? ($placeholders['driver_name'] ?? 'there')
                        : ($placeholders['rider_name'] ?? 'there'),
                    'isDriver' => $isDriver,
                    'isPreview' => !empty($placeholders['is_preview']),
                    'driverName' => $placeholders['driver_name'] ?? '',
                    'pickupLocation' => $placeholders['pickup_location'] ?? '',
                    'dropoffLocation' => $placeholders['dropoff_location'] ?? '',
                    'totalFare' => $placeholders['total_fare'] ?? '',
                    'paymentMethod' => $placeholders['payment_method'] ?? '',
                    'paymentStatus' => $placeholders['payment_status'] ?? '',
                ]);
        }
        
        $locale = $notifiable->language ?? app()->getLocale();
        $fallback = getDefaultLangLocale();

        if (!$template) {
            return (new MailMessage)
                ->subject('Update from ' . config('app.name'))
                ->line('You have a new update in ' . config('app.name') . '.');
        }

        $title = $template->title[$locale] ?? $template->title[$fallback] ?? '';
        $content = $template->content[$locale] ?? $template->content[$fallback] ?? '';
        
        // Replace placeholders
        foreach ($this->placeholders as $key => $value) {
            $title = str_replace("{{{$key}}}", (string) $value, $title);
            $content = str_replace("{{{$key}}}", (string) $value, $content);
        }

        return (new MailMessage)
            ->subject($title)
            ->markdown('taxido::emails.email-template', [
                'content' => $template, 
                'emailContent' => $content, 
                'locale' => $locale
            ]);
    }
}
