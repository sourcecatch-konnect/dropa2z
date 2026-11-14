import base64, gzip, json, os, pathlib, shutil, subprocess, sys, time

APP=pathlib.Path('/home/dropa2z/public_html')
STAGE=pathlib.Path('/home/dropa2z/nov6-driver-flow-stage')
PHP='/opt/cpanel/ea-php83/root/usr/bin/php'
files=json.loads(gzip.decompress(base64.b64decode((STAGE/'bundle.b64').read_text())).decode())
for relative, content in files.items():
    target=(STAGE/relative).resolve()
    if not str(target).startswith(str(STAGE)+'/'): raise RuntimeError('Invalid stage path')
    target.parent.mkdir(parents=True,exist_ok=True); target.write_text(content)
    if relative.endswith('.php') and not relative.endswith('.blade.php'):
        subprocess.check_call([PHP,'-l',str(target)],stdout=subprocess.DEVNULL)

service='Modules/Taxido/app/Services/DriverTrainingService.php'
bootstrap=STAGE/'unit-bootstrap.php'
bootstrap.write_text("<?php require '"+str(APP/ 'vendor/autoload.php')+"'; require '"+str(STAGE/service)+"';")
subprocess.check_call([PHP,str(APP/'vendor/bin/phpunit'),'--bootstrap',str(bootstrap),str(STAGE/'tests/Unit/DriverTrainingProgressTest.php')],cwd=str(APP))

changes={}
def patch(relative, old, new):
    text=changes.get(relative,(APP/relative).read_text())
    if new in text: changes[relative]=text; return
    if text.count(old)!=1: raise RuntimeError('Preflight mismatch: '+relative+' '+old[:90])
    changes[relative]=text.replace(old,new,1)

prefix='Modules/Taxido/'
patch(prefix+'app/Http/Resources/RideResource.php',"'driver_profile_image_url' => $this->driver?->profile_image?->original_url,","'driver_profile_image_url' => $this->driver?->profile_image?->original_url,\n                'profile_image_url' => $this->driver?->profile_image?->original_url,")
patch(prefix+'app/Http/Resources/RideResource.php',"'country_code' => $this->rider['country_code'] ?? null,","'country_code' => $this->rider['country_code'] ?? null,\n                'profile_image_url' => $this->rider?->profile_image?->original_url,")
for resource in ['RideResource.php','RideDetailResource.php']:
    patch(prefix+'app/Http/Resources/'+resource,"['goods_type' => $this->delivery_details['goods_type'] ?? null]","['goods_type' => $this->delivery_details['goods_type'] ?? null, 'vehicle_choice' => $this->delivery_details['vehicle_choice'] ?? null]")
patch(prefix+'app/Http/Resources/Drivers/RideRequestResource.php',"'goods_type' => $this->delivery_details['goods_type'] ?? null,","'goods_type' => $this->delivery_details['goods_type'] ?? null,\n      'delivery_details' => $this->delivery_details ? ['goods_type' => $this->delivery_details['goods_type'] ?? null, 'vehicle_choice' => $this->delivery_details['vehicle_choice'] ?? null] : null,")
patch(prefix+'app/Http/Resources/Drivers/DriverSelfResource.php',"'is_verified' => $this->is_verified,","'is_verified' => $this->is_verified,\n            'training' => \\Modules\\Taxido\\Services\\DriverTrainingService::status((int) $this->id),")
patch(prefix+'app/Repositories/Api/DriverRepository.php',"$is_online = $request->input('is_online');","$is_online = $request->input('is_online');\n            if (filter_var($is_online, FILTER_VALIDATE_BOOLEAN)) {\n                \\Modules\\Taxido\\Services\\DriverTrainingService::assertCanGoOnline($driver);\n            }")
needle="$driverIds = Driver::whereNull('deleted_at')->where('is_verified', true)->where('status', true);"
patch(prefix+'app/Http/Traits/RideRequestTrait.php',needle,needle+"\n                    if (\\Illuminate\\Support\\Facades\\Schema::hasTable('driver_training_progress')) {\n                        $driverIds->whereNotIn('id', \\Illuminate\\Support\\Facades\\DB::table('driver_training_progress')->where('is_required', true)->whereNull('completed_at')->select('driver_id'));\n                    }")
patch(prefix+'routes/api/api.php',"Route::get('driver/self', 'DriverAuthController@self');","Route::get('driver/self', 'DriverAuthController@self');\n        Route::get('driver/training', 'DriverTrainingController@show');\n        Route::post('driver/training/step', 'DriverTrainingController@advance')->middleware('throttle:60,1');")
patch(prefix+'app/Http/Requests/Api/CreateRideRequest.php',"'array:goods_type,gstin,business_name,restricted_items_confirmed'","'array:goods_type,gstin,business_name,restricted_items_confirmed,vehicle_choice'")
patch(prefix+'app/Http/Requests/Api/CreateRideRequest.php',"'delivery_details.goods_type' =>","'delivery_details.vehicle_choice' => ['nullable', Rule::in(['scooter'])],\n            'delivery_details.goods_type' =>")
blade=prefix+'resources/views/admin/driver/details.blade.php'
patch(blade,'$settings = getTaxidoSettings();',"$settings = getTaxidoSettings();\n        $training = \\Modules\\Taxido\\Services\\DriverTrainingService::status((int) $driver->id);")
local_blade=files[blade]
marker='<p class="mt-2 mb-2">Driver training:'
addition=local_blade[local_blade.index(marker):local_blade.index('</p>',local_blade.index(marker))+4]
patch(blade,'<h5>{{ $driver?->name }}</h5>','<h5>{{ $driver?->name }}</h5>\n'+addition)

for relative,content in changes.items():
    staged=STAGE/relative; staged.parent.mkdir(parents=True,exist_ok=True); staged.write_text(content)
    if not relative.endswith('.blade.php'): subprocess.check_call([PHP,'-l',str(staged)],stdout=subprocess.DEVNULL)

backup=pathlib.Path('/home/dropa2z/nov6-driver-flow-backup-'+time.strftime('%Y%m%d-%H%M%S'))
backup.mkdir(mode=0o700)
new_files=[service,prefix+'app/Http/Controllers/Api/DriverTrainingController.php','database/migrations/2026_11_06_160000_create_driver_training_progress_table.php','tests/Unit/DriverTrainingProgressTest.php']
for relative in list(changes)+new_files:
    target=APP/relative
    if target.exists():
        saved=backup/relative;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(str(target),str(saved))

migration=new_files[2]
shutil.copy2(str(STAGE/migration),str(APP/migration))
subprocess.check_call([PHP,'artisan','migrate','--force','--path='+migration],cwd=str(APP))
for relative in new_files+list(changes):
    target=APP/relative;target.parent.mkdir(parents=True,exist_ok=True)
    temporary=target.with_name(target.name+'.nov6-stage')
    shutil.copy2(str(STAGE/relative),str(temporary));os.replace(str(temporary),str(target))

settings=STAGE/'minimum-setting.php'
settings.write_text("""<?php
require '/home/dropa2z/public_html/vendor/autoload.php';
$app=require '/home/dropa2z/public_html/bootstrap/app.php';$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
Illuminate\\Support\\Facades\\DB::transaction(function(){
 $row=Modules\\Taxido\\Models\\TaxidoSetting::lockForUpdate()->firstOrFail();$values=$row->cabbooking_values;
 file_put_contents('"""+str(backup)+"""/wallet-setting-before.json',json_encode(['driver_min_wallet_balance'=>$values['wallet']['driver_min_wallet_balance']??null,'allow_negative_balance'=>$values['activation']['allow_negative_balance']??null]));
 $values['wallet']['driver_min_wallet_balance']=10;$row->cabbooking_values=$values;$row->save();
 echo json_encode(['minimum'=>$values['wallet']['driver_min_wallet_balance'],'allow_negative'=>$values['activation']['allow_negative_balance']??null]).PHP_EOL;
});
""")
subprocess.check_call([PHP,str(settings)],cwd=str(APP))
subprocess.check_call([PHP,'artisan','route:clear'],cwd=str(APP))
subprocess.check_call([PHP,'artisan','view:clear'],cwd=str(APP))
subprocess.check_call([PHP,'artisan','queue:restart'],cwd=str(APP))
print('Deployed with backup: '+str(backup))
