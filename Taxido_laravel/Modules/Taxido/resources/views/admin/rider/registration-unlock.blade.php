@extends('admin.layouts.master')
@section('title', 'User registration unlock')
@section('content')
<div class="contentbox"><div class="inside">
    <div class="contentbox-title"><h3>User registration unlock</h3></div>
    <p>Find a contact restricted after two self-service account deletions. Unlocking allows a new registration; it does not restore the deleted account.</p>
    <form method="get" action="{{ route('admin.rider-registration-unlock.index') }}" class="mb-4">
        <label for="identity">Email or mobile number (include country code for numbers outside India)</label>
        <div class="d-flex gap-2 mt-2"><input id="identity" name="identity" class="form-control" value="{{ $identity }}" required maxlength="255"><button class="btn btn-primary" type="submit">Check contact</button></div>
    </form>
    @if($result)
        <div class="alert {{ $result['blocked'] ? 'alert-warning' : 'alert-info' }}">
            @if(!$result['found']) No self-service deletion history was found.
            @else Self-service deletions: <strong>{{ $result['deletion_count'] }}</strong>. Registration: <strong>{{ $result['blocked'] ? 'Needs Admin approval' : 'Allowed' }}</strong>.
            @endif
        </div>
        @if($result['blocked'])
            <form method="post" action="{{ route('admin.rider-registration-unlock.update') }}">@csrf
                <input type="hidden" name="identity" value="{{ $identity }}">
                <button class="btn btn-primary" type="submit">Unlock registration</button>
            </form>
        @endif
    @endif
</div></div>
@endsection
