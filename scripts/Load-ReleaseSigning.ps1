$ErrorActionPreference = 'Stop'
$signingRoot = Join-Path $env:USERPROFILE '.dropa2z-signing'
foreach ($appName in @('rider', 'driver')) {
    $credentialsFile = Join-Path $signingRoot "$appName.credentials.xml"
    $keystore = Join-Path $signingRoot "dropa2z-$appName-upload.p12"
    if (!(Test-Path -LiteralPath $credentialsFile) -or !(Test-Path -LiteralPath $keystore)) { throw "Production signing files are missing for $appName in $signingRoot" }
    $credential = Import-Clixml -LiteralPath $credentialsFile
    $prefix = "DROPA2Z_$($appName.ToUpperInvariant())_"
    [Environment]::SetEnvironmentVariable($prefix + 'STORE_FILE', $keystore, 'Process')
    [Environment]::SetEnvironmentVariable($prefix + 'STORE_PASSWORD', $credential.GetNetworkCredential().Password, 'Process')
    [Environment]::SetEnvironmentVariable($prefix + 'KEY_ALIAS', $credential.UserName, 'Process')
    [Environment]::SetEnvironmentVariable($prefix + 'KEY_PASSWORD', $credential.GetNetworkCredential().Password, 'Process')
}
Write-Output 'Production signing loaded for this terminal. Passwords were not printed.'
