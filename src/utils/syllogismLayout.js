// A nested-circle drawing is only reliable for simple chains of "all" sets.
// A branching parent would put sibling sets on top of each other and imply equality.
export function getSimpleSetLayout(statements, entities) {
  if (entities.length < 2 || entities.length > 4) return null;
  const allRelations = statements.filter(statement => statement.type === "ALL");
  if (!allRelations.length && entities.length !== 2) return null;
  if (statements.some(statement => !["ALL", "NO"].includes(statement.type))) return null;

  const parent = new Map();
  const childCount = new Map();
  for (const relation of allRelations) {
    if (relation.normSubj === relation.normPred || parent.has(relation.normSubj)) return null;
    parent.set(relation.normSubj, relation.normPred);
    childCount.set(relation.normPred, (childCount.get(relation.normPred) || 0) + 1);
    if (childCount.get(relation.normPred) > 1) return null;
  }

  const roots = entities.filter(entity => !parent.has(entity.norm));
  if (!roots.length || roots.length > 2) return null;
  for (const entity of entities) {
    let current = entity.norm;
    const visited = new Set();
    while (parent.has(current)) {
      if (visited.has(current)) return null;
      visited.add(current);
      current = parent.get(current);
    }
    if (!roots.some(root => root.norm === current)) return null;
  }
  return { parent, roots };
}

export function getSetRootCenters(roots, statements, parent = new Map()) {
  if (roots.length === 1) return [280];
  const [first, second] = roots;
  const rootOf = (norm) => {
    let current = norm;
    while (parent.has(current)) current = parent.get(current);
    return current;
  };
  const disjoint = statements.some(statement => statement.type === "NO" && (
    (rootOf(statement.normSubj) === first.norm && rootOf(statement.normPred) === second.norm) ||
    (rootOf(statement.normSubj) === second.norm && rootOf(statement.normPred) === first.norm)
  ));
  // Root circles have radius 90; 200px separation leaves a visible gap.
  return disjoint ? [180, 380] : [210, 375];
}
