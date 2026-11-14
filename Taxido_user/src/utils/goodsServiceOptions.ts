export type GoodsVehicleKind = "bike" | "auto";
export type GoodsServiceType = "parcel" | "freight";

export function goodsWeightLimit(vehicle: {slug?: string | null; name?: string | null} | GoodsVehicleKind | null | undefined): number | undefined {
  const label = typeof vehicle === 'string' ? vehicle : `${vehicle?.slug ?? ''} ${vehicle?.name ?? ''}`;
  if (/bike|motorcycle|two.?wheeler/i.test(label)) return 20;
  if (/auto|rickshaw|three.?wheeler/i.test(label)) return 90;
  return undefined;
}

export interface GoodsServiceCategory {
  id: number | string;
  slug?: string | null;
  status?: number | boolean | null;
}

export interface GoodsService {
  id: number | string;
  type?: string | null;
  status?: number | boolean | null;
  service_categories?: GoodsServiceCategory[] | null;
}

export interface GoodsOption {
  key: string;
  serviceType: GoodsServiceType;
  vehicleKind: GoodsVehicleKind;
  title: string;
  description: string;
  categorySlug: string;
  serviceId: number | string;
  categoryId: number | string;
}

const offerings = [
  { key: "bike-parcel", serviceType: "parcel", vehicleKind: "bike", title: "Bike Parcel", description: "Send a small packed item within your city.", categorySlug: "ride-parcel-bike" },
  { key: "auto-parcel", serviceType: "parcel", vehicleKind: "auto", title: "Auto Parcel", description: "Send parcels or packed items that fit in an auto.", categorySlug: "ride-parcel-auto" },
] as const;

const enabled = (status: number | boolean | null | undefined) =>
  status == null || status === true || status === 1;

export const getGoodsServiceOptions = (
  services: readonly GoodsService[] | null | undefined,
): GoodsOption[] => {
  if (!Array.isArray(services)) return [];
  return offerings.flatMap(offering => {
    const service = services.find(
      (item: GoodsService) => item.type?.toLowerCase() === offering.serviceType && enabled(item.status),
    );
    const category = service?.service_categories?.find(
      (item: GoodsServiceCategory) => item.slug === offering.categorySlug && enabled(item.status),
    );
    if (!service || !category) return [];
    return [{ ...offering, serviceId: service.id, categoryId: category.id }];
  });
};

export const matchesGoodsVehicle = (
  vehicle: { slug?: string | null; name?: string | null },
  kind: GoodsVehicleKind,
): boolean => {
  const label = `${vehicle.slug ?? ""} ${vehicle.name ?? ""}`.toLowerCase();
  return kind === "bike"
    ? /\bbike\b|motorcycle|two.?wheeler/.test(label)
    : /\bauto\b|rickshaw|three.?wheeler/.test(label);
};
