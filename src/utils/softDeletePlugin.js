/**
 * Mongoose Soft-Delete Plugin
 *
 * Adds a `deletedAt` timestamp field to any schema and installs query
 * middleware that automatically filters out soft-deleted documents.
 *
 * To bypass the filter (e.g. for historical stats), explicitly include
 * `deletedAt` in your query filter:
 *   Model.find({ deletedAt: { $ne: null } })   // only deleted
 *   Model.find({ deletedAt: { $exists: true } }) // all docs
 */
export function softDeletePlugin(schema) {
  // ── 1. Add the deletedAt field ──────────────────────────────────────
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  // ── 2. Query middleware — auto-filter soft-deleted docs ─────────────
  const queryOps = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "countDocuments",
    "updateMany",
  ];

  for (const op of queryOps) {
    schema.pre(op, function () {
      // Only inject the filter when the caller hasn't explicitly
      // specified a `deletedAt` condition (allows opt-out).
      const filter = this.getFilter();
      if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
      }
    });
  }
}
