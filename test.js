import { Entity, Vector2, Angle, rand } from "./chaos.module.js"
import { NaiveArchTypeTable } from "./naivearchtypetable.js"

const entity1 = createEntity(["pos", "vel"])
const entity2 = createEntity(["pos", "vel"])
const entities = createRandom(100000, ["pos", "vel", "rot", "orient"])

const game = new NaiveArchTypeTable()

game.insert(entity1)
game.insert(entity2)

game.remove(entity1)
game.remove(entity2)

addToTable(game, entities)

console.log(game)
console.log(measurePerf(() => game.query(["pos", "vel"])))
console.log(game.query(["pos", "vel"]))

function createEntity(comps) {
  const entity = new Entity()
  for (let i = 0; i < comps.length; i++) {
    switch (comps[i]) {
      case "pos":
        entity.attach("pos", new Vector2())
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

function addToTable(table, entities) {
  for (let i = 0; i < entities.length; i++) {
    table.insert(entities[i])
  }
}

function removeFromTable(table, entities) {
  for (let i = 0; i < entities.length; i++) {
    table.remove(entities[i])
  }
}

function measurePerf(func) {
  const t = performance.now()
  func()
  return performance.now() - t
}