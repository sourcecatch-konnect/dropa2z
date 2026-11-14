const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),parser=require(path.join(root,'Taxido_user/node_modules/@babel/parser'));
for(const file of ['Taxido_user/src/screens/bookRide/index.tsx','Taxido_user/src/screens/bookRide/component/BookingReview.tsx','Taxido_user/src/utils/bookingReview.ts','Taxido_user/src/design/ApprovedHomeArtwork.tsx','Taxido_driver/src/design/ApprovedHomeArtwork.tsx']){
 parser.parse(fs.readFileSync(path.join(root,file),'utf8'),{sourceType:'module',plugins:['typescript','jsx']});console.log('Parsed '+file);
}
