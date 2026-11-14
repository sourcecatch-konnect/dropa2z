<?php
namespace Modules\Taxido\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Taxido\Services\RiderDeletionPolicy;
class RiderRegistrationUnlockController extends Controller
{
    public function index(Request $request)
    {
        $identity=trim((string)$request->input('identity',''));$result=null;
        if($identity!==''){$request->validate(['identity'=>'required|string|max:255']);$result=RiderDeletionPolicy::lookup($identity);}
        return view('taxido::admin.rider.registration-unlock',compact('identity','result'));
    }
    public function unlock(Request $request)
    {
        $request->validate(['identity'=>'required|string|max:255']);
        $count=RiderDeletionPolicy::unlock($request->identity,(int)auth()->id());
        return redirect()->route('admin.rider-registration-unlock.index',['identity'=>$request->identity])
            ->with('success',$count?'Registration unlocked. This does not restore the deleted account.':'No deletion restriction was found for that contact.');
    }
}
