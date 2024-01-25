import {System} from "./chaos.module.js"

export class AddVel extends System {
  update(dt, manager) {
    const { transform, movable } = manager.query(["transform", "movable"])
    for (let i = 0; i < transform.length; i++) {
      for (let j = 0; j < transform[i].length; j++) {
        this.solve(
          transform[i][j].position,
          movable[i][j].velocity,
          transform[i][j].orientation,
          movable[i][j].rotation,
          dt
        )
      }
    }
  }
  solve(position, velocity,orient,rotation, dt) {
    position.x += velocity.x * dt
    position.y += velocity.y * dt
    orient.value += rotation.value * dt
  }
}