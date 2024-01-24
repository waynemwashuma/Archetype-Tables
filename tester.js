

export class Tester {
  constructor(table, sample) {
    this.table = table
    this.sample = sample
    this.queryResult = null
  }
  measureInsert() {
    
    return measurePerf(e => {
      for (let i = 0; i < this.sample.length; i++) {
        this.table.insert(this.sample[i])
      }
    })
  }
  measureRemove() {
    return measurePerf(e => {
      for (let i = 0; i < this.sample.length; i++) {
        this.table.remove(this.sample[i])
      }
    })

  }
  measureQuery(sample) {
    return measurePerf(e =>this.queryResult = this.table.query(sample))
  }
  measureIteration(func){
    return measurePerf(e=>func(this.queryResult))
  }
}


export function addToTable(table, entities) {
  for (let i = 0; i < entities.length; i++) {
    table.insert(entities[i])
  }
}

export function removeFromTable(table, entities) {
  for (let i = 0; i < entities.length; i++) {
    table.remove(entities[i])
  }
}

export function measurePerf(func) {
  const t = performance.now()
  func()
  return performance.now() - t
}