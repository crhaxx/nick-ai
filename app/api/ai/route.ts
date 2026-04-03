export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    // #region agent log
    fetch("http://127.0.0.1:7719/ingest/38ca6b70-5d22-4153-85c4-f4146009ad6d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b25a37",
      },
      body: JSON.stringify({
        sessionId: "b25a37",
        runId: "initial",
        hypothesisId: "H1",
        location: "app/api/ai/route.ts:POST:after-json",
        message: "API route received prompt",
        data: { hasPrompt: Boolean(prompt), promptLength: String(prompt ?? "").length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:1.5b",
        messages: [{ role: "user", content: prompt }],
        stream: true
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(errorText, { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value);
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const data = JSON.parse(line);
                const content = data.message?.content || data.content || "";
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {}
            }
          }
        } catch {}
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7719/ingest/38ca6b70-5d22-4153-85c4-f4146009ad6d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b25a37",
      },
      body: JSON.stringify({
        sessionId: "b25a37",
        runId: "initial",
        hypothesisId: "H3",
        location: "app/api/ai/route.ts:POST:catch",
        message: "API route threw in catch",
        data: { reason: "request_parse_or_model_fetch_error" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json(
        { response: "Request timed out (120s). Ollama may be slow or unresponsive." },
        { status: 504 }
      );
    }
    return Response.json(
      { response: "Failed to process request." },
      { status: 500 }
    );
  }
}
