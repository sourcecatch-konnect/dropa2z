<?php
namespace Modules\Taxido\Services;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RiderDeletionPolicy
{
    private const TABLE='rider_deletion_restrictions';
    public static function identities(?string $email, $phone=null, $countryCode='91'): array
    {
        $values=[];$email=strtolower(trim((string)$email));
        if(filter_var($email,FILTER_VALIDATE_EMAIL))$values['email']=$email;
        $digits=preg_replace('/\D/','',(string)$phone);$code=preg_replace('/\D/','',(string)$countryCode) ?: '91';
        if(strlen($digits)===10)$digits=$code.$digits;
        if(strlen($digits)>=11&&strlen($digits)<=15)$values['phone']=$digits;
        $keys=[];foreach($values as $type=>$value)$keys[hash_hmac('sha256','rider:'.$type.':'.$value,(string)config('app.key'))]=$type;
        ksort($keys);return $keys;
    }
    public static function preview($user): array
    {
        $keys=array_keys(self::identities($user->email,$user->phone,$user->country_code));
        $count=Schema::hasTable(self::TABLE)?(int)DB::table(self::TABLE)->whereIn('identity_hash',$keys)->max('deletion_count'):0;
        return ['completed_deletions'=>$count,'requires_admin_after_deletion'=>$count>=1,'limit'=>2];
    }
    public static function assertRegistrationAllowed(?string $email,$phone=null,$countryCode='91'): void
    {
        if(!Schema::hasTable(self::TABLE))return;
        $keys=array_keys(self::identities($email,$phone,$countryCode));
        if(DB::table(self::TABLE)->whereIn('identity_hash',$keys)->whereNotNull('blocked_at')->exists()){
            throw new Exception('This contact has reached the two-account-deletion limit. Please contact Dropa2z Admin to unlock registration.',403);
        }
    }
    public static function record($user): void
    {
        $keys=self::identities($user->email,$user->phone,$user->country_code);
        foreach($keys as $hash=>$type){
            DB::table(self::TABLE)->insertOrIgnore(['identity_hash'=>$hash,'identity_type'=>$type,'deletion_count'=>0,'created_at'=>now(),'updated_at'=>now()]);
        }
        $rows=DB::table(self::TABLE)->whereIn('identity_hash',array_keys($keys))->orderBy('identity_hash')->lockForUpdate()->get();
        $count=(int)$rows->max('deletion_count')+1;$related=array_keys($keys);
        foreach($rows as $row)$related=array_merge($related,json_decode($row->related_hashes ?: '[]',true) ?: []);
        DB::table(self::TABLE)->whereIn('identity_hash',array_keys($keys))->update(['deletion_count'=>$count,'related_hashes'=>json_encode(array_values(array_unique($related))),'blocked_at'=>$count>=2?now():null,'updated_at'=>now()]);
    }
    public static function lookup(string $identity): array
    {
        $keys=array_keys(filter_var(trim($identity),FILTER_VALIDATE_EMAIL)?self::identities($identity):self::identities(null,$identity));
        $rows=DB::table(self::TABLE)->whereIn('identity_hash',$keys)->get();
        return ['found'=>$rows->isNotEmpty(),'deletion_count'=>(int)$rows->max('deletion_count'),'blocked'=>$rows->contains(fn($row)=>$row->blocked_at!==null)];
    }
    public static function unlock(string $identity,int $adminId): int
    {
        return DB::transaction(function()use($identity,$adminId){
            $keys=array_keys(filter_var(trim($identity),FILTER_VALIDATE_EMAIL)?self::identities($identity):self::identities(null,$identity));
            $matches=DB::table(self::TABLE)->whereIn('identity_hash',$keys)->lockForUpdate()->get();
            foreach($matches as $row)$keys=array_merge($keys,json_decode($row->related_hashes ?: '[]',true) ?: []);
            return DB::table(self::TABLE)->whereIn('identity_hash',array_unique($keys))->update(['blocked_at'=>null,'unblocked_at'=>now(),'unblocked_by'=>$adminId,'updated_at'=>now()]);
        });
    }
}
