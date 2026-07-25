# Complete Action

1. Run a final review to ensure everything is complete
2. Stage all changes and commit with a descriptive message
3. Switch to main and merge the feature branch (no push yet)
4. Delete the local feature branch
5. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Clear Goals and Notes sections
   - Set Status to "Not Started"
   - Add feature summary to the END of History
6. Commit the reset: `chore: reset current-feature.md after completing [feature]`
7. Push main to origin ONCE (single push with all changes)
8. If feature branch was previously push, delete it from origin
```

---

## Directory Structure
```
.claude/skills/feature/
├── SKILL.md
└── actions/
    ├── load.md
    ├── start.md
    ├── review.md
    ├── explain.md
    └── complete.md