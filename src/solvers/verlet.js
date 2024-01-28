import { Vector2 } from "../chaos.module.js"
let position = new Vector2()
let lastaceleration = new Vector2()
let lastvelocity = new Vector2()

/**
 * Verlet intergration.
 * Used so that constraints can be stable at little performance cost.
 */
export class VerletSolver {
  /**
   * @param {Body2D} body
   * @param {number} dt
   */
  static solve(
    position,
    velocity,
    acceleration,
    orientation,
    rotation,
    torque,
    dt
  ) {
    lastaceleration.copy(acceleration).multiply(dt * 0.5)
    lastvelocity.copy(velocity)
    lastposition.copy(position)

    acceleration.set(0, 0)
    velocity.add(lastaceleration)
    lastposition.add(lastvelocity.multiply(dt)).add(lastaceleration.multiply(dt))
    velocity.add(lastaceleration)
    position.copy(lastposition)
    body.angularVelocity += body.angularAcceleration * dt * 0.5

    const lastTorque = torgue.value * dt * 0.5
    const lastRotation = rotation.value
    const lastOrient = orientation.value

    rotation.value += lastTorque
    orientation.value += rotation.value * dt
    torque.value = 0
  }
  static presolve(movable, dt) {
    const acceleration = movable.acceleration
    const torque = movable.torque
    const velocity = movable.velocity
    const rotation = movable.rotation

  }
}