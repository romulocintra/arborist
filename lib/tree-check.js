const debug = require('./debug.js')

const checkTree = tree => {
  // this can only happen in tests where we have a "tree" object
  // that isn't actually a tree.
  if (!tree.root || !tree.root.inventory)
    return tree
  const { inventory } = tree.root
  const seen = new Set()
  const check = node => {
    if (!node || seen.has(node))
      return
    if (node.isRoot && node !== tree.root) {
      throw Object.assign(new Error('double root'), {
        path: node.path,
        realpath: node.realpath,
        tree: tree.path,
      })
    }

    if (!node.isRoot && node.inventory.size !== 0) {
      throw Object.assign(new Error('non-root has non-zero inventory'), {
        node: node.path,
        tree: tree.path,
        root: tree.root.path,
        inventory: [...node.inventory.values()].map(node =>
          [node.path, node.location]),
      })
    }

    if (!node.isRoot && !inventory.has(node)) {
      const parentLoc = node.location
        .split('node_modules')
        .slice(0, -1)
        .join('node_modules')
      throw Object.assign(new Error('not in inventory'), {
        tree: tree.path,
        path: node.path,
        isLink: node.isLink,
        target: node.target && node.target.path,
        linksIn: [...node.linksIn].map(l => l.path),
        targetLinksIn: node.target && [...node.target.linksIn].map(l => l.path),
        realpath: node.realpath,
        location: node.location,
        root: node.root.path,
        parent: parentLoc,
        parentInv: inventory.get(parentLoc),
        parentIsInventory: inventory.get(parentLoc) === node.parent,
        parentIsRoot: parentLoc === '' && node.parent === tree.root,
      })
    }
    const { parent, fsParent, target } = node
    seen.add(node)
    check(parent)
    check(fsParent)
    check(target)
    for (const kid of node.children.values())
      check(kid)
    for (const kid of node.fsChildren)
      check(kid)
    for (const link of node.linksIn)
      check(link)
  }
  check(tree)
  for (const node of inventory.values()) {
    if (!seen.has(node) && node !== tree.root) {
      throw Object.assign(new Error('unreachable in inventory'), {
        path: node.path,
        realpath: node.realpath,
        location: node.location,
      })
    }
  }
  return tree
}

// should only ever run this check in debug mode
module.exports = tree => tree
debug(() => module.exports = checkTree)
