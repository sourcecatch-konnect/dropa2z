param(
    [Parameter(Mandatory=$true)][ValidateSet('rider','driver')][string]$App,
    [Parameter(Mandatory=$true)][string]$BuildTag,
    [string]$Device = '00077344Q001174',
    [ValidateSet('universal','arm64-v8a','armeabi-v7a','x86','x86_64')][string]$Architecture = 'universal',
    [switch]$SkipPhoneCopy
)
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$project = if ($App -eq 'rider') {'Taxido_user'} else {'Taxido_driver'}
$projectPath = Join-Path $sourceRoot $project
$source = Join-Path $projectPath "android\app\build\outputs\apk\release\app-$Architecture-release.apk"
$debugApk = Join-Path $projectPath 'android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk'
$keystore = Join-Path $projectPath 'android\app\debug.keystore'
$tools = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools\36.0.0'
$signer = Join-Path $tools 'apksigner.bat'
$zipalign = Join-Path $tools 'zipalign.exe'
$aapt = Join-Path $tools 'aapt.exe'
$downloadRoot = Join-Path $env:USERPROFILE 'Downloads'
$prefix = if ($App -eq 'rider') {'Dropa2z'} else {'Dropa2z-Driver'}
if (!(Test-Path -LiteralPath $source)) {throw "The $App release APK does not exist."}
function Invoke-ApkTool([string]$Tool, [string[]]$ToolArguments) {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {$result = @(& $Tool @ToolArguments 2>&1); $code = $LASTEXITCODE}
    finally {$ErrorActionPreference = $previousPreference}
    if ($code -ne 0) {throw "$Tool failed: $($result -join [Environment]::NewLine)"}
    return $result | ForEach-Object {$_.ToString()}
}
$sourceBadging = @(Invoke-ApkTool $aapt @('dump','badging',$source))
$versionMatch = [regex]::Match(($sourceBadging -join "`n"), "versionCode='(\d+)' versionName='([^']+)'")
if (!$versionMatch.Success) {throw 'Cannot read the APK version.'}
$versionCode = [int]$versionMatch.Groups[1].Value
$versionName = $versionMatch.Groups[2].Value
$filename = "$prefix-v$versionName-$Architecture-$BuildTag.apk"
$destination = Join-Path $downloadRoot $filename
# The phone copy retains the already-tested certificate. This is a standalone
# release binary, not a Metro-dependent debug APK or a Play production upload.
Invoke-ApkTool $signer @('sign','--ks',$keystore,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--v4-signing-enabled','false','--out',$destination,$source) | Out-Null
$cert = @(Invoke-ApkTool $signer @('verify','--verbose','--print-certs',$destination))
if (Test-Path -LiteralPath $debugApk) {
    $oldCert = @(Invoke-ApkTool $signer @('verify','--print-certs',$debugApk))
    $oldDigest = ($oldCert | Select-String '^Signer #1 certificate SHA-256 digest:').Line
    $newDigest = ($cert | Select-String '^Signer #1 certificate SHA-256 digest:').Line
    if (!$oldDigest -or $oldDigest -ne $newDigest) {throw 'The phone-update certificate differs from the previously tested debug build.'}
}
Invoke-ApkTool $zipalign @('-c','-P','16','4',$destination) | Out-Null
$badging = @(Invoke-ApkTool $aapt @('dump','badging',$destination))
if ($badging -match '^application-debuggable') {throw 'A standalone non-debuggable APK was expected.'}
if (!(($badging -join "`n") -match 'com\.dropa2z\.')) {throw 'Unexpected Android application package.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($destination)
try {
    $entry = $archive.GetEntry('assets/index.android.bundle')
    if (!$entry -or $entry.Length -lt 1000000) {throw 'The embedded JavaScript bundle is missing.'}
    $stream=$entry.Open(); $memory=[System.IO.MemoryStream]::new()
    try {$stream.CopyTo($memory); $bundle=[Text.Encoding]::UTF8.GetString($memory.ToArray())}
    finally {$stream.Dispose();$memory.Dispose()}
    $documentsText=if ($App -eq 'rider') {'Published documents could not be loaded.'} else {'Your verification documents'}
    if ($BuildTag -like '20261110-*' -or $BuildTag -like '20261111-*' -or $BuildTag -like '20261112-*') {
        $latestMarker = if ($App -eq 'rider') {'Delete category'} else {'Auto Rickshaw'}
        if (!$bundle.Contains($latestMarker)) {throw 'The latest app changes are absent from this APK.'}
        if ($BuildTag -like '20261112-*') {
            $releaseMarker = if ($App -eq 'rider') {'Please complete the delivery details below the vehicle list.'} else {'Payment was not confirmed. Check the delivery status before retrying.'}
            if (!$bundle.Contains($releaseMarker) -or !$bundle.Contains('Send message')) {throw 'The new booking form or chat fixes are absent from this APK.'}
        }
        if ($BuildTag -eq '20261110-BookingFix') {
            $bookingMarker = if ($App -eq 'rider') {'The delivery details did not match this booking.'} else {'The server did not confirm that this delivery started.'}
            if (!$bundle.Contains($bookingMarker)) {throw 'The booking/PIN fix is absent from this APK.'}
        }
        if ($BuildTag -eq '20261111-PromosKyc') {
            $featureMarker = if ($App -eq 'rider') {'Promos & coupons'} else {'Registration document setup is unavailable.'}
            if (!$bundle.Contains($featureMarker)) {throw 'The latest promos or registration document change is absent from this APK.'}
        }
        $logoFile = Join-Path $projectPath 'src\design\assets\brand-20261110\tail-exact.png'
        $logoHash = (Get-FileHash -LiteralPath $logoFile -Algorithm SHA256).Hash
        $logoSize = (Get-Item -LiteralPath $logoFile).Length
        $logoFound = $false
        foreach ($assetEntry in @($archive.Entries | Where-Object {$_.Length -eq $logoSize})) {
            $assetStream = $assetEntry.Open(); $assetHasher = [Security.Cryptography.SHA256]::Create()
            try {$assetHash = [BitConverter]::ToString($assetHasher.ComputeHash($assetStream)).Replace('-','')}
            finally {$assetStream.Dispose(); $assetHasher.Dispose()}
            if ($assetHash -eq $logoHash) {$logoFound = $true; break}
        }
        if (!$logoFound) {
            # Android PNG crunching changes encoded bytes, not the logo pixels.
            $python = Join-Path (Split-Path -Parent $sourceRoot) '.tools\brand-media\python\python.exe'
            Invoke-ApkTool $python @((Join-Path $PSScriptRoot 'verify-apk-logo.py'),$destination,$logoFile) | Out-Null
        }
    } elseif ($BuildTag -eq '20261106-Latest') {
        $latestMarker = if ($App -eq 'rider') {'Import from contacts'} else {'Verify practice PIN'}
        if (!$bundle.Contains($latestMarker)) {throw 'The latest receiver import or Driver training is absent from this APK.'}
        # AAPT shortens release resource names. Verify the image bytes instead.
        $scooterFile = Join-Path $projectPath 'src\design\assets\vehicle-choice\scooter.webp'
        $scooterHash = (Get-FileHash -LiteralPath $scooterFile -Algorithm SHA256).Hash
        $scooterSize = (Get-Item -LiteralPath $scooterFile).Length
        $scooterFound = $false
        foreach ($assetEntry in @($archive.Entries | Where-Object {$_.Length -eq $scooterSize})) {
            $assetStream = $assetEntry.Open(); $assetHasher = [Security.Cryptography.SHA256]::Create()
            try {$assetHash = [BitConverter]::ToString($assetHasher.ComputeHash($assetStream)).Replace('-','')}
            finally {$assetStream.Dispose(); $assetHasher.Dispose()}
            if ($assetHash -eq $scooterHash) {$scooterFound = $true; break}
        }
        if (!$scooterFound) {throw 'The supplied Scooter photo is absent from this APK.'}
        if ($App -eq 'driver' -and !$bundle.Contains('training-step-6')) {throw 'The Driver practice screenshots are absent from this APK.'}
    } elseif (!$bundle.Contains($documentsText) -or !$bundle.Contains('0 0 160 104')) {throw 'The new Documents or Bike/Auto graphics are absent from this APK.'}
    if ($BuildTag -like '*Revamped*') {
        $uiMarker = if ($App -eq 'rider') {'Gift cards are not available yet.'} else {'No subscription plans are available right now.'}
        if (!$bundle.Contains('Dingos,Arial,sans-serif') -or !$bundle.Contains('#FC5E02') -or !$bundle.Contains($uiMarker)) {throw 'The updated UI/logo or functional screen changes are absent from this APK.'}
    }
    if ($BuildTag -eq '20261104-Revamped-Final') {
        if (!$bundle.Contains('originalLogo') -or !$bundle.Contains('Dismiss notification')) {throw 'The final orange logo or notification changes are absent from this APK.'}
        if ($App -eq 'rider' -and (!$bundle.Contains('pickup-radar-expand') -or !$bundle.Contains('Continue without GST'))) {throw 'The final pickup radar or booking corrections are absent from the Rider APK.'}
    }
} finally {$archive.Dispose()}
$hash=(Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
if (!$SkipPhoneCopy) {
    Invoke-ApkTool 'adb' @('-s',$Device,'push',$destination,"/sdcard/Download/$filename") | Out-Null
    $deviceHash=@(Invoke-ApkTool 'adb' @('-s',$Device,'shell','sha256sum',"/sdcard/Download/$filename"))
    if (!(($deviceHash -join '') -match [regex]::Escape($hash))) {throw 'The phone copy checksum did not match.'}
}
$phoneDestination=if($SkipPhoneCopy){$null}else{"/sdcard/Download/$filename"}
$manifest=[ordered]@{app=$App;versionCode=$versionCode;versionName=$versionName;architecture=$Architecture;path=$destination;phone=$phoneDestination;bytes=(Get-Item -LiteralPath $destination).Length;sha256=$hash;embeddedBundle=$true;newDocuments=$true;newBikeAutoGraphics=$true;debuggable=$false;certificate='existing test certificate; not a Play upload'}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path (Split-Path -Parent $sourceRoot) "$App-apk-copy-$BuildTag.json") -Encoding UTF8
$manifest | ConvertTo-Json
$badging | Select-String '^(package:|application-label:|native-code:)'
