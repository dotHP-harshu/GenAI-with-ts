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

---

# 🧠 LEVEL 2: Control the Model (DETAILED)

We’ll go task by task like before — but this time focus on **behavior + experimentation**

---

# ✅ Task 4: Temperature Playground

---

## 🎯 What you are building:

A CLI where you can **control randomness of AI**

---

## 🧠 Core Concept: Temperature

Think of temperature like:

| Value | Behavior         |
| ----- | ---------------- |
| 0     | Robotic, factual |
| 0.3   | Focused          |
| 0.7   | Balanced         |
| 1     | Creative         |
| 1.5+  | Chaotic          |

---

## 🛠 What you need to build:

### Step 1: Ask 2 inputs

```bash
Enter prompt:
Enter temperature:
```

---

### Step 2: Pass temperature to API

```ts
client.chat.completions.create({
  model: "...",
  messages: [...],
  temperature: temp
});
```

---

### Step 3: Print output

---

## 🔥 REAL PRACTICE (IMPORTANT)

Don’t just run once.

Test SAME prompt:

```bash
Explain recursion
```

Run with:

- 0
- 0.5
- 1

---

## 🧠 What you should observe:

- At `0` → short, direct
- At `1` → longer, creative, sometimes weird

---

## ⚠️ Mistake to avoid:

Don’t just “see output”

👉 Compare outputs side by side

---

## 💡 Upgrade (DO THIS)

Add:

```bash
/run 3
```

👉 Run same prompt 3 times → compare randomness

---

---

# ✅ Task 5: Output Length + Stop Control

---

## 🎯 What you are building:

Control **how much AI talks** and **when it stops**

---

## 🧠 Concepts:

### 1. max_tokens

Limits output size

```ts
max_tokens: 50;
```

---

### 2. stop sequences

Tell model:

> “Stop when you see this”

```ts
stop: ["END"];
```

---

## 🛠 What you need to build:

### Step 1: Extend CLI

```bash
Enter prompt:
Max tokens:
Stop word:
```

---

### Step 2: Pass params

```ts
client.chat.completions.create({
  model: "...",
  messages: [...],
  max_tokens: max,
  stop: [stopWord]
});
```

---

## 🔥 Practice Example

Prompt:

```bash
Write a story and end with END
```

---

## 🧠 What you should observe:

- Output cuts at stop word
- Output length changes with max_tokens

---

## ⚠️ Important Insight:

Even if:

> max_tokens = 100

AI might stop early.

Why?

👉 Because it thinks it's “complete”

---

## 💡 Upgrade

Force structure:

```txt
Write 5 points:
1.
2.
3.
4.
5.
END
```

---

---

# ✅ Task 6: Prompt Experiment Lab (MOST IMPORTANT)

---

## 🎯 What you are building:

A system to compare **different prompting styles**

---

## 🧠 Core Idea:

Same question → Different prompt → Different output

---

## 🛠 What you need to build:

### Step 1: Hardcode 3 prompt styles

---

### 🔹 1. Normal

```ts
"Explain closures in JavaScript";
```

---

### 🔹 2. Few-shot

```ts
Explain like this:

Example:
Q: What is variable?
A: A variable stores data.

Now:
Q: What is closure?
A:
```

---

### 🔹 3. Chain of Thought

```ts
Explain step by step:
1. Define closure
2. Give example
3. Explain use case
```

---

### Step 2: Run all 3 automatically

---

### Step 3: Print output like:

```bash
--- Normal ---
...

--- Few-shot ---
...

--- CoT ---
...
```

---

## 🧠 What you should observe:

- Few-shot → structured consistency
- CoT → deeper explanation
- Normal → random style

---

## ⚠️ Important:

Don’t just read — analyze:

Ask yourself:

- Which is best?
- Which is most consistent?
- Which is best for apps?

---

## 💡 Upgrade (VERY IMPORTANT)

Add:

```bash
/compare "your question"
```

👉 Run all 3 styles automatically

---

---

# 🧠 HOW LEVEL 2 CONNECTS

| Task   | What you gain           |
| ------ | ----------------------- |
| Task 4 | Control randomness      |
| Task 5 | Control size & stopping |
| Task 6 | Control thinking style  |

---

# ⚡ REAL POWER INSIGHT

After Level 2, you’ll realize:

> AI is NOT magic
> It’s a **configurable system**

---

# 🚫 Common Mistakes

### ❌ Mistake 1:

Ignoring parameters
👉 Most devs never touch them

---

### ❌ Mistake 2:

Testing once
👉 You must experiment repeatedly

---

### ❌ Mistake 3:

Thinking prompts are fixed
👉 Prompts = design tool

---

# 🧪 Final Challenge (IMPORTANT)

Build:

```bash
ai lab
```

Features:

- input prompt
- choose:
  - temperature
  - max_tokens

- run:
  - normal
  - few-shot
  - CoT
