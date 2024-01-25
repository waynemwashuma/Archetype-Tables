import {Renderer2D} from "./chaos.module.js"

export class QueryRenderer extends Renderer2D {
  update(dt, manager) {
    this.clear()
    const { transform, sprite } = manager.query(["transform", "sprite"])
    for (let i = 0; i < transform.length; i++) {
      for (let j = 0; j < transform[i].length; j++) {
        this.renderSingle(
          transform[i][j],
          sprite[i][j],
          dt
        )
      }
    }
  }
  renderSingle(transform, sprite, dt) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.translate(transform.position.x, transform.position.y);
    this.ctx.rotate(transform.orientation.value);
    this.ctx.scale(transform.scale.x,transform.scale.y);
    this.display(sprite.geometry, sprite.material, dt)
    this.ctx.closePath();
    this.ctx.restore();
  }
  display(geometry, material, dt) {
    material.render(this.ctx, dt, geometry.drawable);
  }
}