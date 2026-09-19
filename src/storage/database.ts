import Dexie, { type EntityTable } from 'dexie'
import type { ProjectData } from '../store/useKachmoholStore'

export type SavedProject = { id: string; title: string; updatedAt: string; thumbnail?: string; data: ProjectData }
export type RecoverySnapshot = { id?: number; projectId: string; createdAt: string; data: ProjectData }
const db = new Dexie('kachmohol2099') as Dexie & {
  projects: EntityTable<SavedProject, 'id'>
  snapshots: EntityTable<RecoverySnapshot, 'id'>
}
db.version(1).stores({ projects: 'id, updatedAt' })
db.version(2).stores({ projects: 'id, updatedAt', snapshots: '++id, projectId, createdAt' })

export async function saveLocal(data: ProjectData, thumbnail?: string) {
  const id=data.projectMeta.id || 'legacy-autosave'; const previous=await db.projects.get(id)
  await db.projects.put({ id, title:data.projectMeta.title, updatedAt:new Date().toISOString(), thumbnail:thumbnail ?? previous?.thumbnail, data })
}
export async function loadLocal(id?:string) {
  if(id)return (await db.projects.get(id))?.data
  const latest=await db.projects.orderBy('updatedAt').last();return latest?.data
}
export async function listLocalProjects(){return db.projects.orderBy('updatedAt').reverse().toArray()}
export async function deleteLocalProject(id:string){await db.projects.delete(id);await db.snapshots.where('projectId').equals(id).delete()}
export async function duplicateLocalProject(project:SavedProject){const data=structuredClone(project.data);data.projectMeta.id=crypto.randomUUID();data.projectMeta.title+= ' Copy';data.projectMeta.createdAt=new Date().toISOString();data.projectMeta.updatedAt=data.projectMeta.createdAt;await saveLocal(data,project.thumbnail);return data}
export async function saveThumbnail(id:string,thumbnail:string){const project=await db.projects.get(id);if(project)await db.projects.update(id,{thumbnail})}
export async function saveRecovery(data:ProjectData){const projectId=data.projectMeta.id;await db.snapshots.add({projectId,createdAt:new Date().toISOString(),data:structuredClone(data)});const all=await db.snapshots.where('projectId').equals(projectId).sortBy('createdAt');if(all.length>5)await db.snapshots.bulkDelete(all.slice(0,all.length-5).map(item=>item.id!).filter(Boolean))}
export async function listRecovery(projectId:string){return db.snapshots.where('projectId').equals(projectId).reverse().sortBy('createdAt')}
