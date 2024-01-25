import {
  Utils,
  IndexedList,
  Clock,
  Perf,
  EventDispatcher,
  Err
} from "./chaos.module.js"
import { NaiveArchTypeTable } from "./naivearchtypetable.js"
export class ArchetypedManager {
  /**
   * RAF number of current frame.Used for pausing the manager.
   * 
   * @private
   * @type number
   */
  _rafID = undefined
  /**
   * @private
   */
  _table = new NaiveArchTypeTable()
  /**
   * 
   * @private
   * @type System[]
   */
  _systems = []
  /**
   * @private
   */
  _coreSystems = {
    world: null,
    renderer: null,
  }
  /**
   * 
   * @private
   * @type boolean
   */
  _initialized = false
  /**
   * Whether or not the manager is playing.
   * 
   * @type boolean
   */
  playing = false
  /**
   * 
   * @private
   * @type Object<string, string>
   */
  clock = new Clock()
  /**
   * 
   * @private
   * @type Entity[]
   */
  objects = []
  /**
   * 
   * @private
   * @type number
   */
  _accumulator = 0
  /**
   * Ideal framerate of the manager.Not implemented corrretly.
   * TODO correct it
   * 
   * @type number
   */
  frameRate = 0
  /**
   * 
   * @ignore.
   * This is an artifact of me debugging this.
   * TODO - Should implement a better soluton
   */
  perf = new Perf()
  /**
   * @readonly
   * @type EventDispatcher
   */
  events = new EventDispatcher()
  /**
   * @private
   */
  _update = accumulate => {
    this.perf.start();
    let dt = this.clock.update(accumulate);

    if (this._accumulator < this.frameRate) {
      this._accumulator += dt;
      this.RAF();
      return
    }
    this.events.trigger("updateStart");
    this.update(dt)
    this.events.trigger("update");
    this.events.trigger("updateEnd");
    this._accumulator = 0;
    this.perf.end();
    this.RAF();
  }
  /**
   * Creates a new instance of Manager class
   **/
  constructor(options = {}) {
    options = Object.assign({
      autoplay:true,
    },options)
    this.init()
    if(options.autoplay)this.play()
  }
  /**
   * This initializes the manager.
   * No need to call this function directly.
   * This is called after the preloader finishes loading all its files.
   * 
   */
  init() {
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].init(this);
    }
    this.events.trigger("init", this);
    this._initialized = true;
    if (this.playing) this.play();
  }
  /**
   * Adds an entity to the manager and initializes it.
   * 
   * @param {Entity} entity The entity to add
   */
  add(entity) {
    this.events.trigger("add", entity);
    this._table.insert(entity)
    this.objects.push(entity)
  }
  addComponents(components) {
    const entity = new Entity()
    for (let name in components) {
      entity.attach(name, components[name])
    }
    this.add(entity)
    return entity
  }

  /**
   * Removes an entity from the manager.
   * Note that this doesn't destroy the entity, only removes it and its components from the manager.
   * To destroy the entity,use `Entity.destroy()` method.
   * 
   * @param {Entity} entity The entity to remove
   */
  remove(entity) {
    this.events.trigger("remove", entity);
    this._table.remove(entity)

  }
  /**
   * This removes all of the entities and components from the manager
   */
  clear() {
    this._table.clear()
    this.events.trigger("clear");
    this.objects.length = 0
  }
  /**
   * This method requests an animation frame from the browser
   * 
   * @private
   */
  RAF() {
    this._rafID = requestAnimationFrame(this._update);
  }
  /**
   * This starts up the update loop of the manager
   */
  play() {
    if (!this._initialized) {
      this.playing = true;
      return
    }
    this.RAF();
    this.events.trigger("play");
  }
  /**
   * This stops the update loop of the manager
   */
  pause() {
    if (!this._initialized) {
      this.playing = false;
      return
    }
    cancelAnimationFrame(this._rafID);
    this.events.trigger("pause");
  }
  /**
   * Marches the update loop forward,updating
   * the systems
   * You shouldn't mess with this/call it or everything will explode with undetectable errors.
   * 
   * @private
   */
  update(dt = 0.016) {
    const world = this._coreSystems["world"],
      renderer = this._coreSystems["renderer"],
      systems = this._systems;
    //the only reason this is here is that
    //i need to debug stuff visually - ill remove it later.
    if (renderer) renderer.clear();

    for (let i = 0; i < systems.length; i++) {
      systems[i].update(dt, this);
    }

    if (world) world.update(dt);
    if (renderer) renderer.update(dt);
    if (world) {
      this.events.trigger("precollision", world.contactList);
      this.events.trigger("collision", world.CLMDs);
    }

  }
  /**
   * Used to register a system
   *
   * @param {System} sys The system to be addad
   * 
   * @param {string} [name] 
   */
  registerSystem(sys, name) {
    switch (name) {
      case "world":
      case "physics":
        this._coreSystems.world = sys
        break
      case "renderer":
        this._coreSystems.renderer = sys
        break
      default:
        this._systems.push(sys)
    }
  }
  /**
   * Finds the first entity with all the components and returns it.
   * 
   * @param {Array<String>} comps An array containing the component names to be searched
   * @returns {Entity} 
   */
  getEntityByComponents(comps, entities = this.objects) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < comps.length; j++) {
        if (!entities[i].has(comps[j])) continue
        return entities[i]
      }
    }
  }
  /**
   * Finds the first entity with all the tag and returns it.
   * 
   * @param {Array<String>} comps An array containing the component names to be searched
   * @param {Entity[]} [entities = Manager#objects] The array of entities to search in.Defaults to the manager's entity list
   * @param {Entity[]} [target]
   * 
   * @returns {Entity[]} 
   */
  getEntitiesByComponents(comps, entities = this.objects, target = []) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < comps.length; j++) {
        if (!entities[i].has(comps[j])) continue
        target.push(entities[i]);
      }
    }
    return target
  }
  /**
   * Finds the first entity with all the tag and returns it.
   * 
   * @param {Array<String>} tags An array containing the tags to be searched
   * @returns {Entity} 
   */
  getEntityByTags(tags, entities = this.objects) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < tags.length; j++) {
        if (!entities[i].hasTag(tags[j])) continue
        return entities[i]
      }
    }
  }
  /**
   * Finds the entities with all the tag and returns them in an array.
   * 
   * @param {string[]} tags An array containing the tags to be searched
   * @param {Entity[]} [entities = Manager#objects] The array of entities to search in. Defaults to the manager's entity list
   * @param {Entity[]} target
   * @returns {Entity[]} 
   */
  getEntitiesByTags(tags, entities = this.objects, target = []) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < tags.length; j++) {
        if (!entities[i].hasTag(tags[j])) continue
        target.push(entities[i]);
      }
    }
    return target
  }
  /**
   * @param { string[]  } compNames
   * @returns Entity[]
   */
  query(compNames) {
    return this._table.query(compNames)
  }
}