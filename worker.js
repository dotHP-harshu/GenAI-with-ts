/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║   Cloudflare Worker — OpenAI-Compatible AI Gateway (CF AI Binding)      ║
 * ║                                                                          ║
 * ║   Powered by Cloudflare Workers AI (env.AI binding)                     ║
 * ║   Fully compatible with the official openai-node SDK v4+                ║
 * ║                                                                          ║
 * ║   Routes:                                                                ║
 * ║   ✅ GET  /v1/models                                                     ║
 * ║   ✅ POST /v1/chat/completions  — streaming & non-streaming              ║
 * ║   ✅ POST /v1/embeddings                                                 ║
 * ║   ✅ POST /v1/responses         — OpenAI Responses API shape             ║
 * ║   ✅ POST /v1/rag               — custom RAG endpoint                    ║
 * ║   ✅ GET  /                     — health check                           ║
 * ║                                                                          ║
 * ║   Environment variables (wrangler.toml / Cloudflare dashboard):         ║
 * ║     AI          – Cloudflare Workers AI binding (required)              ║
 * ║     API_KEY     – Secret key clients must send as Bearer token          ║
 * ║     VECTOR_DB   – KV namespace for RAG context (optional)               ║
 * ║                                                                          ║
 * ║   SDK usage:                                                             ║
 * ║     import OpenAI from 'openai';                                         ║
 * ║     const client = new OpenAI({                                          ║
 * ║       apiKey: '<your API_KEY env var value>',                            ║
 * ║       baseURL: 'https://your-worker.workers.dev/v1',                    ║
 * ║     });                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * wrangler.toml example:
 *   [ai]
 *   binding = "AI"
 *
 * If your binding is still named HARSH_PRAJAPATI, change AI_BINDING_NAME below.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

/** Change to match your wrangler.toml [ai] binding name */
const AI_BINDING_NAME = "AI";

const WORKER_VERSION = "2.0.0";

const DEFAULT_CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const DEFAULT_EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";

/**
 * Models exposed on GET /v1/models.
 * Add or remove entries to match what your CF account has access to.
 */
const SUPPORTED_MODELS = [
    { id: "@cf/meta/llama-3.1-8b-instruct", owned_by: "cloudflare", created: 1700000000 },
    { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", owned_by: "cloudflare", created: 1700000001 },
    { id: "@cf/mistral/mistral-7b-instruct-v0.1", owned_by: "cloudflare", created: 1700000002 },
    { id: "@cf/google/gemma-7b-it", owned_by: "cloudflare", created: 1700000003 },
    { id: "@cf/baai/bge-base-en-v1.5", owned_by: "cloudflare", created: 1700000004 },
    { id: "@cf/baai/bge-large-en-v1.5", owned_by: "cloudflare", created: 1700000005 },
    { id: "@cf/openai/gpt-oss-20b", owned_by: "cloudflare", created: 1700000006 },
];

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        // Resolve the AI binding — support both custom names and the standard "AI"
        const ai = env[AI_BINDING_NAME] ?? env.AI ?? env.HARSH_PRAJAPATI;

        const url = new URL(request.url);
        const method = request.method.toUpperCase();

        // CORS preflight
        if (method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        // Health check — GET /
        if (method === "GET" && (url.pathname === "/" || url.pathname === "")) {
            return json({
                status: "ok",
                version: WORKER_VERSION,
                message: "Cloudflare AI Gateway is running.",
                models_endpoint: "/v1/models",
            });
        }

        // Guard: AI binding must exist
        if (!ai) {
            return apiError(
                `Workers AI binding '${AI_BINDING_NAME}' is not configured. ` +
                `Check your wrangler.toml [ai] section.`,
                "server_error", 500,
            );
        }

        // Authentication
        const authErr = authenticate(request, env);
        if (authErr) return authErr;

        // Route dispatch
        try {
            const route = `${method} ${url.pathname}`;
            switch (route) {
                case "GET /v1/models": return handleModels();
                case "POST /v1/chat/completions": return handleChat(request, ai);
                case "POST /v1/embeddings": return handleEmbeddings(request, ai);
                case "POST /v1/responses": return handleResponses(request, ai);
                case "POST /v1/rag": return handleRag(request, ai, env);
                default:
                    return apiError(
                        `Unknown route '${method} ${url.pathname}'. ` +
                        `Available: GET /v1/models, POST /v1/chat/completions, ` +
                        `POST /v1/embeddings, POST /v1/responses, POST /v1/rag`,
                        "invalid_request_error", 404,
                    );
            }
        } catch (err) {
            console.error("[worker] Unhandled error:", err);
            return apiError(err?.message ?? "Unexpected server error.", "server_error", 500);
        }
    },
};

// ─── Authentication ───────────────────────────────────────────────────────────

function authenticate(request, env) {
    const header = request.headers.get("Authorization") ?? "";
    const spaceIdx = header.indexOf(" ");
    const scheme = spaceIdx === -1 ? header : header.slice(0, spaceIdx);
    const token = spaceIdx === -1 ? "" : header.slice(spaceIdx + 1).trim();

    if (scheme !== "Bearer" || !token) {
        return apiError(
            "No API key provided. Include 'Authorization: Bearer <key>' in your request.",
            "authentication_error", 401,
        );
    }

    if (!env.API_KEY) {
        // No key configured — open access (useful for local dev / testing)
        return null;
    }

    if (!timingSafeEqual(token, env.API_KEY)) {
        return apiError("Incorrect API key.", "authentication_error", 401);
    }

    return null;
}

/**
 * Synchronous constant-time string comparison.
 * Prevents timing-oracle attacks on the API key.
 */
function timingSafeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const ta = new TextEncoder().encode(a);
    const tb = new TextEncoder().encode(b);
    if (ta.length !== tb.length) return false;
    let diff = 0;
    for (let i = 0; i < ta.length; i++) diff |= ta[i] ^ tb[i];
    return diff === 0;
}

// ─── GET /v1/models ───────────────────────────────────────────────────────────

function handleModels() {
    return json({
        object: "list",
        data: SUPPORTED_MODELS.map((m) => ({
            id: m.id,
            object: "model",
            created: m.created,
            owned_by: m.owned_by,
        })),
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST /v1/chat/completions
// ══════════════════════════════════════════════════════════════════════════════

async function handleChat(request, ai) {
    let body;
    try { body = await request.json(); }
    catch { return apiError("Request body is not valid JSON.", "invalid_request_error", 400); }

    const validErr = validateChatBody(body);
    if (validErr) return validErr;

    const model = body.model ?? DEFAULT_CHAT_MODEL;
    const isStream = body.stream === true;
    const maxTokens = clampInt(body.max_completion_tokens ?? body.max_tokens, 1, 8192, 1024);
    const temperature = clampFloat(body.temperature, 0, 2, 0.7);
    const topP = clampFloat(body.top_p, 0, 1, 1.0);
    const tools = normalizeCFTools(body.tools);
    const toolChoice = resolveToolChoice(body.tool_choice, tools);

    if (isStream) {
        return handleChatStream(body, { model, maxTokens, temperature, topP, tools, toolChoice }, ai);
    }

    // ── Non-streaming ──────────────────────────────────────────────────────────
    let aiResponse;
    try {
        aiResponse = await ai.run(
            model,
            buildCFPayload(model, body.messages, { maxTokens, temperature, topP, tools, toolChoice }),
        );
    } catch (err) {
        return cfAiError(model, err);
    }

    const content = extractContent(aiResponse);
    const toolCalls = normalizeToolCalls(aiResponse);
    const finishReason = toolCalls?.length ? "tool_calls" : "stop";
    const usage = resolveUsage(aiResponse.usage, body.messages, content ?? "");

    return json({
        id: `chatcmpl-${uuid()}`,
        object: "chat.completion",
        created: nowSec(),
        model,
        system_fingerprint: "fp_cf_worker",
        choices: [{
            index: 0,
            message: buildAssistantMessage(content, toolCalls),
            logprobs: null,
            finish_reason: finishReason,
        }],
        usage,
    });
}

// ─── Chat Completions — streaming ─────────────────────────────────────────────

function handleChatStream(body, opts, ai) {
    const { model, maxTokens, temperature, topP, tools, toolChoice } = opts;
    const id = `chatcmpl-${uuid()}`;
    const created = nowSec();

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();

    const write = (str) => writer.write(enc.encode(str));
    const writeSSE = (obj) => write(`data: ${JSON.stringify(obj)}\n\n`);
    const writeDone = () => write("data: [DONE]\n\n");

    /** Builds a ChatCompletionChunk object — matches OpenAI's exact SSE schema */
    const chunk = (delta, finishReason = null, extra = {}) => ({
        id, object: "chat.completion.chunk", created, model,
        system_fingerprint: "fp_cf_worker",
        choices: [{ index: 0, delta, finish_reason: finishReason, logprobs: null }],
        ...extra,
    });

    (async () => {
        let completionTokens = 0;
        try {
            let aiResponse;
            try {
                aiResponse = await ai.run(
                    model,
                    buildCFPayload(model, body.messages, { maxTokens, temperature, topP, tools, toolChoice, stream: true }),
                );
            } catch (err) {
                // Emit an OpenAI-format error event so the SDK throws properly
                await writeSSE({
                    error: {
                        message: `Model '${model}' failed: ${err?.message ?? "unknown error"}`,
                        type: "server_error", param: null, code: null,
                    },
                });
                return;
            }

            // Role-only chunk — matches OpenAI's first SSE frame exactly
            await writeSSE(chunk({ role: "assistant", content: "" }));

            // Content delta chunks
            for await (const part of aiResponse) {
                const delta = extractContent(part);
                if (!delta) continue;
                completionTokens += estimateTokens([{ role: "assistant", content: delta }]);
                await writeSSE(chunk({ content: delta }));
            }

            // Final stop chunk with usage stats
            const promptTokens = estimateTokens(body.messages);
            await writeSSE(chunk({}, "stop", {
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: promptTokens + completionTokens,
                },
            }));

            await writeDone();

        } catch (err) {
            try {
                await writeSSE({
                    error: { message: err?.message ?? "Stream error", type: "server_error", param: null, code: null },
                });
                await writeDone();
            } catch { /* client disconnected */ }
        } finally {
            try { await writer.close(); } catch { /* already closed */ }
        }
    })();

    return new Response(readable, {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            ...corsHeaders(),
        },
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST /v1/responses  (OpenAI Responses API shape)
// ══════════════════════════════════════════════════════════════════════════════

async function handleResponses(request, ai) {
    let body;
    try { body = await request.json(); }
    catch { return apiError("Request body is not valid JSON.", "invalid_request_error", 400); }

    if (!body.model) return apiError("'model' is required.", "invalid_request_error", 400, "model");
    if (body.input == null) return apiError("'input' is required.", "invalid_request_error", 400, "input");

    const model = body.model;
    const maxTokens = clampInt(body.max_completion_tokens ?? body.max_output_tokens ?? body.max_tokens, 1, 8192, 1024);
    const temperature = clampFloat(body.temperature, 0, 2, 0.7);
    const topP = clampFloat(body.top_p, 0, 1, 1.0);
    const tools = normalizeCFTools(filterFunctionTools(body.tools));
    const toolChoice = resolveToolChoice(body.tool_choice, tools);

    const messages = buildMessagesFromInput(body.input, body.instructions);
    if (messages.length === 0) {
        return apiError("'input' produced an empty message list.", "invalid_request_error", 400, "input");
    }

    let aiResponse;
    try {
        aiResponse = await ai.run(model, buildCFPayload(model, messages, { maxTokens, temperature, topP, tools, toolChoice }));
    } catch (err) {
        return cfAiError(model, err);
    }

    const toolCalls = normalizeToolCalls(aiResponse);
    const outputItems = [];

    if (!toolCalls?.length) {
        outputItems.push(buildResponseMessageItem(extractContent(aiResponse) ?? ""));
    } else {
        for (const tc of toolCalls) {
            outputItems.push({
                type: "function_call",
                id: `fc_${uuid()}`,
                call_id: tc.id,
                name: tc.function.name,
                arguments: tc.function.arguments,
            });
        }
    }

    const textItem = outputItems.find((i) => i.type === "message");
    const outputText = textItem?.content?.find((c) => c.type === "output_text")?.text ?? null;
    const usage = aiResponse.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

    return json({
        id: `resp_${uuid()}`,
        object: "response",
        created_at: nowSec(),
        model,
        status: toolCalls?.length ? "in_progress" : "completed",
        output: outputItems,
        output_text: outputText,   // convenience field matching client.responses.create() behaviour
        usage,
    });
}

function buildMessagesFromInput(input, instructions) {
    let msgs = [];

    if (typeof input === "string") {
        msgs = [{ role: "user", content: input }];
    } else if (Array.isArray(input)) {
        msgs = input.map((item) => {
            if (Array.isArray(item.content)) {
                const text = item.content
                    .map((c) => (typeof c === "string" ? c : c?.text ?? c?.content ?? ""))
                    .join("");
                return { role: item.role ?? "user", content: text };
            }
            return item;
        });
    }

    if (instructions && (msgs.length === 0 || msgs[0].role !== "system")) {
        msgs = [{ role: "system", content: instructions }, ...msgs];
    }
    return msgs;
}

function filterFunctionTools(tools) {
    if (!Array.isArray(tools) || tools.length === 0) return null;
    const fn = tools.filter((t) => t?.type === "function");
    return fn.length > 0 ? fn : null;
}

function buildResponseMessageItem(text) {
    return {
        type: "message",
        id: `msg_${uuid()}`,
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text, annotations: [] }],
    };
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST /v1/embeddings
// ══════════════════════════════════════════════════════════════════════════════

async function handleEmbeddings(request, ai) {
    let body;
    try { body = await request.json(); }
    catch { return apiError("Request body is not valid JSON.", "invalid_request_error", 400); }

    if (body.input == null) return apiError("'input' is required.", "invalid_request_error", 400, "input");

    const model = body.model ?? DEFAULT_EMBED_MODEL;
    const inputs = Array.isArray(body.input) ? body.input : [body.input];
    const encodingFormat = body.encoding_format ?? "float";

    if (!inputs.every((s) => typeof s === "string")) {
        return apiError("All items in 'input' must be strings.", "invalid_request_error", 400, "input");
    }

    let cfResponse;
    try { cfResponse = await ai.run(model, { text: inputs }); }
    catch (err) { return cfAiError(model, err); }

    // CF returns { data: [ { values: [...] } ] } or a bare array
    const raw = cfResponse?.data ?? cfResponse;
    const data = (Array.isArray(raw) ? raw : [raw]).map((emb, index) => {
        const vector = Array.isArray(emb) ? emb : (emb?.values ?? emb?.embedding ?? []);
        return {
            object: "embedding",
            index,
            embedding: encodingFormat === "base64" ? float32ArrayToBase64(vector) : vector,
        };
    });

    const promptTokens = inputs.reduce((n, s) => n + Math.ceil(s.length / 4), 0);

    return json({
        object: "list",
        data,
        model,
        usage: { prompt_tokens: promptTokens, total_tokens: promptTokens },
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST /v1/rag
// ══════════════════════════════════════════════════════════════════════════════

async function handleRag(request, ai, env) {
    let body;
    try { body = await request.json(); }
    catch { return apiError("Request body is not valid JSON.", "invalid_request_error", 400); }

    if (typeof body.query !== "string" || !body.query.trim()) {
        return apiError("'query' must be a non-empty string.", "invalid_request_error", 400, "query");
    }

    const model = body.model ?? DEFAULT_CHAT_MODEL;
    const namespace = body.namespace ?? "docs";

    let context = "";
    if (env.VECTOR_DB) {
        try { context = (await env.VECTOR_DB.get(namespace)) ?? ""; }
        catch (err) { console.warn("[rag] KV lookup failed:", err); }
    }

    const systemPrompt = context.trim()
        ? `You are a helpful assistant. Answer using only the context below.\n\n─── CONTEXT ───\n${context.trim()}`
        : "You are a helpful assistant.";

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.query },
    ];

    let aiResponse;
    try { aiResponse = await ai.run(model, buildCFPayload(model, messages)); }
    catch (err) { return cfAiError(model, err); }

    return json({
        id: `rag-${uuid()}`,
        object: "rag.completion",
        created: nowSec(),
        model,
        query: body.query,
        namespace,
        has_context: context.length > 0,
        response: extractContent(aiResponse) ?? "",
    });
}

// ─── CF AI payload builder ────────────────────────────────────────────────────

/** Models that support native function/tool-calling on CF Workers AI */
function isToolCapable(model) {
    return (
        typeof model === "string" &&
        (model.includes("llama-3.1") || model.includes("llama-3.3"))
    );
}

/**
 * Sanitize messages for Cloudflare Workers AI:
 *
 * Problem 1 — CF Error 5006: CF AI rejects array-typed content; must be a string.
 * Problem 2 — Tool messages must include `name` (the called function's name),
 *             or the model enters an infinite loop. We resolve this from a
 *             pre-built map of tool_call_id → function.name.
 * Problem 3 — Non-tool-capable models crash on tool_calls / tool role messages.
 *             We downgrade those gracefully.
 */
function sanitizeMessages(messages, allowTools) {
    // Pre-scan: build tool_call_id → function name map from the full history
    const toolCallNameMap = {};
    for (const m of messages) {
        if (Array.isArray(m.tool_calls)) {
            for (const tc of m.tool_calls) {
                if (tc?.id && tc?.function?.name) {
                    toolCallNameMap[tc.id] = tc.function.name;
                }
            }
        }
    }

    return messages.map((m) => {
        const textContent = flattenContent(m.content);
        const clean = { role: m.role, content: textContent };

        if (allowTools) {
            // Preserve tool_calls on assistant messages
            if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
                clean.tool_calls = m.tool_calls;
            }
            // Tool result messages — CF requires `name`
            if (m.role === "tool" && m.tool_call_id) {
                clean.tool_call_id = m.tool_call_id;
                clean.name = m.name
                    ?? toolCallNameMap[m.tool_call_id]
                    ?? "unknown_function";
            }
        } else {
            // Non-tool model: downgrade to plain user messages
            if (m.role === "tool") {
                clean.role = "user";
                clean.content = `[Tool Result for ${m.name ?? m.tool_call_id ?? "unknown"}]: ${textContent}`;
            }
            if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
                const names = m.tool_calls.map((tc) => tc.function?.name ?? "unknown").join(", ");
                clean.content = (clean.content ? clean.content + "\n" : "") +
                    `[Assistant requested tool call(s): ${names}]`;
            }
        }

        return clean;
    });
}

function flattenContent(content) {
    if (content == null) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((c) => (typeof c === "string" ? c : c?.text ?? c?.content ?? ""))
            .join("");
    }
    return String(content);
}

function buildCFPayload(model, messages, opts = {}) {
    const { maxTokens, temperature, topP, tools, toolChoice, stream } = opts;
    const allowTools = isToolCapable(model);
    const safeMessages = sanitizeMessages(messages, allowTools);

    const payload = {
        messages: safeMessages,
        max_tokens: maxTokens ?? 1024,
    };

    if (temperature != null) payload.temperature = temperature;
    if (topP != null && topP > 0) payload.top_p = topP;
    if (stream === true) payload.stream = true;

    if (allowTools && tools?.length) {
        payload.tools = tools;
        if (toolChoice) payload.tool_choice = toolChoice;
    }

    return payload;
}

// ─── Tool helpers ─────────────────────────────────────────────────────────────

/**
 * Normalise tools from OpenAI SDK shape → CF AI shape.
 * CF accepts the same { type, function: { name, description, parameters } }
 * structure, so this is mainly validation + stripping unknowns.
 */
function normalizeCFTools(tools) {
    if (!Array.isArray(tools) || tools.length === 0) return null;
    return tools
        .filter((t) => t?.type === "function" && t?.function?.name)
        .map((t) => ({
            type: "function",
            function: {
                name: t.function.name,
                description: t.function.description ?? "",
                parameters: t.function.parameters ?? { type: "object", properties: {} },
            },
        }));
}

function resolveToolChoice(toolChoice, tools) {
    if (!tools?.length) return undefined;
    return toolChoice ?? "auto";
}

/**
 * Extract tool calls from a CF AI response.
 * CF may return them at the top level or nested inside choices[0].message.
 */
function normalizeToolCalls(res) {
    if (!res) return null;

    let raw = null;
    if (Array.isArray(res.tool_calls) && res.tool_calls.length > 0) {
        raw = res.tool_calls;
    } else if (Array.isArray(res.choices?.[0]?.message?.tool_calls)) {
        raw = res.choices[0].message.tool_calls;
    }

    if (!raw?.length) return null;

    return raw.map((tc) => {
        const rawArgs = tc?.function?.arguments ?? tc?.arguments ?? "{}";
        const args = typeof rawArgs === "string" ? rawArgs : JSON.stringify(rawArgs);
        return {
            id: tc.id ?? `call_${uuid().replace(/-/g, "").slice(0, 24)}`,
            type: "function",
            function: {
                name: tc?.function?.name ?? tc?.name ?? "unknown",
                arguments: args,
            },
        };
    });
}

// ─── Content extraction ───────────────────────────────────────────────────────

function extractContent(res) {
    if (!res) return null;
    if (typeof res === "string") return res;
    if (typeof res.response === "string") return res.response;
    if (Array.isArray(res.choices) && res.choices.length > 0) {
        return res.choices[0]?.message?.content
            ?? res.choices[0]?.delta?.content
            ?? res.choices[0]?.text
            ?? null;
    }
    return null;
}

function buildAssistantMessage(content, toolCalls) {
    const msg = { role: "assistant", content: content ?? null };
    if (toolCalls?.length) msg.tool_calls = toolCalls;
    return msg;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateChatBody(body) {
    if (typeof body !== "object" || body === null) {
        return apiError("Request body must be a JSON object.", "invalid_request_error", 400);
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return apiError("'messages' must be a non-empty array.", "invalid_request_error", 400, "messages");
    }
    const validRoles = new Set(["developer", "system", "user", "assistant", "tool", "function"]);
    for (let i = 0; i < body.messages.length; i++) {
        if (!validRoles.has(body.messages[i]?.role)) {
            return apiError(
                `messages[${i}].role must be one of: ${[...validRoles].join(", ")}.`,
                "invalid_request_error", 400, "messages",
            );
        }
    }
    return null;
}

// ─── Usage resolution ─────────────────────────────────────────────────────────

function resolveUsage(cfUsage, messages, content) {
    if (cfUsage && (cfUsage.prompt_tokens > 0 || cfUsage.completion_tokens > 0)) {
        return {
            prompt_tokens: cfUsage.prompt_tokens ?? 0,
            completion_tokens: cfUsage.completion_tokens ?? 0,
            total_tokens: cfUsage.total_tokens ?? 0,
        };
    }
    const pt = estimateTokens(messages);
    const ct = estimateTokens([{ role: "assistant", content }]);
    return { prompt_tokens: pt, completion_tokens: ct, total_tokens: pt + ct };
}

// ─── Response / error builders ────────────────────────────────────────────────

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
    });
}

/**
 * Returns an OpenAI error envelope:
 *   { error: { message, type, param, code } }
 *
 * This is the exact shape that APIError.generate() in the openai-node SDK
 * parses to throw the right typed exception (BadRequestError, AuthenticationError, etc.)
 */
function apiError(message, type = "invalid_request_error", status = 400, param = null, code = null) {
    return json({ error: { message, type, param, code } }, status);
}

function cfAiError(model, err) {
    const msg = err?.message ?? "";
    if (msg.includes("429") || /rate.?limit/i.test(msg)) {
        return apiError(`Rate limit reached for model '${model}'.`, "rate_limit_error", 429, null, "rate_limit_exceeded");
    }
    if (msg.includes("404") || /not.?found/i.test(msg) || /unknown model/i.test(msg)) {
        return apiError(`Model '${model}' not found or not available in your account.`, "invalid_request_error", 404, "model", "model_not_found");
    }
    if (msg.includes("401") || /unauthorized/i.test(msg)) {
        return apiError(`Authentication failed for model '${model}'.`, "authentication_error", 401);
    }
    return apiError(`Model '${model}' returned an error: ${msg}`, "server_error", 500, null, "model_error");
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Stainless-Lang, X-Stainless-Package-Version, X-Stainless-OS, X-Stainless-Runtime, X-Stainless-Runtime-Version, OpenAI-Beta",
        "Access-Control-Max-Age": "86400",
    };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Rough token estimator (~4 chars/token + 10/message overhead).
 * Used only when CF AI doesn't return usage stats.
 */
function estimateTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((n, m) => {
        return n + Math.ceil(flattenContent(m.content).length / 4) + 10;
    }, 0);
}

function uuid() { return crypto.randomUUID(); }
function nowSec() { return Math.floor(Date.now() / 1000); }

function clampInt(val, min, max, fallback) {
    const n = parseInt(val, 10);
    return isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}

function clampFloat(val, min, max, fallback) {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}

function float32ArrayToBase64(floats) {
    const bytes = new Uint8Array(new Float32Array(floats).buffer);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
}