import { create } from 'zustand'
import { getObjectDefinition } from '../catalog/objects'

export type Language = 'en' | 'bn'
export type EntityType = 'mushroom' | 'bonsai' | 'coral' | 'waterOrb' | 'crystal' | 'core' | 'solarFlower' | 'beacon' | 'jellyfish' | 'droneBee'
export type TransformMode = 'translate' | 'rotate' | 'scale'
export type Vec3 = [number, number, number]

export interface Entity {
  id: string
  type: EntityType
  name: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  color: string
  locked: boolean
  hidden: boolean
  interactionCount?: number
}

export interface ProjectData {
  schemaVersion: 1
  appVersion: string
  projectMeta: { title: string; author: string; updatedAt: string }
  environment: { mode: 'day' | 'night'; auraColor: string; float: boolean }
  entities: Entity[]
}

type Snapshot = Pick<ProjectData, 'environment' | 'entities'>

interface Store extends ProjectData {
  language: Language
  selectedId: string | null
  transformMode: TransformMode
  past: Snapshot[]
  future: Snapshot[]
  saveState: 'saved' | 'saving'
  setLanguage: (language: Language) => void
  select: (id: string | null) => void
  setTransformMode: (mode: TransformMode) => void
  addEntity: (type: EntityType, position?: Vec3) => void
  newProject: (template?: 'empty' | 'garden' | 'abyss') => void
  deleteSelected: () => void
  duplicateSelected: () => void
  updateEntity: (id: string, patch: Partial<Entity>, record?: boolean) => void
  setEnvironment: (patch: Partial<ProjectData['environment']>) => void
  undo: () => void
  redo: () => void
  loadProject: (data: ProjectData) => void
  serialize: () => ProjectData
  markSaved: () => void
}

const initialEntities: Entity[] = [
  { id: 'mushroom-welcome', type: 'mushroom', name: 'Lumen Mushroom', position: [-1.25, -1.55, 0.2], rotation: [0, 0, -0.08], scale: [1, 1, 1], color: '#ff4fc8', locked: false, hidden: false, interactionCount: 0 },
  { id: 'crystal-welcome', type: 'crystal', name: 'Neon Crystal', position: [1.25, -1.42, 0], rotation: [0, 0, 0.12], scale: [1, 1.25, 1], color: '#59f3ff', locked: false, hidden: false, interactionCount: 0 },
  { id: 'core-welcome', type: 'core', name: 'Anti-gravity Core', position: [0, 0.25, 0], rotation: [0.25, 0, 0.1], scale: [.85, .85, .85], color: '#8c74ff', locked: false, hidden: false, interactionCount: 0 }
]

const copySnapshot = (s: Snapshot): Snapshot => structuredClone(s)

export const useKachmoholStore = create<Store>((set, get) => {
  const checkpoint = () => set(state => ({
    past: [...state.past.slice(-49), copySnapshot({ entities: state.entities, environment: state.environment })],
    future: [], saveState: 'saving'
  }))

  return {
    schemaVersion: 1,
    appVersion: '0.6.0',
    projectMeta: { title: 'Neon Eden', author: 'Explorer-01', updatedAt: new Date().toISOString() },
    environment: { mode: 'night', auraColor: '#4defff', float: true },
    entities: initialEntities,
    language: (localStorage.getItem('kachmohol-language') as Language) || 'bn',
    selectedId: null,
    transformMode: 'translate',
    past: [], future: [], saveState: 'saved',
    setLanguage: language => { localStorage.setItem('kachmohol-language', language); set({ language }) },
    select: selectedId => set({ selectedId }),
    setTransformMode: transformMode => set({ transformMode }),
    addEntity: (type, position) => {
      checkpoint()
      const id = `${type}-${crypto.randomUUID()}`
      const definition = getObjectDefinition(type)
      const entity: Entity = { id, type, name: definition.name.en, position: position ?? [(Math.random() - .5) * 2.2, ['core','waterOrb','jellyfish','droneBee'].includes(type) ? -.45 : -1.58, (Math.random() - .5) * 1.2], rotation: [0, Math.random() * Math.PI, 0], scale: [1, 1, 1], color: definition.color, locked: false, hidden: false, interactionCount: 0 }
      set(state => ({ entities: [...state.entities, entity], selectedId: id }))
    },
    newProject: (template = 'empty') => {
      checkpoint()
      const entities = template === 'empty' ? [] : template === 'garden' ? structuredClone(initialEntities) : [
        { id: `crystal-${crypto.randomUUID()}`, type: 'crystal' as const, name: 'Abyss Crystal', position: [-.7,-1.58,.1] as Vec3, rotation: [0,.4,0] as Vec3, scale: [1.2,1.2,1.2] as Vec3, color: '#42e8ff', locked: false, hidden: false, interactionCount: 0 },
        { id: `core-${crypto.randomUUID()}`, type: 'core' as const, name: 'Tidal Core', position: [.75,-.45,0] as Vec3, rotation: [.2,0,.1] as Vec3, scale: [.8,.8,.8] as Vec3, color: '#8f63ff', locked: false, hidden: false, interactionCount: 0 }
      ]
      set({ entities, environment: { mode: template === 'garden' ? 'day' : 'night', auraColor: template === 'abyss' ? '#4a8cff' : '#4defff', float: true }, selectedId: null, past: [], future: [], saveState: 'saving' })
    },
    deleteSelected: () => {
      const id = get().selectedId; if (!id) return
      checkpoint(); set(state => ({ entities: state.entities.filter(e => e.id !== id), selectedId: null }))
    },
    duplicateSelected: () => {
      const source = get().entities.find(e => e.id === get().selectedId); if (!source) return
      checkpoint()
      const clone = structuredClone(source); clone.id = `${clone.type}-${crypto.randomUUID()}`; clone.name += ' Copy'; clone.position = [clone.position[0] + .35, clone.position[1] + .2, clone.position[2]]
      set(state => ({ entities: [...state.entities, clone], selectedId: clone.id }))
    },
    updateEntity: (id, patch, record = true) => {
      if (record) checkpoint()
      set(state => ({ entities: state.entities.map(e => e.id === id ? { ...e, ...patch } : e), saveState: 'saving' }))
    },
    setEnvironment: patch => { checkpoint(); set(state => ({ environment: { ...state.environment, ...patch } })) },
    undo: () => set(state => {
      const previous = state.past.at(-1); if (!previous) return state
      return { ...copySnapshot(previous), past: state.past.slice(0, -1), future: [copySnapshot({ entities: state.entities, environment: state.environment }), ...state.future], selectedId: null, saveState: 'saving' }
    }),
    redo: () => set(state => {
      const next = state.future[0]; if (!next) return state
      return { ...copySnapshot(next), future: state.future.slice(1), past: [...state.past, copySnapshot({ entities: state.entities, environment: state.environment })], selectedId: null, saveState: 'saving' }
    }),
    loadProject: data => set({ ...data, selectedId: null, past: [], future: [], saveState: 'saving' }),
    serialize: () => {
      const s = get(); return { schemaVersion: 1, appVersion: s.appVersion, projectMeta: { ...s.projectMeta, updatedAt: new Date().toISOString() }, environment: s.environment, entities: s.entities }
    },
    markSaved: () => set({ saveState: 'saved' })
  }
})
