export interface SSEHandlers {
  onLog?: (message: string) => void;
  onComplete?: (data: any) => void;
  onError?: (message: string) => void;
}

export async function readSSEStream(
  response: Response,
  handlers: SSEHandlers
): Promise<"completed" | "error"> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalStatus: "completed" | "error" = "completed";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "log") {
            handlers.onLog?.(event.message);
          } else if (event.type === "complete") {
            handlers.onComplete?.(event);
            finalStatus = "completed";
          } else if (event.type === "error") {
            handlers.onError?.(event.message);
            finalStatus = "error";
          }
        } catch {
          // ignore malformed events
        }
      }
    }
  }

  return finalStatus;
}
