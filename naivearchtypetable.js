import { Utils, Err } from "./chaos.module.js"
class Archtype {
  entities = []
  components = new Map()
  keys = []
  /**
   * @param {Entity} entity
   */
  insert(entity) {
    if (entity.id !== -1)
      return Err.warn("An entity has been added twice into an archetype.\nThe dublicate will be ignored.")
    for (let i = 0; i < this.keys.length; i++) {
      this.components.get(this.keys[i]).push(entity.get(this.keys[i]))
    }
    this.entities.push(entity)
    entity.id = this.entities.length - 1
  }
  remove(entity) {
    const index = entity.id
    for (let name in entity._components) {
      Utils.removeElement(
        this.components.get(name),
        index
      )
    }
    Utils.removeElement(
      this.entities,
      index
    )
    if ( index !== this.entities.length)
      this.entities[index].id = index
    entity.id = -1
  }
  setComponentList(name, list) {
    this.components.set(name, list)
    this.keys.push(name)
  }
  getComponentLists(name) {
    return this.components.get(name)
  }
  hasComponentList(name) {
    return this.components.has(name)
  }
}
export class NaiveArchTypeTable {
  queryList = {

  }
  list = []
  constructor() {}
  _createArchetype(comps) {
    const archetype = new Archtype()
    for (let i = 0; i < comps.length; i++) {
      archetype.setComponentList(comps[i], [])
    }
    this.list.push(archetype)
    return archetype
  }
  _ArcheTypeHasOnly(archetype,comps){
    if (comps.length !== archetype.components.size) return false
    for (let i = 0; i < comps.length; i++) {
      if (!archetype.components.has(comps[i])) return false
    }
    return true
  }
  _getArchetype(comps) {
    for (let i = 0; i < this.list.length; i++) {
      if (this._ArcheTypeHasOnly(this.list[i],comps)) {
        return this.list[i]
      }
    }
    return null
  }
  _getArchetypes(comps) {
    const filtered = []
    for (let i = 0; i < this.list.length; i++) {
      let hasComponents = true
      for (let j = 0; j < comps.length; j++) {
        if (!this.list[i].hasComponentList(comps[j])) {
          hasComponents = false
          break
        }
      }
      if (hasComponents)
        filtered.push(this.list[i])
    }
    return filtered
  }
  insert(entity) {
    const keys = []
    for (let name in entity._components) {
      keys.push(name)
    }
    let t =
      this._getArchetype(keys) ||
      this._createArchetype(keys)

    t.insert(entity)
  }
  remove(entity) {
    const keys = []
    for (let name in entity._components) {
      keys.push(name)
    }
    const t = this._getArchetype(keys)
    t.remove(entity)
  }
  query(compnames) {
    let archetypes = this._getArchetypes(compnames)
    let out = []
    for (let i = 0; i < compnames.length; i++) {
      out[i] = []
    }
    for (let i = 0; i < out.length; i++) {
      for (let j = 0; j < archetypes.length; j++) {
        const bin = archetypes[j].getComponentLists(compnames[i])
        out[i].push(bin)
        /*for (let k = 0; k < bin.length; k++) {
          out[i].push(bin[k])
        }*/
      }
    }
    return out
  }
}