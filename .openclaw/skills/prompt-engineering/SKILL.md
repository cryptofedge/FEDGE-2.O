---
name: prompt-engineering
description: 'Advanced programmatic prompt engineering and reasoning architecture. Use when: (1) designing complex system prompts, (2) implementing reasoning patterns (CoT, ToT, GoT), (3) automating prompt optimization via DSPy, (4) reducing latency via Skeleton-of-Thought (SoT), (5) structuring few-shot examples for high-stakes tasks.'
metadata:
  {
    "openclaw":
      {
        "emoji": "🧪",
        "requires": { "anyBins": ["dspy", "python"] },
        "patterns": ["Chain-of-Thought", "Tree-of-Thought", "Graph-of-Thought", "Skeleton-of-Thought", "DSPy"]
      },
  }
---

# Prompt Engineering & Reasoning Architecture

This skill governs how FEDGE 2.O communicates with underlying LLMs and structures its reasoning processes. It transitions "prompting" from a creative task to a programmatic discipline.

## 2025 Reasoning Standards

### 1. Chain of Thought (CoT)
The baseline "Think step-by-step" approach. Use for logical deductions and math.
- **Note:** For Reasoning Models (o1, DeepSeek-R1), avoid manual CoT; instead, use clear constraints and let the model's internal "thought" handle the logic.

### 2. Tree of Thought (ToT)
Treat reasoning as a search tree.
- Generate multiple "thought branches."
- Evaluate each branch.
- Backtrack if a branch leads to a dead end.
- Use for strategic planning and debugging.

### 3. Graph of Thought (GoT)
The most advanced non-linear reasoning.
- Allow thoughts to **merge, split, and loop**.
- Combine disparate ideas into a new synthesis.
- Ideal for cross-referencing complex data or creative brainstorming.

### 4. Skeleton-of-Thought (SoT)
Optimized for high-speed, long-form generation.
1. **Skeleton:** Generate a high-level outline.
2. **Parallel Expansion:** Expand each point of the outline in parallel (multiple API calls).
3. **Aggregation:** Stitch the results into a cohesive final output.

## Programmatic Prompting (DSPy)

FEDGE 2.O uses **DSPy (Declarative Self-improving Language Programs)** to replace manual prompt hacking.
- **Signatures:** Define the task as `input -> output` (e.g., `context, question -> answer`).
- **Optimizers:** Give the system 50+ examples of "good" outputs, and it will automatically find the most effective prompt text for the specific model being used.
- **Model-Agnostic:** A prompt optimized for Claude may not work for GPT; DSPy handles the translation.

## Structure & Delimiters

Always use clear XML-style tags or Markdown headers to isolate context:
- `<context>` / `</context>`
- `<constraints>` / `</constraints>`
- `<examples>` / `</examples>`

---

## Learnings (August 2026 Upgrade)

- **Stop Hacking, Start Programming:** If a prompt fails, don't just change the words; change the **reasoning architecture** or add more structured examples.
- **Reasoning Budget:** For newer models, the prompt should manage the *depth* of thought rather than the *steps* of thought.
- **Metadata Gating:** Use prompts to extract structured metadata (JSON) alongside natural language for better downstream tool integration.
