type Point = {lat:number;lng:number};
export const pickupRadarCss = `<style>
 .pulse-overlay{position:absolute;pointer-events:none;z-index:1000;width:0;height:0;top:0;left:0;display:none}
 .pulse-container{position:relative;width:0;height:0;pointer-events:none}
 .pulse-ring{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:30px;height:30px;background-color:rgba(252,94,2,.24);border:1px solid rgba(252,94,2,.55);border-radius:50%;animation:pickup-radar-expand 2s ease-out infinite;opacity:0;pointer-events:none}
 .pulse-ring:nth-child(2){animation-delay:.6s}.pulse-ring:nth-child(3){animation-delay:1.2s}
 @keyframes pickup-radar-expand{0%{transform:translate(-50%,-50%) scale(.5);opacity:.8}100%{transform:translate(-50%,-50%) scale(15);opacity:0}}
 </style>`;
export const pickupRadarMarkup = '<div id="pickup-radar" class="pulse-overlay"><div class="pulse-container"><div class="pulse-ring"></div><div class="pulse-ring"></div><div class="pulse-ring"></div></div></div>';
export const googlePickupRadarScript = (pickup:Point) => `
 var pickupRadarElement=document.getElementById('pickup-radar');
 if(pickupRadarElement){
   var pickupRadarOverlay=new google.maps.OverlayView();
   pickupRadarOverlay.onAdd=function(){};
   pickupRadarOverlay.draw=function(){
     var projection=this.getProjection();
     if(!projection)return;
     var pixel=projection.fromLatLngToContainerPixel(new google.maps.LatLng(${pickup.lat},${pickup.lng}));
     if(!pixel)return;
     pickupRadarElement.style.left=pixel.x+'px';pickupRadarElement.style.top=pixel.y+'px';pickupRadarElement.style.display='block';
   };
   pickupRadarOverlay.onRemove=function(){pickupRadarElement.style.display='none';};
   pickupRadarOverlay.setMap(map);
 }
`;
export const leafletPickupRadarScript = (pickup:Point) => `
 var pickupRadarElement=document.getElementById('pickup-radar');
 function updatePickupRadar(){
   if(!pickupRadarElement)return;
   var pixel=map.latLngToContainerPoint([${pickup.lat},${pickup.lng}]);
   pickupRadarElement.style.left=pixel.x+'px';pickupRadarElement.style.top=pixel.y+'px';pickupRadarElement.style.display='block';
 }
 map.on('move zoom viewreset resize',updatePickupRadar);updatePickupRadar();
`;
