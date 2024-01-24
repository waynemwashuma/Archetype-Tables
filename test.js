import {
  Utils,
  Entity,
  Vector2,
  Angle,
  rand,
  Renderer2D,
} from "./src/chaos.module.js"
import { NaiveArchTypeTable } from "./src/naivearchtypetable.js"
import { Tester, measurePerf } from "./src/tester.js"
const sampleSize = 1000
const querySample = ["pos", "vel"]
const sample = createRandom(sampleSize, ["pos", "vel", "rot", "orient"])
const renderer = new Renderer2D()
renderer.bindTo("#can")
renderer.setViewport(innerWidth, innerHeight)
/*let a = createEntity([])
let b = createEntity(["pos","vel"])
let c = createEntity(["pos"])
let d = createEntity(["vel","pos"])

table_naive.insert(a)
table_naive.insert(b)
table_naive.insert(c)
table_naive.insert(d)

console.log(table_naive)
console.log(table_naive.query(["vel","pos"]))/**/
console.log("-----Traditional method -----\n")
const traditional_table = {
  entities: [],
  list: {},
  insert(entity) {
    entity.id = this.entities.length
    for (let name in entity._components) {
      if (!this.list[name])
        this.list[name] = []
      this.list[name][entity.id] = entity.get(name)
    }
    this.entities.push(entity)
  },
  remove(entity) {
    for (let name in entity._components) {
      this.list[name][entity.id] = null
    }
    Utils.removeElement(this.entities, entity.index)
    entity.id = -1
  },
  query(comps) {
    const out = []
    for (let name of comps) {
      out.push([this.list[name]])
    }
    return out
  }
}
const testrunner_traditional = new Tester(traditional_table, sample)

const traditional_insert = testrunner_traditional.measureInsert()
const traditional_query = testrunner_traditional.measureQuery(querySample)
const traditional_iterate = testrunner_traditional.measureIteration(iterateEntitiesSafe)
const traditional_remove = testrunner_traditional.measureRemove()

console.log("  Insertion time :: " + traditional_insert + "ms.")
console.log("  Removal time :: " + traditional_remove + "ms.")
console.log("  Query time :: " + traditional_query + "ms.")
console.log("  Iteration time :: " + traditional_iterate + "ms.")
/**/

console.log("-----Naive Archype Table-----\n")
const table_naive = new NaiveArchTypeTable()
const testrunner_naive = new Tester(table_naive, sample)

const naive_insert = testrunner_naive.measureInsert()
const naive_query = testrunner_naive.measureQuery(querySample)
const naive_iterate = testrunner_naive.measureIteration(iterateEntities)
const naive_remove = 0 // testrunner_naive.measureRemove()

console.log(table_naive)
console.log("  Insertion time :: " + naive_insert + "ms.")
console.log("  Removal time :: " + naive_remove + "ms.")
console.log("  Query time :: " + naive_query + "ms.")
console.log("  Iteration time :: " + naive_iterate + "ms.")
/**/

function createEntity(comps) {
  const entity = new Entity()
  for (let i = 0; i < comps.length; i++) {
    switch (comps[i]) {
      case "pos":
        entity.attach("pos", new Vector2(rand(0, innerWidth), rand(0, innerHeight)))
        break
      case "vel":
        entity.attach("vel", new Vector2())
        break
      case "rot":
        entity.attach("rot", new Angle())
        break
      case "orient":
        entity.attach("orient", new Angle())
        break
    }

  }
  return entity
}

function createRandom(number, comps) {
  const entities = []
  for (var i = 0; i < number; i++) {
    const actual = comps.filter(e => rand() > 0.6)
    entities.push(createEntity(actual))
  }
  return entities
}

function iterateEntities(comps) {
  const [position, velocity] = comps
  for (let i = 0; i < position.length; i++) {
    for (let j = 0; j < position[i].length; j++) {
      position[i][j].add(velocity[i][j])
    }
  }
}

function iterateEntitiesSafe(comps) {
  const [position, velocity] = comps
  for (let i = 0; i < position.length; i++) {
    for (let j = 0; j < position[i].length; j++) {
      if (!position[i][j] || !velocity[i][j])
        continue
      position[i][j].add(velocity[i][j])
    }
  }
}

function render(ctx, position) {
  ctx.beginPath()
  ctx.arc(position.x, position.y, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.closePath()
}

function renderloop() {
  let [positions] = table_naive.query(["pos"])
  console.log(positions)
  renderer.ctx.fillStyle = "black"
  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions[i].length; j++) {
      render(renderer.ctx, positions[i][j])
    }

  }
  //requestAnimationFrame(renderloop)
}
renderloop()
console.log("drawingtime:: " + measurePerf(renderloop))