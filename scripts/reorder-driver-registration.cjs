const fs=require('fs');
let p='Taxido_driver/src/screen/auth/registration/createAccount/index.tsx',s=fs.readFileSync(p,'utf8');
s=s.replace("navigation.navigate('UploadedDocument', { type: userType })","navigation.navigate(userType==='fleet'?'UploadedDocument':'VehicleRegistration', { type: userType })");fs.writeFileSync(p,s);
p='Taxido_driver/src/screen/auth/registration/vehicleRegistration/index.tsx';s=fs.readFileSync(p,'utf8');
const start=s.indexOf('  const handleRegister = async () => {'),end=s.indexOf('  const [selectedVehicleSeat',start);if(start<0||end<0)throw Error('Registration function not found');
s=s.slice(0,start)+`  const handleRegister = async () => {
    setVehicleDetail({...formDatas, preferences:selectedPrefs});
    navigation.navigate('UploadedDocument', {type:'driver', vehicleReady:true} as any);
  }

`+s.slice(end);
s=s.replace('if (selectedItem?.seat) {','if (selectedItem) {').replace('setSelectedVehicleSeat(selectedItem.seat)','setSelectedVehicleSeat(Number(selectedItem.seat)||1)').replace('maximumSeats: selectedItem.seat.toString()','maximumSeats: String(Number(selectedItem.seat)||1)').replace('<ProgressBar fill={3} />','<ProgressBar fill={2} />');
s=s.replace('      setSelectedCategoryID(undefined)','      setSelectedCategoryID(undefined)\n      setCategoryIndex(null)\n      setVehicleIndex(null)');
s=s.replace('if (seatValue < 1 || seatValue > selectedVehicleSeat)', 'if (seatValue < 1 || seatValue > Number(selectedVehicleSeat||1))');
fs.writeFileSync(p,s);
p='Taxido_driver/src/screen/auth/registration/uploadDocument/index.tsx';s=fs.readFileSync(p,'utf8');
s="import {registerDriver} from '../../../../utils/registerDriver';\nimport {selfDriverData} from '../../../../api/store/action';\nimport {setValue} from '../../../../utils/localstorage';\nimport {notificationHelper} from '../../../../commonComponents';\n"+s;
s=s.replace('textRtlStyle, setDocumentDetail, isDark, rtl','textRtlStyle, setDocumentDetail, isDark, rtl, accountDetail, vehicleDetail, setToken');
s=s.replace("  const [documentType,", "  const [submitting,setSubmitting]=useState(false);\n  const submittingRef=useRef(false);\n  const [documentType,");
s=s.replace("doc.type === 'fleet_manager'","(userType==='fleet'?doc.type==='fleet_manager':doc.type==='vehicle')");
s=s.replace('    if (documentsLoading) return;','    if (documentsLoading || submittingRef.current) return;');
const old=`    const userType = await getValue('userType');
    if (userType == 'driver') {
      navigate('VehicleRegistration');
    } else if (userType == 'fleet') {
      navigate('FleetDetails');
    } else {
      navigate('VehicleRegistration');
    }`;
if(!s.includes(old))throw Error('KYC continuation not found');
s=s.replace(old,`    if (userType === 'fleet') {navigate('FleetDetails');return;}
    if (!vehicleDetail?.vehicleType) {navigate('VehicleRegistration');return;}
    submittingRef.current=true;setSubmitting(true);
    try {
      const data=await registerDriver(accountDetail,vehicleDetail,finalData,await getValue('fcmToken')||'');
      await setValue('token',data.access_token);setToken(data.access_token);
      await dispatch(selfDriverData()).unwrap();
      (navigation as any).reset({index:0,routes:[{name:Number(data.is_verified)===1?'TabNav':'Verification'}]});
    } catch(error:any) {notificationHelper('',error?.message||'Could not submit your documents.','error');}
    finally {submittingRef.current=false;setSubmitting(false);}`);
s=s.replace('documentData?.data?.forEach((doc) => {',"documentData?.data?.filter((doc:any)=>userType==='fleet'?doc.type==='fleet_manager':['driver','vehicle'].includes(doc.type)).forEach((doc) => {")
 .replace('<ProgressBar fill={2} />','<ProgressBar fill={3} />').replace('title={translateData.next}',"title={submitting?'Submitting…':userType==='fleet'?translateData.next:'Submit KYC for verification'}\n            loading={submitting}");
fs.writeFileSync(p,s);
console.log('Driver order: verified contact, personal information, vehicle, KYC, Admin verification.');
