import React from 'react';
import {Image, ImageProps} from 'react-native';
import {VehicleGraphic} from './VehicleGraphic';
import {vehicleChoiceKind} from '../utils/vehicleChoiceKind';

const artwork = {
  scooter: require('./assets/vehicle-choice/scooter.webp'),
  bike: require('./assets/vehicle-choice/bike.webp'),
  'classic-auto': require('./assets/vehicle-choice/classic-auto.webp'),
  'roof-rack-auto': require('./assets/vehicle-choice/roof-rack-auto.webp'),
  'electric-rickshaw': require('./assets/vehicle-choice/electric-rickshaw.webp'),
  'open-cargo-auto': require('./assets/vehicle-choice/open-cargo-auto.webp'),
};

/** Presentation only: the backend vehicle and booking IDs stay unchanged. */
export function VehicleChoiceArtwork({vehicle, style, ...props}: ImageProps & {vehicle?: any}) {
  const kind = vehicle?.vehicle_choice==='scooter'||/scooter/i.test(vehicle?.name||'') ? 'scooter' : vehicleChoiceKind(vehicle);
  if (!kind) return <VehicleGraphic vehicle={vehicle} style={style} {...props} />;
  return <Image {...props} source={artwork[kind]} resizeMode="contain"
    accessibilityLabel={`${vehicle?.name || 'Vehicle'} parcel placement illustration`}
    style={[{width: 84, height: 58, backgroundColor: '#FFFFFF'}, style]} />;
}
