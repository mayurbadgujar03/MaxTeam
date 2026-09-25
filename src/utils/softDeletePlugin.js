export function softDeletePlugin(schema) {
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  const queryOps = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "countDocuments",
    "updateMany",
  ];

  for (const op of queryOps) {
    schema.pre(op, function () {
      const filter = this.getFilter();
      if (filter.deletedAt === undefined) {
        this.where({ deletedAt: null });
      }
    });
  }
}
