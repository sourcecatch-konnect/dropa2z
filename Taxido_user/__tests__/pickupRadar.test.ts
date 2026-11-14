import vm from 'vm';
import {googlePickupRadarScript,leafletPickupRadarScript,pickupRadarCss} from '../src/screens/bookRide/mapBooking/pickupRadar';
const pickup={lat:21.01,lng:75.56};
it('anchors Google radar to projected pickup coordinates and redraws after map movement',()=>{
 const element={style:{} as any},project=jest.fn(()=>({x:720,y:510}));let overlay:any;
 class Overlay{getProjection(){return {fromLatLngToContainerPixel:project};}setMap(){overlay=this;(this as any).draw();}}
 const LatLng=jest.fn(function(this:any,lat:number,lng:number){this.lat=lat;this.lng=lng;});
 vm.runInNewContext(googlePickupRadarScript(pickup),{map:{},document:{getElementById:()=>element},google:{maps:{OverlayView:Overlay,LatLng}}});
 expect(LatLng).toHaveBeenCalledWith(21.01,75.56);expect(element.style).toMatchObject({left:'720px',top:'510px',display:'block'});
 project.mockReturnValue({x:310,y:900});overlay.draw();expect(element.style).toMatchObject({left:'310px',top:'900px'});
});
it('keeps Leaflet radar aligned with pickup through pan, zoom and resize',()=>{
 const element={style:{} as any},project=jest.fn(()=>({x:440,y:680})),events:any={};
 const map={latLngToContainerPoint:project,on:(names:string,callback:()=>void)=>names.split(' ').forEach(name=>events[name]=callback)};
 vm.runInNewContext(leafletPickupRadarScript(pickup),{map,document:{getElementById:()=>element}});
 expect(project).toHaveBeenCalledWith([21.01,75.56]);expect(element.style).toMatchObject({left:'440px',top:'680px'});
 project.mockReturnValue({x:600,y:200});events.zoom();expect(element.style).toMatchObject({left:'600px',top:'200px'});expect(events.move).toBeDefined();expect(events.resize).toBeDefined();
});
it('does not centre the overlay on the screen or intercept map taps',()=>{
 expect(pickupRadarCss).toContain('pointer-events:none');expect(pickupRadarCss).not.toContain('justify-content:center');expect(pickupRadarCss).toContain('width:0;height:0');
});
