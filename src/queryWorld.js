//import { PenetrationSolver, FrictionSolver, ImpulseSolver, ContactSolver,VerletSolver } from "./solvers/index.js";
import { Vector2 } from "./chaos.module.js";
import { Utils } from "./chaos.module.js";
import { ObjType,Settings } from "./settings.js"
import { NaiveBroadphase } from "./chaos.module.js";
import { SATNarrowPhase } from "./chaos.module.js";
import { System } from  "./chaos.module.js";
import { Err as Logger } from "./chaos.module.js";

/**
 * Class responsible for updating bodies,constraints and composites.
 */
export class queryWorld extends System {
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
  intergrator = VerletSolver
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
  narrowPhase() {
    this.CLMDs = this.narrowphase.getCollisionPairs(this.contactList, [])
  }
  /**
   * @private
   */
  broadPhase() {
    this.contactList = []
    this.broadphase.getCollisionPairs(this.contactList)
  }
  /**
   * @private
   */
  collisionDetection() {
    this.broadPhase()
    this.narrowPhase()
  }
  /**
   * @private
   * @param {number} dt 
   */
  collisionResponse(dt) {
    let length = this.CLMDs.length,
      manifold,
      inv_dt = 1 / dt

    for (var j = 0; j < this.velocitySolverIterations; j++) {
      for (let i = 0; i < length; i++) {
        manifold = this.CLMDs[i]
        manifold.velA.set(0, 0)
        manifold.velB.set(0, 0)
        manifold.rotA = 0
        manifold.rotB = 0
        ImpulseSolver.solve(manifold)
        FrictionSolver.solve(manifold)
      }
      for (var i = 0; i < length; i++) {
        manifold = this.CLMDs[i]
        manifold.bodyA.velocity.add(manifold.velA)
        manifold.bodyB.velocity.add(manifold.velB)
        manifold.bodyA.rotation.value += manifold.rotA
        manifold.bodyB.rotation.value += manifold.rotB
      }
    }

    for (let i = 0; i < length; i++) {
      manifold = this.CLMDs[i]
      PenetrationSolver.solve(manifold, inv_dt)
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
        this.intergrator.solve(
          transform[i][j],
          movable[i][j],
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
  applyForces(movable, dt) {
    for (let i = 0; i < movable.length; i++) {
      for (let j = 0; j < movable[i].length; j++) {
        const a = movable[i][j]
        if (a.mass)
          a.acceleration.add(this.gravitationalAcceleration)
        this.intergrator.presolve(a,dt)
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
  /**
   * @private
   * @param {Body[][]} bodies 
   */
  updateBodies(bodies) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = 0; j < bodies[i].length; j++) {
        bodies[i][j].update()
      }
    }
  }
  /**
   * @param {Number} dt the time passed between the last call and this call.
   * @param {Manager} manager
   */
  update(dt, manager) {
    let { transform, movable, body } = manager.query(["transform", "movable","bounds","body"])
    this.applyGravity(transform, dt)
    this.updateBodies(body)
    this.updateConstraints(dt)
    this.broadphase.update(body)
    this.collisionDetection()
    this.collisionResponse(dt)
    this.updateConstraints(dt)
    if (this.enableIntergrate)
      this.intergrate(transform,movable,dt)
    this.updateBodies(body)
  }

  /**
   * Initializes the manager.
   * 
   * @param {Manager} manager
   */
  init(manager) {
    manager.setComponentList("body", this.objects)
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