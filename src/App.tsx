import { useEffect, useRef, useState } from 'react'
import { Activity, BookOpen, Box, Camera, ChevronRight, CircleDot, Copy, Download, FlipHorizontal, Folder, FolderOpen, Grid3X3, Home, Languages, Layers, LayoutDashboard, LockKeyhole, Maximize2, Minimize2, Moon, Move3D, Plus, Redo2, RefreshCw, Rotate3D, Scale3D, Sparkles, Sun, Trash2, Trophy, Undo2, Upload, WandSparkles, X } from 'lucide-react'
import { TerrariumCanvas } from './scene/TerrariumCanvas'
import { useKachmoholStore, type EntityType, type ProjectData, type TransformMode } from './store/useKachmoholStore'
import { translations } from './locales/translations'
import { getObjectDefinition, objectCatalog } from './catalog/objects'
import { achievementCatalog, calculateAchievements, calculateEcosystem } from './simulation/ecosystem'
import { deleteLocalProject, duplicateLocalProject, listLocalProjects, listRecovery, loadLocal, saveLocal, saveRecovery, saveThumbnail, type RecoverySnapshot, type SavedProject } from './storage/database'
import './styles/app.css'

function IconButton({ title, onClick, disabled, active, children }: { title: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return <button className={`icon-button ${active ? 'active' : ''}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>{children}</button>
}

function App() {
  const store = useKachmoholStore()
  const t = translations[store.language]
  const selected = store.entities.find(e => e.id === store.selectedId)
  const selectedDefinition = selected ? getObjectDefinition(selected.type) : null
  const ecosystem = calculateEcosystem(store.entities, store.environment.mode)
  const stats = ecosystem
  const achievements = calculateAchievements(store.entities, ecosystem)
  const discoveredTypes = new Set(store.entities.filter(entity => (entity.interactionCount ?? 0) > 0).map(entity => entity.type))
  const inputRef = useRef<HTMLInputElement>(null)
  const [welcome, setWelcome] = useState(false)
  const [homeOpen, setHomeOpen] = useState(true)
  const [advanced, setAdvanced] = useState(false)
  const [relaxMode, setRelaxMode] = useState(false)
  const [pendingType, setPendingType] = useState<EntityType | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [ecosystemOpen, setEcosystemOpen] = useState(false)
  const [ecosystemTab, setEcosystemTab] = useState<'status' | 'codex' | 'achievements'>('status')
  const [projectOpen, setProjectOpen] = useState(false)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [snapshots, setSnapshots] = useState<RecoverySnapshot[]>([])
  const [creativeOpen, setCreativeOpen] = useState(false)
  const [cameraPreset, setCameraPreset] = useState('front:0')
  const [notice, setNotice] = useState('')
  const primaryName = store.language === 'bn' ? 'কাচমহল ২০৯৯' : 'Kachmohol 2099'
  const alternateName = store.language === 'bn' ? 'KACHMOHOL 2099' : 'কাচমহল ২০৯৯'

  useEffect(() => { loadLocal().then(data => data && store.loadProject(data)).catch(console.warn) }, [])
  useEffect(() => {
    const open = () => setInspectorOpen(true)
    window.addEventListener('kachmohol-open-inspector', open)
    return () => window.removeEventListener('kachmohol-open-inspector', open)
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(async () => { await saveLocal(store.serialize()); store.markSaved() }, 700)
    return () => clearTimeout(timer)
  }, [store.entities, store.environment])
  useEffect(() => {
    const timer=window.setInterval(()=>saveRecovery(useKachmoholStore.getState().serialize()).catch(console.warn),30000)
    return()=>clearInterval(timer)
  },[store.projectMeta.id])
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('kachmohol-achievements') || '[]') as string[]
    const fresh = achievements.filter(id => !saved.includes(id))
    if (fresh.length) { const item=achievementCatalog[fresh[0] as keyof typeof achievementCatalog]; setNotice(`${store.language==='bn'?'অর্জন':'Achievement'}: ${store.language==='bn'?item.bn:item.en}`); localStorage.setItem('kachmohol-achievements',JSON.stringify([...new Set([...saved,...achievements])])) }
  }, [achievements.join('|')])
  useEffect(() => {
    if (store.entities.length < 3) return
    const timer=window.setInterval(() => { const messages=ecosystem.stability>75 ? (store.language==='bn'?['একটি নরম অরোরা হ্যাবিট্যাট ছুঁয়ে গেল।','আলোক-বীজ বাতাসে ভেসে উঠেছে।']:['A soft aurora passed through the habitat.','Luminous spores drift through the air.']) : (store.language==='bn'?['হ্যাবিট্যাট শান্তভাবে নতুন ভারসাম্য খুঁজছে।']:['The habitat is gently seeking a new balance.']); setNotice(messages[Math.floor(Math.random()*messages.length)]) },45000)
    return () => clearInterval(timer)
  }, [store.entities.length, ecosystem.stability, store.language])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo() }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); store.duplicateSelected() }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if ((e.target as HTMLElement).tagName !== 'INPUT') store.deleteSelected() }
      else if (e.key.toLowerCase() === 'g') store.setTransformMode('translate')
      else if (e.key.toLowerCase() === 'r') store.setTransformMode('rotate')
      else if (e.key.toLowerCase() === 's' && !mod) store.setTransformMode('scale')
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [store.selectedId, store.entities, store.past, store.future])

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(store.serialize(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kachmohol-2099-dome.json'; a.click(); URL.revokeObjectURL(url)
  }
  const importProject = async (file?: File) => {
    if (!file || file.size > 2_000_000) return setNotice('Invalid or oversized file')
    try {
      const data = JSON.parse(await file.text()) as ProjectData
      if (data.schemaVersion !== 1 || !Array.isArray(data.entities) || !data.environment) throw new Error()
      store.loadProject(data); setNotice(store.language === 'bn' ? 'ডোম সফলভাবে ইমপোর্ট হয়েছে' : 'Dome imported successfully')
    } catch { setNotice(store.language === 'bn' ? 'সঠিক Kachmohol JSON নয়' : 'Not a valid Kachmohol JSON') }
  }
  const takePhoto = () => {
    const canvas = document.querySelector('#terrarium-canvas') as HTMLCanvasElement | null
    if (!canvas) return; const a = document.createElement('a'); a.download = 'kachmohol-2099.png'; a.href = canvas.toDataURL('image/png'); a.click()
  }
  const refreshProjects=async()=>{setProjects(await listLocalProjects());setSnapshots(await listRecovery(store.projectMeta.id))}
  const openProjects=async()=>{const canvas=document.querySelector('#terrarium-canvas') as HTMLCanvasElement|null;if(canvas)await saveThumbnail(store.projectMeta.id,canvas.toDataURL('image/jpeg',.6));await refreshProjects();setProjectOpen(true)}
  const openSavedProject=async(id:string)=>{const data=await loadLocal(id);if(data){store.loadProject(data);setProjectOpen(false);setHomeOpen(false)}}
  const removeProject=async(id:string)=>{if(projects.length<=1)return;await deleteLocalProject(id);await refreshProjects()}
  const copyProject=async(project:SavedProject)=>{await duplicateLocalProject(project);await refreshProjects()}
  const restoreSnapshot=(snapshot:RecoverySnapshot)=>{store.loadProject(snapshot.data);setProjectOpen(false);setNotice(store.language==='bn'?'পূর্ববর্তী সংস্করণ ফিরিয়ে আনা হয়েছে':'Recovery snapshot restored')}
  const chooseCamera=(name:string)=>setCameraPreset(`${name}:${Date.now()}`)
  const closeWelcome = () => { sessionStorage.setItem('kachmohol-entered', '1'); setWelcome(false) }
  const beginProject = (template: 'empty' | 'garden' | 'abyss') => { store.newProject(template); setHomeOpen(false); setPendingType(null); setInspectorOpen(false); if (template === 'empty') setWelcome(true) }
  const addSmart = (type: EntityType) => {
    const index = store.entities.length
    const angle = index * 2.35 + .6
    const radius = .75 + (index % 3) * .38
    const floating = ['core', 'waterOrb', 'jellyfish', 'droneBee'].includes(type)
    const position: [number, number, number] = [Math.cos(angle) * radius, floating ? -.45 + (index % 2) * .55 : -1.58, Math.sin(angle) * radius]
    store.addEntity(type, position); setCatalogOpen(false); setNotice(store.language === 'bn' ? 'অবজেক্ট যোগ হয়েছে—ধরে টেনে সরান' : 'Object added — drag it to move')
  }
  const enterRelax = () => { setRelaxMode(true); document.documentElement.requestFullscreen?.().catch(() => undefined) }
  const exitRelax = () => { setRelaxMode(false); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined) }

  return <main className={`app-shell ${relaxMode ? 'relax-mode' : ''}`}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>{primaryName}</strong><small>{alternateName} · {t.subtitle}</small></div></div>
      <div className="top-actions">
        <IconButton title={store.language==='bn'?'প্রজেক্ট':'Projects'} onClick={openProjects}><Folder /></IconButton>
        <IconButton title={store.language==='bn'?'ক্রিয়েটিভ টুল':'Creative tools'} onClick={() => setCreativeOpen(true)}><WandSparkles /></IconButton>
        <IconButton title="Creative Home" onClick={() => setHomeOpen(true)}><Home /></IconButton>
        <button className={`mode-button ${advanced ? 'active' : ''}`} onClick={() => setAdvanced(v => !v)}><LayoutDashboard />{advanced ? (store.language === 'bn' ? 'সহজ মোড' : 'Guided mode') : (store.language === 'bn' ? 'অ্যাডভান্সড' : 'Advanced')}</button>
        <span className={`save-state ${store.saveState}`}>{store.saveState === 'saved' ? t.saved : t.saving}</span>
        <button className="relax-button" onClick={enterRelax}><Maximize2 />{store.language === 'bn' ? 'রিল্যাক্স' : 'Relax'}</button>
        <div className="tool-pair"><IconButton title="Undo" onClick={store.undo} disabled={!store.past.length}><Undo2 /></IconButton><IconButton title="Redo" onClick={store.redo} disabled={!store.future.length}><Redo2 /></IconButton></div>
        <IconButton title={t.photo} onClick={takePhoto}><Camera /></IconButton>
        <button className="text-button" onClick={exportProject}><Download /> {t.export}</button>
        <button className="text-button" onClick={() => inputRef.current?.click()}><Upload /> {t.import}</button>
        <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={e => importProject(e.target.files?.[0])} />
        <button className="language" onClick={() => store.setLanguage(store.language === 'bn' ? 'en' : 'bn')}><Languages /> {store.language === 'bn' ? 'EN' : 'বাংলা'}</button>
      </div>
    </header>

    <section className={`workspace ${advanced ? 'advanced' : 'guided'} ${inspectorOpen ? 'show-inspector' : ''} ${catalogOpen ? 'catalog-open' : ''} ${pendingType ? 'placing' : ''}`}>
      <aside className="panel left-panel">
        <button className="catalog-close" onClick={() => setCatalogOpen(false)} aria-label="Close catalog"><X /></button>
        <PanelTitle icon={<Box />} text={t.objects} />
        <div className="catalog">
          {objectCatalog.map((definition, index) => <button key={definition.type} className={`catalog-card category-${definition.category}`} onClick={() => { addSmart(definition.type); setInspectorOpen(false) }}>
            <span className={`artifact-preview p${index % 3}`}><Sparkles /></span><span><em>{definition.category}</em><b>{definition.name[store.language]}</b><small>{definition.description[store.language]}</small></span><ChevronRight />
          </button>)}
        </div>
        <PanelTitle icon={<Sparkles />} text={t.scene} />
        <div className="entity-list">{store.entities.map(e => <button key={e.id} className={store.selectedIds.includes(e.id) ? 'selected' : ''} onClick={event => store.select(e.id,event.shiftKey)}><span className={`dot ${e.type}`} />{e.name}</button>)}</div>
      </aside>

      <section className="viewport"><TerrariumCanvas pendingType={pendingType} advanced={advanced} relax={relaxMode} stability={ecosystem.stability} cameraPreset={cameraPreset} onPlace={position => { if (!pendingType) return; store.addEntity(pendingType, position); setPendingType(null); setNotice(store.language === 'bn' ? 'আর্টিফ্যাক্টটি স্থাপন হয়েছে' : 'Artifact placed') }} />
        {!advanced && !pendingType && <div className="guided-create-tray">
          <button className="add-object-button" onClick={() => setCatalogOpen(true)}><Plus /><span><b>{store.language === 'bn' ? 'অবজেক্ট যোগ করুন' : 'Add object'}</b><small>{store.language === 'bn' ? 'উদ্ভিদ, ক্রিস্টাল ও প্রযুক্তি' : 'Nature, crystals and technology'}</small></span></button>
          {selected && <>
            <span className="tray-divider" />
            <div className="selected-summary"><i className={`dot ${selected.type}`} /><span><b>{selected.name}</b><small>{store.language === 'bn' ? 'ধরে টেনে সরান' : 'Drag the object to move'}</small></span></div>
            <div className="step-control"><small>{store.language === 'bn' ? 'ঘোরান' : 'Rotate'}</small><span><button onClick={() => store.updateEntity(selected.id,{rotation:[selected.rotation[0],selected.rotation[1]-.25,selected.rotation[2]]})}>−</button><button onClick={() => store.updateEntity(selected.id,{rotation:[selected.rotation[0],selected.rotation[1]+.25,selected.rotation[2]]})}>+</button></span></div>
            <div className="step-control"><small>{store.language === 'bn' ? 'আকার' : 'Size'}</small><span><button onClick={() => {const n=Math.max(.35,selected.scale[0]-.12);store.updateEntity(selected.id,{scale:[n,n,n]})}}>−</button><button onClick={() => {const n=Math.min(2.5,selected.scale[0]+.12);store.updateEntity(selected.id,{scale:[n,n,n]})}}>+</button></span></div>
            {selectedDefinition && <button className="interact-button" onClick={() => { store.updateEntity(selected.id,{interactionCount:(selected.interactionCount ?? 0)+1}); setNotice(selectedDefinition.interaction[store.language]) }}><Sparkles />{selectedDefinition.interaction[store.language]}</button>}
            <button className="tray-more" onClick={() => setInspectorOpen(true)}>{store.language === 'bn' ? 'আরও' : 'More'}<ChevronRight /></button>
          </>}
        </div>}
        {pendingType && <div className="placement-banner"><span><Plus />{store.language === 'bn' ? 'ডোমের ভেতর পছন্দের জায়গায় ক্লিক করুন' : 'Click a spot inside the dome to place it'}</span><button onClick={() => setPendingType(null)}><X />{store.language === 'bn' ? 'বাতিল' : 'Cancel'}</button></div>}
        <div className="guided-environment"><button className={store.environment.mode === 'day' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'day' })}><Sun />{t.day}</button><button className={store.environment.mode === 'night' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'night' })}><Moon />{t.night}</button></div>
        <div className="viewport-hint">{t.tip}</div><div className="scanline" /></section>

      <aside className="panel right-panel">
        <button className="inspector-close" onClick={() => setInspectorOpen(false)} aria-label="Close inspector"><X /></button>
        <PanelTitle icon={<Sparkles />} text={t.environment} />
        <div className="segmented"><button className={store.environment.mode === 'day' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'day' })}><Sun />{t.day}</button><button className={store.environment.mode === 'night' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'night' })}><Moon />{t.night}</button></div>
        <label className="field"><span>{t.aura}</span><input type="color" value={store.environment.auraColor} onChange={e => store.setEnvironment({ auraColor: e.target.value })} /></label>
        <label className="toggle"><span>{t.float}</span><input type="checkbox" checked={store.environment.float} onChange={e => store.setEnvironment({ float: e.target.checked })} /><i /></label>
        <div className="separator" />
        {selected ? <div className="inspector">
          <small className="eyebrow">{t.selected}</small><input className="name-input" value={selected.name} onChange={e => store.updateEntity(selected.id, { name: e.target.value })} />
          {selectedDefinition && <><p className="artifact-description">{selectedDefinition.description[store.language]}</p><div className="impact-row"><span>O₂ {selectedDefinition.oxygen > 0 ? '+' : ''}{selectedDefinition.oxygen}</span><span>⚡ {selectedDefinition.power > 0 ? '+' : ''}{selectedDefinition.power}</span><span>◌ {selectedDefinition.humidity > 0 ? '+' : ''}{selectedDefinition.humidity}</span></div><button className="discover-button" onClick={() => store.updateEntity(selected.id,{interactionCount:(selected.interactionCount ?? 0)+1})}><Sparkles />{selectedDefinition.interaction[store.language]}</button></>}
          <div className="transform-tools">{([['translate', Move3D], ['rotate', Rotate3D], ['scale', Scale3D]] as [TransformMode, typeof Move3D][]).map(([mode, Icon]) => <IconButton key={mode} title={mode} active={store.transformMode === mode} onClick={() => store.setTransformMode(mode)}><Icon /></IconButton>)}</div>
          <label className="field color-field"><span>{t.color}</span><input type="color" value={selected.color} onChange={e => store.updateEntity(selected.id, { color: e.target.value })} /></label>
          <div className="object-actions"><button onClick={store.duplicateSelected}><Copy />{t.duplicate}</button><button className="danger" onClick={store.deleteSelected}><Trash2 />{t.remove}</button></div>
        </div> : <div className="empty-inspector"><Move3D /><p>{t.empty}</p></div>}
      </aside>
    </section>

    <footer className="statusbar">
      <Meter label={t.oxygen} value={stats.oxygen} color="#65ffd1" /><Meter label={t.power} value={stats.power} color="#65c7ff" /><Meter label={t.humidity} value={stats.humidity} color="#c27bff" />
      <a className="author-credit" href="https://github.com/tbahsan" target="_blank" rel="noreferrer">Created by tbahsan</a>
      <button className="harmony" onClick={() => setEcosystemOpen(true)}><i />{ecosystem.stability}% · {store.language==='bn'?(ecosystem.mood==='harmonious'?'সুরেলা ভারসাম্য':ecosystem.mood==='growing'?'বিকাশমান':'শান্ত'):(ecosystem.mood==='harmonious'?'HARMONIOUS':ecosystem.mood==='growing'?'GROWING':'QUIET')}</button>
    </footer>

    {relaxMode && <div className="relax-overlay"><div><strong>{primaryName}</strong><small>{store.environment.mode === 'day' ? t.day : t.night} · {store.entities.length} artifacts</small></div><a href="https://github.com/tbahsan" target="_blank" rel="noreferrer">by tbahsan</a><button onClick={exitRelax}><Minimize2 />{store.language === 'bn' ? 'বের হন' : 'Exit'}</button></div>}
    {ecosystemOpen && <div className="dashboard-backdrop" onMouseDown={event => { if(event.target===event.currentTarget)setEcosystemOpen(false) }}><section className="ecosystem-dashboard">
      <header><div><small>LIVING SYSTEM</small><h2>{store.language==='bn'?'কাচমহল পর্যবেক্ষণ':'Habitat Observatory'}</h2></div><button onClick={() => setEcosystemOpen(false)}><X /></button></header>
      <nav><button className={ecosystemTab==='status'?'active':''} onClick={()=>setEcosystemTab('status')}><Activity />{store.language==='bn'?'অবস্থা':'Status'}</button><button className={ecosystemTab==='codex'?'active':''} onClick={()=>setEcosystemTab('codex')}><BookOpen />Codex</button><button className={ecosystemTab==='achievements'?'active':''} onClick={()=>setEcosystemTab('achievements')}><Trophy />{store.language==='bn'?'অর্জন':'Achievements'}</button></nav>
      {ecosystemTab==='status' && <div className="dashboard-content"><div className="stability-hero"><div style={{'--stability':`${ecosystem.stability*3.6}deg`} as React.CSSProperties}><strong>{ecosystem.stability}%</strong><small>STABILITY</small></div><span><b>{ecosystem.mood.toUpperCase()}</b><small>{store.language==='bn'?'কঠিন failure নেই—পরামর্শ অনুসরণ করে ভারসাম্য উন্নত করুন।':'There is no hard failure—follow gentle suggestions to improve balance.'}</small></span></div><div className="dashboard-meters"><Meter label={t.oxygen} value={stats.oxygen} color="#65ffd1"/><Meter label={t.power} value={stats.power} color="#65c7ff"/><Meter label={t.humidity} value={stats.humidity} color="#c27bff"/></div><h3>{store.language==='bn'?'আবিষ্কৃত Synergy':'Discovered synergies'}</h3><div className="synergy-list">{ecosystem.synergies.length?ecosystem.synergies.map(item=><div key={item.id}><Sparkles/><span><b>{store.language==='bn'?item.bn:item.en}</b><small>{item.bonus}</small></span></div>):<p>{store.language==='bn'?'সম্পর্কিত object একসঙ্গে রাখলে synergy আবিষ্কার হবে।':'Combine related artifacts to discover synergies.'}</p>}</div><h3>{store.language==='bn'?'কোমল পরামর্শ':'Gentle suggestion'}</h3><p className="recommendation">{ecosystem.recommendations[0][store.language]}</p></div>}
      {ecosystemTab==='codex' && <div className="dashboard-content codex-grid">{objectCatalog.map(item=><article key={item.type} className={discoveredTypes.has(item.type)?'discovered':'undiscovered'}><div><Sparkles/></div><small>{item.category}</small><h3>{discoveredTypes.has(item.type)?item.name[store.language]:'???'}</h3><p>{discoveredTypes.has(item.type)?item.description[store.language]:(store.language==='bn'?'Dome-এ object-এর সঙ্গে interact করে আবিষ্কার করুন।':'Interact with this artifact in the dome to discover it.')}</p></article>)}</div>}
      {ecosystemTab==='achievements' && <div className="dashboard-content achievement-grid">{Object.entries(achievementCatalog).map(([id,item])=><article key={id} className={achievements.includes(id)?'earned':''}><Trophy/><div><h3>{store.language==='bn'?item.bn:item.en}</h3><p>{store.language==='bn'?item.detailBn:item.detailEn}</p></div><span>{achievements.includes(id)?'✓':'○'}</span></article>)}</div>}
    </section></div>}
    {projectOpen && <div className="dashboard-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setProjectOpen(false)}}><section className="project-manager">
      <header><div><small>LOCAL WORKSPACE</small><h2>{store.language==='bn'?'আমার কাচমহল':'My Projects'}</h2></div><button onClick={()=>setProjectOpen(false)}><X/></button></header>
      <div className="project-current"><label>{store.language==='bn'?'বর্তমান প্রজেক্ট':'Current project'}<input value={store.projectMeta.title} onChange={event=>store.renameProject(event.target.value)}/></label><button onClick={()=>{store.newProject('empty');setProjectOpen(false);setHomeOpen(false)}}><Plus/>{store.language==='bn'?'নতুন ডোম':'New Dome'}</button></div>
      <div className="project-body"><div><h3>{store.language==='bn'?'লোকাল প্রজেক্ট':'Local projects'}</h3><div className="project-grid">{projects.map(project=><article key={project.id} className={project.id===store.projectMeta.id?'current':''}>{project.thumbnail?<img src={project.thumbnail}/>:<div className="project-placeholder"><Sparkles/></div>}<div><b>{project.title}</b><small>{new Date(project.updatedAt).toLocaleString()}</small></div><span><button onClick={()=>openSavedProject(project.id)}>Open</button><button onClick={()=>copyProject(project)}><Copy/></button><button disabled={projects.length<=1} onClick={()=>removeProject(project.id)}><Trash2/></button></span></article>)}</div></div><aside><h3>{store.language==='bn'?'রিকভারি':'Recovery snapshots'}</h3>{snapshots.length?snapshots.map(snapshot=><button key={snapshot.id} onClick={()=>restoreSnapshot(snapshot)}><RefreshCw/><span><b>{new Date(snapshot.createdAt).toLocaleTimeString()}</b><small>{snapshot.data.entities.length} artifacts</small></span></button>):<p>{store.language==='bn'?'৩০ সেকেন্ড কাজ করার পর recovery snapshot দেখা যাবে।':'Recovery snapshots appear after 30 seconds of work.'}</p>}</aside></div>
    </section></div>}
    {creativeOpen && <div className="dashboard-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setCreativeOpen(false)}}><section className="creative-studio">
      <header><div><small>CREATIVE LAB</small><h2>{store.language==='bn'?'নির্মাণ সরঞ্জাম':'Creation Tools'}</h2></div><button onClick={()=>setCreativeOpen(false)}><X/></button></header>
      <div className="creative-section"><h3><Layers/>{store.language==='bn'?'নির্বাচন ও গ্রুপ':'Selection & groups'}</h3><p>{store.language==='bn'?`নির্বাচিত ${store.selectedIds.length}টি · একাধিক object নিতে Shift + click করুন`:`${store.selectedIds.length} selected · Shift-click objects to select more`}</p><div className="tool-grid"><button disabled={store.selectedIds.length<2} onClick={store.groupSelected}><Layers/><span><b>Group</b><small>Move together</small></span></button><button disabled={!store.selectedIds.length} onClick={store.ungroupSelected}><Grid3X3/><span><b>Ungroup</b><small>Separate items</small></span></button><button disabled={!store.selectedIds.length} onClick={store.duplicateSelected}><Copy/><span><b>Duplicate</b><small>Copy selection</small></span></button></div></div>
      <div className="creative-section"><h3><CircleDot/>{store.language==='bn'?'প্যাটার্ন':'Pattern tools'}</h3><div className="tool-grid"><button disabled={!selected} onClick={()=>store.applyPattern('mirror')}><FlipHorizontal/><span><b>Mirror</b><small>Opposite side</small></span></button><button disabled={!selected} onClick={()=>store.applyPattern('radial')}><CircleDot/><span><b>Radial ×6</b><small>Circle pattern</small></span></button><button disabled={!selected} onClick={()=>store.applyPattern('scatter')}><Sparkles/><span><b>Scatter</b><small>Organic cluster</small></span></button></div></div>
      <div className="creative-section"><h3><Camera/>{store.language==='bn'?'ক্যামেরা':'Camera presets'}</h3><div className="preset-row">{['front','top','isometric','interior','underside'].map(name=><button key={name} onClick={()=>chooseCamera(name)}>{name}</button>)}</div></div>
      <div className="creative-section"><h3><WandSparkles/>{store.language==='bn'?'প্রসিডিউরাল জেনারেটর':'Procedural generator'}</h3><p>{store.language==='bn'?'বর্তমান scene বদলে নতুন seed-ভিত্তিক arrangement তৈরি করবে।':'Replaces the current scene with a fresh generated arrangement.'}</p><div className="generator-row"><button onClick={()=>{store.generateScene('balanced');setCreativeOpen(false)}}>Balanced Habitat</button><button onClick={()=>{store.generateScene('garden');setCreativeOpen(false)}}>Lumen Garden</button><button onClick={()=>{store.generateScene('cosmic');setCreativeOpen(false)}}>Cosmic Machine</button></div></div>
    </section></div>}
    {homeOpen && <div className="home-hub">
      <div className="home-glow" /><div className="home-content">
        <div className="home-brand"><div className="orb"><Sparkles /></div><small>{alternateName}</small><h1>{primaryName}</h1><p>{store.language === 'bn' ? 'আপনার নিজস্ব জীবন্ত কাচের জগৎ গড়ে তুলুন' : 'Create your own living world of glass and light'}</p></div>
        <div className="home-actions">
          <button className="continue-card" onClick={() => setHomeOpen(false)}><FolderOpen /><span><b>{store.language === 'bn' ? 'আগের কাজ চালিয়ে যান' : 'Continue creating'}</b><small>{store.entities.length} {store.language === 'bn' ? 'টি আর্টিফ্যাক্ট · লোকালি সেভ' : 'artifacts · saved locally'}</small></span><ChevronRight /></button>
          <div className="new-project-title"><span>{store.language === 'bn' ? 'নতুন কাচমহল' : 'START A NEW DOME'}</span></div>
          <div className="template-grid">
            <button className="template empty" onClick={() => beginProject('empty')}><Plus /><span><b>{store.language === 'bn' ? 'খালি ডোম' : 'Empty Dome'}</b><small>{store.language === 'bn' ? 'শূন্য থেকে তৈরি করুন' : 'Begin from nothing'}</small></span></button>
            <button className="template garden" onClick={() => beginProject('garden')}><span className="template-art">✦</span><span><b>{store.language === 'bn' ? 'লুমেন উদ্যান' : 'Lumen Garden'}</b><small>{store.language === 'bn' ? 'উজ্জ্বল সোলারপাঙ্ক' : 'Bright solarpunk'}</small></span></button>
            <button className="template abyss" onClick={() => beginProject('abyss')}><span className="template-art">◉</span><span><b>{store.language === 'bn' ? 'অ্যাবিসাল কোর' : 'Abyssal Core'}</b><small>{store.language === 'bn' ? 'গভীর নিয়ন রাত্রি' : 'Deep neon night'}</small></span></button>
          </div>
        </div>
        <button className="home-language" onClick={() => store.setLanguage(store.language === 'bn' ? 'en' : 'bn')}><Languages />{store.language === 'bn' ? 'Continue in English' : 'বাংলায় চালিয়ে যান'}</button>
      </div>
    </div>}
    {welcome && <div className="modal-backdrop"><div className="welcome-card"><div className="orb"><Sparkles /></div><small>KACHMOHOL 2099</small><h1>{t.welcome}</h1><p>{t.welcomeText}</p><button onClick={closeWelcome}>{t.start}<ChevronRight /></button><span>{t.tip}</span></div></div>}
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
  </main>
}

function PanelTitle({ icon, text }: { icon: React.ReactNode; text: string }) { return <h2 className="panel-title">{icon}<span>{text}</span></h2> }
function Meter({ label, value, color }: { label: string; value: number; color: string }) { return <div className="meter"><div><span>{label}</span><b>{value}%</b></div><div className="track"><i style={{ width: `${value}%`, background: color, boxShadow: `0 0 12px ${color}` }} /></div></div> }
export default App
