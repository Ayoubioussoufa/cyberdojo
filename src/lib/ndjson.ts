/** Reads a stream of JSON objects, one per line, as they arrive. Works in the browser and in Node. */
export async function* jsonLines<T>(body: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let rest = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      rest += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = rest.split("\n");
      rest = done ? "" : (lines.pop() ?? "");
      for (const line of lines) if (line.trim()) yield JSON.parse(line) as T;
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}
