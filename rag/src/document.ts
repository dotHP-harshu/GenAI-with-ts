export const document = `
# 📄 Internal Policy Document

## Company: **Nexora Systems Pvt. Ltd.**

**Document Type:** Employee & AI Usage Policy
**Version:** 1.3
**Last Updated:** January 2026
**Confidentiality Level:** Internal Use Only

---

## 1. Introduction

This document defines the operational, behavioral, and technical policies governing employees, contractors, and AI-assisted workflows at Nexora Systems Pvt. Ltd. (“Nexora”).

The purpose of this policy is to:

* Ensure data security and compliance
* Standardize AI usage across teams
* Define acceptable engineering practices
* Protect intellectual property

All personnel are required to read, understand, and comply with this document.

---

## 2. Definitions

**2.1 “AI System”**
Any software that generates outputs using machine learning models, including but not limited to LLMs, code generators, and autonomous agents.

**2.2 “Confidential Data”**
Includes:

* Customer information
* Internal APIs
* Source code (private repositories)
* Financial records

**2.3 “RAG System”**
A Retrieval-Augmented Generation system that retrieves internal documents and uses them in AI responses.

---

## 3. Acceptable Use of AI Tools

### 3.1 Allowed Use Cases

Employees may use AI systems for:

* Code generation and debugging
* Documentation drafting
* Internal knowledge search (via approved RAG systems)
* Test case generation

### 3.2 Restricted Use Cases

The following are strictly prohibited:

* Uploading confidential data to external AI services
* Using AI to generate production secrets (API keys, tokens)
* Autonomous deployment without human review
* Generating legal or financial advice without verification

---

## 4. AI Output Verification Policy

All AI-generated outputs must be reviewed before use.

### 4.1 Code Review Requirements

* All AI-generated code must pass peer review
* Must include test coverage ≥ 70%
* Security review required for authentication-related code

### 4.2 Content Validation

* Documentation must be verified for accuracy
* No direct copy-paste into production systems without validation

---

## 5. RAG System Guidelines

### 5.1 Approved Data Sources

Only the following may be indexed:

* Internal documentation
* Public technical resources
* Approved knowledge bases

### 5.2 Prohibited Data Sources

* Personal employee data
* Unencrypted databases
* Third-party licensed content without permission

### 5.3 Chunking Standard

All documents must follow:

* Chunk size: 300–800 tokens
* Overlap: 50–100 tokens
* Semantic boundaries preferred over fixed splits

---

## 6. Data Security Policy

### 6.1 Access Control

* Role-based access (RBAC) is mandatory
* Engineers may only access data relevant to their project

### 6.2 Encryption

* All data at rest must use AES-256 encryption
* Data in transit must use HTTPS/TLS 1.3

### 6.3 Logging

All AI interactions must be logged, including:

* User query
* Retrieved documents
* Final response

Retention period: **30 days**

---

## 7. Incident Handling

### 7.1 AI Misuse

If AI is used improperly:

1. Report within 24 hours
2. Disable affected systems
3. Conduct internal audit

### 7.2 Data Leak

In case of suspected data leak:

* Immediate access revocation
* Notify security team
* Regenerate compromised credentials

---

## 8. Engineering Standards

### 8.1 Backend Systems

* Must follow REST or GraphQL standards
* All APIs must include authentication
* Rate limiting required for public endpoints

### 8.2 Frontend Systems

* Must handle API errors gracefully
* Avoid exposing sensitive data in client-side code

### 8.3 AI Integration

* Use middleware for AI calls
* Avoid direct client-to-AI API communication
* Implement fallback responses

---

## 9. Cost Optimization Policy

AI usage must be optimized to reduce cost.

### 9.1 Guidelines

* Use smaller models where possible
* Cache frequent queries
* Limit max tokens per request

### 9.2 Monitoring

* Monthly usage reports required
* Alerts for abnormal usage spikes

---

## 10. Compliance and Violations

Failure to comply may result in:

* Access suspension
* Formal warning
* Termination (in severe cases)

---

## 11. Special Clause: Internal AI Assistant (“Nexa”)

Nexora maintains an internal AI assistant called **Nexa**.

### 11.1 Capabilities

* Answers internal queries using RAG
* Assists with debugging
* Provides architecture suggestions

### 11.2 Limitations

* Cannot access production databases directly
* Cannot execute code
* Cannot override human decisions

---

## 12. Final Notes

This policy is subject to updates. Employees are responsible for staying informed about the latest version.
`;
