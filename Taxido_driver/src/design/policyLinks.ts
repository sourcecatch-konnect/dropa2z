export type PolicyLink = {key: string; title: string; url: string};
export function safeDocumentUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  return /^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::[0-9]{1,5})?(?:[/?#][^\s<>"'\\]*)?$/i.test(url) ? url : null;
}
export function publishedPolicyLinks(pages: any[], setting: any, mode: 'rider' | 'driver', site: string): PolicyLink[] {
  const links: PolicyLink[] = [];
  const configured = safeDocumentUrl(setting?.[mode + '_privacy_policy']);
  if (configured) links.push({key: 'privacy', title: 'Privacy Policy', url: configured});
  for (const page of pages) {
    if (Number(page?.status) !== 1 || typeof page?.slug !== 'string' || !page.slug.trim()) continue;
    const rawTitle = typeof page.title === 'string' ? page.title : page.title?.en;
    const title = (rawTitle || page.slug.replace(/[-_]/g, ' ')).trim();
    if (!/privacy|terms?|conditions?|polic|delivery.?rules?|parcel.?rules?|refund|cancell|prohibited|shipping/i.test(title + ' ' + page.slug)) continue;
    if (configured && /privacy/i.test(title + ' ' + page.slug)) continue;
    const url = safeDocumentUrl(site.replace(/\/$/, '') + '/page/' + encodeURIComponent(page.slug));
    if (url && !links.some(link => link.url === url)) links.push({key: String(page.id ?? page.slug), title, url});
  }
  return links;
}
