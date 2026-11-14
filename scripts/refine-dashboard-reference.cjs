const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname,'../Taxido_driver/src/screen/dashBoard/index.tsx');
let source=fs.readFileSync(file,'utf8');
if(source.includes('const dashboardInk'))throw Error('Dashboard already refined');
source=source.replace("ReferenceScreen, ReferenceLogo","ReferenceScreen, ReferenceLogo, referenceSurfaces");
source=source.replace('ScrollView, BackHandler','ScrollView, BackHandler, useWindowDimensions');
source=source.replace('  const size = windowHeight(20)', '  const {width:screenWidth}=useWindowDimensions()\n  const size = Math.min(190,screenWidth*.48)');
const start=source.indexOf('\n  return (\n    <ReferenceScreen>');
if(start<0)throw Error('Dashboard return not found');
source=source.slice(0,start)+`
  const dashboardInk=isDark?'#FFFFFF':'#111111';
  const dashboardCard={...referenceSurfaces.card,backgroundColor:isDark?'#202422':'#FFFFFF'};
  return <ReferenceScreen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding:16,paddingBottom:24,gap:14}}>
    <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between'}}>
      <ReferenceLogo driver width={130}/>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>navigate('Notification')} style={{width:38,height:38,borderRadius:20,borderWidth:1,borderColor:'#E5E8EB',alignItems:'center',justifyContent:'center'}}><Icons.Notification color={dashboardInk}/></TouchableOpacity>
    </View>
    <Text style={{fontSize:24,fontWeight:'800',color:dashboardInk,marginBottom:2}}>{translateData.dashboard || 'Dashboard'}</Text>
    <View style={[dashboardCard,{padding:16,alignItems:'center'}]}>
      <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
        <Svg width={size} height={size} style={{position:'absolute'}}><G>{data.filter(item=>item.value>0).map((item,index)=>{
          const angle=total>0?item.value/total*360:0;
          const arc=<Circle key={index} cx={cx} cy={cy} r={radius} stroke={item.color} strokeWidth={strokeWidth} fill="none" strokeDasharray={[(angle/360)*2*Math.PI*radius,2*Math.PI*radius]} strokeLinecap="round" rotation={startAngle} origin={cx+','+cy}/>;
          startAngle+=angle;
          return arc;
        })}</G></Svg>
        <Text style={{fontSize:15,fontWeight:'800',color:dashboardInk}}>{translateData.totalBooking || 'Total Booking'}</Text>
        <Text style={{fontSize:28,fontWeight:'800',color:'#0867D7',marginTop:4}}>{total}</Text>
      </View>
      <View style={{flexDirection:rtl?'row-reverse':'row',marginTop:16}}>{data.map((item,index)=><View key={item.label} style={{flex:1,alignItems:'center',borderLeftWidth:index?1:0,borderColor:'#E5E8EB'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:5}}><View style={{width:15,height:5,borderRadius:3,backgroundColor:item.color}}/><Text style={{fontSize:11,color:'#68717A'}}>{item.label}</Text></View>
        <Text style={{fontSize:16,fontWeight:'700',color:dashboardInk,marginTop:4}}>{item.value}</Text>
      </View>)}</View>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Total Earnings" onPress={gotoDetails} style={[dashboardCard,{padding:14,flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:12}]}>
      <View style={{width:60,height:60,borderRadius:12,backgroundColor:'#FFF3E8',alignItems:'center',justifyContent:'center'}}><Image source={Images.mapFrame} resizeMode="contain" style={{width:40,height:40,tintColor:'#FC5E02'}}/></View>
      <View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'800',color:dashboardInk}}>{translateData.totalEarning || 'Total Earnings'}</Text><Text style={{fontSize:23,fontWeight:'800',color:'#FC5E02',marginTop:3}}>{dashBoardList?.ride?.total_earnings || 0}</Text></View>
      <Text style={{fontSize:30,color:dashboardInk}}>›</Text>
    </TouchableOpacity>
    <Text style={{fontSize:19,fontWeight:'800',color:dashboardInk}}>{translateData.drivePerformance || 'Drive Performance'}</Text>
    <View style={{flexDirection:rtl?'row-reverse':'row',gap:12}}>{[
      {icon:Images.mapFrame5,value:dashBoardList?.driver_performance?.average_distance || 0,unit:dashBoardList?.driver_performance?.unit || 'Km',label:translateData.averageDistances || 'Total Distances',color:'#0867D7',tint:'#EBF4FF'},
      {icon:Images.mapFrame8,value:dashBoardList?.driver_performance?.average_hours || '0 Hr',unit:'',label:translateData.averageHours || 'Total Hours',color:'#FC5E02',tint:'#FFF0E8'},
    ].map(item=><View key={item.label} style={[dashboardCard,{padding:13,flex:1,minWidth:0}]}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><View style={{width:43,height:48,borderRadius:9,backgroundColor:item.tint,alignItems:'center',justifyContent:'center'}}><Image source={item.icon} resizeMode="contain" style={{width:30,height:35,tintColor:item.color}}/></View><Text style={{flex:1,fontSize:20,fontWeight:'800',color:item.color}}>{item.value}{item.unit?'\\n'+item.unit:''}</Text></View><Text style={{fontSize:13,fontWeight:'700',color:dashboardInk,marginTop:10}}>{item.label}</Text></View>)}</View>
  </ScrollView></ReferenceScreen>;
}
`;
fs.writeFileSync(file,source);
console.log('Driver Dashboard presentation updated; live selectors and navigation retained.');
