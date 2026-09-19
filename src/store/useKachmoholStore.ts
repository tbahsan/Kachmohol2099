import { create } from 'zustand'
import { getObjectDefinition, objectCatalog } from '../catalog/objects'

export type Language = 'en' | 'bn'
export type EntityType = 'mushroom' | 'bonsai' | 'coral' | 'waterOrb' | 'crystal' | 'core' | 'solarFlower' | 'beacon' | 'jellyfish' | 'droneBee'
export type TransformMode = 'translate' | 'rotate' | 'scale'
export type Vec3 = [number, number, number]
export type PatternType = 'mirror' | 'radial' | 'scatter'
export interface Entity { id:string;type:EntityType;name:string;position:Vec3;rotation:Vec3;scale:Vec3;color:string;locked:boolean;hidden:boolean;interactionCount?:number;groupId?:string|null }
export interface ProjectData {
  schemaVersion:1;appVersion:string
  projectMeta:{id:string;title:string;author:string;createdAt:string;updatedAt:string}
  environment:{mode:'day'|'night';auraColor:string;float:boolean}
  entities:Entity[]
}
type Snapshot=Pick<ProjectData,'environment'|'entities'>
interface Store extends ProjectData {
  language:Language;selectedId:string|null;selectedIds:string[];transformMode:TransformMode;past:Snapshot[];future:Snapshot[];saveState:'saved'|'saving'
  setLanguage:(language:Language)=>void;select:(id:string|null,multi?:boolean)=>void;setTransformMode:(mode:TransformMode)=>void
  addEntity:(type:EntityType,position?:Vec3)=>void;newProject:(template?:'empty'|'garden'|'abyss')=>void;renameProject:(title:string)=>void
  deleteSelected:()=>void;duplicateSelected:()=>void;groupSelected:()=>void;ungroupSelected:()=>void;applyPattern:(pattern:PatternType)=>void;generateScene:(theme:'balanced'|'garden'|'cosmic')=>void
  updateEntity:(id:string,patch:Partial<Entity>,record?:boolean)=>void;setEnvironment:(patch:Partial<ProjectData['environment']>)=>void
  undo:()=>void;redo:()=>void;loadProject:(data:ProjectData)=>void;serialize:()=>ProjectData;markSaved:()=>void
}
const makeEntity=(type:EntityType,position:Vec3,name?:string):Entity=>{const definition=getObjectDefinition(type);return{id:`${type}-${crypto.randomUUID()}`,type,name:name??definition.name.en,position,rotation:[0,Math.random()*Math.PI,0],scale:[1,1,1],color:definition.color,locked:false,hidden:false,interactionCount:0,groupId:null}}
const initialEntities:Entity[]=[makeEntity('mushroom',[-1.25,-1.55,.2]),makeEntity('crystal',[1.25,-1.42,0]),makeEntity('core',[0,.25,0])]
const now=()=>new Date().toISOString();const newMeta=(title='Untitled Dome')=>({id:crypto.randomUUID(),title,author:'Explorer-01',createdAt:now(),updatedAt:now()})
const copySnapshot=(snapshot:Snapshot):Snapshot=>structuredClone(snapshot)
export const useKachmoholStore=create<Store>((set,get)=>{
  const checkpoint=()=>set(state=>({past:[...state.past.slice(-49),copySnapshot({entities:state.entities,environment:state.environment})],future:[],saveState:'saving'}))
  const setSelection=(ids:string[])=>set({selectedIds:ids,selectedId:ids.at(-1)??null})
  return {
    schemaVersion:1,appVersion:'0.8.0',projectMeta:newMeta('Neon Eden'),environment:{mode:'night',auraColor:'#4defff',float:true},entities:initialEntities,
    language:(localStorage.getItem('kachmohol-language') as Language)||'bn',selectedId:null,selectedIds:[],transformMode:'translate',past:[],future:[],saveState:'saved',
    setLanguage:language=>{localStorage.setItem('kachmohol-language',language);set({language})},
    select:(id,multi=false)=>{if(!id)return setSelection([]);const current=get().selectedIds;if(multi)setSelection(current.includes(id)?current.filter(item=>item!==id):[...current,id]);else setSelection([id])},
    setTransformMode:transformMode=>set({transformMode}),
    addEntity:(type,position)=>{checkpoint();const floating=['core','waterOrb','jellyfish','droneBee'].includes(type);const entity=makeEntity(type,position??[(Math.random()-.5)*2.2,floating?-.45:-1.58,(Math.random()-.5)*1.2]);set(state=>({entities:[...state.entities,entity],selectedId:entity.id,selectedIds:[entity.id]}))},
    newProject:(template='empty')=>{checkpoint();const entities=template==='empty'?[]:template==='garden'?structuredClone(initialEntities):[makeEntity('crystal',[-.7,-1.58,.1],'Abyss Crystal'),makeEntity('core',[.75,-.45,0],'Tidal Core'),makeEntity('jellyfish',[0,.2,.3])];set({projectMeta:newMeta(template==='empty'?'Untitled Dome':template==='garden'?'Lumen Garden':'Abyssal Core'),entities,environment:{mode:template==='garden'?'day':'night',auraColor:template==='abyss'?'#4a8cff':'#4defff',float:true},selectedId:null,selectedIds:[],past:[],future:[],saveState:'saving'})},
    renameProject:title=>set(state=>({projectMeta:{...state.projectMeta,title},saveState:'saving'})),
    deleteSelected:()=>{const ids=get().selectedIds;if(!ids.length)return;checkpoint();set(state=>({entities:state.entities.filter(entity=>!ids.includes(entity.id)),selectedId:null,selectedIds:[]}))},
    duplicateSelected:()=>{const ids=get().selectedIds;if(!ids.length)return;checkpoint();const clones=get().entities.filter(entity=>ids.includes(entity.id)).map(source=>({...structuredClone(source),id:`${source.type}-${crypto.randomUUID()}`,name:`${source.name} Copy`,position:[source.position[0]+.32,source.position[1],source.position[2]+.22] as Vec3}));set(state=>({entities:[...state.entities,...clones],selectedId:clones.at(-1)?.id??null,selectedIds:clones.map(item=>item.id)}))},
    groupSelected:()=>{const ids=get().selectedIds;if(ids.length<2)return;checkpoint();const groupId=crypto.randomUUID();set(state=>({entities:state.entities.map(entity=>ids.includes(entity.id)?{...entity,groupId}:entity)}))},
    ungroupSelected:()=>{const ids=get().selectedIds;if(!ids.length)return;checkpoint();const groups=new Set(get().entities.filter(entity=>ids.includes(entity.id)).map(entity=>entity.groupId).filter(Boolean));set(state=>({entities:state.entities.map(entity=>entity.groupId&&groups.has(entity.groupId)?{...entity,groupId:null}:entity)}))},
    applyPattern:pattern=>{const source=get().entities.find(entity=>entity.id===get().selectedId);if(!source)return;checkpoint();let clones:Entity[]=[];if(pattern==='mirror')clones=[{...structuredClone(source),id:`${source.type}-${crypto.randomUUID()}`,name:`${source.name} Mirror`,position:[-source.position[0],source.position[1],source.position[2]],rotation:[source.rotation[0],-source.rotation[1],source.rotation[2]]}];if(pattern==='radial')clones=Array.from({length:5},(_,index)=>{const angle=(index+1)*Math.PI*2/6;const radius=Math.max(.7,Math.hypot(source.position[0],source.position[2]));return{...structuredClone(source),id:`${source.type}-${crypto.randomUUID()}`,name:`${source.name} ${index+2}`,position:[Math.cos(angle)*radius,source.position[1],Math.sin(angle)*radius],rotation:[source.rotation[0],-angle,source.rotation[2]]}});if(pattern==='scatter')clones=Array.from({length:5},(_,index)=>{const angle=Math.random()*Math.PI*2;const radius=.5+Math.random()*1.5;return{...structuredClone(source),id:`${source.type}-${crypto.randomUUID()}`,name:`${source.name} ${index+2}`,position:[Math.cos(angle)*radius,source.position[1],Math.sin(angle)*radius],rotation:[0,Math.random()*Math.PI*2,0],scale:[.72+Math.random()*.5,.72+Math.random()*.5,.72+Math.random()*.5]}});set(state=>({entities:[...state.entities,...clones],selectedIds:[source.id,...clones.map(item=>item.id)]}))},
    generateScene:theme=>{checkpoint();const pool=theme==='garden'?objectCatalog.filter(item=>item.category==='nature'):theme==='cosmic'?objectCatalog.filter(item=>item.category!=='nature'):objectCatalog;const entities=Array.from({length:theme==='balanced'?12:9},(_,index)=>{const item=pool[index%pool.length];const angle=index/Math.max(1,(theme==='balanced'?12:9))*Math.PI*2;const radius=.55+(index%4)*.38;const floating=['core','waterOrb','jellyfish','droneBee'].includes(item.type);const entity=makeEntity(item.type,[Math.cos(angle)*radius,floating?-.25+(index%3)*.45:-1.58,Math.sin(angle)*radius]);entity.scale=[.72+(index%3)*.14,.72+(index%3)*.14,.72+(index%3)*.14];return entity});set({projectMeta:newMeta(theme==='garden'?'Generated Garden':theme==='cosmic'?'Cosmic Machine':'Balanced Habitat'),entities,environment:{mode:theme==='garden'?'day':'night',auraColor:theme==='cosmic'?'#8d67ff':'#4defff',float:true},selectedId:null,selectedIds:[],past:[],future:[],saveState:'saving'})},
    updateEntity:(id,patch,record=true)=>{if(record)checkpoint();set(state=>{const source=state.entities.find(entity=>entity.id===id);let entities=state.entities;if(source?.groupId&&patch.position){const delta:[number,number,number]=[patch.position[0]-source.position[0],patch.position[1]-source.position[1],patch.position[2]-source.position[2]];entities=entities.map(entity=>entity.groupId===source.groupId?{...entity,position:[entity.position[0]+delta[0],entity.position[1]+delta[1],entity.position[2]+delta[2]]}:entity)}else entities=entities.map(entity=>entity.id===id?{...entity,...patch}:entity);return{entities,saveState:'saving'}})},
    setEnvironment:patch=>{checkpoint();set(state=>({environment:{...state.environment,...patch}}))},
    undo:()=>set(state=>{const previous=state.past.at(-1);if(!previous)return state;return{...copySnapshot(previous),past:state.past.slice(0,-1),future:[copySnapshot({entities:state.entities,environment:state.environment}),...state.future],selectedId:null,selectedIds:[],saveState:'saving'}}),
    redo:()=>set(state=>{const next=state.future[0];if(!next)return state;return{...copySnapshot(next),future:state.future.slice(1),past:[...state.past,copySnapshot({entities:state.entities,environment:state.environment})],selectedId:null,selectedIds:[],saveState:'saving'}}),
    loadProject:data=>{const timestamp=now();const migrated={...data,projectMeta:{id:data.projectMeta?.id||crypto.randomUUID(),title:data.projectMeta?.title||'Imported Dome',author:data.projectMeta?.author||'Explorer-01',createdAt:data.projectMeta?.createdAt||timestamp,updatedAt:data.projectMeta?.updatedAt||timestamp},entities:(data.entities||[]).map(entity=>({...entity,groupId:entity.groupId??null,interactionCount:entity.interactionCount??0}))};set({...migrated,selectedId:null,selectedIds:[],past:[],future:[],saveState:'saving'})},
    serialize:()=>{const state=get();return{schemaVersion:1,appVersion:state.appVersion,projectMeta:{...state.projectMeta,updatedAt:now()},environment:state.environment,entities:state.entities}},markSaved:()=>set({saveState:'saved'})
  }
})
