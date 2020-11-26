const relpath = require('./relpath.js')
const Node = require('./node.js')
const _loadDeps = Symbol.for('Arborist.Node._loadDeps')
const _target = Symbol('_target')
const {dirname} = require('path')
class Link extends Node {
  constructor (options) {
    const { realpath, target } = options

    if (!realpath && !(target && target.path))
      throw new TypeError('must provide realpath for Link node')

    super({
      ...options,
      realpath: realpath || target.path,
    })

    this.target = target || new Node({
      ...options,
      path: realpath,
      parent: null,
      root: this.root,
      linksIn: [this],
    })

    if (this.root.meta)
      this.root.meta.add(this)
  }

  // links don't have their own package definition, just proxy to target
  get package () {
    return this.target ? this.target.package : {}
  }
  set package (pkg) {}

  get target () {
    return this[_target]
  }

  set target (target) {
    const current = this[_target]
    if (current && current.linksIn)
      current.linksIn.delete(this)

    this[_target] = target

    if (!target)
      return

    if (target.then) {
      // can set to a promise during an async tree build operation
      // wait until then to assign it.
      target.then(node => this.target = node)
      return
    }

    // it's possible that two links to the same realpath will race to
    // create the same node, leading to a situation where one is in the
    // inventory and the other is in the tree.  try to see if our root
    // already knows about this target, and if so, choose that instead.
    // this can also happen when a link is created in one root, then moved
    // to another, where the target has already been added to the tree.
    const targetLoc = relpath(this.root.realpath, target.path)
    const fromInv = this.root.inventory.get(targetLoc)
    if (fromInv && fromInv !== target)
      target = fromInv

    this.package = target.package

    this.realpath = target.path
    target.linksIn.add(this)
  }

  // a link always resolves to the relative path to its target
  get resolved () {
    return this.path && this.realpath
      ? `file:${relpath(dirname(this.path), this.realpath)}`
      : null
  }

  set resolved (r) {}

  // deps are resolved on the target, not the Link
  // so this is a no-op
  [_loadDeps] () {}

  // links can't have children, only their targets can
  // fix it to an empty list so that we can still call
  // things that iterate over them, just as a no-op
  get children () {
    return new Map()
  }

  set children (c) {}

  get isLink () {
    return true
  }
}

module.exports = Link
