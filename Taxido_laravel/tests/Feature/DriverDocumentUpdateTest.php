<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Taxido\Http\Controllers\Api\DriverAuthController;
use Modules\Taxido\Models\Document;
use Modules\Taxido\Models\DriverDocument;
use Modules\Taxido\Models\FleetDocument;
use PHPUnit\Framework\TestCase;

class DriverDocumentUpdateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Event::fake(); Mail::fake(); Notification::fake(); Queue::fake();
        config(['media-library.disk_name'=>'dropa2z-document-tests']);
        config(['filesystems.disks.dropa2z-document-tests'=>['driver'=>'local','root'=>storage_path('framework/testing/disks/dropa2z-document-tests'),'throw'=>true]]);
        Storage::fake('dropa2z-document-tests');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        while (DB::transactionLevel() > 0) DB::rollBack();
        Auth::forgetGuards();
        Storage::disk('dropa2z-document-tests')->deleteDirectory('');
        parent::tearDown();
    }

    private function identity(string $role): User
    {
        $user=new User();
        $user->forceFill(['name'=>'Document Test','email'=>'doc-test-'.Str::uuid().'@example.invalid','status'=>1])->save();
        $user->assignRole($role);
        Auth::setUser($user);
        return $user;
    }

    private function definition(string $type='driver'): Document
    {
        $document=new Document();
        $document->forceFill(['name'=>['en'=>'Test licence'],'slug'=>'doc-'.Str::uuid(),'type'=>$type,'status'=>1,'is_required'=>1,'need_expired_date'=>1,'created_by_id'=>Auth::id()])->save();
        return $document;
    }

    private function stored(User $owner, Document $definition, string $class=DriverDocument::class)
    {
        $column=$class===FleetDocument::class ? 'fleet_manager_id' : 'driver_id';
        $mediaId=DB::table('media')->whereNull('deleted_at')->value('id');
        if (!$mediaId) throw new \RuntimeException('A media row is needed for a read-only foreign-key reference.');
        return $class::create([$column=>$owner->id,'document_id'=>$definition->id,'document_image_id'=>$mediaId,'expired_at'=>'2028-01-01','status'=>'approved']);
    }

    private function update(array $documents): array
    {
        return (new DriverAuthController())->updateDocument(Request::create('/api/update/document','POST',['documents'=>$documents]));
    }

    public function test_expiry_update_preserves_file_and_is_scoped_to_the_signed_in_driver(): void
    {
        $first=$this->identity('driver'); $definition=$this->definition(); $mine=$this->stored($first,$definition);
        $other=$this->identity('driver'); $theirs=$this->stored($other,$definition); Auth::setUser($first);
        $image=$mine->document_image_id;
        $result=$this->update([['slug'=>$definition->slug,'expired_at'=>'2029-01-01','driver_id'=>$other->id]]);
        $this->assertTrue($result['success']); $this->assertSame(1,$result['updated']);
        $this->assertSame($image,$mine->fresh()->document_image_id);
        $this->assertSame('pending',$mine->fresh()->status);
        $this->assertSame('2029-01-01',$mine->fresh()->expired_at->toDateString());
        $this->assertSame('approved',$theirs->fresh()->status);
        $this->assertSame('2028-01-01',$theirs->fresh()->expired_at->toDateString());
    }

    public function test_new_document_requires_a_file_and_rejects_past_expiry(): void
    {
        $this->identity('driver'); $definition=$this->definition();
        foreach ([['slug'=>$definition->slug,'expired_at'=>'2029-01-01'],['slug'=>$definition->slug,'expired_at'=>'2020-01-01']] as $entry) {
            try {$this->update([$entry]); $this->fail('Invalid document must be rejected.');}
            catch (\App\Exceptions\ExceptionHandler $exception) {$this->assertSame(422,$exception->getCode());}
        }
        $this->assertSame(0,DriverDocument::where('document_id',$definition->id)->count());
    }

    public function test_rider_token_cannot_update_driver_documents(): void
    {
        $this->identity('rider'); $definition=$this->definition();
        try {$this->update([['slug'=>$definition->slug]]); $this->fail('Rider must be denied.');}
        catch (\App\Exceptions\ExceptionHandler $exception) {$this->assertSame(403,$exception->getCode());}
    }

    public function test_fleet_updates_its_own_fleet_document_table(): void
    {
        $owner=$this->identity('fleet_manager'); $definition=$this->definition('fleet_manager'); $record=$this->stored($owner,$definition,FleetDocument::class);
        $this->update([['slug'=>$definition->slug,'expired_at'=>'2029-01-01']]);
        $this->assertSame('pending',$record->fresh()->status);
        $this->assertSame('2029-01-01',$record->fresh()->expired_at->toDateString());
        $this->assertSame(0,DriverDocument::where('document_id',$definition->id)->count());
    }

    public function test_pdf_upload_creates_a_reviewable_document_on_an_isolated_test_disk(): void
    {
        $owner=$this->identity('driver'); $definition=$this->definition();
        $pdf="%PDF-1.4\n";
        $objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count 1 /Kids [3 0 R] >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>',"<< /Length 0 >>\nstream\n\nendstream"];
        $offsets=[];
        foreach ($objects as $index=>$object) {$offsets[]=strlen($pdf); $pdf.=($index+1)." 0 obj\n".$object."\nendobj\n";}
        $xref=strlen($pdf); $pdf.="xref\n0 5\n0000000000 65535 f \n";
        foreach ($offsets as $offset) $pdf.=sprintf("%010d 00000 n \n",$offset);
        $pdf.="trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
        $file=UploadedFile::fake()->createWithContent('licence.pdf',$pdf);
        $request=Request::create('/api/update/document','POST',['documents'=>[['slug'=>$definition->slug,'expired_at'=>'2029-01-01']]],[],['documents'=>[['file'=>$file]]]);
        $result=(new DriverAuthController())->updateDocument($request);
        $record=DriverDocument::where('driver_id',$owner->id)->where('document_id',$definition->id)->firstOrFail();
        $this->assertTrue($result['success']); $this->assertSame('pending',$record->status);
        $media=\App\Models\Attachment::findOrFail($record->document_image_id);
        $this->assertSame('application/pdf',$media->mime_type);
        $this->assertSame('dropa2z-document-tests',$media->disk);
        $this->assertNotEmpty(Storage::disk('dropa2z-document-tests')->allFiles());
    }
}
