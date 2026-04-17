# 🔍 LEVEL 1 REVIEW (Your Code)

---

# ✅ Task 1 Review (Prompt Runner)

### 👍 What you did right:

- ✔ CLI loop → good
- ✔ Command handling (`/code`, `/explain`) → correct thinking
- ✔ Prompt modification → good
- ✔ Error handling → nice touch

---

### ⚠️ Problem (Important)

```ts
{
  role: "assistant",
  content: "You are a friendly ai assistant..."
}
```

❌ This is **wrong role usage**

👉 It should be:

```ts
role: "system";
```

---

### 💡 Why this matters:

- `system` = defines behavior
- `assistant` = previous AI response

Right now:
👉 You’re confusing the model slightly every time

---

### ✅ Fix:

```ts
messages: [
  {
    role: "system",
    content: "You are a friendly AI assistant...",
  },
  {
    role: "user",
    content: prompt,
  },
];
```

---

### ⚠️ Small Improvement

You’re passing:

```ts
User asked:
${ques}
```

👉 This still includes `/code` or `/explain`

❌ Not clean

---

### ✅ Better:

```ts
const actualText = ques.replace("/code", "").trim();
```

---

---

# ✅ Task 2 Review (System Modes)

### 👍 What you did right:

- ✔ Dynamic system switching → perfect
- ✔ Type safety (`type Systems`) → 🔥 good TypeScript usage
- ✔ Command parsing → clean

---

### ⚠️ Same mistake again:

```ts
role: "assistant";
```

❌ Should be:

```ts
role: "system";
```

---

### ⚠️ Design Improvement (Important)

Right now:

```ts
"You are a teacher, who give the satisfactory answers...";
```

👉 Weak prompts

---

### ✅ Make them stronger:

```ts
teacher: "Explain concepts clearly with simple examples like a teacher.",
sarcastic: "Respond sarcastically but still answer the question.",
interviewer: "Ask follow-up questions and guide like a real interviewer."
```

👉 Better prompts = better output

---

---

# ✅ Task 3 Review (Memory Chat)

### 👍 What you did right:

- ✔ Message array → correct
- ✔ Push user messages → correct
- ✔ Multi-turn concept → understood

---

### ❌ Critical Mistake

You are NOT storing AI responses.

```ts
return res.choices[0].message.content ?? "";
```

👉 but NOT doing:

```ts
messages.push({
  role: "assistant",
  content: aiReply,
});
```

---

### 💥 Why this is important:

Without this:

- AI forgets its own answers
- Conversation becomes broken

---

### ✅ Fix:

```ts
const aiReply = res.choices[0].message.content ?? "";

messages.push({
  role: "assistant",
  content: aiReply,
});

return aiReply;
```

---

---

### ❌ Another Issue

```ts
messages = [];
```

After `/clear`

👉 Now system prompt is gone

---

### ✅ Fix:

```ts
messages = [
  {
    role: "system",
    content: "You are a helpful assistant.",
  },
];
```

---

---

# 🧠 Overall Evaluation

### You are at:

👉 **Beginner → Early Intermediate (AI Dev)**

Why?

- You understand structure ✔
- You implemented logic yourself ✔
- Mistakes are conceptual (not syntax) ✔

That’s exactly where real learning starts.

---

# ⚡ What You Should Do NOW (before Level 2)

Fix these 3 things:

1. ✅ Replace `assistant` → `system`
2. ✅ Store AI responses in Task 3
3. ✅ Fix `/clear` to reset system properly

---

# 🧪 Mini Upgrade Challenge (DO THIS)

Before moving to Level 2:

👉 Add this feature:

```bash
/history
```

Output:

```bash
1. User: ...
2. AI: ...
3. User: ...
```

---

### Why?

This will:

- Strengthen your understanding of `messages`
- Prepare you for **RAG + Agents later**

---

# 🚀 Next Step

Once you:

- fix bugs
- complete `/history`
