export type VehicleChoiceKind = 'bike' | 'classic-auto' | 'roof-rack-auto' | 'electric-rickshaw' | 'open-cargo-auto';

export function vehicleChoiceKind(vehicle: any): VehicleChoiceKind | null {
  const info = vehicle?.vehicle_info || vehicle?.vehicle || vehicle;
  const label = [typeof vehicle === 'string' ? vehicle : '', vehicle?.name, vehicle?.slug,
    vehicle?.vehicle_type?.name, vehicle?.vehicle_type?.slug, info?.name,
    info?.vehicle_type?.name, info?.vehicle_type?.slug, info?.vehicle_type_name]
    .filter(value => typeof value === 'string').join(' ').toLowerCase();
  if (/bike|motorcycle|two.?wheeler|scooter/.test(label)) return 'bike';
  if (/roof.?rack/.test(label)) return 'roof-rack-auto';
  if (/electric.*rickshaw|e[ -]?rickshaw|electric.*auto/.test(label)) return 'electric-rickshaw';
  if (/cargo.*auto|auto.*cargo|open.*cargo/.test(label)) return 'open-cargo-auto';
  if (/auto|rickshaw|three.?wheeler/.test(label)) return 'classic-auto';
  return null;
}
