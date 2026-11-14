<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::group(['middleware' => ['localization' , 'maintenance', 'web'], 'namespace' => 'Front', 'as' => 'front.cab.'], function () {

  // Authentication
  Route::get('login', 'AuthController@login')->name('login.index');
  Route::post('login-with-credential', 'AuthController@loginWithCredential')->name('login_with_credential');
  Route::post('verify-firebase-otp', 'AuthController@verifyFirebaseOtp')->name('verify_firebase_otp');
  Route::get('verify-otp', 'AuthController@verifyOtp')->name('verify_otp');
  Route::post('verify-otp', 'AuthController@verifyOtpStore')->name('verify_otp.store');
  Route::get('register', 'AuthController@register')->name('register.index');
  Route::post('register', 'RegisterController@store')->name('register.store');
  Route::post('verify-firebase-otp', 'AuthController@verifyFirebaseOtp')->name('firebase.verify-otp');

  // Ride Track
  Route::get('/ride/track/{track_id}', 'RideController@track')->name('ride.track');
  Route::get('/ride/track-data/{track_id}', 'RideController@trackData')->name('ride.track-data');

  Route::group(['middleware' => ['taxido.auth']], function() {

  // Account
  Route::get('dashboard', 'AccountController@dashboard')->name('dashboard.index');
  Route::get('notifications', 'AccountController@notifications')->name('notification.index');
  Route::post('update-profile', 'AccountController@updateProfile')->name('updateProfile');
  Route::post('update-password', 'AccountController@updatePassword')->name('updatePassword');
  Route::post('update-profile-image', 'AccountController@updateProfileImage')->name('updateProfileImage');

  // Locations
  Route::resource('location','LocationController', ['except' => ['show']]);

  // Notifications
  Route::post('notifications/mark-as-read', 'AccountController@markAsRead')->name('notifications.markAsRead');

  // Ride
  Route::get('history', 'RideController@history')->name('history.index');
  Route::get('create-ride', 'RideController@create')->name('ride.create');
  Route::get('ride/{ride_id}', 'RideController@show')->name('ride.show');
  Route::get('ride/invoice/{invoice_id}', 'RideController@getInvoice')->name('ride.invoice');

  // Ride Request
  Route::post('ride', 'RideRequestController@store')->name('ride-request.store');

  // Wallet
  Route::get('wallet', 'WalletController@index')->name('wallet.index');
  Route::post('wallet/top-up', 'WalletController@topUp')->name('wallet.top-up');
  Route::get('wallet/verify-top-up/{item_id}', 'WalletController@verifyPayment')->name('wallet.top-up.verify');

  // Chat
  Route::get('chat', 'ChatController@index')->name('chat.index');

  // Logout
  Route::post('/', 'AccountController@logout')->name('logout');

  });
});

Route::group(['middleware' => ['localization', 'maintenance', 'web'], 'namespace' => 'DriverPortal', 'prefix' => 'driver', 'as' => 'driver.portal.'], function () {
  Route::get('login', 'DriverPortalController@login')->name('login');
  Route::post('login', 'DriverPortalController@authenticate')->middleware('throttle:5,1')->name('authenticate');

  Route::group(['middleware' => ['driver.portal.auth']], function () {
    Route::get('/', 'DriverPortalController@dashboard')->name('dashboard');
    Route::post('availability', 'DriverPortalController@availability')->middleware('throttle:30,1')->name('availability');
    Route::post('location', 'DriverPortalController@location')->middleware('throttle:30,1')->name('location');
    Route::get('ride-request/current', 'DriverPortalController@currentRideRequest')->middleware('throttle:30,1')->name('ride-request.current');
    Route::post('ride-request/accept', 'DriverPortalController@acceptRideRequest')->middleware('throttle:20,1')->name('ride-request.accept');
    Route::post('ride-request/reject', 'DriverPortalController@rejectRideRequest')->middleware('throttle:20,1')->name('ride-request.reject');
    Route::post('ride/start', 'DriverPortalController@startRide')->middleware('throttle:20,1')->name('ride.start');
    Route::post('ride/complete', 'DriverPortalController@completeRide')->middleware('throttle:20,1')->name('ride.complete');
    Route::post('logout', 'DriverPortalController@logout')->name('logout');
  });
});

