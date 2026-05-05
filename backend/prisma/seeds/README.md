# Prisma seeds

Scoped seed scripts that complement the main `prisma/seed.ts` (run via `npm run db:seed`).
Each script here is self-contained, idempotent, and safe to re-run against the dev/homolog DB.

- **`re-enrollment-kanban.seed.ts`** — populates a single `ReEnrollmentPeriod` named
  "Seed Period — Kanban E2E" with 17 invites spread across every `ReEnrollmentGateStatus`
  (including one REMATRICULADO row dated 45 days ago to exercise the auto-archive filter,
  one CONVITE_ENVIADO with a past `extendedDeadline` to exercise the overdue indicator, and
  at least one invite in each action gate so the `hasAction` flag lights up). All created
  records are prefixed `[SEED]` for visual identification. Run with `npm run seed:kanban`.
  Re-running deletes the previous seed-owned Lead and Period before repopulating, so it never
  duplicates rows. **Never touches state it does not own**: if another `ReEnrollmentPeriod`
  is already `OPEN` — even one created by another developer — the seed leaves itself in
  `DRAFT` and warns. In that case select "Seed Period — Kanban E2E" manually from the
  period dropdown in the preview page.
