import Dexie, { type EntityTable } from 'dexie'
import type { ProjectData } from '../store/useKachmoholStore'

type SavedProject = { id: string; updatedAt: string; data: ProjectData }
const db = new Dexie('kachmohol2099') as Dexie & { projects: EntityTable<SavedProject, 'id'> }
db.version(1).stores({ projects: 'id, updatedAt' })

export async function saveLocal(data: ProjectData) {
  await db.projects.put({ id: 'autosave', updatedAt: new Date().toISOString(), data })
}
export async function loadLocal() {
  return (await db.projects.get('autosave'))?.data
}
