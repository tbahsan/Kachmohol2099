import type { EntityType } from '../store/useKachmoholStore'

export type ObjectCategory = 'nature' | 'energy' | 'life'
export interface ObjectDefinition {
  type: EntityType
  category: ObjectCategory
  name: { en: string; bn: string }
  description: { en: string; bn: string }
  interaction: { en: string; bn: string }
  color: string
  oxygen: number
  power: number
  humidity: number
}

export const objectCatalog: ObjectDefinition[] = [
  { type:'mushroom', category:'nature', name:{en:'Lumen Mushroom',bn:'লুমেন মাশরুম'}, description:{en:'Breathes soft spores into humid air.',bn:'আর্দ্র বাতাসে কোমল আলোক-বীজ ছড়ায়।'}, interaction:{en:'Release spores',bn:'আলোক-বীজ ছড়ান'}, color:'#ff4fc8', oxygen:8,power:0,humidity:5 },
  { type:'bonsai', category:'nature', name:{en:'Glow Bonsai',bn:'গ্লো বনসাই'}, description:{en:'A miniature tree grown around a light core.',bn:'আলোর কোর ঘিরে বেড়ে ওঠা ক্ষুদ্র বৃক্ষ।'}, interaction:{en:'Let it bloom',bn:'ফুল ফোটান'}, color:'#67f0a5', oxygen:14,power:0,humidity:-2 },
  { type:'coral', category:'nature', name:{en:'Cyber Coral',bn:'সাইবার কোরাল'}, description:{en:'Filters water and hums in harmonic waves.',bn:'পানি পরিশোধন করে সুরেলা তরঙ্গ তোলে।'}, interaction:{en:'Sing a wave',bn:'তরঙ্গ জাগান'}, color:'#ff718f', oxygen:6,power:0,humidity:10 },
  { type:'waterOrb', category:'nature', name:{en:'Cloud Orb',bn:'ক্লাউড অর্ব'}, description:{en:'A suspended reservoir that creates gentle mist.',bn:'ভাসমান জলাধার, যা কোমল কুয়াশা তৈরি করে।'}, interaction:{en:'Make rain',bn:'বৃষ্টি নামান'}, color:'#55dfff', oxygen:0,power:-2,humidity:18 },
  { type:'crystal', category:'energy', name:{en:'Neon Crystal',bn:'নিয়ন ক্রিস্টাল'}, description:{en:'Stores ambient energy as coloured light.',bn:'চারপাশের শক্তি রঙিন আলো হিসেবে ধরে রাখে।'}, interaction:{en:'Resonate',bn:'অনুরণন করুন'}, color:'#59f3ff', oxygen:0,power:9,humidity:0 },
  { type:'core', category:'energy', name:{en:'Anti-gravity Core',bn:'অ্যান্টি-গ্র্যাভিটি কোর'}, description:{en:'Keeps the habitat suspended and stable.',bn:'হ্যাবিট্যাটকে ভাসমান ও স্থিতিশীল রাখে।'}, interaction:{en:'Pulse energy',bn:'শক্তি প্রবাহিত করুন'}, color:'#8c74ff', oxygen:0,power:20,humidity:-2 },
  { type:'solarFlower', category:'energy', name:{en:'Solar Flower',bn:'সোলার ফ্লাওয়ার'}, description:{en:'Petal-like panels follow the moving sun.',bn:'পাপড়ির মতো প্যানেল চলমান সূর্য অনুসরণ করে।'}, interaction:{en:'Open petals',bn:'পাপড়ি খুলুন'}, color:'#ffd166', oxygen:2,power:16,humidity:-1 },
  { type:'beacon', category:'energy', name:{en:'Holo Beacon',bn:'হলো বিকন'}, description:{en:'Projects navigational rings through the dome.',bn:'ডোমের ভেতর পথনির্দেশক আলোর বলয় তৈরি করে।'}, interaction:{en:'Send a signal',bn:'সংকেত পাঠান'}, color:'#48e7ff', oxygen:0,power:-4,humidity:0 },
  { type:'jellyfish', category:'life', name:{en:'Synth Jellyfish',bn:'সিন্থ জেলিফিশ'}, description:{en:'A calm artificial lifeform attracted to balance.',bn:'ভারসাম্যের প্রতি আকৃষ্ট শান্ত কৃত্রিম প্রাণ।'}, interaction:{en:'Call closer',bn:'কাছে ডাকুন'}, color:'#d57cff', oxygen:-2,power:-3,humidity:8 },
  { type:'droneBee', category:'life', name:{en:'Pollinator Drone',bn:'পরাগায়ন ড্রোন'}, description:{en:'Pollinates luminous plants across the habitat.',bn:'হ্যাবিট্যাটের আলোকিত উদ্ভিদে পরাগায়ন করে।'}, interaction:{en:'Pollinate',bn:'পরাগায়ন করুন'}, color:'#ffd45a', oxygen:4,power:-5,humidity:0 }
]

export const getObjectDefinition = (type: EntityType) => objectCatalog.find(item => item.type === type) ?? objectCatalog[0]
