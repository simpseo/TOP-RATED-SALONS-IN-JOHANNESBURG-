# Security Specification for The Johannesburg Beauty Index

## 1. Data Invariants
- A Business listing cannot exist without a valid ownerId (Firebase UID).
- Users can only modify their own profile details.
- Only the owner of a business can update or delete its listing.
- Anyone can read business listings (public directory).
- Leads/Claims must belong to an authenticated user and point to a valid business.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

| ID | Attack Type | Intent | Collection | Payload | Expected |
|----|-------------|--------|------------|---------|----------|
| 1 | Identity Spoofing | Create business as someone else | businesses | `{ businessName: "Spam", ownerId: "attacker_id" }` (where auth.uid != attacker_id) | DENIED |
| 2 | Shadow Update | Inject ghost field into user profile | users | `{ displayName: "Name", isVerified: true }` | DENIED |
| 3 | Orphaned Write | Create lead for non-existent business | leads | `{ businessId: "non_existent", type: "claim" }` | DENIED |
| 4 | State Shortcutting | Change business rank tier | businesses | `{ rankTier: "Tier 1" }` by non-admin | DENIED |
| 5 | Resource Poisoning | Inject massive string into document ID | businesses | (Target ID is 1MB string) | DENIED |
| 6 | Bulk Scraping | Attempt to list all leads | leads | `getDocs(collection(db, "leads"))` | DENIED (Only own leads allowed) |
| 7 | PII Leak | Read someone else's user profile | users | `getDoc(doc(db, "users", "other_user"))` | ALLOWED (Public names) but restricted fields? |
| 8 | Unauthorized Delete | Delete another business | businesses | `deleteDoc(doc(db, "businesses", "competitor"))` | DENIED |
| 9 | Timestamp Spoofing | Set old createdAt | businesses | `{ createdAt: "2000-01-01" }` | DENIED (Must be serverTime) |
| 10 | Cross-Origin Write | Write from outside app | businesses | (Any write without auth) | DENIED |
| 11 | Malicious Link | Inject script into website field | businesses | `{ website: "javascript:alert(1)" }` | DENIED (Format check) |
| 12 | Role Escalation | Set role to 'admin' | users | `{ role: "admin" }` | DENIED |

## 3. Test Runner (Conceptual)
I will implement validation helpers that block these payloads.
