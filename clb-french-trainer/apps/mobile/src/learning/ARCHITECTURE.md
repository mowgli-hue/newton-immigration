# CLB French Trainer Learning Architecture

## Folder Structure

- `types/` Domain schemas for lessons, sessions, diagnostic, and progress.
- `engines/` Pure business logic engines.
- `repositories/` Content retrieval and catalog queries.
- `modules/foundation/` Module 0 lesson definitions for absolute beginners.
- `modules/a1/` CEFR A1 lesson definitions.
- `modules/a2/` CEFR A2 lesson definitions.
- `modules/b1/` CEFR B1 lesson definitions.
- `modules/b2/` CEFR B2 lesson definitions.
- `modules/clb-practice/` CLB 5/7 practice structures (listening, speaking, reading, writing).

## Core Engines

- `focusSessionEngine.ts`
  - 25:5 timer model
  - Block progression state
  - Session phase transitions
- `lessonTemplateEngine.ts`
  - Converts lesson schema into Teach/Practice/Produce/Test block metadata
  - Mini-test scoring and mastery checks
- `strictModeEngine.ts`
  - Enforces no-skip sequencing
  - Locks break until full completion
- `adaptiveDiagnosticEngine.ts`
  - Tiered question progression from A1 upward
  - CEFR recommendation scoring
- `progressEngine.ts`
  - Lesson completion updates
  - Daily focus session counters
- `companionExplanationEngine.ts`
  - Placeholder explanation + hint generation contract for future AI

## Persistence

- `services/progress/progressRepository.ts`
  - AsyncStorage persistence for progress state
  - Firestore sync placeholder
