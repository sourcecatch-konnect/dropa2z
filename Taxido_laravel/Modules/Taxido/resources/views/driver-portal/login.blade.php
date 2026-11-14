<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Driver Portal | {{ config('app.name') }}</title>
    <style>
        :root { --ink: #15251f; --brand: #1d7558; --line: #d8e4dc; }
        * { box-sizing: border-box; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--ink); background: linear-gradient(145deg, #f4fbf7, #e8f5ee); }
        main { width: min(100%, 430px); background: #fff; padding: 34px; border: 1px solid var(--line); border-radius: 24px; box-shadow: 0 20px 55px rgba(21, 37, 31, .12); }.brand { font-weight: 800; color: var(--brand); letter-spacing: .03em; }.brand-mark { display:inline-grid;width:32px;height:32px;place-items:center;background:var(--brand);color:#fff;border-radius:10px;margin-right:8px; } h1 { margin: 28px 0 8px; font-size: 28px; } p { color: #5e6f66; line-height: 1.55; } label { display: block; margin: 20px 0 7px; font-weight: 700; font-size: 14px; } input { width: 100%; padding: 13px 14px; border: 1px solid var(--line); border-radius: 11px; font: inherit; } input:focus { outline: 3px solid #c6e9d7; border-color: var(--brand); } button { width: 100%; margin-top: 24px; padding: 14px; border: 0; border-radius: 11px; font: inherit; font-weight: 800; color: #fff; background: var(--brand); cursor: pointer; }.notice { padding: 12px; border-radius: 10px; margin: 18px 0 0; font-size: 14px; }.error { color: #8a1f1f; background: #fff1f1; }.success { color: #145a39; background: #e8f4ed; }
    </style>
</head>
<body>
    <main>
        <div class="brand"><span class="brand-mark">D</span>DROPA2Z DRIVER</div>
        <h1>Welcome back</h1>
        <p>Sign in to go online, receive ride requests, and manage your trip.</p>
        @if (session('error')) <div class="notice error">{{ session('error') }}</div> @endif
        @if (session('success')) <div class="notice success">{{ session('success') }}</div> @endif
        @if ($errors->any()) <div class="notice error">{{ $errors->first() }}</div> @endif
        <form method="POST" action="{{ route('driver.portal.authenticate') }}" novalidate>
            @csrf
            <label for="email">Email address</label><input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required autofocus>
            <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required>
            <button type="submit">Sign in to Driver Portal</button>
        </form>
    </main>
</body>
</html>
