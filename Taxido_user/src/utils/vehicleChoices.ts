/** Only the real Bike and standard Auto choices are offered; keep their IDs/fares. */
export function vehicleChoices(vehicles:any[]) {
  if(!Array.isArray(vehicles))return [];
  return vehicles.filter(vehicle=>{
    const label=`${vehicle.name||''} ${vehicle.slug||''}`;
    return !/scooter|freight|cargo|electric|roof.?rack/i.test(label)&&/\bbike\b|motorcycle|two.?wheeler|\bauto\b|rickshaw|three.?wheeler/i.test(label);
  });
}
