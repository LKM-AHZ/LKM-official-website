import type { APIRoute } from "astro";
import { apiFetch } from "~/lib/api/fetch";

const MAX_BODY = 16_384;
const allowedHosts = new Set(
  (process.env.AI_ALLOWED_HOSTS || "api.openai.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY)
    return new Response("Request too large", { status: 413 });

  let input: {
    endpoint?: string;
    apiKey?: string;
    model?: string;
    messages?: unknown;
    max_tokens?: number;
    temperature?: number;
  };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY)
      return new Response("Request too large", { status: 413 });
    input = JSON.parse(raw);
    if (!input || typeof input !== "object") throw new Error("Invalid input");
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(input.endpoint ?? "");
  } catch {
    return new Response("Invalid endpoint", { status: 400 });
  }
  if (
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.port ||
    endpoint.search ||
    endpoint.hash ||
    !allowedHosts.has(endpoint.hostname.toLowerCase())
  ) {
    return new Response("Endpoint not allowed", { status: 403 });
  }

  const path = endpoint.pathname.replace(/\/+$/, "");
  const completionPath = path.endsWith("/v1/chat/completions")
    ? path
    : path.endsWith("/v1")
      ? `${path}/chat/completions`
      : `${path}/v1/chat/completions`;
  const url = `${endpoint.origin}${completionPath}`;
  try {
    const result = await apiFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        max_tokens: input.max_tokens,
        temperature: input.temperature,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (result.isErr()) throw result.error;
    const upstream = result.value;
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return new Response("AI service unavailable", { status: 502 });
  }
};
