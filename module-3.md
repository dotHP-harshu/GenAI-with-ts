# 🔥 Module 3: LLM Integration — Practice System

We’ll divide this into **4 levels**:

1. **Core Practice (Basics)**
2. **Control Practice (Parameters + Behavior)**
3. **Structured Output Practice**
4. **Mini Projects (Real Use)**

Each level = multiple tasks you should code yourself.

---

# 🧠 LEVEL 1: Core API Practice (Foundation)

### 🎯 Goal:

Understand how LLM actually works in code (input → output)

---

### ✅ Task 1: Basic Prompt Runner

Create a Node.js script:

```js
// input: user question
// output: AI response
```

**Your task:**

- Take input from terminal (`readline`)
- Send to LLM
- Print response

👉 Twist:

- Add a **command prefix**
  - `/code` → returns code
  - `/explain` → explains

---

### ✅ Task 2: System Prompt Control

Create 3 modes:

- Teacher
- Sarcastic friend
- Interviewer

```js
/system teacher
/system sarcastic
/system interviewer
```

👉 Change system prompt dynamically

---

### ✅ Task 3: Multi-turn Chat (Memory Lite)

Instead of single prompt:

- Maintain chat history in array

```js
messages = [
  { role: "system", content: "..." },
  { role: "user", content: "..." },
];
```

👉 Add:

- `/clear` → resets memory

---

# 🧠 LEVEL 2: Control the Model (Important)

### 🎯 Goal:

Understand how model behavior changes

---

### ✅ Task 4: Temperature Playground

Create UI in terminal:

```bash
Enter prompt:
Enter temperature:
```

Test:

- 0 → factual
- 1 → creative

👉 Print difference

---

### ✅ Task 5: Output Length Controller

Add:

- max tokens limit
- stop sequence

👉 Example:

- Stop at `"END"`

---

### ✅ Task 6: Prompt Experiment Lab

Try 3 prompts for same question:

- Normal
- Few-shot
- Chain of Thought

Compare outputs.

👉 This builds _real prompt intuition_

---

# 🧠 LEVEL 3: Structured Output (Very Important for Devs)

### 🎯 Goal:

Make AI usable in real apps

---

### ✅ Task 7: JSON Output Enforcer

Prompt:

```txt
Return response in JSON:
{
  "title": "",
  "summary": ""
}
```

👉 Parse JSON in Node.js

---

### ✅ Task 8: Zod Validation

Use schema:

```ts
const schema = z.object({
  title: z.string(),
  summary: z.string(),
});
```

👉 If invalid:

- Retry automatically

---

### ✅ Task 9: AI as API

Build endpoint:

```bash
POST /summarize
```

Input:

```json
{ "text": "..." }
```

Output:

```json
{ "summary": "..." }
```

---

# 🧠 LEVEL 4: Micro Projects (REAL LEARNING)

Now the important part 👇

---

## 🚀 Micro Project 1: Smart Code Explainer

Input:

- code snippet

Output:

- explanation
- complexity
- improvements

👉 Add:

- JSON output
- system prompt = "senior developer"

---

## 🚀 Micro Project 2: Prompt-Based Resume Analyzer

Input:

- resume text

Output:

```json
{
  "skills": [],
  "strength": "",
  "weakness": ""
}
```

---

## 🚀 Micro Project 3: AI CLI Assistant

Build your own:

```bash
ai "explain closures"
ai "generate react form"
```

👉 Add:

- memory
- modes

---

## 🚀 Micro Project 4: Blog Generator API

Input:

```json
{ "topic": "AI agents" }
```

Output:

- title
- blog
- tags

---

# ⚙️ Suggested Folder Structure

Keep things clean:

```
module-3/
│
├── basics/
├── params/
├── structured-output/
├── mini-projects/
│
└── utils/
    ├── llmClient.js
    ├── prompts.js
```

---

# 🧠 How to Actually Do This (Important)

Don’t do everything at once.

### Daily flow:

- Pick **1–2 tasks max**
- Code yourself (don’t copy)
- Break things → fix → understand

---

# ⚡ Bonus (Important for YOU specifically)

Since you're building:
👉 **GitHub Repo Analyzer**

You can connect Module 3 learning to it:

- Summarize files ✔
- Extract function meaning ✔
- Generate README parts ✔

---

# 🚫 One Mistake to Avoid

Don’t just:

> “make it work”

Instead ask:

- Why did this output come?
- What happens if I change prompt?
- What if JSON breaks?

---
