<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::group(['middleware' => ['localization'], 'namespace' => 'Admin', 'as' => 'admin.'], function () {

  Route::group(['middleware' => ['auth']], function () {

    // Demo mode
    Route::group(['middleware' => ['demo']], function () {

      // Zones
      Route::delete('zone/destroy/{zone}', 'ZoneController@destroy')->name('zone.destroy')->middleware('can:zone.destroy');
      Route::patch('zone/restore/{id}', 'ZoneController@restore')->name('zone.restore')->middleware('can:zone.restore');
      Route::delete('zone/force-delete/{id}', 'ZoneController@forceDelete')->name('zone.forceDelete')->middleware('can:zone.forceDelete');
      Route::put('zone/status/{id}', 'ZoneController@status')->name('zone.status')->middleware('can:zone.edit');

      // Peak Zones
      Route::delete('peakZone/destroy/{zone}', 'PeakZoneController@destroy')->name('peakZone.destroy')->middleware('can:peak_zone.destroy');
      Route::patch('peakZone/restore/{id}', 'PeakZoneController@restore')->name('peakZone.restore')->middleware('can:peak_zone.restore');
      Route::delete('peakZone/force-delete/{id}', 'PeakZoneController@forceDelete')->name('peakZone.forceDelete')->middleware('can:peak_zone.forceDelete');
      Route::put('peakZone/status/{id}', 'PeakZoneController@status')->name('peakZone.status')->middleware('can:peak_zone.edit');

      // Banner
      Route::delete('banner/destroy/{banner}', 'BannerController@destroy')->name('banner.destroy')->middleware('can:banner.destroy');
      Route::patch('banner/restore/{id}', 'BannerController@restore')->name('banner.restore')->middleware('can:banner.restore');
      Route::delete('banner/force-delete/{id}', 'BannerController@forceDelete')->name('banner.forceDelete')->middleware('can:banner.forceDelete');

      // Preference
      Route::delete('preference/destroy/{preference}', 'PreferenceController@destroy')->name('preference.destroy')->middleware('can:preference.destroy');
      Route::patch('preference/restore/{id}', 'PreferenceController@restore')->name('preference.restore')->middleware('can:preference.restore');
      Route::delete('preference/force-delete/{id}', 'PreferenceController@forceDelete')->name('preference.forceDelete')->middleware('can:preference.forceDelete');

      // Vehicle Type
      Route::put('vehicle-type/status/{id}', 'VehicleTypeController@status')->name('vehicle-type.status')->middleware('can:vehicle_type.edit');
      Route::delete('vehicle-type/destroy/{vehicle_type}', 'VehicleTypeController@destroy')->name('vehicle-type.destroy')->middleware('can:vehicle_type.destroy');
      Route::patch('vehicle-type/restore/{id}', 'VehicleTypeController@restore')->name('vehicle-type.restore')->middleware('can:vehicle_type.restore');
      Route::delete('vehicle-type/force-delete/{id}', 'VehicleTypeController@forceDelete')->name('vehicle-type.forceDelete')->middleware('can:vehicle_type.forceDelete');
      Route::resource('vehicle-type', 'VehicleTypeController', ['except' => ['index','show', 'destroy', 'create','edit']]);
      Route::put('vehicle-type/status/{id}', 'VehicleTypeController@status')->name('vehicle-type.status')->middleware('can:vehicle_type.edit');

      // Vehicle Surge Price
      Route::put('/vehicle-surge-price/{vehicleSurgePrice}', 'VehicleSurgePriceController@vehicleSurgePriceUpdate')->name('vehicle-surge-prices.update')->middleware('can:vehicle_type.edit');

      // Vehicle Type Zone Preferences
      Route::put('/vehicle-type-zone/{vehicleTypeZone}/preferences', 'VehicleTypeZoneController@updatePreferences')
          ->name('vehicle-type-zone.preferences.update')
          ->middleware('can:vehicle_type.edit');

      // Hourly Packages
      Route::delete('hourly-package/destroy/{hourly_package}', 'HourlyPackageController@destroy')->name('hourly-package.destroy')->middleware('can:hourly_package.destroy');
      Route::patch('hourly-package/restore/{id}', 'HourlyPackageController@restore')->name('hourly-package.restore')->middleware('can:hourly_package.restore');
      Route::delete('hourly-package/force-delete/{id}', 'HourlyPackageController@forceDelete')->name('hourly-package.forceDelete')->middleware('can:hourly_package.forceDelete');
      Route::put('hourly-package/status/{id}', 'HourlyPackageController@status')->name('hourly-package.status')->middleware('can:hourly_package.edit');

      // Documents
      Route::delete('document/destroy/{document}', 'DocumentController@destroy')->name('document.destroy')->middleware('can:document.destroy');
      Route::patch('document/restore/{id}', 'DocumentController@restore')->name('document.restore')->middleware('can:document.restore');
      Route::delete('document/force-delete/{id}', 'DocumentController@forceDelete')->name('document.forceDelete')->middleware('can:document.forceDelete');

      // Coupons
      Route::delete('coupon/destroy/{coupon}', 'CouponController@destroy')->name('coupon.destroy')->middleware('can:coupon.destroy');
      Route::patch('coupon/restore/{id}', 'CouponController@restore')->name('coupon.restore')->middleware('can:coupon.restore');
      Route::delete('coupon/force-delete/{id}', 'CouponController@forceDelete')->name('coupon.forceDelete')->middleware('can:coupon.forceDelete');

      // SOS
      Route::delete('sos/destroy/{sos}', 'SOSController@destroy')->name('sos.destroy')->middleware('can:sos.destroy');
      Route::patch('sos/restore/{id}', 'SOSController@restore')->name('sos.restore')->middleware('can:sos.restore');
      Route::delete('sos/force-delete/{id}', 'SOSController@forceDelete')->name('sos.forceDelete')->middleware('can:sos.edit');

      // Riders
      Route::delete('rider/destroy/{rider}', 'RiderController@destroy')->name('rider.destroy')->middleware('can:rider.destroy');
      Route::patch('rider/restore/{id}', 'RiderController@restore')->name('rider.restore')->middleware('can:rider.restore');
      Route::delete('rider/force-delete/{id}', 'RiderController@forceDelete')->name('rider.forceDelete')->middleware('can:rider.forceDelete');

      // Dispatchers
      Route::delete('dispatcher/destroy/{dispatcher}', 'DispatcherController@destroy')->name('dispatcher.destroy')->middleware('can:dispatcher.destroy');
      Route::patch('dispatcher/restore/{id}', 'DispatcherController@restore')->name('dispatcher.restore')->middleware('can:dispatcher.restore');
      Route::delete('dispatcher/force-delete/{id}', 'DispatcherController@forceDelete')->name('dispatcher.forceDelete')->middleware('can:dispatcher.forceDelete');

      // Driver Document
      Route::delete('driver-document/destroy/{driver_document}', 'DriverDocumentController@destroy')->name('driver-document.destroy')->middleware('can:driver_document.destroy');
      Route::patch('driver-document/restore/{id}', 'DriverDocumentController@restore')->name('driver-document.restore')->middleware('can:driver_document.restore');
      Route::delete('driver-document/force-delete/{id}', 'DriverDocumentController@forceDelete')->name('driver-document.forceDelete')->middleware('can:driver_document.forceDelete');

      // Fleet Document
      Route::delete('fleet-document/destroy/{fleet_document}', 'FleetDocumentController@destroy')->name('fleet-document.destroy')->middleware('can:fleet_document.destroy');
      Route::patch('fleet-document/restore/{id}', 'FleetDocumentController@restore')->name('fleet-document.restore')->middleware('can:fleet_document.restore');
      Route::delete('fleet-document/force-delete/{id}', 'FleetDocumentController@forceDelete')->name('fleet-document.forceDelete')->middleware('can:fleet_document.forceDelete');

      // Fleet Vehicle Document
      Route::delete('vehicleInfoDoc/destroy/{vehicleInfoDoc}', 'VehicleInfoDocController@destroy')->name('vehicleInfoDoc.destroy')->middleware('can:fleet_vehicle_document.destroy');
      Route::patch('vehicleInfoDoc/restore/{id}', 'VehicleInfoDocController@restore')->name('vehicleInfoDoc.restore')->middleware('can:fleet_vehicle_document.restore');
      Route::delete('vehicleInfoDoc/force-delete/{id}', 'VehicleInfoDocController@forceDelete')->name('vehicleInfoDoc.forceDelete')->middleware('can:fleet_vehicle_document.forceDelete');

      // Driver Rules
      Route::delete('driver-rule/destroy/{driver_rule}', 'DriverRuleController@destroy')->name('driver-rule.destroy')->middleware('can:driver_rule.destroy');
      Route::patch('driver-rule/restore/{id}', 'DriverRuleController@restore')->name('driver-rule.restore')->middleware('can:driver_rule.restore');
      Route::delete('driver-rule/force-delete/{id}', 'DriverRuleController@forceDelete')->name('driver-rule.forceDelete')->middleware('can:driver_rule.forceDelete');

      // Plans
      Route::delete('plan/destroy/{plan}', 'PlanController@destroy')->name('plan.destroy')->middleware('can:plan.destroy');
      Route::patch('plan/restore/{id}', 'PlanController@restore')->name('plan.restore')->middleware('can:plan.restore');
      Route::delete('plan/force-delete/{id}', 'PlanController@forceDelete')->name('plan.forceDelete')->middleware('can:plan.forceDelete');

      // Surge Price
      Route::delete('surge-price/destroy/{surge_price}', 'SurgePriceController@destroy')->name('surge-price.destroy')->middleware('can:surge_price.destroy');
      Route::patch('surge-price/restore/{id}', 'SurgePriceController@restore')->name('surge-price.restore')->middleware('can:surge_price.restore');
      Route::delete('surge-price/force-delete/{id}', 'SurgePriceController@forceDelete')->name('surge-price.forceDelete')->middleware('can:surge_price.forceDelete');

      // Airport
      Route::delete('airport/destroy/{airport}', 'AirportController@destroy')->name('airport.destroy')->middleware('can:airport.destroy');
      Route::patch('airport/restore/{id}', 'AirportController@restore')->name('airport.restore')->middleware('can:airport.restore');
      Route::delete('airport/force-delete/{id}', 'AirportController@forceDelete')->name('airport.forceDelete')->middleware('can:airport.forceDelete');

      // Rental Vehicle
      Route::delete('rental-vehicle/destroy/{rental_vehicle}', 'RentalVehicleController@destroy')->name('rental-vehicle.destroy')->middleware('can:rental_vehicle.destroy');
      Route::patch('rental-vehicle/restore/{id}', 'RentalVehicleController@restore')->name('rental-vehicle.restore')->middleware('can:rental_vehicle.restore');
      Route::delete('rental-vehicle/force-delete/{id}', 'RentalVehicleController@forceDelete')->name('rental-vehicle.forceDelete')->middleware('can:rental_vehicle.forceDelete');

      // Update Password
      Route::put('rider/{id}/password/update', 'RiderController@updatePassword')->name('rider.password.update');

      // Fleet Manager
      Route::delete('fleet-manager/destroy/{fleet_manager}', 'FleetManagerController@destroy')->name('fleet-manager.destroy')->middleware('can:fleet_manager.destroy');
      Route::patch('fleet-manager/restore/{id}', 'FleetManagerController@restore')->name('fleet-manager.restore')->middleware('can:fleet_manager.restore');
      Route::delete('fleet-manager/force-delete/{id}', 'FleetManagerController@forceDelete')->name('fleet-manager.forceDelete')->middleware('can:fleet_manager.forceDelete');

      // Driver
      Route::delete('driver/destroy/{driver}', 'DriverController@destroy')->name('driver.destroy')->middleware('can:driver.destroy');
      Route::patch('driver/restore/{id}', 'DriverController@restore')->name('driver.restore')->middleware('can:driver.restore');
      Route::delete('driver/force-delete/{id}', 'DriverController@forceDelete')->name('driver.forceDelete')->middleware('can:driver.forceDelete');

      // Cancellation Reason
      Route::delete('cancellation-reason/destroy/{cancellation_reason}', 'CancellationReasonController@destroy')->name('cancellation-reason.destroy')->middleware('can:cancellation_reason.destroy');
      Route::patch('cancellation-reason/restore/{id}', 'CancellationReasonController@restore')->name('cancellation-reason.restore')->middleware('can:cancellation_reason.restore');
      Route::delete('cancellation-reason/force-delete/{id}', 'CancellationReasonController@forceDelete')->name('cancellation-reason.forceDelete')->middleware('can:cancellation_reason.forceDelete');

      // Service
      Route::put('service/status/{id}', 'ServiceController@status')->name('service.status')->middleware('can:service.edit');

      // OnBoarding
      Route::put('onboarding/status/{id}', 'OnboardingController@status')->name('onboarding.status')->middleware('can:onboarding.edit');

    });

    // Zones
    Route::resource('zone', 'ZoneController', ['except' => ['show', 'destroy']]);

    // Peak Zones
    Route::resource('peakZone', 'PeakZoneController', ['except' => ['show', 'destroy']]);
    // Route::get('peak-zone-map', 'PeakZoneController@peakZoneMap')->name('peakZone.map')->middleware('can:peakZone.index');

    // Banners
    Route::resource('banner', 'BannerController', ['except' => ['show', 'destroy']]);
    Route::put('banner/status/{id}', 'BannerController@status')->name('banner.status')->middleware('can:banner.edit');

    // Preferences
    Route::resource('preference', 'PreferenceController', ['except' => ['show', 'destroy']]);
    Route::put('preference/status/{id}', 'PreferenceController@status')->name('preference.status')->middleware('can:preference.edit');

    // Services
    Route::resource('service', 'ServiceController', ['except' => ['show', 'destroy']]);
    Route::put('service/primary/{id}', 'ServiceController@primary')->name('service.primary')->middleware('can:service.edit');

    // Service Categories
    Route::resource('service-category', 'ServiceCategoryController', ['except' => ['index','show', 'destroy', 'edit']]);

    Route::get('service-category/cab', 'ServiceCategoryController@cabIndex')->name('service-category.cab.index')->middleware('can:service_category.index');
    Route::get('service-category/{serviceCategory}/cab/edit', 'ServiceCategoryController@cabEdit')->name('service-category.cab.edit')->middleware('can:service_category.edit');

    Route::get('service-category/{serviceCategory}/parcel/edit', 'ServiceCategoryController@parcelEdit')->name('service-category.parcel.edit')->middleware('can:service_category.edit');

    Route::get('service-category/parcel', 'ServiceCategoryController@parcelIndex')->name('service-category.parcel.index')->middleware('can:service_category.index');
    Route::get('service-category/{serviceCategory}/freight/edit', 'ServiceCategoryController@freightEdit')->name('service-category.freight.edit')->middleware('can:service_category.edit');
    Route::get('service-category/freight', 'ServiceCategoryController@freightIndex')->name('service-category.freight.index')->middleware('can:service_category.index');
    Route::put('service-category/status/{id}', 'ServiceCategoryController@status')->name('service-category.status')->middleware('can:service_category.edit');

    //find  driver
    Route::get('service-category/find-driver', 'ServiceCategoryController@finddriverIndex')->name('service-category.finddriver.index')->middleware('can:service_category.index');
    Route::get('service-category/{serviceCategory}/find-driver/edit', 'ServiceCategoryController@finddriverEdit')->name('service-category.find-driver.edit')->middleware('can:service_category.edit');


    // Onboarding
    Route::resource('onboarding', 'OnboardingController', ['except' => ['show', 'destroy']]);

    // Vehicle Types
    Route::get('vehicle-type/{vehicleType}/cab/edit', 'VehicleTypeController@cabEdit')->name('vehicle-type.cab.edit')->middleware('can:vehicle_type.edit');
    Route::get('vehicle-type/cab', 'VehicleTypeController@cabIndex')->name('vehicle-type.cab.index')->middleware('can:vehicle_type.index');
    Route::get('vehicle-type/cab/create', 'VehicleTypeController@cabCreate')->name('vehicle-type.cab.create')->middleware('can:vehicle_type.create');

    Route::get('vehicle-type/{vehicleType}/parcel/edit', 'VehicleTypeController@parcelEdit')->name('vehicle-type.parcel.edit')->middleware('can:vehicle_type.edit');
    Route::get('vehicle-type/parcel', 'VehicleTypeController@parcelIndex')->name('vehicle-type.parcel.index')->middleware('can:vehicle_type.index');
    Route::get('vehicle-type/parcel/create', 'VehicleTypeController@parcelCreate')->name('vehicle-type.parcel.create')->middleware('can:vehicle_type.create');

    Route::get('vehicle-type/{vehicleType}/freight/edit', 'VehicleTypeController@freightEdit')->name('vehicle-type.freight.edit')->middleware('can:vehicle_type.edit');
    Route::get('vehicle-type/freight', 'VehicleTypeController@freightIndex')->name('vehicle-type.freight.index')->middleware('can:vehicle_type.index');
    Route::get('vehicle-type/freight/create', 'VehicleTypeController@freightCreate')->name('vehicle-type.freight.create')->middleware('can:vehicle_type.create');

    Route::get('vehicle-type/{vehicleType}/finddriver/edit', 'VehicleTypeController@finddriverEdit')->name('vehicle-type.finddriver.edit')->middleware('can:vehicle_type.edit');
    Route::get('vehicle-type/finddriver', 'VehicleTypeController@finddriverIndex')->name('vehicle-type.finddriver.index')->middleware('can:vehicle_type.index');
    Route::get('vehicle-type/finddriver/create', 'VehicleTypeController@finddriverCreate')->name('vehicle-type.finddriver.create')->middleware('can:vehicle_type.create');

    Route::resource('vehicle-type', 'VehicleTypeController', ['except' => ['index','show', 'destroy', 'create','edit']]);

    // Vehicle Types Zone Pricing
    Route::resource('vehicle-type-zones', 'VehicleTypeController', ['except' => ['show', 'update', 'destroy']]);
    Route::get('vehicle-type-zone/{vehicleTypeId}', 'VehicleTypeZoneController@index')->name('vehicle-type-zone.index')->middleware('can:vehicle_type.index');
    Route::get('/vehicle-type-zones/{vehicleTypeId}/{zoneId}', 'VehicleTypeZoneController@vehicleZonePriceShow')->name('vehicle-type-zones.show')->middleware('can:vehicle_type.index');
    Route::post('/vehicle-type-zones', 'VehicleTypeZoneController@vehicleZonePriceStore')->name('vehicle-type-zones.store')->middleware('can:vehicle_type.create');
    Route::put('/vehicle-type-zones/{vehicleTypeZone}', 'VehicleTypeZoneController@vehicleZonePriceUpdate')->name('vehicle-type-zones.update')->middleware('can:vehicle_type.edit');

    // Vehicle Type Zone Incentive Management
    Route::get('/vehicle-type-zones/incentive-data', 'VehicleTypeZoneController@getIncentiveData')->name('vehicle-type-zones.incentive-data')->middleware('can:vehicle_type.index');
    Route::post('/vehicle-type-zones/save-incentive-configuration', 'VehicleTypeZoneController@saveIncentiveConfiguration')->name('vehicle-type-zones.save-incentive-configuration')->middleware('can:vehicle_type.edit');
    Route::delete('/vehicle-type-zones/delete-incentive-level', 'VehicleTypeZoneController@deleteIncentiveLevel')->name('vehicle-type-zones.delete-incentive-level')->middleware('can:vehicle_type.edit');

    // Vehicle Surge Price
    Route::resource('vehicle-surge-prices', 'VehicleSurgePriceController', ['except' => ['show', 'update', 'destroy']]);
    Route::get('vehicle-surge-price/{vehicleTypeId}', 'VehicleSurgePriceController@index')->name('vehicle-surge-price.index')->middleware('can:vehicle_type.index');
    Route::get('/vehicle-surge-price/{vehicleTypeId}/{zoneId}', 'VehicleSurgePriceController@vehicleSurgePriceShow')->name('vehicle-surge-prices.show')->middleware('can:vehicle_type.index');
    Route::put('/vehicle-surge-price/{vehicleSurgePrice}', 'VehicleSurgePriceController@vehicleSurgePriceUpdate')->name('vehicle-surge-prices.update')->middleware('can:vehicle_type.edit');

    // Hourly Packages
    Route::resource('hourly-package', 'HourlyPackageController', ['except' => ['show', 'destroy']]);

    // Documents
    Route::resource('document', 'DocumentController', ['except' => ['show', 'destroy']]);
    Route::put('document/status/{id}', 'DocumentController@status')->name('document.status')->middleware('can:document.edit');

    // Coupons
    Route::resource('coupon', 'CouponController', ['except' => ['show', 'destroy']]);
    Route::put('coupon/status/{id}', 'CouponController@status')->name('coupon.status')->middleware('can:coupon.edit');

    // SOS
    Route::resource('sos', 'SOSController', ['except' => ['show', 'destroy', 'update', 'edit']]);
    Route::put('sos/{sos}', 'SOSController@update')->name('sos.update');
    Route::get('sos/{sos}/edit', 'SOSController@edit')->name('sos.edit');
    Route::put('sos/status/{id}', 'SOSController@status')->name('sos.status')->middleware('can:sos.edit');
    Route::delete('sos/destroy/{sos}', 'SOSController@destroy')->name('sos.destroy')->middleware('can:sos.destroy');
    Route::patch('sos/restore/{id}', 'SOSController@restore')->name('sos.restore')->middleware('can:sos.restore');
    Route::delete('sos/force-delete/{id}', 'SOSController@forceDelete')->name('sos.forceDelete')->middleware('can:sos.edit');

    // SOS Alert
    Route::resource('sos-alerts', 'SOSAlertController');
    Route::post('sos-alerts/{id}/update-status', 'SOSAlertController@updateStatus')->name('sos-alerts.update-status');

    // Setting
    Route::resource('taxido-setting', 'SettingController');

    Route::get('rider-registration-unlock','RiderRegistrationUnlockController@index')->name('rider-registration-unlock.index')->middleware('can:rider.edit');
    Route::post('rider-registration-unlock','RiderRegistrationUnlockController@unlock')->name('rider-registration-unlock.update')->middleware(['can:rider.edit','demo']);

    // Riders
    Route::resource('rider', 'RiderController', ['except' => ['destroy']]);
    Route::put('rider/status/{id}', 'RiderController@status')->name('rider.status')->middleware('can:rider.edit');
    Route::delete('delete-riders', 'RiderController@deleteRows')->name('delete.riders');

    // Dispatchers
    Route::resource('dispatcher', 'DispatcherController', ['except' => ['destroy']]);
    Route::put('dispatcher/status/{id}', 'DispatcherController@status')->name('dispatcher.status')->middleware('can:dispatcher.edit');

    // Fleet Manager
    Route::resource('fleet-manager', 'FleetManagerController', options: ['except' => ['destroy']]);
    Route::get('unverified-fleet-managers', 'FleetManagerController@getUnverifiedFleetManagers')->name('fleet-manager.unverified.index')->middleware('can:fleet_manager.index');
    Route::put('fleet-manager/status/{id}', 'FleetManagerController@status')->name('fleet-manager.status')->middleware('can:fleet_manager.edit');
    Route::put('fleet-manager/verify/{id}', 'FleetManagerController@verify')->name('fleet-manager.verify');

    // Fleet Wallet
    Route::resource('fleet-wallet', 'FleetWalletController', ['except' => ['show', 'destroy']]);
    Route::post('update/fleet-wallet', 'FleetWalletController@updateBalance')->name('fleet-wallet.update.balance');
    Route::post('credit/fleet-wallet', 'FleetWalletController@credit')->name('fleet-wallet.credit');
    Route::post('debit/fleet-wallet', 'FleetWalletController@debit')->name('fleet-wallet.debit');

    // Rider Wallet
    Route::resource('rider-wallet', 'RiderWalletController', ['except' => ['show', 'destroy']]);
    Route::post('update/rider-wallet', 'RiderWalletController@updateBalance')->name('rider-wallet.update.balance');
    Route::post('credit/rider-wallet', 'RiderWalletController@credit')->name('rider-wallet.credit');
    Route::post('debit/rider-wallet', 'RiderWalletController@debit')->name('rider-wallet.debit');

    // Rider Reviews
    Route::apiResource('rider-review', 'RiderReviewController', ['except' => ['destroy']]);
    Route::delete('rider-review/destroy/{rider_review}', 'RiderReviewController@destroy')->name('rider-review.destroy')->middleware('can:rider_review.destroy');
    Route::patch('rider-review/restore/{id}', 'RiderReviewController@restore')->name('rider-review.restore')->middleware('can:rider_review.restore');
    Route::delete('rider-review/force-delete/{id}', 'RiderReviewController@forceDelete')->name('rider-review.forceDelete')->middleware('can:rider_review.forceDelete');

    // Drivers
    Route::get('driver/export', 'DriverController@export')->name('driver.export')->middleware('can:driver.index');
    Route::resource('driver', 'DriverController', ['except' => ['destroy']]);
    Route::put('driver/update-location/{id}', 'DriverController@updateLocation')->name('driver.update-location')->middleware('can:driver.edit');
    Route::get('unverified-drivers', 'DriverController@getUnverifiedDrivers')->name('driver.unverified-drivers')->middleware('can:driver.index');
    Route::put('driver/status/{id}', 'DriverController@status')->name('driver.status')->middleware('can:driver.edit');
    Route::put('driver/verify/{id}', 'DriverController@verify')->name('driver.verify');
    Route::get('driver/document/{id}', 'DriverController@driverDocument')->name('driver.document');

    // Driver Documents
    Route::resource('driver-document', 'DriverDocumentController', ['except' => ['show', 'destroy']]);
    Route::put('driver-document/status/{id}', 'DriverDocumentController@status')->name('driver-document.status')->middleware('can:driver_document.edit');
    Route::get('driver-document/get-detail', 'DriverDocumentController@getDetail')->name('driver-document.getDetail');
    Route::put('driver-document/update-status/{id}', 'DriverDocumentController@updateStatus')->name('driver-document.updateStatus');

    // Fleet Documents
    Route::resource('fleet-document', 'FleetDocumentController', ['except' => ['show', 'destroy']]);
    Route::put('fleet-document/status/{id}', 'FleetDocumentController@status')->name('fleet-document.status')->middleware('can:fleet_document.edit');
    Route::get('fleet-document/get-detail', 'FleetDocumentController@getDetail')->name('fleet-document.getDetail');
    Route::put('fleet-document/update-status/{id}', 'FleetDocumentController@updateStatus')->name('fleet-document.updateStatus');

    // Fleet Vehicle Documents
    Route::resource('vehicleInfoDoc', 'VehicleInfoDocController', ['except' => ['show', 'destroy']]);
    Route::put('vehicleInfoDoc/status/{id}', 'VehicleInfoDocController@status')->name('vehicleInfoDoc.status')->middleware('can:fleet_vehicle_document.edit');
    Route::get('vehicleInfoDoc/get-detail', 'VehicleInfoDocController@getDetail')->name('vehicleInfoDoc.getDetail');
    Route::put('vehicleInfoDoc/update-status/{id}', 'VehicleInfoDocController@updateStatus')->name('vehicleInfoDoc.updateStatus');

    // Driver Rules
    Route::resource('driver-rule', 'DriverRuleController', ['except' => ['show', 'destroy']]);

    // Fleet Vehicles (Vehicle Info)
    Route::resource('vehicle-info', 'VehicleInfoController', ['except' => ['show', 'destroy']]);
    Route::delete('vehicle-info/destroy/{vehicle_info}', 'VehicleInfoController@destroy')->name('vehicle-info.destroy')->middleware('can:vehicle_info.destroy');
    Route::put('vehicle-info/verify/{id}', 'VehicleInfoController@verify')->name('vehicleInfo.verify');
    Route::get('vehicle-info/document/{id}', 'VehicleInfoController@vehicleInfoDocument')->name('vehicleInfo.document');
    Route::patch('vehicle-info/restore/{id}', 'VehicleInfoController@restore')->name('vehicle-info.restore')->middleware('can:vehicle_info.restore');
    Route::delete('vehicle-info/force-delete/{id}', 'VehicleInfoController@forceDelete')->name('vehicle-info.forceDelete')->middleware('can:vehicle_info.forceDelete');

    Route::get('vehicle-info/verified', 'VehicleInfoController@index')->name('vehicle-info.verified')->middleware('can:vehicle_info.index');
    Route::get('vehicle-info/unverified', 'VehicleInfoController@getUnverifiedVehicles')->name('vehicle-info.unverified')->middleware('can:vehicle_info.index');
    Route::put('driver-rule/status/{id}', 'DriverRuleController@status')->name('driver-rule.status')->middleware('can:driver_rule.edit');

    // Plans
    Route::resource('plan', 'PlanController', ['except' => ['show', 'destroy']]);
    Route::put('plan/status/{id}', 'PlanController@status')->name('plan.status')->middleware('can:plan.edit');

    // Surge Price
    Route::resource('surge-price', 'SurgePriceController', ['except' => ['show', 'destroy']]);
    Route::put('surge-price/status/{id}', 'SurgePriceController@status')->name('surge-price.status')->middleware('can:surge_price.edit');

    // Airport
    Route::resource('airport', 'AirportController', ['except' => ['show', 'destroy']]);
    Route::put('airport/status/{id}', 'AirportController@status')->name('airport.status')->middleware('can:airport.edit');

    // Extra Charges
    Route::resource('extra-charge', 'ExtraChargeController', ['except' => ['show', 'destroy']]);
    Route::put('extra-charge/status/{id}', 'ExtraChargeController@status')->name('extra-charge.status')->middleware('can:extra_charge.edit');
    Route::delete('extra-charge/destroy/{extra_charge}', 'ExtraChargeController@destroy')->name('extra-charge.destroy')->middleware('can:extra_charge.destroy');
    Route::patch('extra-charge/restore/{id}', 'ExtraChargeController@restore')->name('extra-charge.restore')->middleware('can:extra_charge.restore');
    Route::delete('extra-charge/force-delete/{id}', 'ExtraChargeController@forceDelete')->name('extra-charge.forceDelete')->middleware('can:extra_charge.forceDelete');

    // Driver Locations
    Route::get('driver-location', 'DriverController@driverLocation')->name('driver-location.index')->middleware('can:driver_location.index');

    // Notice
    Route::resource('notice', 'NoticeController', ['except' => ['show', 'destroy']]);
    Route::put('notice/status/{id}', 'NoticeController@status')->name('notice.status')->middleware('can:notice.edit');
    Route::delete('notice/destroy/{notice}', 'NoticeController@destroy')->name('notice.destroy')->middleware('can:notice.destroy');
    Route::patch('notice/restore/{id}', 'NoticeController@restore')->name('notice.restore')->middleware('can:notice.restore');
    Route::delete('notice/force-delete/{id}', 'NoticeController@forceDelete')->name('notice.forceDelete')->middleware('can:notice.forceDelete');

    // Driver Wallet
    Route::resource('driver-wallet', 'DriverWalletController', ['except' => ['show', 'destroy']]);
    Route::post('update/driver-wallet', 'DriverWalletController@updateBalance')->name('driver-wallet.update.balance');
    Route::post('credit/driver-wallet', 'DriverWalletController@credit')->name('driver-wallet.credit');
    Route::post('debit/driver-wallet', 'DriverWalletController@debit')->name('driver-wallet.debit');

    // Driver Reviews
    Route::apiResource('driver-review', 'DriverReviewController', ['except' => ['destroy']]);
    Route::delete('driver-review/destroy/{driver_review}', 'DriverReviewController@destroy')->name('driver-review.destroy')->middleware('can:driver_review.destroy');
    Route::patch('driver-review/restore/{id}', 'DriverReviewController@restore')->name('driver-review.restore')->middleware('can:driver_review.restore');
    Route::delete('driver-review/force-delete/{id}', 'DriverReviewController@forceDelete')->name('driver-review.forceDelete')->middleware('can:driver_review.forceDelete');

    // Withdraw Requests
    Route::get('withdraw-request/export', 'WithdrawRequestController@export')->name('withdraw-request.export');
    Route::resource('withdraw-request', 'WithdrawRequestController', ['except' => ['destroy']]);

    // Fleet Withdraw Requests
    Route::resource('fleet-withdraw-request', 'FleetWithdrawRequestController', ['except' => ['destroy']]);

    // Commission history
    Route::resource('cab-commission-history', 'CabCommissionHistoryController', ['only' => ['index']]);

    // Rides
    Route::resource('ride', 'RideController', ['except' => ['show', 'destroy']]);
    Route::get('ride/details/{ride_number}', 'RideController@details')->name('ride.details')->middleware('can:ride.index');
    Route::post('ride/{ride}/cancel', 'RideController@cancel')->name('ride.cancel')->middleware('can:ride.edit');
    Route::get('ride/status/{status}', 'RideController@getRidesByStatus')->name('ride.status.filter')->middleware('can:ride.index');
    Route::get('ride/export', 'RideController@export')->name('ride.export')->middleware('can:ride.index');

    // Ride Requests
    Route::resource('ride-request', 'RideRequestController', ['except' => ['show', 'destroy']]);
    Route::get('ride-request/live-notifications', 'RideRequestNotificationController@index')->name('ride-request.live-notifications')->middleware('can:ride_request.index');
    Route::post('ride-request/live-notifications/{rideRequestId}/assign', 'RideRequestNotificationController@assign')->name('ride-request.live-notifications.assign')->middleware('can:ride_request.edit');
    Route::post('ride-request/live-notifications/{rideRequestId}/decline', 'RideRequestNotificationController@decline')->name('ride-request.live-notifications.decline')->middleware('can:ride_request.edit');
    Route::get('/fetch-drivers/{lat}/{lng}/{serviceId?}/{serviceCategoryId?}/{vehicleTypeId?}', 'RideRequestController@fetchDrivers')->name('fetch-drivers');
    Route::get('ride-request/details/{id}', 'RideRequestController@details')->name('ride-request.details')->middleware('can:ride_request.index');

    // SOS Requests
    Route::resource('sos-request', 'SosController', ['except' => ['show', 'destroy']]);

    // Cancellation Reason
    Route::resource('cancellation-reason', 'CancellationReasonController', ['except' => ['show', 'destroy']]);
    Route::put('cancellation-reason/status/{id}', 'CancellationReasonController@status')->name('cancellation-reason.status')->middleware('can:cancellation_reason.edit');

    // Driver Reports
    Route::get('driver-report', 'DriverReportController@index')->name('driver-report.index')->middleware('can:report.index');
    Route::post('driver-report/filter', 'DriverReportController@filter')->name('driver-report.filter')->middleware('can:report.index');
    Route::post('driver-report/export', 'DriverReportController@export')->name('driver-report.export')->middleware('can:report.index');

    // Ride Reports
    Route::get('ride-report', 'RideReportController@index')->name('ride-report.index');
    Route::post('ride-report/filter', 'RideReportController@filter')->name('ride-report.filter')->middleware('can:report.index');
    Route::post('ride-report/export', 'RideReportController@export')->name('ride-report.export')->middleware('can:report.index');

    // Coupon Reports
    Route::get('coupon-report', 'CouponReportController@index')->name('coupon-report.index')->middleware('can:report.index');
    Route::post('coupon-report/filter', 'CouponReportController@filter')->name('coupon-report.filter')->middleware('can:report.index');
    Route::post('coupon-report/export', 'CouponReportController@export')->name('coupon-report.export')->middleware('can:report.index');

    // Zone Reports
    Route::get('zone-report', 'ZoneReportController@index')->name('zone-report.index')->middleware('can:report.index');
    Route::post('zone-report/filter', 'ZoneReportController@filter')->name('zone-report.filter')->middleware('can:report.index');
    Route::post('zone-report/export', 'ZoneReportController@export')->name('zone-report.export')->middleware('can:report.index');

    // Incentive Reports
    Route::get('incentive-report', 'IncentiveReportController@index')->name('incentive-report.index')->middleware('can:report.index');
    Route::post('incentive-report/filter', 'IncentiveReportController@filter')->name('incentive-report.filter')->middleware('can:report.index');
    Route::post('incentive-report/export', 'IncentiveReportController@export')->name('incentive-report.export')->middleware('can:report.index');
    Route::post('incentive-report/analytics', 'IncentiveReportController@analytics')->name('incentive-report.analytics')->middleware('can:report.index');

    // Transaction Reports
    Route::get('transaction-report', 'TransactionReportController@index')->name('transaction-report.index')->middleware('can:report.index');
    Route::post('transaction-report/filter', 'TransactionReportController@filter')->name('transaction-report.filter')->middleware('can:report.index');
    Route::post('transaction-report/export', 'TransactionReportController@export')->name('transaction-report.export')->middleware('can:report.index');

    // Push Notification
    Route::resource('push-notification', 'PushNotificationController');
    Route::post('send-notification', 'PushNotificationController@sendNotification')->name('send-notification');
    Route::delete('push-notification/force-delete/{push_notification}', 'PushNotificationController@forceDelete')->name('pushNotification.forceDelete')->middleware('can:push_notification.forceDelete');
    Route::delete('push-notification/destroy/{push_notification}', 'PushNotificationController@destroy')->name('pushNotification.destroy')->middleware('can:push_notification.destroy');

    // Rental Vehicle
    Route::resource('rental-vehicle', 'RentalVehicleController', ['except' => ['destroy']]);
    Route::get('rental-vehicle/get-vehicle-zones/{vehicleId?}', 'RentalVehicleController@getVehicleZones')->name('rental-vehicle.getVehicleZones');
    Route::put('rental-vehicle/status/{id}', 'RentalVehicleController@status')->name('rental-vehicle.status')->middleware('can:rental_vehicle.edit');
    Route::get('rental-vehicle/filter/{vehicleId?}', 'RentalVehicleController@RentalVehicleFilter')->name('rental-vehicle.filter')->middleware('can:rental_vehicle.index');

    // Driver Subscription
    Route::resource('driver-subscription', 'DriverSubscriptionController');

    // Heat Map
    Route::get('heat-map', 'RideRequestController@showHeatMap')->name('heat-map');

    // Peak Zone Map
    Route::resource('peakZone', 'PeakZoneController', ['except' => ['show', 'destroy']])->middleware('can:peak_zone.index');
    Route::get('peakZoneMap', 'PeakZoneMapController@index')->name('peakZoneMap.index')->middleware('can:peak_zone.index');


    // Ambulance
    Route::resource('ambulance', 'AmbulanceController', ['only' => ['index']]);

    // Referral
    Route::get('referral', 'ReferralController@index')->name('referral.index')->middleware('can:cab_referral.index');
  });
});
