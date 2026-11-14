<?php
namespace Modules\Taxido\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Taxido\Services\DeliveryServiceCards;
class DeliveryServiceCardController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['zone_id'=>'nullable|integer|min:1']);
        return response()->json(['data'=>DeliveryServiceCards::catalog($request->integer('zone_id') ?: null)]);
    }
}
