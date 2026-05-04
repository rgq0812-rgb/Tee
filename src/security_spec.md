# Security Specification: Golf Tracker Pro

## Data Invariants
1. A Round must have a valid `userId` matching the authenticated user.
2. A HoleData document must belong to a Round that the user owns.
3. User profiles are only writable by the user themselves.
4. Courses are read-only for public, writable only by admins (system).

## The Dirty Dozen Payloads
1. **Identity Theft**: Update `Round.userId` to another user's ID.
2. **Score Spoofing**: Submit negative score or unrealistically large score.
3. **Orphan Hole**: Create `HoleData` under a `Round` that doesn't exist.
4. **PII Leak**: Read another user's profile private data.
5. **Course Sabotage**: Update or delete a global Course document as a regular user.
6. **Self-Admin**: Set `isAdmin` claim on own user profile (shadow field).
7. **Future Round**: Set round date to a future time if not allowed.
8. **Malicious Notes**: Inject 1MB string into `HoleData.notes`.
9. **Status Shortcut**: Move Round status from `completed` back to `in-progress` (if forbidden).
10. **Shadow Analysis**: Create `SwingAnalysis` for another user.
11. **ID Poisoning**: Use a 2KB string as `roundId`.
12. **Relational Drift**: Add a hole to a round with a `holeNumber` already existing in a different record.

## Test Runner (TDD)
I will implement `firestore.rules` to block these.
