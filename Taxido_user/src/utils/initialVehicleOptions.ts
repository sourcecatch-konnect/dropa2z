export interface VehicleOffering {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  status?: boolean | number | null;
}

const isEnabled = (status: VehicleOffering["status"]): boolean =>
  status === undefined || status === null || status === true || status === 1;

/**
 * The backend is the source of truth for which offerings a Dropa2z Rider may
 * book. The booking API already scopes its response to the requested service,
 * service category and zone, so the app only drops anything the server has
 * explicitly marked disabled and never adds offerings of its own.
 */
export const getInitialVehicleOptions = <T extends VehicleOffering>(
  vehicles: readonly T[] | null | undefined,
): T[] => {
  if (!Array.isArray(vehicles)) {
    return [];
  }

  return vehicles.filter(vehicle => isEnabled(vehicle.status));
};
