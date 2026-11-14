param([string]$BuildTag='20261104-Revamped-BookingReview')
Add-Type -AssemblyName System.IO.Compression.FileSystem
foreach($appName in @('rider','driver')) {
 $prefix=if($appName -eq 'rider'){'Dropa2z'}else{'Dropa2z-Driver'}
 $apkFile=Join-Path $env:USERPROFILE "Downloads\$prefix-Full-$BuildTag.apk"
 $zip=[IO.Compression.ZipFile]::OpenRead($apkFile)
 try {
  $reader=[IO.StreamReader]::new($zip.GetEntry('assets/index.android.bundle').Open())
  try{$bundle=$reader.ReadToEnd()}finally{$reader.Dispose()}
  [pscustomobject]@{App=$appName;OrangeLogo=$bundle.Contains('originalLogo');PickupRadar=$bundle.Contains('pickup-radar-expand');GSTChoice=$bundle.Contains('Continue without GST');NotificationDismiss=$bundle.Contains('Dismiss notification');File=$apkFile}
 }finally{$zip.Dispose()}
}
