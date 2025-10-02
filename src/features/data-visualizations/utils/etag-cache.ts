type Key = string;

class EtagCache {
  private etags = new Map<Key, string>();
  private payloads = new Map<Key, unknown>();

  keyFrom(url: string, params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && usp.set(k, v));
    return `${url}?${usp.toString()}`;
  }

  getEtag(key: Key) {
    return this.etags.get(key);
  }
  set(key: Key, etag: string | null | undefined, payload: unknown) {
    if (etag) this.etags.set(key, etag);
    this.payloads.set(key, payload);
  }
  getPayload<T>(key: Key) {
    return this.payloads.get(key) as T | undefined;
  }
}

export const etagCache = new EtagCache();
