import { useEffect, useRef, useState } from 'react'
import { Box, Camera, ChevronRight, Copy, Download, Languages, LockKeyhole, Moon, Move3D, Redo2, Rotate3D, Scale3D, Sparkles, Sun, Trash2, Undo2, Upload } from 'lucide-react'
import { TerrariumCanvas } from './scene/TerrariumCanvas'
import { useKachmoholStore, type EntityType, type ProjectData, type TransformMode } from './store/useKachmoholStore'
import { translations } from './locales/translations'
import { loadLocal, saveLocal } from './storage/database'
import './styles/app.css'

function IconButton({ title, onClick, disabled, active, children }: { title: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return <button className={`icon-button ${active ? 'active' : ''}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>{children}</button>
}

function App() {
  const store = useKachmoholStore()
  const t = translations[store.language]
  const selected = store.entities.find(e => e.id === store.selectedId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [welcome, setWelcome] = useState(() => !sessionStorage.getItem('kachmohol-entered'))
  const [notice, setNotice] = useState('')

  useEffect(() => { loadLocal().then(data => data && store.loadProject(data)).catch(console.warn) }, [])
  useEffect(() => {
    const timer = window.setTimeout(async () => { await saveLocal(store.serialize()); store.markSaved() }, 700)
    return () => clearTimeout(timer)
  }, [store.entities, store.environment])

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
  const closeWelcome = () => { sessionStorage.setItem('kachmohol-entered', '1'); setWelcome(false) }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Sparkles size={18} /></div><div><strong>কাচমহল <span>২০৯৯</span></strong><small>KACHMOHOL 2099 · {t.subtitle}</small></div></div>
      <div className="top-actions">
        <span className={`save-state ${store.saveState}`}>{store.saveState === 'saved' ? t.saved : t.saving}</span>
        <div className="tool-pair"><IconButton title="Undo" onClick={store.undo} disabled={!store.past.length}><Undo2 /></IconButton><IconButton title="Redo" onClick={store.redo} disabled={!store.future.length}><Redo2 /></IconButton></div>
        <IconButton title={t.photo} onClick={takePhoto}><Camera /></IconButton>
        <button className="text-button" onClick={exportProject}><Download /> {t.export}</button>
        <button className="text-button" onClick={() => inputRef.current?.click()}><Upload /> {t.import}</button>
        <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={e => importProject(e.target.files?.[0])} />
        <button className="language" onClick={() => store.setLanguage(store.language === 'bn' ? 'en' : 'bn')}><Languages /> {store.language === 'bn' ? 'EN' : 'বাংলা'}</button>
      </div>
    </header>

    <section className="workspace">
      <aside className="panel left-panel">
        <PanelTitle icon={<Box />} text={t.objects} />
        <div className="catalog">
          {(['mushroom', 'crystal', 'core'] as EntityType[]).map((type, i) => <button key={type} className="catalog-card" onClick={() => store.addEntity(type)}>
            <span className={`artifact-preview p${i}`}><Sparkles /></span><span><b>{t[type]}</b><small>+ ADD TO DOME</small></span><ChevronRight />
          </button>)}
          <div className="locked-card"><LockKeyhole /><span>{t.locked}</span><b>06</b></div>
        </div>
        <PanelTitle icon={<Sparkles />} text={t.scene} />
        <div className="entity-list">{store.entities.map(e => <button key={e.id} className={e.id === store.selectedId ? 'selected' : ''} onClick={() => store.select(e.id)}><span className={`dot ${e.type}`} />{e.name}</button>)}</div>
      </aside>

      <section className="viewport"><TerrariumCanvas /><div className="viewport-hint">{t.tip}</div><div className="scanline" /></section>

      <aside className="panel right-panel">
        <PanelTitle icon={<Sparkles />} text={t.environment} />
        <div className="segmented"><button className={store.environment.mode === 'day' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'day' })}><Sun />{t.day}</button><button className={store.environment.mode === 'night' ? 'active' : ''} onClick={() => store.setEnvironment({ mode: 'night' })}><Moon />{t.night}</button></div>
        <label className="field"><span>{t.aura}</span><input type="color" value={store.environment.auraColor} onChange={e => store.setEnvironment({ auraColor: e.target.value })} /></label>
        <label className="toggle"><span>{t.float}</span><input type="checkbox" checked={store.environment.float} onChange={e => store.setEnvironment({ float: e.target.checked })} /><i /></label>
        <div className="separator" />
        {selected ? <div className="inspector">
          <small className="eyebrow">{t.selected}</small><input className="name-input" value={selected.name} onChange={e => store.updateEntity(selected.id, { name: e.target.value })} />
          <div className="transform-tools">{([['translate', Move3D], ['rotate', Rotate3D], ['scale', Scale3D]] as [TransformMode, typeof Move3D][]).map(([mode, Icon]) => <IconButton key={mode} title={mode} active={store.transformMode === mode} onClick={() => store.setTransformMode(mode)}><Icon /></IconButton>)}</div>
          <label className="field color-field"><span>{t.color}</span><input type="color" value={selected.color} onChange={e => store.updateEntity(selected.id, { color: e.target.value })} /></label>
          <div className="object-actions"><button onClick={store.duplicateSelected}><Copy />{t.duplicate}</button><button className="danger" onClick={store.deleteSelected}><Trash2 />{t.remove}</button></div>
        </div> : <div className="empty-inspector"><Move3D /><p>{t.empty}</p></div>}
      </aside>
    </section>

    <footer className="statusbar">
      <Meter label={t.oxygen} value={78} color="#65ffd1" /><Meter label={t.power} value={92} color="#65c7ff" /><Meter label={t.humidity} value={64} color="#c27bff" />
      <div className="harmony"><i />{t.harmony}</div>
    </footer>

    {welcome && <div className="modal-backdrop"><div className="welcome-card"><div className="orb"><Sparkles /></div><small>KACHMOHOL 2099</small><h1>{t.welcome}</h1><p>{t.welcomeText}</p><button onClick={closeWelcome}>{t.start}<ChevronRight /></button><span>{t.tip}</span></div></div>}
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice}</button>}
  </main>
}

function PanelTitle({ icon, text }: { icon: React.ReactNode; text: string }) { return <h2 className="panel-title">{icon}<span>{text}</span></h2> }
function Meter({ label, value, color }: { label: string; value: number; color: string }) { return <div className="meter"><div><span>{label}</span><b>{value}%</b></div><div className="track"><i style={{ width: `${value}%`, background: color, boxShadow: `0 0 12px ${color}` }} /></div></div> }
export default App
