const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
function edit(file,change){const target=path.join(root,file),old=fs.readFileSync(target,'utf8'),next=change(old);if(old===next)throw Error('No edit: '+file);fs.writeFileSync(target,next);}
edit('Taxido_user/src/design/DeliveryBackButton.tsx',s=>s.replace("{screen:'Home'}","{screen:'HomeScreen'}"));
for(const screen of ['otpRide','acceptFare','rideComplete']){
 edit(`Taxido_driver/src/screen/home/${screen}/index.tsx`,s=>"import {DeliveryBackButton} from '../../../design/DeliveryBackButton';\n"+s.replace(/<View style={styles.backButton}>\s*<BackButton \/>\s*<\/View>/,'<DeliveryBackButton/>'));
}
edit('Taxido_driver/src/screen/home/rideDetails/index.tsx',s=>{
 s="import {DeliveryBackButton} from '../../../design/DeliveryBackButton';\n"+s;
 return s.replace('<ScrollView','<DeliveryBackButton/><ScrollView');
});
for(const app of ['Taxido_user','Taxido_driver']){
 edit(`${app}/src/design/PickupCard.tsx`,s=>{
  const actions=s.match(/    <View style=\{\[s.row,\{marginTop:14\}\]\}>[\s\S]*?    <\/View>/)?.[0];
  if(!actions)throw Error('Missing pickup actions');
  return s.replace('    {children}\n'+actions,actions.replace('marginTop:14','marginTop:8,marginBottom:10')+'\n    {children}')
   .replace("card:{borderWidth:1,borderRadius:21,padding:16}","card:{borderWidth:1,borderRadius:16,padding:12}")
   .replace("title:{fontSize:21,fontWeight:'700',marginTop:18,marginBottom:5}","title:{fontSize:18,fontWeight:'700',marginTop:10,marginBottom:4}")
   .replace('paddingVertical:14,marginVertical:6','paddingVertical:10,marginVertical:4')
   .replace("<Text style={[s.address,{color:muted}]}>","<Text numberOfLines={2} style={[s.address,{color:muted}]}>");
 });
}
edit('Taxido_driver/src/screen/home/homeScreen/index.tsx',s=>s
 .replace("bottom: windowHeight(10),","bottom: 116,")
 .replace("bottom: windowHeight(10),","bottom: 116,")
 .replace("ref={bottomSheetModalRef}\n          index={0}","ref={bottomSheetModalRef}\n          index={1}"));
edit('Taxido_driver/src/screen/home/otpRide/index.tsx',s=>{
 s=s.replace('<BottomSheetTextInput\n              ref={otpInput}',`<View style={{flexDirection:'row',gap:10,position:'relative',width:'100%'}}>
              {[0,1,2,3].map(index=><View key={index} pointerEvents="none" style={{flex:1,minHeight:54,borderWidth:enteredOtp.length===index?2:1,borderColor:enteredOtp.length===index?appColors.primary:colors.border,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:colors.card}}><Text style={{fontFamily:appFonts.bold,fontSize:25,color:colors.text}}>{enteredOtp[index]||''}</Text></View>)}
            <BottomSheetTextInput
              ref={otpInput}`);
 s=s.replace('placeholder="4-digit PIN"','caretHidden\n              selectionColor="transparent"');
 s=s.replace("style={{height:56,width:'100%',borderWidth:1,borderColor:colors.border,borderRadius:12,paddingHorizontal:14,fontFamily:appFonts.bold,fontSize:24,letterSpacing:8,color:colors.text,textAlign:'center'}}","style={{position:'absolute',top:0,left:0,right:0,bottom:0,color:'transparent',fontSize:1,backgroundColor:'transparent'}}");
 return s.replace(/(onSubmitEditing=\{\(\)=>Keyboard.dismiss\(\)\}[\s\S]*?\/>)/,'$1\n            </View>');
});
edit('Taxido_driver/src/screen/home/rideComplete/index.tsx',s=>s
 .replace('  BottomSheetModal,','  BottomSheetModal,\n  BottomSheetScrollView,')
 .replace("snapPoints={isParcelTrip && parcelStopCount > 0 ? ['53%'] : ['32%']}","snapPoints={['55%', '85%']}\n          enableDynamicSizing={false}")
 .replace('enableContentPanningGesture={false}','enableContentPanningGesture={true}')
 .replace('enableHandlePanningGesture={false}','enableHandlePanningGesture={true}')
 .replace('<BottomSheetView style={styles.bottomSheetlayer}>',"<BottomSheetScrollView style={{flex:1}} contentContainerStyle={{padding:14,paddingBottom:32,gap:12}} keyboardShouldPersistTaps=\"handled\">")
 .replace("<View style={[styles.greenSection, isParcelTrip && parcelStopCount > 0 ? { height: 'auto', bottom: 0 } : null]}>","<View style={{width:'100%',gap:12}}>")
 .replace('styles.additionalSection,',"{padding:12,borderRadius:16,borderWidth:1},")
 .replace('<View style={styles.buttonContainer}>',"<View style={{flexDirection:'row',gap:12,width:'100%'}}>" )
 .replaceAll('<View style={styles.halfButton}>',"<View style={{flex:1,minWidth:0}}>")
 .replace('          </BottomSheetView>\n        </BottomSheetModal>', '          </BottomSheetScrollView>\n        </BottomSheetModal>'));
console.log('Tracking back controls, pickup contacts, PIN boxes and delivery panels updated.');
