"""Validate minimal live-file patches before an explicitly selected apply step. Python 3.6+."""
import json, os, re, shutil, subprocess, sys
from datetime import datetime
from pathlib import Path

ROOT = Path('/home/dropa2z/public_html')
STAGE = Path('/home/dropa2z/delivery-flow-stage-20261106')
PAYLOAD = Path('/home/dropa2z/delivery-flow-20261106.json')

def run(command):
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, cwd=str(ROOT))
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout

if len(sys.argv)>1 and sys.argv[1]=='apply':
    paths=json.loads((STAGE/'validated.json').read_text())
    backup=Path('/home/dropa2z/delivery-flow-backup-'+datetime.utcnow().strftime('%Y%m%d-%H%M%S'))
    for path in paths:
        target=ROOT/path; saved=backup/path
        if target.exists():
            saved.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(str(target),str(saved))
    for path in paths:
        target=ROOT/path; target.parent.mkdir(parents=True,exist_ok=True)
        temporary=target.with_name(target.name+'.delivery-flow-tmp')
        shutil.copy2(str(STAGE/path),str(temporary)); os.replace(str(temporary),str(target))
    print('Backup: '+str(backup))
    print(run(['php','artisan','optimize:clear']))
    print(run(['php','artisan','route:list','--path=confirm-pickup-vehicle']))
    print('Applied validated delivery-flow changes.')
    sys.exit(0)

p=json.loads(PAYLOAD.read_text()); files={}
path=p['repo']; s=(ROOT/path).read_text(); pattern=r'    public function updateParcelStop\(.*?(?=    public function update\(\$request, \$id\))'
assert len(re.findall(pattern,s,re.S))==1 and 'confirmPickupVehicle' not in s, 'Repository differs or already patched'
files[path]=re.sub(pattern,lambda m:p['repoChunk'],s,flags=re.S)
path=p['controller']; s=(ROOT/path).read_text(); assert "'in:delivered'" in s
files[path]=s.replace("'in:delivered'","'in:arrived,delivered'",1).replace('    public function updateParcelStop(',p['confirmMethod']+'\n\n    public function updateParcelStop(',1)
path='Modules/Taxido/routes/api/api.php'; s=(ROOT/path).read_text()
needle="        Route::post('ride/{ride}/parcel-stop', 'RideController@updateParcelStop')->middleware(['can:ride.edit', 'throttle:20,1']);"
assert needle in s
files[path]=s.replace(needle,needle+"\n        Route::post('ride/{ride}/confirm-pickup-vehicle', 'RideController@confirmPickupVehicle')->middleware('throttle:20,1');",1)
path=p['admin'];s=(ROOT/path).read_text();assert 'renderDeliveryProgress' not in s and "@section('content')" in s
s=s.replace("@section('content')","@section('content')\n"+p['card'],1)
assert '        // Safe element updater' in s and '                    if (!rideData) return;' in s
s=s.replace('        // Safe element updater',p['js']+'        // Safe element updater',1)
files[path]=s.replace('                    if (!rideData) return;','                    if (!rideData) return;\n                    renderDeliveryProgress(rideData.parcel_delivery_progress);',1)
files.update({f['path']:f['content'] for f in p['newFiles']})
for path,content in files.items():
    target=STAGE/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
    print(run(['php','-l',str(target)]).strip())
bootstrap=STAGE/'bootstrap.php'
bootstrap.write_text('<?php require '+repr(str(ROOT/'vendor/autoload.php'))+'; require '+repr(str(STAGE/'Modules/Taxido/app/Services/DeliveryProgress.php'))+';')
print(run(['php',str(ROOT/'vendor/bin/phpunit'),'--bootstrap',str(bootstrap),str(STAGE/'tests/Unit/DeliveryProgressTest.php')]))
(STAGE/'validated.json').write_text(json.dumps(list(files)))
print('Validated '+str(len(files))+' staged files. Production unchanged.')
