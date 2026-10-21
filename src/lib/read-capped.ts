/**
 * Reading a body without buffering more of it than a cap allows.
 *
 * Shared by the telemetry intake, whose bodies come from anyone, and the API
 * proxy, which reads a backend error body before filtering it (ADR-0034). Both
 * take a `Request` or a `Response`; only the headers and the stream are read.
 */
type CappedBody = { headers: Headers; body: ReadableStream<Uint8Array> | null };

export const discard = async (message: CappedBody): Promise<void> => {
  try {
    await message.body?.cancel();
  } catch {
    // The body was already consumed or the other side went away; nothing to release.
  }
};

/** The body as text, or `null` when it is larger than `maxBytes`. */
export const readCapped = async (message: CappedBody, maxBytes: number): Promise<string | null> => {
  // A declared length is a cheap first refusal. It is the sender's claim, so the
  // streamed count below is what actually enforces the cap.
  if (Number(message.headers.get("content-length")) > maxBytes) {
    await discard(message);
    return null;
  }
  if (!message.body) return "";

  const reader = message.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    bytes += value.byteLength;
    if (bytes > maxBytes) {
      // A failed cancel must not turn "too large" into "malformed".
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
};
