---
name: execution-playbook
description: "Use when: planning non-trivial tasks, verification-first implementation, subagent delegation, autonomous bug fixing, and iterative execution with clear checkpoints."
---

# Execution Playbook

## 1) Plan Mode Default
- Enter plan mode for any non-trivial task (3+ steps or architecture impact).
- Define both execution and verification steps.
- If something breaks, stop and re-plan.
- Write clear specs to remove ambiguity.

## 2) Subagent Strategy
- Use subagents for complex tasks.
- Split work into research, execution, and analysis.
- Assign one focused task per subagent.
- Parallelize where safe.

## 3) Self-Improvement Loop
- After each mistake, log the lesson.
- Convert recurring mistakes into explicit rules.
- Review past lessons before starting similar work.
- Iterate until error rate drops.

## 4) Verification Before Done
- Do not mark done without proof.
- Run tests, check logs, and simulate realistic usage.
- Compare expected vs actual behavior.
- Ask: would a lead engineer approve this outcome?

### API Testing Protocol
- Smoke Testing
- Functional Testing
- Integration Testing
- UI Testing
- Security Testing
- Stress Testing
- Load Testing

## 5) Demand Elegance
- Ask whether there is a simpler and cleaner approach.
- Avoid temporary hacks when a robust fix is feasible.
- Optimize for maintainability.
- Avoid overengineering for small fixes.

## 6) Autonomous Bug Fixing
- Fix obvious bugs immediately.
- Trace logs and failing tests to root cause.
- Fix causes, not symptoms.
- Add guardrails to prevent recurrence.

## 7) Skills as System Layer
- Treat skills as reusable workflow intelligence.
- Use skills for verification, automation, analysis, and scaffolding.
- Store reusable templates and scripts with the skill when useful.

## 8) File System as Context Engine
- Use folder structure to organize references, scripts, and templates.
- Keep context discoverable and progressively disclosed.
- Prefer consistent structure to improve reasoning quality.

## 9) Avoid Over-Constraining AI
- Prefer intent and constraints over micromanaged steps.
- Let the agent adapt methods to the problem.
- Focus on outcomes and correctness.

## Task Management Checklist
1. Plan first.
2. Verify before execution when risk is high.
3. Track progress continuously.
4. Explain changes at each major step.
5. Document results clearly.
6. Capture lessons learned.

## Core Principles
- Simplicity first.
- Systems over ad-hoc prompts.
- Verification over generation.
- Iteration over perfection.
- No lazy fixes; solve root causes.
