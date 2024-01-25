import {
  Manager,
  createEntity,
  Renderer2D,
  World,
  Box,
  Sprite,
  BasicMaterial,
  BoxGeometry,
  Movable,
  rand
} from "./src/chaos.module.js"
import { ArchetypedManager } from "./src/manager.js"
import { queryWorld } from "./src/queryWorld.js"
import { QueryRenderer } from "./src/queryRenderer.js"
import { measurePerf } from "./src/tester.js"

const sample = createSample(10000, ["sprite", "movable"])

const queryrenderer = new QueryRenderer()
const defaultRenderer = new Renderer2D()

const defaultmanager = new Manager({
  autoplay: false
})
const typedmanager = new ArchetypedManager({
  autoplay: false
})


defaultmanager.registerSystem("renderer", defaultRenderer)
typedmanager.registerSystem(queryrenderer)
addToManager(defaultmanager, sample)
addToManager(typedmanager, sample)

testPerformance(defaultmanager,typedmanager)

function testPerformance(manager1, manager2) {
  const t1 = measurePerf(() => { manager1.update(0) })
  const t2 = measurePerf(() => { manager2.update(0) })
  
  console.log("Manager1 ::" + t1 + "ms")
  console.log("Manager2 ::" + t2 + "ms")
  
  if (t1 < t2) {
    console.log("Manager1 is " + (t1 - t2) * 100 / t1 + "% faster")
  } else {
    console.log("Manager2 is " + ((t1 - t2) * 100 / t2).toFixed(2) + "% faster")
  }
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
          new BoxGeometry(50, 50),
          new BasicMaterial()
        ))
        break;
      case 'movable':
        entity.attach("movable", new Movable(0, 100))
        break;
    }
  }
  return entity
}

function createSample(number, comps) {
  const entities = []
  for (var i = 0; i < number; i++) {
    const actual = comps.filter(e => rand() > 0.6)
    entities.push(createEntityhere(actual))
  }
  return entities
}