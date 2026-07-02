---
phase: "{phase-number}-{phase-name}"
plan: "{phase}-{plan-number}"
objective: "{one-line objective}"
requirements: []  # [REQ-01, REQ-02]
autonomous: true  # false if any checkpoint tasks
wave: 1
files: []
must_haves: []
---

# {Phase} Plan {Number}: {Objective}

## Context
{What this plan accomplishes and why}

## Dependencies
- **Requires:** {prior plans or existing code this depends on}
- **Produces:** {what this creates for downstream plans}

## Tasks

<task type="auto">
  <n>{task name}</n>
  <files>{comma-separated file paths}</files>
  <action>
    {Specific, executable instructions.
    Include library names, function signatures, exact behavior.
    The executor implements this literally.}
  </action>
  <verify>
    {Concrete command or check to verify the task worked}
  </verify>
  <done>{Success criteria — what is true when this task is done}</done>
</task>
