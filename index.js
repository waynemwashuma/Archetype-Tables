import {
  Manager,
  createEntity,
  Renderer2D,
  World as World2D,
  World,
  Box,
  Ball,
  Body,
  Sprite,
  BasicMaterial,
  BoxGeometry,
  Movable,
  rand,
  bodyDebugger
} from "./src/chaos.module.js"
import { ArchetypedManager } from "./src/manager.js"
import { QueryWorld } from "./src/queryWorld.js"
import { QueryRenderer } from "./src/queryRenderer.js"
import { measurePerf } from "./src/tester.js"

const sample =stack(500,0,50,50,100) 
//const sample = createSample(100, ["sprite", "body"])
//sample[1].get("transform").position.x +=20
//sample[1].get("transform"). orientation.value+= Math.PI /1900
const queryrenderer = new QueryRenderer()
const defaultRenderer = new Renderer2D()
queryrenderer.bindTo("#can")
queryrenderer.setViewport(innerWidth, innerHeight)
const queryworld = new QueryWorld()
const world = new World2D()
const defaultmanager = new Manager({
  autoplay: false
})
const typedmanager = new ArchetypedManager({
  autoplay: false
})

sample.push(...createPlatform(
  queryrenderer.width / 2,
  queryrenderer.height - 100,
  queryrenderer.width,
  50
))

//defaultmanager.registerSystem("renderer", defaultRenderer)
typedmanager.registerSystem(queryrenderer)
/*typedmanager.registerSystem({
  update: (dt, manager) => {
    const { bounds } = manager.query(["bounds"])
    queryrenderer.ctx.strokeStyle = "red"
    for (var i = 0; i < bounds.length; i++) {
      for (var j = 0; j < bounds[i].length; j++) {
        renderBound(queryrenderer.ctx, bounds[i][j].bounds)
        queryrenderer.ctx.stroke()
      }
    }
  }
})*/
defaultmanager.registerSystem("world", world)
typedmanager.registerSystem(queryworld)
typedmanager.registerSystem({
  update(dt) {
    const ctx = queryrenderer.ctx
    const clmds = queryworld.CLMDs
    ctx.save()
    ctx.lineWidth = 3
    ctx.strokeStyle = "blue"
    for (let i = 0; i < clmds.length; i++) {
      const manifold = clmds[i]

      ctx.beginPath()
      ctx.moveTo(...manifold.bodyA.position)
      ctx.lineTo(...manifold.ca1.add(manifold.bodyA.position))
      ctx.moveTo(...manifold.bodyB.position)
      ctx.lineTo(...manifold.ca2.add(manifold.bodyB.position))
      ctx.closePath()
      ctx.stroke()
    }
    ctx.restore()
  }
})
/*console.log("-------Insertion performance------")
testPerformanceAdd(defaultmanager, typedmanager)/**/
console.log("-------Update performance------")
//typedmanager.update(0.016)
addToManager(defaultmanager, sample)
addToManager(typedmanager, sample)
testPerformanceUpdate(defaultmanager, typedmanager) /**/

function testPerformanceUpdate(manager1, manager2) {
  const t1 = measurePerf(() => { manager1.update(0.016) })
  const t2 = measurePerf(() => { manager2.update(0.016) })

  console.log("Manager1 ::" + t1 + "ms")
  console.log("Manager2 ::" + t2 + "ms")

  if (t1 < t2) {
    console.log("Manager1 is " + (t2 - t1) * 100 / t1 + "% faster")
  } else {
    console.log("Manager2 is " + ((t1 - t2) * 100 / t2).toFixed(2) + "% faster")
  }
}

function testPerformanceAdd(manager1, manager2) {
  const t1 = measurePerf(() => { addToManager(manager1, sample) })
  const t2 = measurePerf(() => { addToManager(manager2, sample) })

  console.log("Manager1 ::" + t1 + "ms")
  console.log("Manager2 ::" + t2 + "ms")

  if (t1 < t2) {
    console.log("Manager1 is " + (t2 - t1) * 100 / t1 + "% faster")
  } else {
    console.log("Manager2 is " + ((t1 - t2) * 100 / t2).toFixed(2) + "% faster")
  }
  manager1.clear()
  manager2.clear()
}

function addToManager(manager, entities) {
  for (let i = 0; i < entities.length; i++) {
    manager.add(entities[i])
  }
}

function createEntityhere(comps) {
  const entity = createEntity(rand(0, 1000), rand(0, 1000))
  for (let i = 0; i < comps.length; i++) {
    switch (comps[i]) {
      case 'sprite':
        entity.attach("sprite", new Sprite(
          new BoxGeometry(50, 10),
          new BasicMaterial()
        ))
        break;
      case 'body':
        entity.attach("body", new Box(50,10))
        break;
    }
  }
  return entity
}

function createSample(number, comps) {
  const entities = []
  for (var i = 0; i < number; i++) {
    const actual = comps // comps.filter(e => rand() > 0.6)
    entities.push(createEntityhere(actual))
  }
  return entities
}

function renderBound(ctx, bounds) {
  const w = (bounds.max.x - bounds.min.x)
  const h = (bounds.max.y - bounds.min.y)
  ctx.strokeRect(
    bounds.min.x,
    bounds.min.y,
    w,
    h
  )
}

function createPlatform(x, y, w, h) {
  let sprite = new Sprite(
    new BoxGeometry(w, h),
    new BasicMaterial()
  )
  let sprite1 = new Sprite(
    new BoxGeometry(h, w),
    new BasicMaterial()
  )
  let sprite2 = new Sprite(
    new BoxGeometry(h, w),
    new BasicMaterial()
  )
  let body = new Box(w, h)
  let body1 = new Box(h, w)
  let body2 = new Box(h, w)
  body.type = Body.STATIC
  body1.type = Body.STATIC
  body2.type = Body.STATIC

  return [
    createEntity(x, y)
    .attach("body", body)
    .attach("sprite", sprite),
    createEntity(x + w / 2, y)
    .attach("body", body1)
    .attach("sprite", sprite1),
    createEntity(x - w / 2, y)
      .attach("body", body2)
      .attach("sprite", sprite2),
    ]
}

function stack(x, y, w, h, no, spacing = 0) {
  const entities = []
  for (var i = 0; i < no; i++) {
    let entity = createEntity(x, y + (h + spacing) * i)
      .attach("body", new Box(w, h))
      .attach("sprite", new Sprite(
        new BoxGeometry(w, h),
        new BasicMaterial()
      ))
    entities.push(entity)
  }
  return entities
}
//world.gravity = 900
queryworld.gravity = 900
//defaultmanager.play()
typedmanager.play()
console.log(queryworld)
//console.log(defaultmanager)