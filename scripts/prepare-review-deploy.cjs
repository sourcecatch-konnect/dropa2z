const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../Taxido_laravel');
const changes=[];
const file=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const patch=(p,oldText,newText)=>changes.push({path:p,old:oldText,new:newText});
for(const name of ['RideRequest','Ride']){
 const p=`Modules/Taxido/app/Models/${name}.php`;
 patch(p,"        'description',","        'description',\n        'delivery_details',");
 patch(p,"        'parcel_receiver' => 'json',","        'parcel_receiver' => 'json',\n        'delivery_details' => 'array',");
}
const requestPath='Modules/Taxido/app/Http/Requests/Api/CreateRideRequest.php';
patch(requestPath,'use Illuminate\\Contracts\\Validation\\Validator;','use Illuminate\\Contracts\\Validation\\Validator;\nuse Illuminate\\Validation\\Rule;\nuse Modules\\Taxido\\Services\\DeliveryBookingDetails;');
const request=file(requestPath),start=request.indexOf("            'delivery_details' =>"),end=request.indexOf("            'preferences.*'",start);
patch(requestPath,"            'description' => ['nullable'],", "            'description' => ['nullable'],\n"+request.slice(start,end).trimEnd());
patch('Modules/Taxido/app/Http/Traits/RideRequestTrait.php',"                            'description' => $request->description,","                            'description' => $request->description,\n                            'delivery_details' => $request->input('delivery_details'),");
patch('Modules/Taxido/app/Http/Traits/RideTrait.php',"                    'description' => $rideRequest?->description,","                    'description' => $rideRequest?->description,\n                    'delivery_details' => $rideRequest?->delivery_details,");
for(const name of ['RideDetailResource','RideResource'])patch(`Modules/Taxido/app/Http/Resources/${name}.php`,"            'parcel_receiver' => $this->parcel_receiver,","            'parcel_receiver' => $this->parcel_receiver,\n            'delivery_details' => $this->delivery_details ? ['goods_type' => $this->delivery_details['goods_type'] ?? null] : null,");
patch('Modules/Taxido/app/Http/Resources/Drivers/RideRequestResource.php',"      'parcel_receiver' => $this->parcel_receiver,","      'parcel_receiver' => $this->parcel_receiver,\n      'goods_type' => $this->delivery_details['goods_type'] ?? null,");
const invoicePath='Modules/Taxido/resources/views/emails/rider-invoice.blade.php',invoice=file(invoicePath),invoiceStart=invoice.indexOf("                    @if (!empty($ride->delivery_details['gstin']))"),invoiceEnd=invoice.indexOf('                    @if ($ride->additional_distance_charge > 0)',invoiceStart);
patch(invoicePath,'                    @if ($ride->additional_distance_charge > 0)',invoice.slice(invoiceStart,invoiceEnd)+'                    @if ($ride->additional_distance_charge > 0)');
const newFiles=['Modules/Taxido/app/Services/DeliveryBookingDetails.php','Modules/Taxido/database/migrations/2026_11_04_000001_add_delivery_details_to_booking_records.php','tests/Unit/DeliveryBookingDetailsTest.php'].map(p=>({path:p,content:file(p)}));
const stageFiles=[requestPath,'Modules/Taxido/app/Models/Ride.php','Modules/Taxido/app/Models/RideRequest.php'].map(p=>({path:p,content:file(p)}));
console.log(JSON.stringify({changes,newFiles,stageFiles}));
