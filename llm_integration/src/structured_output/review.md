# 🔍 LEVEL 3 CODE REVIEW (SERIOUS MODE)

---

# ✅ Task 7 Review (JSON Enforcer)

### 👍 What you did right:

- ✔ Retry system (`MAX_TRIES`) → good instinct
- ✔ JSON validation via `JSON.parse` → correct
- ✔ Low temperature (0.2) → smart for structured output
- ✔ Recursive retry → good approach

---

## ⚠️ Problem 1: Global `MAX_TRIES` (BIG ISSUE)

```ts
let MAX_TRIES = 3;
```

❌ This is **global state**

### 💥 Problem:

- Multiple requests → shared state → bugs
- One failure affects next request

---

### ✅ Fix:

Move inside function:

```ts
const askQuestion = async (query: string, retries = 3): Promise<any> => {
  if (retries <= 0) {
    return "AI failed to generate valid JSON";
  }
```

Then:

```ts
return askQuestion(query, retries - 1);
```

---

## ⚠️ Problem 2: Weak Prompt

```ts
Return Response in valid json format.
```

❌ Too weak

---

### ✅ Make it strict:

```ts
content: `
You MUST return ONLY valid JSON.
Do NOT include any explanation or text outside JSON.

Schema:
{
  "title": string,
  "summary": string
}
`;
```

---

## ⚠️ Problem 3: No logging for debugging

👉 You are not seeing what AI returned when it fails.

---

### ✅ Add this:

```ts
const raw = res.choices[0].message.content || "";
console.log("RAW AI:", raw);
```

---

---

# ✅ Task 8 Review (Zod + Structured Parsing)

Now this is where I can see **real progress** 👇

---

### 👍 What you did right:

- ✔ Used `zod` schema → perfect
- ✔ Used `zodTextFormat` → advanced usage 🔥
- ✔ Structured parsing via `responses.parse` → very good
- ✔ Retry logic exists

---

## ⚠️ Problem 1: Recursive call NOT returned

```ts
askQuestion(query);
```

❌ You forgot `return`

---

### 💥 Result:

- Function doesn’t wait for retry
- Returns `undefined`

---

### ✅ Fix:

```ts
return askQuestion(query);
```

---

---

## ⚠️ Problem 2: `checkJson` naming is misleading

```ts
const checkJson = (json: any)
```

👉 This is NOT JSON check anymore
👉 This is schema validation

---

### ✅ Rename:

```ts
const validateOutput = (data: unknown)
```

---

---

## ⚠️ Problem 3: Double validation (unnecessary)

You already use:

```ts
responses.parse + zodTextFormat;
```

👉 This already enforces structure

Then again:

```ts
outputSchemea.parse(json);
```

👉 Redundant

---

### 💡 Insight:

With `zodTextFormat`, retries are handled internally sometimes.

You can simplify.

---

---

# ✅ Task 9 Review (AI API — THIS IS IMPORTANT)

This is your first **real backend AI service**.

---

### 👍 What you did right:

- ✔ Express setup → clean
- ✔ Schema validation → good
- ✔ Retry logic → correct direction
- ✔ API endpoint → working structure

---

## ⚠️ Problem 1: Same `MAX_TRIES` global issue

Again:

```ts
let MAX_TRIES = 3;
```

❌ Same bug

---

### ✅ Fix:

Pass as parameter:

```ts
const aiCall = async (query: string, retries = 3)
```

---

---

## ⚠️ Problem 2: Response sent twice (CRITICAL BUG)

```ts
if (checkValidation(aiRes)) {
  res.json(aiRes);
}
res.json({ erro: true, message: aiRes });
```

💥 This will crash:

> “Cannot set headers after they are sent”

---

### ✅ Fix:

```ts
if (checkValidation(aiRes)) {
  return res.json(aiRes);
}

return res.json({ error: true, message: aiRes });
```

---

---

## ⚠️ Problem 3: Validation misuse

```ts
if (checkValidation(aiRes))
```

But `aiRes` can be:

- string (error)
- object (valid)

---

### ✅ Fix:

Better typing:

```ts
if (typeof aiRes !== "string") {
  return res.json(aiRes);
}
```

---

---

## ⚠️ Problem 4: No input validation

```ts
const { text } = req.body;
```

❌ What if:

- `text` missing?
- not string?

---

### ✅ Add:

```ts
if (!text || typeof text !== "string") {
  return res.status(400).json({ error: "Invalid input" });
}
```

---

---

# 🧠 Overall Evaluation

You are now:

> 🔥 **Intermediate AI Backend Developer (Early Stage)**

Why?

- You understand structure ✔
- You implemented retries ✔
- You used schema validation ✔
- You built API ✔

Mistakes are:
👉 architectural (which is GOOD — means you're growing)

---

---

# ⚡ What You Should Fix NOW

### Must fix:

1. ❌ Global `MAX_TRIES`
2. ❌ Missing `return` in recursion
3. ❌ Double `res.json`
4. ❌ Weak prompts

---

---

# 🧪 Final Upgrade Challenge (VERY IMPORTANT)

Before Level 4:

👉 Upgrade your API:

### Add:

```json
{
  "title": "",
  "summary": "",
  "keywords": []
}
```

---

### And:

- Retry with **stricter prompt on failure**
- Log failures
- Return clean error responses

---

---

# 🚀 What This Means for YOU

Now you can:

- Build APIs ✔
- Structure AI output ✔
- Validate + retry ✔

👉 You are now capable of building:

- SaaS tools
- AI features in apps
- Your repo analyzer properly
