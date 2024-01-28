import { PenetrationSolver, FrictionSolver, ImpulseSolver, ContactSolver, EulerSolver, NaiveBroadphase, SATNarrowPhase } from "./solvers/index.js"
import { Vector2 } from "./chaos.module.js";
import { Utils } from "./chaos.module.js";
import { ObjType, Settings } from "./settings.js"
import { System } from "./chaos.module.js";
import { Err as Logger } from "./chaos.module.js";

/**
 * Class responsible for updating bodies,constraints and composites.
 */
export class QueryWorld extends System {
  /**
   * A record of collision manifolds.
   * 
   * @type {Map<number,Manifold>}
   * @protected
   */
  records = new Map()
  /**
   * A list of constraints fixed to a static object.
   * 
   * @type {Constraint[]}
   * @private
   */
  fixedConstraits = []
  /**
   * A list of constraints fixed to two dynamic bodies.
   * 
   * @type {Constraint[]}
   * @private
   */
  constraints = []
  /**
   * A value between 0 and 1 used to dampen linear velocity of bodies.
   * 
   * @type {number}
   */
  linearDamping = Settings.linearDamping
  /**
   * A value between 0 and 1 used to dampen angular velocity of bodies.
   * 
   * @type {number}
   */
  angularDamping = Settings.angularDamping

  /**
   * The number of times to solve for velocity.A high number results in much more stable stacking.
   * 
   * @type {number}
   */
  velocitySolverIterations = Settings.velocitySolverIterations
  /**
   * The collision manifolds that have passed narrowphase and verified to be colliding.
   * 
   * @type {Manifold[]}
   */
  CLMDs = []
  /**
   * The collision manifolds that have passed broadphase and could be colliding
   * 
   * 
   * @type {CollisionPair[]}
   */
  contactList = []
  /**
   * The gravitational pull of the world.
   * 
   * @type {Vector2}
   */
  gravitationalAcceleration = new Vector2(0, 0)
  /**
   * Time in seconds that a single frame takes.This has more precedence than the first parameter of World2D.update(),set to this to zero if you want to use the latter as the delta time.
   * 
   * @type {number}
   */
  fixedFrameRate = Settings.fixedFrameRate
  /**
   * This is a cheap way of determining which pairs of bodies could be colliding.
   * 
   * @type {Broadphase}
   */
  broadphase = null
  /**
   * This accurately tests body pairs to check 
   * for collision and outputs a manifold for each body pair.
   * 
   * @type {NarrowPhase}
   */
  narrowphase = null
  /**
   * Moves the bodies forward in time.
   * 
   * @type {Intergrator}
   */
  intergrator = EulerSolver
  /**
   * @type {boolean}
   * @default true
   */
  enableIntergrate = true

  constructor() {
    super()
    this.broadphase = new NaiveBroadphase(this)
    this.narrowphase = new SATNarrowPhase()
  }

  /**
   * Gravitational pull of the world,will affect all bodies except static bodies.
   * 
   * @type { Vector2 }
   */
  get gravity() {
    return this.gravitationalAcceleration
  }

  set gravity(x) {
    if (typeof x === "object") {
      this.gravitationalAcceleration.copy(x)
    } else {
      this.gravitationalAcceleration.set(0, x)
    }
  }
  /**
   * @private
   */
  collisionDetection(body, bounds, transform) {
    this.broadphase.update(body, bounds)
    this.contactList =
      this.broadphase.getCollisionPairs(body, bounds, [])
    this.CLMDs = this.narrowphase.getCollisionPairs(body, transform, this.contactList, [])
  }
  /**
   * @private
   * @param {number} dt 
   */
  collisionResponse(movable, dt) {
    let length = this.CLMDs.length,
      manifold,
      inv_dt = 1 / dt

    for (let j = 0; j < this.velocitySolverIterations; j++) {
      for (let i = 0; i < length; i++) {
        this.CLMDs[i].velA.set(0, 0)
        this.CLMDs[i].velB.set(0, 0)
        this.CLMDs[i].rotA = 0
        this.CLMDs[i].rotB = 0
        const { indexA, indexB } = this.CLMDs[i]
        ImpulseSolver.solve(
          movable[indexA[0]][indexA[1]].velocity,
          movable[indexB[0]][indexB[1]].velocity,
          movable[indexA[0]][indexA[1]].rotation,
          movable[indexB[0]][indexB[1]].rotation,
          this.CLMDs[i]
        )
        FrictionSolver.solve(
          movable[indexA[0]][indexA[1]].velocity,
          movable[indexB[0]][indexB[1]].velocity,
          movable[indexA[0]][indexA[1]].rotation,
          movable[indexB[0]][indexB[1]].rotation,
          this.CLMDs[i]
        )
      }
      for (let i = 0; i < length; i++) {
        const { indexA, indexB } = this.CLMDs[i]
        movable[indexA[0]][indexA[1]].velocity.add(this.CLMDs[i].velA)
        movable[indexA[0]][indexA[1]].rotation.value += this.CLMDs[i].rotA
        movable[indexB[0]][indexB[1]].velocity.add(this.CLMDs[i].velB)
        movable[indexB[0]][indexB[1]].rotation.value += this.CLMDs[i].rotB
      }
    }

    for (let i = 0; i < length; i++) {
      const { indexA, indexB } = this.CLMDs[i]
      PenetrationSolver.solve(
        movable[indexA[0]][indexA[1]].velocity,
        movable[indexB[0]][indexB[1]].velocity,
        movable[indexA[0]][indexA[1]].rotation,
        movable[indexB[0]][indexB[1]].rotation,
        this.CLMDs[i],
        inv_dt
      )
    }

    for (let i = 0; i < length; i++) {
      manifold = this.CLMDs[i]
      ContactSolver.solve(
        manifold.bodyA,
        manifold.bodyB,
        manifold.impulse,
        manifold.contactData.contactNo
      )
    }
  }
  /**
   * @private
   * @param {Transform[][]} transform 
   * @param {Movable[][]} movable 
   * @param {number} dt 
   */
  intergrate(transform, movable, dt) {
    const ld = 1 - this.linearDamping
    const ad = 1 - this.angularDamping
    for (let i = 0; i < movable.length; i++) {
      for (let j = 0; j < movable[i].length; j++) {
        transform[i][j].lastPosition.copy(
          transform[i][j].position
        )
        this.intergrator.solve(
          transform[i][j].position,
          movable[i][j].velocity,
          movable[i][j].acceleration,
          transform[i][j].orientation,
          movable[i][j].rotation,
          movable[i][j].torque,
          dt
        )
        movable[i][j].velocity.multiply(ld)
        movable[i][j].rotation.value *= ad
      }
    }
  }
  /**
   * @private
   * @param {Movable[][]} movable 
   * @param {number} dt 
   */
  applyForces(movable, body, dt) {
    for (let i = 0; i < movable.length; i++) {
      for (let j = 0; j < movable[i].length; j++) {
        if (!body[i][j].mass) continue
        movable[i][j].acceleration.add(this.gravitationalAcceleration)
      }
    }
  }
  /**
   * @private
   * @param {number} dt
   */
  updateConstraints(dt) {
    let length = this.constraints.length,
      fixedlength = this.fixedConstraits.length
    for (var i = 0; i < fixedlength; i++) {
      this.fixedConstraits[i].update(dt)
    }
    for (var i = 0; i < length; i++) {
      this.constraints[i].update(dt)
    }
  }
  updateGeometry(geometry, vertices, pos, orient, scale) {
    const cos = Math.cos(orient)
    const sin = Math.sin(orient)
    for (let i = 0; i < geometry.vertices.length; i++) {
      let vertex = vertices[i]
      vertex.copy(geometry.vertices[i])
        .rotateFast(cos, sin)
        .set(
          vertex.x * scale.x + pos.x,
          vertex.y * scale.y + pos.y
        )
    }
  }
  updateShape(shape, position, angle, scale) {
    shape.angle = shape.offAngle + angle
    this.updateGeometry(shape.geometry, shape.vertices, new Vector2().copy(position).add(shape.offPosition), shape.angle, scale, position)
    //position.sub(shape.offPosition)
  }
  updateBody(body, transform, bounds) {
    const orientation = transform.orientation.value
    for (let i = 0; i < body.shapes.length; i++) {
      //body.shapes[i].update()
      this.updateShape(
        body.shapes[i],
        transform.position,
        transform.orientation.value,
        transform.scale
      )
    }
    for (let i = 0; i < body.anchors.length; i++) {
      body.anchors[i].copy(body).rotate(orientation)
    }
    if (body.autoUpdateBound)
      ///make sure this function acts on local space not world space! The remove the "else" when that is done
      bounds.calculateBounds(body, body.boundPadding)
    else
      bounds.translate(
        transform.position.x - transform.lastPosition.x,
        transform.position.y - transform.lastPosition.y
      )
    //transform.orientation.value = orientation % 360
  }
  /**
   * @private
   * @param {Body[][]} bodies 
   */
  updateBodies(bodies, transform, bounds) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = 0; j < bodies[i].length; j++) {
        this.updateBody(
          bodies[i][j],
          transform[i][j],
          bounds[i][j].bounds
        )
      }
    }
  }
  /**
   * @param {Number} dt the time passed between the last call and this call.
   * @param {Manager} manager
   */
  update(dt, manager) {
    let { transform, movable, bounds, body } = manager.query(["transform", "movable", "bounds", "body"])
    this.applyForces(movable,body, dt)
    this.updateBodies(body, transform, bounds)
    this.collisionDetection(body, bounds, transform)
    this.collisionResponse(movable, dt)
    if (this.enableIntergrate)
      this.intergrate(transform, movable, dt)
  }
  /**
   * Searches for objects in a given bounds and returns them.
   * 
   * @param {Bounds} bound the region to search in
   * @param {Body2D[]} [target = []] an array to store results in
   * @returns {Body2D[]}
   */
  query(bound, target = []) {
    this.broadphase.query(bound, target)
    return target
  }
}