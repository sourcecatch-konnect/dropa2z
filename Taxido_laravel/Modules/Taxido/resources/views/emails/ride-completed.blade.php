<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>DropA2Z ride complete</title>
    <style>
        @media only screen and (max-width: 620px) {
            .email-shell { width: 100% !important; }
            .email-card { padding: 24px 20px !important; }
            .detail-label { width: 96px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f2f5f8;font-family:Arial,Helvetica,sans-serif;color:#253344;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f5f8;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">
                    <tr>
                        <td style="padding:0 8px 18px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="left" valign="middle">
                                        <img src="{{ secure_asset('images/branding/dropa2z-email-logo.png') }}" alt="DropA2Z" width="160" style="display:block;width:160px;max-width:100%;height:auto;border:0;">
                                    </td>
                                    <td align="right" valign="middle" style="font-size:12px;letter-spacing:1px;color:#718096;text-transform:uppercase;">Ride complete</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-card" style="background:#ffffff;border:1px solid #e5ebf1;border-radius:16px;padding:36px 40px;box-shadow:0 8px 28px rgba(25,55,85,.07);">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                @if(!empty($isPreview))
                                    <tr>
                                        <td align="center" style="padding:10px 12px;background:#fff7df;border:1px solid #f0d995;border-radius:8px;font-size:12px;line-height:1.5;color:#735c1b;">
                                            PREVIEW ONLY — sample content; no ride was completed.
                                        </td>
                                    </tr>
                                    <tr><td style="height:16px;"></td></tr>
                                @endif
                                <tr>
                                    <td align="center" style="padding-bottom:18px;">
                                        <span style="display:inline-block;width:52px;height:52px;border-radius:50%;background:#e7f6ef;color:#159b70;font-size:30px;line-height:52px;font-weight:700;">&#10003;</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom:8px;font-size:27px;line-height:1.25;font-weight:700;color:#183b5b;">
                                        @if($isDriver)
                                            Ride marked complete
                                        @else
                                            Your ride is complete
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:0 0 27px;font-size:15px;line-height:1.65;color:#66788a;">
                                        Hi {{ $recipientName }},
                                        @if($isDriver)
                                            ride #{{ $rideNumber }} has been marked complete. Thank you for driving with DropA2Z.
                                        @else
                                            your ride is complete. Thanks for riding with DropA2Z. We hope you had a comfortable trip.
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:15px 17px;border:1px solid #e5ebf1;border-radius:10px;background:#fbfcfd;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding:2px 0 13px;font-size:14px;font-weight:700;color:#183b5b;">Ride summary</td>
                                                <td align="right" style="padding:2px 0 13px;font-size:12px;font-weight:700;letter-spacing:.4px;color:#138b68;text-transform:uppercase;">Completed</td>
                                            </tr>
                                            <tr>
                                                <td class="detail-label" width="118" valign="top" style="padding:10px 8px 10px 0;border-top:1px solid #e8edf2;font-size:12px;color:#7a8998;">Ride number</td>
                                                <td valign="top" style="padding:10px 0;border-top:1px solid #e8edf2;font-size:14px;font-weight:600;color:#253344;">#{{ $rideNumber }}</td>
                                            </tr>
                                            @if(!empty($pickupLocation))
                                                <tr>
                                                    <td class="detail-label" width="118" valign="top" style="padding:10px 8px 10px 0;border-top:1px solid #e8edf2;font-size:12px;color:#7a8998;">Pickup</td>
                                                    <td valign="top" style="padding:10px 0;border-top:1px solid #e8edf2;font-size:14px;line-height:1.5;color:#253344;">{{ $pickupLocation }}</td>
                                                </tr>
                                            @endif
                                            @if(!empty($dropoffLocation))
                                                <tr>
                                                    <td class="detail-label" width="118" valign="top" style="padding:10px 8px 10px 0;border-top:1px solid #e8edf2;font-size:12px;color:#7a8998;">Destination</td>
                                                    <td valign="top" style="padding:10px 0;border-top:1px solid #e8edf2;font-size:14px;line-height:1.5;color:#253344;">{{ $dropoffLocation }}</td>
                                                </tr>
                                            @endif
                                            @if(!empty($driverName))
                                                <tr>
                                                    <td class="detail-label" width="118" valign="top" style="padding:10px 8px 10px 0;border-top:1px solid #e8edf2;font-size:12px;color:#7a8998;">Driver</td>
                                                    <td valign="top" style="padding:10px 0;border-top:1px solid #e8edf2;font-size:14px;color:#253344;">{{ $driverName }}</td>
                                                </tr>
                                            @endif
                                            @if(!empty($totalFare))
                                                <tr>
                                                    <td class="detail-label" width="118" valign="top" style="padding:10px 8px 2px 0;border-top:1px solid #e8edf2;font-size:12px;color:#7a8998;">Fare</td>
                                                    <td valign="top" style="padding:10px 0 2px;border-top:1px solid #e8edf2;font-size:16px;font-weight:700;color:#183b5b;">{{ $totalFare }}</td>
                                                </tr>
                                            @endif
                                            @if(!empty($paymentMethod) || !empty($paymentStatus))
                                                <tr>
                                                    <td class="detail-label" width="118" valign="top" style="padding:10px 8px 2px 0;font-size:12px;color:#7a8998;">Payment</td>
                                                    <td valign="top" style="padding:10px 0 2px;font-size:13px;color:#253344;">
                                                        {{ $paymentMethod }}
                                                        @if(!empty($paymentMethod) && !empty($paymentStatus)) · @endif
                                                        {{ $paymentStatus }}
                                                    </td>
                                                </tr>
                                            @endif
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding:24px 4px 0;font-size:14px;line-height:1.6;color:#66788a;">
                                        @if($isDriver)
                                            You can open the Driver app to view your ride details and earnings.
                                        @else
                                            You can open the Rider app to view your ride details or plan your next trip.
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:19px 10px 0;font-size:12px;line-height:1.6;color:#8795a3;">
                            This is an automatic ride update from DropA2Z. Please do not reply to this email.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
