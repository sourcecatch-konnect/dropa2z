/** Display wording only. API slugs and IDs remain unchanged. */
export function serviceLabel(value: string): string {
  return value.replace(/\b(?:Auto[\s-]+)?Freight\b/gi, 'Cargo Auto');
}
