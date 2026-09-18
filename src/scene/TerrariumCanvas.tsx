import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, MeshTransmissionMaterial, OrbitControls, Sparkles, Stars, TransformControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useKachmoholStore, type Entity } from '../store/useKachmoholStore'

function Mushroom({ color }: { color: string }) {
  return <group>
    <mesh position={[0, .28, 0]} castShadow><cylinderGeometry args={[.095, .17, .62, 24]} /><meshStandardMaterial color="#d8fff1" roughness={.42} emissive="#3d8a76" emissiveIntensity={.18} /></mesh>
    <mesh position={[0, .69, 0]} scale={[1, .46, 1]} castShadow><sphereGeometry args={[.46, 48, 24, 0, Math.PI * 2, 0, Math.PI / 1.78]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={.26} clearcoat={1} clearcoatRoughness={.12} /></mesh>
    <pointLight position={[0, .74, 0]} color={color} intensity={2.8} distance={2.2} />
    {[-.22, -.07, .11, .25].map((x, i) => <mesh key={i} position={[x, .84 - Math.abs(x) * .3, .15]}><sphereGeometry args={[.022 + i % 2 * .008, 12, 12]} /><meshBasicMaterial color="#f4ffff" toneMapped={false} /></mesh>)}
    <mesh position={[0, .02, 0]}><cylinderGeometry args={[.42, .52, .08, 40]} /><meshStandardMaterial color="#153d37" roughness={.7} metalness={.15} /></mesh>
  </group>
}

function Crystal({ color }: { color: string }) {
  return <group>
    <mesh position={[0, .46, 0]} rotation={[0, .15, -.05]} castShadow><coneGeometry args={[.3, 1.05, 7]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.9} roughness={.08} metalness={.18} transmission={.18} thickness={.5} clearcoat={1} /></mesh>
    <mesh position={[.3, .27, .06]} scale={[.68, .72, .68]} rotation={[0, .32, .22]} castShadow><coneGeometry args={[.28, .88, 7]} /><meshPhysicalMaterial color="#d374ff" emissive="#a23aff" emissiveIntensity={1.45} roughness={.1} clearcoat={1} /></mesh>
    <mesh position={[-.24, .21, .04]} scale={[.48, .58, .48]} rotation={[0, -.2, -.18]}><coneGeometry args={[.26, .78, 7]} /><meshPhysicalMaterial color="#77ffd8" emissive="#38d6b3" emissiveIntensity={1.3} /></mesh>
    <mesh position={[0, -.02, 0]}><cylinderGeometry args={[.52, .6, .09, 40]} /><meshStandardMaterial color="#122d38" metalness={.75} roughness={.22} /></mesh>
    <pointLight position={[0, .45, .15]} color={color} intensity={3.5} distance={2.4} />
  </group>
}

function Core({ color }: { color: string }) {
  const ring = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (ring.current) { ring.current.rotation.y += dt * .55; ring.current.rotation.z += dt * .12 } })
  return <group ref={ring}>
    <mesh castShadow><icosahedronGeometry args={[.25, 3]} /><meshPhysicalMaterial color="#eaffff" emissive={color} emissiveIntensity={3.5} roughness={.08} clearcoat={1} toneMapped={false} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.68, .027, 16, 96]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} metalness={.85} roughness={.12} toneMapped={false} /></mesh>
    <mesh rotation={[.72, .18, 0]}><torusGeometry args={[.5, .02, 16, 96]} /><meshStandardMaterial color="#ff65d2" emissive="#ff42c2" emissiveIntensity={2.8} toneMapped={false} /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.094) * .68, 0, Math.sin(i * 2.094) * .68]}><sphereGeometry args={[.055, 16, 16]} /><meshBasicMaterial color="#dfffff" toneMapped={false} /></mesh>)}
    <pointLight color={color} intensity={5} distance={3} />
  </group>
}

function Artifact({ entity }: { entity: Entity }) {
  const ref = useRef<THREE.Group>(null)
  const selectedId = useKachmoholStore(s => s.selectedId)
  const mode = useKachmoholStore(s => s.transformMode)
  const select = useKachmoholStore(s => s.select)
  const update = useKachmoholStore(s => s.updateEntity)
  if (entity.hidden) return null
  const visual = entity.type === 'mushroom' ? <Mushroom color={entity.color} /> : entity.type === 'crystal' ? <Crystal color={entity.color} /> : <Core color={entity.color} />
  const group = <group ref={ref} position={entity.position} rotation={entity.rotation} scale={entity.scale} onClick={e => { e.stopPropagation(); select(entity.id) }}>
    {visual}
    {selectedId === entity.id && <mesh position={[0,.35,0]}><sphereGeometry args={[.82, 32, 20]} /><meshBasicMaterial color="#9bf8ff" wireframe transparent opacity={.08} depthWrite={false} /></mesh>}
  </group>
  if (selectedId !== entity.id || entity.locked) return group
  return <TransformControls mode={mode} size={.65} onMouseUp={() => {
    const o = ref.current; if (!o) return
    update(entity.id, { position: o.position.toArray() as [number, number, number], rotation: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray() as [number, number, number] })
  }}>{group}</TransformControls>
}

function Habitat({ isDay, aura }: { isDay: boolean; aura: string }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.z += dt * .025 })
  const leafPositions = useMemo(() => Array.from({length: 28}, (_,i) => {
    const a = (i / 28) * Math.PI * 2; const r = 1.55 + Math.sin(i * 4.3) * .28
    return [Math.cos(a)*r, -1.57 + Math.sin(i*2.1)*.06, Math.sin(a)*r] as [number,number,number]
  }), [])
  return <>
    <mesh position={[0,-1.89,0]} receiveShadow><cylinderGeometry args={[2.52,2.72,.34,96]} /><meshPhysicalMaterial color={isDay?'#365c47':'#092c31'} roughness={.58} metalness={.12} clearcoat={.25} /></mesh>
    <mesh position={[0,-1.69,0]} receiveShadow><cylinderGeometry args={[2.28,2.48,.14,96]} /><meshStandardMaterial color={isDay?'#527963':'#10484a'} roughness={.82} /></mesh>
    <mesh ref={ring} position={[0,-1.96,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.67,.026,12,128]} /><meshBasicMaterial color={aura} toneMapped={false} /></mesh>
    {leafPositions.map((p,i)=><mesh key={i} position={p} rotation={[0,i*.73,(i%3-1)*.32]} scale={[.7+ i%4*.08,.25,1]}><sphereGeometry args={[.12,16,10]} /><meshStandardMaterial color={i%3===0?'#7ee6a3':'#2d8067'} emissive={isDay?'#173e2a':'#0a4b3d'} emissiveIntensity={.5} roughness={.66} /></mesh>)}
    <ContactShadows position={[0,-1.66,0]} opacity={isDay?.55:.8} scale={5.2} blur={2.6} far={3.5} color={isDay?'#1b3026':'#00181c'} />
  </>
}

function World() {
  const entities = useKachmoholStore(s => s.entities)
  const env = useKachmoholStore(s => s.environment)
  const select = useKachmoholStore(s => s.select)
  const isDay = env.mode === 'day'
  return <>
    <color attach="background" args={[isDay ? '#6f98a1' : '#01040b']} />
    <fog attach="fog" args={[isDay ? '#84a9a5' : '#030713', 9, 24]} />
    <ambientLight intensity={isDay ? 1.4 : .32} />
    <hemisphereLight intensity={isDay ? 2.1 : .55} color={isDay?'#fff4d5':'#7ccfff'} groundColor={isDay?'#325843':'#061323'} />
    <directionalLight castShadow position={[4, 7, 5]} intensity={isDay ? 3.8 : .5} color={isDay ? '#fff0c2' : '#8cc8ff'} shadow-mapSize={[1024,1024]} />
    <pointLight position={[-3, 1, 2]} intensity={isDay?4:18} color={isDay?'#ffd59c':'#24dfff'} distance={9} />
    <pointLight position={[3, -1, -2]} intensity={isDay?2:14} color="#d43cff" distance={8} />
    {!isDay && <Stars radius={50} depth={24} count={2200} factor={2.2} fade speed={.18} />}
    <Sparkles count={isDay?45:95} scale={[6,5,5]} size={isDay?1.6:2.5} speed={.18} opacity={isDay?.3:.65} color={isDay?'#f7e8b2':env.auraColor} />
    <group onPointerMissed={() => select(null)}>
      <mesh><sphereGeometry args={[3.55, 96, 64]} /><MeshTransmissionMaterial backside color={isDay?'#d9fff0':env.auraColor} transmission={.96} thickness={.18} roughness={.08} chromaticAberration={.025} anisotropy={.1} distortion={.04} distortionScale={.16} temporalDistortion={.02} transparent opacity={.25} /></mesh>
      <mesh rotation={[0,0,.02]}><torusGeometry args={[3.52,.018,12,160]} /><meshBasicMaterial color={env.auraColor} transparent opacity={.72} toneMapped={false} /></mesh>
      <Habitat isDay={isDay} aura={env.auraColor} />
      {entities.map(entity => env.float && entity.type === 'core' ? <Float key={entity.id} speed={1.05} rotationIntensity={.05} floatIntensity={.18}><Artifact entity={entity} /></Float> : <Artifact key={entity.id} entity={entity} />)}
    </group>
    <OrbitControls makeDefault enableDamping dampingFactor={.055} minDistance={5.6} maxDistance={10} maxPolarAngle={Math.PI*.78} minPolarAngle={Math.PI*.16} />
    <EffectComposer multisampling={0}><Bloom mipmapBlur intensity={isDay?.45:1.25} luminanceThreshold={isDay?.92:.48} radius={.72} /><Vignette eskil={false} offset={.18} darkness={isDay?.35:.66} /></EffectComposer>
  </>
}

export function TerrariumCanvas() {
  return <Canvas id="terrarium-canvas" shadows gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }} camera={{ position: [0, .8, 7.9], fov: 42 }} dpr={[1, 1.65]}>
    <Suspense fallback={null}><World /></Suspense>
  </Canvas>
}
