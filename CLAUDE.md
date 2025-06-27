# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jikanicle is a time-blocking TUI application that leverages AI-powered duration prediction and category classification. When users input tasks, AI automatically generates optimal time blocks and enables efficient time management through real work time tracking. The project adopts DDD (Domain Driven Design) and schema-driven development.

## Development Guidelines

### Language Policy
**IMPORTANT: All user-facing text, comments, error messages, and documentation must be written in English only. This includes:**
- UI text and labels
- Error messages and validation text
- Code comments and JSDoc
- Test descriptions and assertions
- Git commit messages
- Documentation

### Naming Conventions
- Domain Models: WorkItem, ScheduleSlot, TaskDurationPredictor, SchedulePlanner, etc., reflecting domain concepts
- Functions/Variables/Repositories: getTaskById, storeTask, updateTask, createTaskManager, etc., following consistent rules

### Code Standards
- Follow t-wada's TDD approach
- Adhere to oxlint rules
- Respect functional programming principles (immutability, pure functions)
- Prioritize type safety and avoid `any` type
- Document with JSDoc comments

### Testing Strategy
- Test-driven development (TDD) using Vitest following t-wada's approach
- Unit tests for domain layer
- Integration tests for repositories
- UI component tests

### Technology Stack
- **Language**: TypeScript
- **UI Framework**: Ink (React)
- **Type Definition/Validation**: Zod
- **Error Handling**: neverthrow
- **Testing**: Vitest
- **Package Management**: pnpm
- **Data Storage**: JSON files (considering SQLite in the future)
- **AI Integration**: External AI APIs (e.g., OpenAI API)

## Development Commands

### Build Commands
```bash
# TypeScript build
pnpm build
```

### Run Commands
```bash
# Start application
pnpm start

# Development mode (auto-reload on file changes)
pnpm dev
```

### Test Commands
```bash
# Run all tests
pnpm test

# Run tests once
pnpm test:run

# Generate coverage report
pnpm test:coverage

# Type check only
pnpm test:typecheck
```

### Linter
```bash
# Check code with oxlint
pnpm lint

# Auto-fix with oxlint
pnpm lint:fix
```

## Key Features
1. **Task Management**
   - Users input task names and optional descriptions
   - AI predicts duration and categorizes based on input content
   - Tasks are saved to JSON files with list and detail view capabilities

2. **Time Blocking**
   - Automatically generates time blocks based on predicted durations for specified time frames
   - Calculates start/end times and places them within schedules

3. **Time Tracking**
   - Measures actual task time through key operations (start: s, pause: p, end: e)
   - Uses recorded actual times as AI learning data

4. **Prediction Feedback**
   - Provides feedback on AI predictions: "too short/too long/accurate/uncertain"
   - Feedback information is linked to tasks and used for AI model learning

