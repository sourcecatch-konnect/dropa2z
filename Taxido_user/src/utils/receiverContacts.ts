export function receiverContacts(contacts: any[]) {
  return contacts.flatMap(contact => {
    const name = String(contact.displayName || [contact.givenName, contact.middleName, contact.familyName].filter(Boolean).join(' ')).trim();
    const numbers = new Set<string>();
    return (contact.phoneNumbers || []).flatMap((entry: any) => {
      let phone = String(entry.number || '').replace(/\D/g, '');
      if (phone.startsWith('0091') && phone.length === 14) phone = phone.slice(4);
      else if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
      else if (phone.startsWith('0') && phone.length === 11) phone = phone.slice(1);
      if (!/^[6-9]\d{9}$/.test(phone) || numbers.has(phone)) return [];
      numbers.add(phone);
      return [{id: `${contact.recordID || name}:${phone}`, name: name || phone, phone, countryCode: '+91'}];
    });
  }).sort((a, b) => a.name.localeCompare(b.name));
}
