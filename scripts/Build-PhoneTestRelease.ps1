param(
    [Parameter(Mandatory=$true)][ValidateSet('rider','driver')][string]$App,
    [string]$BuildTag = '20261104-Functional',
    [string]$Device = '00077344Q001174',
    [switch]$CopyToPhone,
    [ValidateSet('universal','arm64-v8a','armeabi-v7a','x86','x86_64')][string]$Architecture = 'universal',
    [ValidateRange(2,12)][int]$HeapGb = 6,
    [ValidateRange(1,12)][int]$Workers = 6
)
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $sourceRoot
$project = if ($App -eq 'rider') {'Taxido_user'} else {'Taxido_driver'}
$android = Join-Path $sourceRoot "$project\android"
$logFile = Join-Path $workspaceRoot "$App-$BuildTag-build.log"
$privateJdks = Join-Path $workspaceRoot '.tools\jdk17'
$privateJdk = if (Test-Path -LiteralPath $privateJdks) {Get-ChildItem -LiteralPath $privateJdks -Directory | Select-Object -First 1} else {$null}
if ($privateJdk -and (Test-Path -LiteralPath (Join-Path $privateJdk.FullName 'bin\java.exe'))) {
    $env:JAVA_HOME = $privateJdk.FullName
} elseif (!$env:JAVA_HOME) {
    $javaCommand = (Get-Command java -ErrorAction Stop).Source
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $javaCommand)
}
if (!$env:GRADLE_USER_HOME) {
    $env:GRADLE_USER_HOME = Join-Path $workspaceRoot '.gradle-user-home-phone'
}
. (Join-Path $PSScriptRoot 'Load-ReleaseSigning.ps1')
Push-Location -LiteralPath $android
try {
    # Gradle warnings on stderr are not build failures. Check the native exit
    # code instead of inheriting Stop from the secure-signing loader.
    $ErrorActionPreference = 'Continue'
    & .\gradlew.bat assembleRelease "--max-workers=$Workers" "-Dorg.gradle.jvmargs=-Xmx${HeapGb}g -Dfile.encoding=UTF-8" --init-script (Join-Path $PSScriptRoot 'gradle9-foojay.init.gradle') --console=plain *> $logFile
    $buildCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = 'Stop'
    Pop-Location
}
Get-Content -LiteralPath $logFile -Tail 20
if ($buildCode -ne 0) {throw "The $App build failed. See $logFile"}
if ($CopyToPhone) {
    & (Join-Path $PSScriptRoot 'Copy-PhoneTestApk.ps1') -App $App -BuildTag $BuildTag -Device $Device -Architecture $Architecture
}
