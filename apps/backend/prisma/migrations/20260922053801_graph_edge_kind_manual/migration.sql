-- Split into its own migration deliberately: Postgres does not allow a newly
-- added enum value to be used (e.g. as a column default) within the same
-- transaction that adds it. This commits the new value alone first; the next
-- migration is free to use it as a default.
ALTER TYPE "GraphEdgeKind" ADD VALUE 'manual';
