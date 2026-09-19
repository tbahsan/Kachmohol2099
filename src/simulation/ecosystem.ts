import type { Entity, EntityType } from '../store/useKachmoholStore'
import { getObjectDefinition } from '../catalog/objects'

export interface EcosystemStats {
  oxygen: number
  power: number
  humidity: number
  biodiversity: number
  stability: number
  mood: 'harmonious' | 'growing' | 'quiet'
  synergies: { id: string; en: string; bn: string; bonus: string }[]
  recommendations: { en: string; bn: string }[]
}
const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)))
const has=(types:Set<EntityType>,...wanted:EntityType[])=>wanted.every(type=>types.has(type))

export function calculateEcosystem(entities:Entity[], mode:'day'|'night'):EcosystemStats {
  const totals=entities.reduce((sum,entity)=>{const item=getObjectDefinition(entity.type);return {oxygen:sum.oxygen+item.oxygen,power:sum.power+item.power,humidity:sum.humidity+item.humidity}}, {oxygen:42,power:42,humidity:42})
  const types=new Set(entities.map(entity=>entity.type)); const synergies:EcosystemStats['synergies']=[]
  const add=(id:string,en:string,bn:string,bonus:string)=>synergies.push({id,en,bn,bonus})
  if(has(types,'bonsai','droneBee')){totals.oxygen+=10;add('pollination','Living pollination loop','জীবন্ত পরাগায়ন চক্র','O₂ +10')}
  if(has(types,'coral','waterOrb')){totals.humidity+=12;totals.oxygen+=4;add('reef','Self-cleaning cloud reef','স্বয়ং-পরিষ্কার ক্লাউড রিফ','Humidity +12')}
  if(has(types,'crystal','core')){totals.power+=14;add('resonance','Crystal-core resonance','ক্রিস্টাল-কোর অনুরণন','Power +14')}
  if(has(types,'mushroom','waterOrb')){totals.oxygen+=7;totals.humidity+=5;add('spores','Mist-fed spore garden','কুয়াশা-পুষ্ট স্পোর উদ্যান','O₂ +7')}
  if(mode==='day'&&types.has('solarFlower')){totals.power+=12;add('solar','Solar bloom alignment','সৌর-পুষ্প সমন্বয়','Power +12')}
  if(mode==='night'&&types.has('beacon')){totals.power+=5;add('night-signal','Night beacon efficiency','রাত্রিকালীন বিকন দক্ষতা','Power +5')}
  const oxygen=clamp(totals.oxygen),power=clamp(totals.power),humidity=clamp(totals.humidity)
  const diversity=Math.min(100,types.size*11+entities.length*2)
  const target=68;const balancePenalty=(Math.abs(oxygen-target)+Math.abs(power-target)+Math.abs(humidity-target))/3
  const stability=clamp(100-balancePenalty+synergies.length*3)
  const recommendations:EcosystemStats['recommendations']=[]
  if(oxygen<55)recommendations.push({en:'Add a bonsai or mushroom for more oxygen.',bn:'অক্সিজেন বাড়াতে বনসাই বা মাশরুম যোগ করুন।'})
  if(power<55)recommendations.push({en:'A solar flower or crystal will restore power.',bn:'সোলার ফ্লাওয়ার বা ক্রিস্টাল শক্তি বাড়াবে।'})
  if(humidity<50)recommendations.push({en:'Add a cloud orb to create gentle mist.',bn:'কোমল কুয়াশার জন্য ক্লাউড অর্ব যোগ করুন।'})
  if(humidity>85)recommendations.push({en:'Add a solar flower to soften excess humidity.',bn:'অতিরিক্ত আর্দ্রতা কমাতে সোলার ফ্লাওয়ার যোগ করুন।'})
  if(!recommendations.length)recommendations.push({en:'Your habitat is balanced. Try discovering a new synergy.',bn:'হ্যাবিট্যাট ভারসাম্যপূর্ণ। নতুন synergy আবিষ্কার করুন।'})
  return {oxygen,power,humidity,biodiversity:diversity,stability,mood:stability>78?'harmonious':stability>55?'growing':'quiet',synergies,recommendations}
}

export function calculateAchievements(entities:Entity[], stats:EcosystemStats):string[]{
  const types=new Set(entities.map(entity=>entity.type));const interacted=entities.filter(entity=>(entity.interactionCount??0)>0).length;const result:string[]=[]
  if(entities.length>=1)result.push('first-light')
  if(types.size>=3)result.push('three-worlds')
  if(entities.length>=8)result.push('collector')
  if(interacted>=5)result.push('curious-mind')
  if(stats.stability>=80&&entities.length>=4)result.push('perfect-harmony')
  if(stats.synergies.length>=3)result.push('system-weaver')
  return result
}

export const achievementCatalog={
  'first-light':{en:'First Light',bn:'প্রথম আলো',detailEn:'Place your first artifact.',detailBn:'প্রথম আর্টিফ্যাক্ট স্থাপন করুন।'},
  'three-worlds':{en:'Three Worlds',bn:'তিন জগৎ',detailEn:'Use three different artifact types.',detailBn:'তিন ধরনের আর্টিফ্যাক্ট ব্যবহার করুন।'},
  collector:{en:'Curator',bn:'সংগ্রাহক',detailEn:'Build a habitat with eight artifacts.',detailBn:'আটটি আর্টিফ্যাক্ট দিয়ে হ্যাবিট্যাট বানান।'},
  'curious-mind':{en:'Curious Mind',bn:'কৌতূহলী মন',detailEn:'Interact with five artifacts.',detailBn:'পাঁচটি আর্টিফ্যাক্টের সঙ্গে interact করুন।'},
  'perfect-harmony':{en:'Perfect Harmony',bn:'নিখুঁত ভারসাম্য',detailEn:'Reach 80% ecosystem stability.',detailBn:'৮০% ecosystem stability অর্জন করুন।'},
  'system-weaver':{en:'System Weaver',bn:'সিস্টেম উইভার',detailEn:'Discover three synergies.',detailBn:'তিনটি synergy আবিষ্কার করুন।'}
} as const
