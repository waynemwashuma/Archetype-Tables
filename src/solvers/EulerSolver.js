import { Vector2 } from "../chaos.module.js"
const lastvelocity = new Vector2()

/**
 * Verlet intergration.
 * Used so that constraints can be stable at little performance cost.
 */
export class EulerSolver {
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
    velocity.set(
      velocity.x + acceleration.x * dt,
      velocity.y + acceleration.y * dt
    )
    position.set(
      position.x + velocity.x * dt,
      position.y + velocity.y * dt
    )
    acceleration.set(0, 0)

    rotation.value += torque.value * dt
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