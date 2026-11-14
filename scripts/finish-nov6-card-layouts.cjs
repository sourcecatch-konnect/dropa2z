const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const file='Taxido_driver/src/screen/settings/settingManu/index.tsx',target=path.join(root,file);let s=fs.readFileSync(target,'utf8');
s="import {LogoutConfirmation} from '../../../design/LogoutConfirmation';\n"+s;
s=s.replace('  BottomSheetView,','  BottomSheetView,\n  BottomSheetScrollView,').replace("const logoutSnapPoints = useMemo(() => ['43%'], [])","const logoutSnapPoints = useMemo(() => ['42%', '65%'], [])");
const start=s.indexOf('<BottomSheetModal\n          ref={logoutSheetRef}');if(start<0)throw Error('Logout sheet not found');
const bodyStart=s.indexOf('<BottomSheetView',start),bodyEnd=s.indexOf('</BottomSheetView>',bodyStart);if(bodyEnd<0)throw Error('Logout body missing');
s=s.slice(0,bodyStart)+`<BottomSheetScrollView keyboardShouldPersistTaps="handled">
            <LogoutConfirmation busy={isLoggingOut} onCancel={closeLogoutSheet} onLogout={gotoLogout}/>
          </BottomSheetScrollView>`+s.slice(bodyEnd+'</BottomSheetView>'.length);
s=s.slice(0,start)+s.slice(start).replace('index={1}','index={0}').replace('snapPoints={logoutSnapPoints}','snapPoints={logoutSnapPoints}\n          enableDynamicSizing={false}');fs.writeFileSync(target,s);
console.log('Logout confirmation layout updated.');
