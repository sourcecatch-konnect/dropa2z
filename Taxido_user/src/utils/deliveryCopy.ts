/** Convert presentation copy while keeping API keys and navigation names stable. */
export const deliveryCopy = <T>(value: T): T => {
  const replaceWord = (word: string, singular: string, plural: string) => {
    const replacement = word.toLowerCase().endsWith("s") ? plural : singular;
    if (word === word.toUpperCase()) return replacement.toUpperCase();
    return /^[A-Z]/.test(word) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
  };
  if (typeof value === "string") {
    return value
      .replace(/\brides?\b/gi, word => replaceWord(word, "delivery", "deliveries"))
      .replace(/\briders?\b/gi, word => replaceWord(word, "sender", "senders")) as T;
  }
  if (Array.isArray(value)) return value.map(item => deliveryCopy(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deliveryCopy(item)])) as T;
  }
  return value;
};
