DropA2Z — Ride complete
@if(!empty($isPreview))
PREVIEW ONLY — sample content; no ride was completed.
@endif

Hi {{ $recipientName }},
@if($isDriver)
Ride #{{ $rideNumber }} has been marked complete. Thank you for driving with DropA2Z.
@else
Your ride is complete. Thanks for riding with DropA2Z. We hope you had a comfortable trip.
@endif

Ride summary
Ride number: #{{ $rideNumber }}
@if(!empty($pickupLocation))
Pickup: {{ $pickupLocation }}
@endif
@if(!empty($dropoffLocation))
Destination: {{ $dropoffLocation }}
@endif
@if(!empty($driverName))
Driver: {{ $driverName }}
@endif
@if(!empty($totalFare))
Fare: {{ $totalFare }}
@endif
@if(!empty($paymentMethod) || !empty($paymentStatus))
Payment: {{ $paymentMethod }}@if(!empty($paymentMethod) && !empty($paymentStatus)) · @endif{{ $paymentStatus }}
@endif
@if($isDriver)
Open the Driver app to view your ride details and earnings.
@else
Open the Rider app to view your ride details or plan your next trip.
@endif

This is an automatic ride update from DropA2Z. Please do not reply to this email.
