import { Vector2, sq } from "../chaos.module.js"
import { Settings } from "../settings.js"
const tmp1 = new Vector2(),
  tmp2 = new Vector2()
let dampen = Settings.posDampen

/**
 * Solves the interpenetration of bodies.
 */
export const PenetrationSolver = {
  solve(
    velA,
    velB,
    rotA,
    rotB,
    manifold,
    inv_dt
  ) {
    const { bodyA, bodyB, ca1, ca2 } = manifold
    const { axis, overlap } = manifold.contactData
    const dampened = overlap * dampen
    const a = dampened / (bodyA.inv_mass + bodyB.inv_mass + sq(ca1.cross(axis)) * bodyA.inv_inertia + sq(ca2.cross(axis)) * bodyB.inv_inertia)
    const jp = tmp2.copy(axis).multiply(a)
    velA.set(
      velA.x + (jp.x * bodyA.inv_mass * inv_dt),
      velA.y + (jp.y * bodyA.inv_mass * inv_dt)
    )
    velB.set(
      velB.x + -(jp.x * bodyB.inv_mass * inv_dt),
      velB.y + -(jp.y * bodyB.inv_mass * inv_dt)
    )
    rotA.value += ca1.cross(jp) * bodyA.inv_inertia * inv_dt
    rotB.value += ca2.cross(jp) * -bodyB.inv_inertia * inv_dt
    manifold.contactData.lastOverlap = overlap;
  },
  solveInt(velA,
    velB,
    rotA,
    rotB,
    manifold,
    inv_dt
  ) {
    let { bodyA, bodyB, ca1, ca2 } = manifold;
    let { axis, overlap } = manifold.contactData;

    const dampened = overlap * dampen;
    const a = dampened / (bodyA.inv_mass + bodyB.inv_mass + sq(ca1.cross(axis)) * bodyA.inv_inertia )//+ sq(ca2.cross(axis)) * bodyB.inv_inertia);
    let jp = tmp2.copy(axis).multiply(a);
    velA.add(tmp1.copy(jp).multiply(bodyA.inv_mass * inv_dt));
    velB.add(tmp1.copy(jp).multiply(-bodyB.inv_mass * inv_dt));
    //rotA.value += ca1.cross(jp) * bodyA.inv_inertia * inv_dt;
    //rotB.value += ca2.cross(jp) * -bodyB.inv_inertia * inv_dt;
    manifold.contactData.lastOverlap = overlap;
  }
}