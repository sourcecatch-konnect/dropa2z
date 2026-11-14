export interface ServiceOffering {
  id: string | number;
  type?: string | null;
  status?: boolean | number | null;
}

// Only Parcel is offered. The server still controls whether it is enabled.
export const LAUNCHED_SERVICE_TYPES: readonly string[] = ["parcel"];

export const getLaunchedServices = <T extends ServiceOffering>(
  services: readonly T[] | null | undefined,
): T[] => {
  if (!services) {
    return [];
  }

  return services.filter(service => {
    const type = service.type?.trim().toLowerCase() ?? "";
    const enabled = service.status == null || service.status === true || service.status === 1;
    return enabled && LAUNCHED_SERVICE_TYPES.includes(type);
  });
};
