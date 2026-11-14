param([Parameter(Mandatory=$true)][ValidateSet('rider','driver')][string]$App)
$ErrorActionPreference='Stop'
$sourceRoot=Split-Path -Parent $PSScriptRoot
$workspaceRoot=Split-Path -Parent $sourceRoot
$project=if($App -eq 'rider'){'Taxido_user'}else{'Taxido_driver'}
$port=if($App -eq 'rider'){8081}else{8082}
$jdk=Get-ChildItem -LiteralPath (Join-Path $workspaceRoot '.tools\jdk17') -Directory | Select-Object -First 1
$env:JAVA_HOME=$jdk.FullName
$env:GRADLE_USER_HOME=Join-Path $workspaceRoot '.gradle-user-home-phone'
. (Join-Path $PSScriptRoot 'Load-ReleaseSigning.ps1')
$log=Join-Path $workspaceRoot "$App-visual-debug-build.log"
Push-Location -LiteralPath (Join-Path $sourceRoot "$project\android")
try {
    $ErrorActionPreference='Continue'
    & .\gradlew.bat assembleDebug '-PreactNativeArchitectures=arm64-v8a' "-PreactNativeDevServerPort=$port" --max-workers=6 '-Dorg.gradle.jvmargs=-Xmx6g -Dfile.encoding=UTF-8' --init-script (Join-Path $PSScriptRoot 'gradle9-foojay.init.gradle') --console=plain *> $log
    $buildCode=$LASTEXITCODE
} finally {$ErrorActionPreference='Stop';Pop-Location}
Get-Content -LiteralPath $log -Tail 15
if($buildCode -ne 0){throw "The $App debug build failed. See $log"}
