@php
    $settings = getSettings();
    $announcement = $settings['announcement']['admin'] ?? null;
    $locale = app()->getLocale();
    $text = $announcement['text'][$locale] ?? $announcement['text']['en'] ?? '';
    $buttonText = $announcement['button_text'][$locale] ?? $announcement['button_text']['en'] ?? '';
@endphp

@if($announcement && $announcement['status'])
<div class="sub-header">
    <h6 class="offer-text">{{ $text }}
        @if(isset($announcement['link']) && $announcement['link'] && $buttonText)
        <a href="{{ $announcement['link'] }}" class="btn" target="_blank">{{ $buttonText }}</a>
        @endif
    </h6>
</div>
@endif


<!-- Page Header Start-->
@can('ride_request.index')
<aside id="dropa2z-live-bookings" aria-live="polite" aria-label="Live booking notifications" style="display:none;position:fixed;top:76px;right:24px;width:min(480px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow:auto;z-index:1055;background:#fff;border:1px solid #dce5ed;border-radius:16px;box-shadow:0 14px 44px rgba(20,48,75,.2);">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#1d5b96;color:#fff;position:sticky;top:0;z-index:1;border-radius:16px 16px 0 0;">
        <div class="dropa2z-live-bookings-heading"><strong>Live bookings</strong><div class="dropa2z-live-bookings-subtitle" style="font-size:12px;opacity:.86">New rider requests</div></div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span id="dropa2z-live-bookings-count" style="min-width:26px;height:26px;border-radius:13px;background:#fff;color:#1d5b96;text-align:center;line-height:26px;font-weight:700">0</span>
            <button id="dropa2z-live-bookings-minimize" type="button" aria-label="Minimize live bookings" aria-expanded="true" title="Minimize" style="width:32px;height:32px;border:1px solid rgba(255,255,255,.55);border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:20px;line-height:1;cursor:pointer">−</button>
            <button id="dropa2z-live-bookings-maximize" type="button" aria-label="Maximize live bookings" aria-pressed="false" title="Maximize" style="width:32px;height:32px;border:1px solid rgba(255,255,255,.55);border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:17px;line-height:1;cursor:pointer">□</button>
        </div>
    </div>
    <div id="dropa2z-live-bookings-list" style="padding:8px 14px 14px;"></div>
</aside>
@push('scripts')
<style>
    #toast-container > .toast.toast-info {
        color: #263442 !important;
        background-color: #fff !important;
        background-image: none !important;
        border-left: 5px solid #1d5b96 !important;
        box-shadow: 0 8px 28px rgba(20, 48, 75, .22) !important;
    }
    #toast-container > .toast.toast-info .toast-title,
    #toast-container > .toast.toast-info .toast-message,
    #toast-container > .toast.toast-info * {
        color: #263442 !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    #dropa2z-booking-notices {
        position: fixed;
        z-index: 1060;
        top: 86px;
        left: 50%;
        transform: translateX(-50%);
        width: min(420px, calc(100vw - 32px));
        pointer-events: none;
    }
    #dropa2z-live-bookings.dropa2z-live-bookings-minimized > div:first-child {
        padding: 9px 12px !important;
    }
    #dropa2z-live-bookings.dropa2z-live-bookings-minimized .dropa2z-live-bookings-subtitle {
        display: none !important;
    }
    #dropa2z-live-bookings.dropa2z-live-bookings-minimized .dropa2z-live-bookings-heading strong {
        white-space: nowrap;
        font-size: 14px;
    }
    .dropa2z-booking-notice {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 15px 18px;
        color: #263442;
        background: #fff;
        border: 1px solid #dce5ed;
        border-left: 5px solid #1d5b96;
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(20, 48, 75, .22);
        font-weight: 600;
        pointer-events: auto;
    }
    .dropa2z-booking-notice button {
        border: 0;
        padding: 2px 6px;
        color: #526171;
        background: transparent;
        font-size: 20px;
        cursor: pointer;
    }
</style>
<script>
$(function () {
    const panel = $('#dropa2z-live-bookings');
    const list = $('#dropa2z-live-bookings-list');
    const minimizeButton = $('#dropa2z-live-bookings-minimize');
    const maximizeButton = $('#dropa2z-live-bookings-maximize');
    const knownIds = new Set();
    let requestInFlight = false;
    let isMinimized = false;
    let isMaximized = false;
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const assignUrlTemplate = @json(route('admin.ride-request.live-notifications.assign', ['rideRequestId' => '__ID__']));
    const declineUrlTemplate = @json(route('admin.ride-request.live-notifications.decline', ['rideRequestId' => '__ID__']));

    function showAdminNotice(message) {
        let stack = $('#dropa2z-booking-notices');
        if (!stack.length) {
            stack = $('<div>').attr({ id: 'dropa2z-booking-notices', role: 'status', 'aria-live': 'polite' }).appendTo('body');
        }
        const notice = $('<div>').addClass('dropa2z-booking-notice');
        notice.append($('<span>').text(message));
        notice.append($('<button>').attr({ type: 'button', 'aria-label': 'Dismiss notice' }).text('×').on('click', function () { notice.remove(); }));
        stack.append(notice);
        window.setTimeout(function () { notice.fadeOut(250, function () { notice.remove(); }); }, 7000);
    }

    function updatePanelControls() {
        list.toggle(!isMinimized);
        panel.toggleClass('dropa2z-live-bookings-minimized', isMinimized);
        panel.css({
            top: '76px',
            right: '24px',
            left: 'auto',
            width: isMinimized ? 'min(360px,calc(100vw - 32px))' : (isMaximized ? 'min(960px,calc(100vw - 48px))' : 'min(480px,calc(100vw - 32px))'),
            height: isMaximized && !isMinimized ? 'calc(100vh - 100px)' : 'auto',
            maxHeight: isMinimized ? 'none' : (isMaximized ? 'calc(100vh - 100px)' : 'calc(100vh - 100px)'),
            overflow: isMinimized ? 'hidden' : 'auto'
        });
        minimizeButton.text(isMinimized ? '+' : '−')
            .attr('aria-label', isMinimized ? 'Show live bookings' : 'Minimize live bookings')
            .attr('aria-expanded', String(!isMinimized))
            .attr('title', isMinimized ? 'Show bookings' : 'Minimize');
        maximizeButton.text(isMaximized ? '▣' : '□')
            .attr('aria-label', isMaximized ? 'Restore live bookings size' : 'Maximize live bookings')
            .attr('aria-pressed', String(isMaximized))
            .attr('title', isMaximized ? 'Restore size' : 'Maximize');
    }

    minimizeButton.on('click', function () {
        isMinimized = !isMinimized;
        if (isMinimized) isMaximized = false;
        updatePanelControls();
    });
    maximizeButton.on('click', function () {
        isMaximized = !isMaximized;
        updatePanelControls();
    });

    function refreshLiveBookings() {
        if (requestInFlight) return;
        requestInFlight = true;
        fetch("{{ route('admin.ride-request.live-notifications') }}", {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin',
        })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                if (!payload || !Array.isArray(payload.requests)) return;
                const requests = payload.requests;
                $('#dropa2z-live-bookings-count').text(payload.count || 0);
                list.empty();

                if (requests.length === 0) {
                    panel.hide();
                    knownIds.clear();
                    return;
                }

                panel.show();
                requests.forEach((booking) => {
                    const id = String(booking.id);
                    if (!knownIds.has(id)) showAdminNotice('New booking request #' + booking.ride_number);
                    knownIds.add(id);

                    const card = $('<article>').css({ padding: '12px 4px', borderBottom: '1px solid #edf1f4' });
                    const title = $('<div>').css({ display: 'flex', justifyContent: 'space-between', gap: '8px' });
                    title.append($('<strong>').text(booking.rider_name + ' · #' + booking.ride_number));
                    title.append($('<span>').text(booking.total || '').css({ color: '#1d5b96', fontWeight: 700 }));
                    const description = $('<div>').text([booking.service, booking.category, booking.vehicle].filter(Boolean).join(' · ')).css({ marginTop: '5px', color: '#5b6874', fontSize: '13px' });
                    const route = $('<div>').css({ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '10px', padding: '10px 12px', background: '#f5f8fb', border: '1px solid #e6edf3', borderRadius: '10px' });
                    const from = $('<div>');
                    from.append($('<div>').text('From').css({ color: '#687783', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }));
                    from.append($('<div>').text(booking.pickup || 'Pickup location unavailable').css({ color: '#263442', fontSize: '13px', overflowWrap: 'anywhere' }));
                    const to = $('<div>');
                    to.append($('<div>').text('To').css({ color: '#687783', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }));
                    to.append($('<div>').text(booking.destination || 'Destination unavailable').css({ color: '#263442', fontSize: '13px', overflowWrap: 'anywhere' }));
                    route.append(from);
                    if (Array.isArray(booking.stops) && booking.stops.length) {
                        const stops = $('<div>').text('Via: ' + booking.stops.join(' → ')).css({ color: '#526171', fontSize: '12px', overflowWrap: 'anywhere' });
                        route.append(stops);
                    }
                    route.append(to);
                    const actions = $('<div>').css({ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' });
                    const driverSelect = $('<select>').addClass('form-select form-select-sm').css({ minWidth: '190px', maxWidth: '100%' });
                    const drivers = Array.isArray(booking.drivers) ? booking.drivers : [];
                    driverSelect.append($('<option>').val('').text(drivers.length ? 'Choose online driver' : 'No online eligible drivers'));
                    drivers.forEach((driver) => {
                        const label = [driver.name, driver.vehicle, driver.plate].filter(Boolean).join(' / ');
                        driverSelect.append($('<option>').val(driver.id).text(label));
                    });
                    const assignButton = $('<button>').attr('type', 'button').text('Assign to driver').addClass('btn btn-sm btn-primary').prop('disabled', drivers.length === 0);
                    assignButton.on('click', function () {
                        const driverId = driverSelect.val();
                        if (!driverId) {
                            if (typeof toastr !== 'undefined') toastr.warning('Choose an online driver first.', 'Dropa2z');
                            return;
                        }
                        assignButton.prop('disabled', true).text('Sending...');
                        fetch(assignUrlTemplate.replace('__ID__', encodeURIComponent(id)), {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                            body: JSON.stringify({ driver_id: driverId }),
                        }).then(async (response) => {
                            const result = await response.json().catch(() => ({}));
                            if (!response.ok) throw new Error(result.message || 'Could not assign this booking.');
                            if (typeof toastr !== 'undefined') toastr.success(result.message, 'Dropa2z');
                            refreshLiveBookings();
                        }).catch((error) => {
                            if (typeof toastr !== 'undefined') toastr.error(error.message, 'Dropa2z');
                            assignButton.prop('disabled', false).text('Assign to driver');
                        });
                    });
                    const declineButton = $('<button>').attr('type', 'button').text('Decline').addClass('btn btn-sm btn-outline-danger');
                    declineButton.on('click', function () {
                        if (!window.confirm('Decline booking #' + booking.ride_number + '? The Rider and Driver apps will be notified.')) return;
                        declineButton.prop('disabled', true).text('Declining...');
                        fetch(declineUrlTemplate.replace('__ID__', encodeURIComponent(id)), {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                        }).then(async (response) => {
                            const result = await response.json().catch(() => ({}));
                            if (!response.ok) throw new Error(result.message || 'Could not decline this booking.');
                            if (typeof toastr !== 'undefined') toastr.success(result.message, 'Dropa2z');
                            refreshLiveBookings();
                        }).catch((error) => {
                            if (typeof toastr !== 'undefined') toastr.error(error.message, 'Dropa2z');
                            declineButton.prop('disabled', false).text('Decline');
                        });
                    });
                    actions.append(driverSelect, assignButton, declineButton, $('<a>').attr('href', booking.details_url).text('View map & details').addClass('btn btn-sm btn-outline-primary'));
                    card.append(title, description, route, actions);
                    list.append(card);
                });
            })
            .catch(() => undefined)
            .finally(() => { requestInFlight = false; });
    }

    refreshLiveBookings();
    window.setInterval(refreshLiveBookings, 5000);
});
</script>
@endpush
@endcan
<div class="page-main-header">
    <div class="main-header row">
        <div class="main-header-left d-lg-none d-flex">
            <div
                class="d-flex align-items-center flex-lg-row flex-row-reverse justify-content-lg-between justify-content-end gap-md-3 gap-2">
                <div class="logo-wrapper">
                    <a href="{{ route('admin.dashboard.index') }}">
                        @if (isset(getSettings()['general']['light_logo_image']))
                        <img src="{{ getSettings()['general']['light_logo_image']?->original_url }}" alt="user"
                            class="light-mode">
                        <img src="{{ getSettings()['general']['dark_logo_image']?->original_url }}" alt="user"
                            class="dark-mode">
                        @else
                        <img src="{{ asset('images/logo.svg') }}" alt="user">
                        @endif
                    </a>
                </div>
                <a href="javascript:void(0)" class="toggle">
                    <img src="{{ asset('images/svg/toggle.svg') }}" class="sidebar-toggle" alt="">
                </a>
            </div>
        </div>
        <div class="nav-left w-auto d-lg-block d-none">
            <ul class="nav-menus">
                <li class="onhover-dropdown">
                    <div class="quick-dropdown-box">
                        <div class="d-flex gap-1 align-items-center new-btn custom-padding">
                            <span>{{ __('static.quick_links') }}</span>
                            <i class="ri-add-line add"></i>
                        </div>
                        <div class="onhover-show-div">
                            <div class="dropdown-title">
                                <h4>{{ __('static.quick_links') }}</h4>
                            </div>
                            @php
                            $quickLinks = collect(get_quick_links())->filter(function ($link) {
                            return !isset($link['permission']) || auth()->user()->can($link['permission']);
                            })?->toArray() ?? [];
                            @endphp
                            <ul class="h-custom-scrollbar dropdown-list">
                                @forelse($quickLinks as $link)
                                <li>
                                    <a href="{{ route($link['route']) }}">
                                        <div class="svg-box">
                                            <i class="{{ $link['icon'] }}"></i>
                                        </div>
                                        <span>{{ __($link['label_key']) }}</span>
                                    </a>
                                </li>
                                @empty
                                <li class="no-notifications">
                                    <div class="media"></div>
                                </li>
                                @endforelse
                            </ul>
                            @if(!count($quickLinks))
                            <div class="no-data mt-3 mb-3">
                                <img src="{{ url('/images/no-data.png') }}" alt="">
                                <h6 class="mt-2">{{ __('static.quick_links_not_found') }}</h6>
                            </div>
                            @endif
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div class="nav-right col">
            <ul class="nav-menus">
                <li class="d-flex onhover-dropdown">
                    <a href="{{ route('admin.clear.cache')}}" data-bs-toggle="tooltip" data-bs-placement="bottom"
                        {{-- class="cleaning" --}} data-bs-title="Clear Cache">
                        <i class="ri-brush-line"></i>
                    </a>
                </li>

                <li class="onhover-dropdown">
                    <a href="{{ route('home') }}" target="_blank" data-bs-toggle="tooltip" data-bs-placement="bottom"
                        data-bs-title="Browse Frontend">
                        <i class="ri-global-line"></i>
                    </a>
                </li>
                <li class="onhover-dropdown">
                    <a class="txt-dark" href="javascript:void(0)">
                        <h6 class="mb-0 text-dark">{{ strtoupper(Session::get('locale', 'en')) }}</h6>
                    </a>
                    <ul class="language-dropdown onhover-show-div p-20  language-dropdown-hover">
                        @forelse (getLanguages() as $lang)
                        <li>
                            <a href="{{ route('admin.lang', @$lang?->locale) }}"
                                data-lng="{{ @$lang?->locale }}"><img class="active-icon"
                                    src="{{ @$lang?->flag ?? asset('images/flags/default.png') }}"><span>{{ @$lang?->name }}
                                    ({{ @$lang?->locale }})
                                </span></a>
                        </li>
                        @empty
                        <li>
                            <a href="{{ route('admin.lang', 'en') }}" data-lng="en"><img class="active-icon"
                                    src="{{ asset('images/flags/US.png') }}"><a href="javascript:void(0)"
                                    data-lng="en">{{ __('static.english') }}</a>
                        </li>
                        @endforelse
                    </ul>
                </li>
                <li class="dark-light-mode onhover-dropdown" id="dark-mode">
                    <i class="ri-moon-line  light-mode"></i>
                    <i class="ri-sun-line dark-mode"></i>
                </li>
                @can('sos.index')
                <li class="sos-alert onhover-dropdown" id="sos-alert">
                    <span class="sos-text">SOS</span>

                    @php
                    $sosNotifications = auth()
                    ?->user()
                    ?->notifications()
                    ?->where('type', 'Modules\Taxido\Notifications\SOSAlertNotification')
                    ?->whereNull('read_at')
                    ?->latest()
                    ?->take(5)
                    ?->get();
                    @endphp
                    <span class="badge badge-danger" id="sos-notification-count" style="{{ $sosNotifications?->count() > 0 ? '' : 'display: none;' }}">{{ $sosNotifications?->count() }}</span>

                    <div class="notification-dropdown onhover-show-div">
                        <h5 class="dropdown-title">{{ __('static.recent_sos_alerts') }}</h5>
                        <ul class="notification-box custom-scrollbar" id="sos-notification-list">
                            @forelse ($sosNotifications as $notification)
                            <li data-id="{{ $notification->id }}">
                                <div class="media">
                                    <div class="d-flex align-items-start gap-2">
                                        <div class="media-img bg-white">
                                            <i class="ri-alert-line text-danger"></i>
                                        </div>
                                        <div class="media-content">
                                            <div>
                                                <a href="javascript:void(0)" class="text-dark">
                                                    SOS Alert:
                                                    {{ $notification->data['message'] ?? 'Location: ' . $notification->data['coordinates']['lat'] . ', ' . $notification->data['coordinates']['lng'] }}
                                                </a>
                                                <p>{{ $notification->created_at->diffForHumans() }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            @empty
                            <li class="no-notifications">
                                <div class="media">
                                    <div class="no-data mt-3">
                                        <img src="{{ url('/images/no-data.png') }}" alt="">
                                        <h6 class="mt-2">{{ __('static.no_sos_alert_found') }}</h6>
                                    </div>
                                </div>
                            </li>
                            @endforelse
                        </ul>
                        @if ($sosNotifications->count())
                            @if (Route::has('admin.sos-alerts.index'))
                            <div class="dropdown-footer">
                                <a class="btn btn-solid view-chat w-100"
                                    href="{{ route('admin.sos-alerts.index') }}">{{ __('static.all_sos_alerts') }}</a>
                            </div>
                            @endif
                        @endif
                    </div>
                </li>
                @endcan

                <li class="onhover-dropdown">
                    <div class="notify-bell">
                        <i class="ri-notification-2-line"></i>
                    </div>
                    @php
                    $notifications = auth()
                    ?->user()
                    ?->notifications()
                    ?->whereNull('read_at')
                    ->where('type', '!=', 'Modules\Taxido\Notifications\SOSAlertNotification')
                    ->latest()
                    ->take(5)
                    ->get();
                    @endphp
                    <span class="badge badge-secondary" id="notification-count" style="{{ $notifications?->count() > 0 ? '' : 'display: none;' }}">{{ $notifications?->count() }}</span>
                    <div class="notification-dropdown onhover-show-div">
                        <h5 class="dropdown-title">{{ __('static.recent_notifications') }}</h5>
                        <ul class="notification-box custom-scrollbar" id="notification-list">
                            @forelse ($notifications as $notification)
                            <li data-id="{{ $notification->id }}">
                                <div class="media">
                                    <div class="d-flex align-items-start gap-2">
                                        <div class="media-img bg-white">
                                            @if ($notification->module == 'ticket')
                                            <i class="ri-ticket-2-line text-primary"></i>
                                            @else
                                            <i class="ri-notification-2-line text-primary"></i>
                                            @endif
                                        </div>
                                        <div class="media-content">
                                            <div>
                                                <a href="javascript:void(0)"
                                                    class="text-dark">{{ $notification->data['message'] ?? null }}</a>
                                                <p>{{ $notification->created_at->diffForHumans() }}</p>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </li>
                            @empty
                            <li class="no-notifications">
                                <div class="media">
                                    <div class="no-data mt-3">
                                        <img src="{{ url('/images/no-data.png') }}" alt="">
                                        <h6 class="mt-2">{{ __('static.no_notification_found') }}</h6>
                                    </div>
                            </li>
                            @endforelse
                        </ul>
                        @if ($notifications->count())
                        <div class="dropdown-footer">
                            <a class="btn btn-solid view-chat w-100"
                                href="{{ route('admin.notification.index') }}">{{ __('static.all_notifications') }}</a>
                        </div>
                        @endif
                    </div>
                </li>

                @can('chat.index')
                @php
                    $chatRepo = app(\App\Repositories\Admin\ChatRepository::class);
                    $totalUnread = $chatRepo->getTotalUnreadCount();
                    $recentChats = $chatRepo->getRecentChats();
                @endphp
                <li class="onhover-dropdown" id="chat-notification">
                    <i class="ri-chat-3-line"></i>
                    <span class="badge badge-primary" id="chat-notification-count" style="{{ $totalUnread > 0 ? '' : 'display: none;' }}">{{ $totalUnread }}</span>
                    <div class="notification-dropdown onhover-show-div">
                        <h5 class="dropdown-title">{{ __('static.chats.recent_chats') }}</h5>
                        <ul class="notification-box custom-scrollbar" id="chat-notification-list">
                            @forelse($recentChats as $chat)
                                <li>
                                    <a href="{{ route('admin.chat.index') }}?room_id={{ $chat['chat_id'] }}">
                                        <div class="media">
                                            @if($chat['image'])
                                                <img class="img-fluid rounded-circle me-3" src="{{ $chat['image'] }}" style="width: 35px; height: 35px;">
                                            @else
                                                <div class="user-round me-3" style="width: 35px; height: 35px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                                    <h6 class="mb-0" style="font-size: 12px;">{{ strtoupper($chat['name'][0]) }}</h6>
                                                </div>
                                            @endif
                                            <div class="media-body">
                                                <h6 class="mb-0">{{ $chat['name'] }}</h6>
                                                <p class="mb-0" style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                                                    {{ $chat['last_message']['message'] ?? 'New Message' }}
                                                </p>
                                            </div>
                                            @if($chat['unread_count'] > 0)
                                                <span class="badge bg-primary ms-auto">{{ $chat['unread_count'] }}</span>
                                            @endif
                                        </div>
                                    </a>
                                </li>
                            @empty
                                <li class="no-notifications">
                                    <div class="media">
                                        <div class="no-data mt-3">
                                            <img src="{{ asset('images/no-user.png') }}" alt="">
                                            <h6 class="mt-2 text-center">{{ __('static.chats.no_chats_found') }}</h6>
                                        </div>
                                    </div>
                                </li>
                            @endforelse
                        </ul>
                        @if(count($recentChats) > 0)
                        <div class="dropdown-footer">
                            <a class="btn btn-solid view-chat w-100" href="{{ route('admin.chat.index') }}">{{ __('static.chats.view_all_chats') }}</a>
                        </div>
                        @endif
                    </div>
                </li>
                @endcan

                <li class="onhover-dropdown">
                    <div class="media align-items-center profile-box">
                        <div class="profile-img">
                            @if (Auth::user()->profile_image)
                            <img src="{{ Auth::user()->profile_image->original_url }}">
                            @else
                            <div class="user-round">
                                <h6>{{ strtoupper(substr(Auth::user()->name, 0, 1)) }}</h6>
                            </div>
                            @endif
                        </div>
                        <div class="d-lg-block d-none">
                            <h6>{{ Auth::user()->name }}</h6>
                            <span class="d-md-block d-none">{{ Auth::user()->getRoleNames()->first() }}</span>
                        </div>
                    </div>
                    <div class="profile-dropdown onhover-show-div profile-dropdown-hover custom-scrollbar">
                        <ul>
                            @if (Route::has('admin.account.profile'))
                            <li>
                                <a href="{{ route('admin.account.profile') }}">
                                    <i class="ri-user-line"></i>
                                    <span>{{ __('static.edit_profile') }}</span>
                                </a>
                            </li>
                            @endif
                            <li>
                                <a href="{{ route('admin.logout') }}"
                                    onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                                    <i class="ri-logout-box-line"></i>
                                    <span>{{ __('static.logout') }}</span>
                                </a>
                                <form action="{{ route('admin.logout') }}" method="POST" class="d-none"
                                    id="logout-form">
                                    @csrf
                                </form>
                            </li>
                        </ul>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>
<!-- Page Header Ends -->

@auth
@push('scripts')
<script>
    $(document).ready(function() {
        let knownNotificationIds = @json($notifications?->pluck('id')->values() ?? []);

        const refreshNotificationBell = () => {
            fetch("{{ route('admin.notifications.poll') }}", {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            })
                .then((response) => response.ok ? response.json() : null)
                .then((payload) => {
                    if (!payload) return;

                    const hasNewNotification = payload.notifications.some(
                        (notification) => !knownNotificationIds.includes(notification.id),
                    );
                    knownNotificationIds = payload.notifications.map((notification) => notification.id);

                    const badge = $('#notification-count');
                    badge.text(payload.count);
                    payload.count ? badge.show() : badge.hide();

                    const list = $('#notification-list').empty();
                    if (!payload.notifications.length) {
                        list.append('<li class="no-notifications"><div class="media"><div class="no-data mt-3"><h6 class="mt-2">{{ __('static.no_notification_found') }}</h6></div></div></li>');
                        return;
                    }

                    payload.notifications.forEach((notification) => {
                        const item = $('<li>');
                        const link = $('<a>', { class: 'text-dark', href: notification.url }).text(notification.message);
                        item.append($('<div>', { class: 'media' }).append(
                            $('<div>', { class: 'd-flex align-items-start gap-2' }).append(
                                $('<div>', { class: 'media-img bg-white' }).append($('<i>', { class: 'ri-notification-2-line text-primary' })),
                                $('<div>', { class: 'media-content' }).append($('<div>').append(link).append($('<p>').text(notification.time))),
                            ),
                        ));
                        list.append(item);
                    });

                    if (hasNewNotification && typeof toastr !== 'undefined') {
                        const newest = payload.notifications[0];
                        showAdminNotice(newest.message || 'New admin notification');
                    }
                })
                .catch(() => undefined);
        };

        setInterval(refreshNotificationBell, 10000);

        setTimeout(function() {
            if (typeof window.Echo !== 'undefined') {
                const userId = "{{ auth()->user()->id }}";
                window.Echo.private(`user.notifications.${userId}`)
                    .notification((notification) => {
                        console.log('New notification received:', notification);
                        if (notification.type === 'Modules\\Taxido\\Notifications\\SOSAlertNotification') {
                            if (typeof toastr !== 'undefined') {
                                toastr.warning(notification.message || 'New SOS Alert!', 'SOS Alert', {
                                    timeOut: 0,
                                    extendedTimeOut: 0,
                                    closeButton: true
                                });
                            }
                            
                            const badge = $('#sos-notification-count');
                            let currentCount = parseInt(badge.text()) || 0;
                            currentCount++;
                            badge.text(currentCount).show();
                            
                            const list = $('#sos-notification-list');
                            list.find('.no-notifications').remove();
                            
                            const newAlertHtml = `
                                <li>
                                    <div class="media">
                                        <div class="d-flex align-items-start gap-2">
                                            <div class="media-img bg-white">
                                                <i class="ri-alert-line text-danger"></i>
                                            </div>
                                            <div class="media-content">
                                                <div>
                                                    <a href="/admin/sos-alerts" class="text-dark">
                                                        SOS Alert: ${notification.message}
                                                    </a>
                                                    <p>Just now</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            `;
                            list.prepend(newAlertHtml);
                        } else {
                            if (typeof toastr !== 'undefined') {
                                showAdminNotice(notification.message || 'You have a new notification.');
                            }

                            const badge = $('#notification-count');
                            const currentCount = parseInt(badge.text()) || 0;
                            badge.text(currentCount + 1).show();

                            const list = $('#notification-list');
                            list.find('.no-notifications').remove();
                            const item = $('<li>');
                            const link = $('<a>', { class: 'text-dark', href: notification.url || '/admin/ride-request' })
                                .text(notification.message || 'You have a new notification.');
                            item.append($('<div>', { class: 'media' }).append(
                                $('<div>', { class: 'd-flex align-items-start gap-2' }).append(
                                    $('<div>', { class: 'media-img bg-white' }).append($('<i>', { class: 'ri-notification-2-line text-primary' })),
                                    $('<div>', { class: 'media-content' }).append($('<div>').append(link).append($('<p>').text('Just now')))
                                )
                            ));
                            list.prepend(item);
                        }
                    });
            }
        }, 500);
    });
</script>
@endpush
@endauth
