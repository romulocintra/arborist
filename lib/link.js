const relpath = require('./relpath.js')
const Node = require('./node.js')
const _loadDeps = Symbol.for('Arborist.Node._loadDeps')
const _target = Symbol.for('_target')
const {dirname} = require('path')
// defined by Node class
const _delistFromMeta = Symbol.for('_delistFromMeta')
const _refreshLocation = Symbol.for('_refreshLocation')
class Link extends Node {
  constructor (options) {
    const { root, realpath, target, parent, fsParent } = options

    if (!realpath && !(target && target.path))
      throw new TypeError('must provide realpath for Link node')

    super({
      ...options,
      realpath: realpath || target.path,
      root: root ? root
        : parent ? parent.root
        : fsParent ? fsParent.root
        : target ? target.root
        : null
    })

    this.target = target || new Node({
      ...options,
      path: realpath,
      parent: null,
    })
  }

  get target () {
    return this[_target]
  }

  // should this even be a setter?
  set target (target) {
    const current = this[_target]
    if (target === current)
      return

    if (target && target.then) {
      // can set to a promise during an async tree build operation
      // wait until then to assign it.
      target.then(node => this.target = node)
      return
    }

    if (!target) {
      if (current)
        current.linksIn.delete(this)
      this[_delistFromMeta]()
      this[_target] = null
      this.package = {}
      this[_refreshLocation]()
      return
    }

    // have to refresh metadata, because either realpath or package
    // is very likely changing.
    this[_delistFromMeta]()
    this.package = target.package
    this.realpath = target.path
    this[_refreshLocation]()

    target.root = this.root
  }

  // a link always resolves to the relative path to its target
  get resolved () {
    // the path/realpath guard is there for the benefit of setting
    // these things in the "wrong" order
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
