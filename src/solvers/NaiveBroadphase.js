export class NaiveBroadphase {
  bodies = []
  bounds = []
  update(body, bounds) {
    this.bodies = body
    this
    for (let i = 0; i < body.length; i++) {
      for (let j = 0; j < body[i].length; j++) {
        this.bodies.push(body[i][j])
        this.bounds.push(bounds[i][j].bounds)
      }
    }
  }
  /**
   * @inheritdoc
   * @param {Bounds} bound Region to check in.
   * @param {Body[]} target Empty array to store results.
   * @returns {Body[]}
   */
  query(bound, out = []) {
    for (let i = 0; i < this.bodies.length; i++) {
      if (this.bounds[i].intersects(bound))
        out.push(this.bodies[i])
    }
    return out
  }
  /**
   * @inheritdoc
   * @param {CollisionPair[]} target Empty array to store results.
   * @returns {CollisionPair[]}
   */
  getCollisionPairs(body,bounds,out = []) {
    for (let x = 0; x < body.length; x++) {
      for (let i = 0; i < body[x].length; i++) {
        for (let j = i + 1; j < body[x].length; j++) {
          if (!this.canCollide(body[x][i], body[x][j])) continue
          if (!bounds[x][i].bounds.intersects(bounds[x][j].bounds))
            continue
          const list = {
            indexA:[x,i],
            indexB:[x,j]
          };
          if (body[x][i].aabbDetectionOnly || body[x][j].aabbDetectionOnly) continue
          out.push(list);
        }
      }
    }
    return out
  }
  canCollide(a, b) {
    if (a.mass == 0 && b.mass == 0)
      return false
    if (
      (a.mask.group !== 0 && b.mask.group !== 0) &&
      a.mask.group == b.mask.group
    ) return false
    if (a.mask.layer && b.mask.layer && a.mask.layer !== b.mask.layer)
      return false
    if (a.sleeping && b.sleeping) return false
    return true
  }

}