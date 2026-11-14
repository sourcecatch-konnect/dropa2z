export const GOODS_TYPES = [
  ["documents", "Documents & stationery"],
  ["food", "Packed food & groceries"],
  ["clothing", "Clothing & accessories"],
  ["electronics", "Electronics"],
  ["household", "Household items"],
  ["spares", "Tools & spare parts"],
  ["business-stock", "Shop stock & supplies"],
  ["healthcare", "Non-restricted healthcare products"],
  ["gifts", "Gifts & toys"],
  ["general", "Other general goods"],
  ["building-materials", "Packed building materials"],
  ["events", "Event & hospitality supplies"],
  ["ceramics", "Ceramic & sanitary wares"],
  ["nonhazardous-paints", "Non-hazardous paints"],
  ["electrical", "Electrical supplies"],
  ["furniture", "Small furniture & furnishings"],
  ["plastic", "Plastic products"],
  ["rubber", "Rubber products"],
  ["paper", "Timber, plywood & paper products"],
] as const;
export const RESTRICTED_GOODS = [
  "Illegal drugs and narcotics",
  "Explosives and flammable materials",
  "Weapons and ammunition",
  "Hazardous or radioactive goods",
  "Dry ice",
  "Live animals, livestock and human remains",
  "Illegal or stolen goods",
  "Cash, currencies and coins",
  "Precious jewellery, stones and gemstones",
  "Pornographic materials",
  "Gambling devices and lottery tickets",
  "Cigarettes and alcohol",
  "Fire extinguishers",
];
export type DeliveryDetails = {
  goods_type: string;
  gstin?: string;
  business_name?: string;
  restricted_items_confirmed: boolean;
};
export function validGstin(value: string): boolean {
  const gstin = value.trim().toUpperCase();
  if (
    !/^(0[1-9]|[12][0-9]|3[0-8]|97|99)[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
      gstin
    )
  )
    return false;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0,
    factor = 2;
  for (let i = 13; i >= 0; i--) {
    const product = alphabet.indexOf(gstin[i]) * factor;
    sum += Math.floor(product / 36) + (product % 36);
    factor = factor === 2 ? 1 : 2;
  }
  return alphabet[(36 - (sum % 36)) % 36] === gstin[14];
}
const money = (value: any) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export function reviewFare(vehicle: any, coupon: any, finalPrice?: any) {
  const fare = money(vehicle?.charges?.total),
    isApplied =
      coupon?.success === true &&
      (Number(coupon?.is_apply_all) === 1 ||
        coupon?.applicable_vehicles?.some(
          (id: any) => String(id) === String(vehicle?.id)
        ));
  // The verify endpoint returns the actual capped discount. Never recompute an uncapped percentage.
  const discount = isApplied
    ? Math.min(fare, money(coupon?.total_coupon_discount))
    : 0;
  const gross =
    finalPrice !== undefined &&
    finalPrice !== null &&
    Number.isFinite(Number(finalPrice))
      ? money(finalPrice)
      : fare;
  const payable = Math.max(0, gross - discount);
  return { fare, discount, payable, extras: Math.max(0, gross - fare) };
}
