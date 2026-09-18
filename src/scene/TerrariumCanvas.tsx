import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars, TransformControls } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useKachmoholStore, type Entity } from '../store/useKachmoholStore'

function Mushroom({ color }: { color: string }) {
  return <group>
    <mesh position={[0, .3, 0]}><cylinderGeometry args={[.13, .2, .65, 12]} /><meshStandardMaterial color="#bcf8ed" roughness={.5} /></mesh>
    <mesh position={[0, .72, 0]} scale={[1, .55, 1]}><sphereGeometry args={[.43, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.85]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} /></mesh>
    {[-.2, 0, .22].map((x, i) => <mesh key={i} position={[x, .85, .1]}><sphereGeometry args={[.035, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>)}
  </group>
}

function Crystal({ color }: { color: string }) {
  return <group>
    <mesh position={[0, .45, 0]} rotation={[0, 0, -.08]}><octahedronGeometry args={[.42, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} roughness={.15} metalness={.3} /></mesh>
    <mesh position={[.3, .2, .08]} scale={[.55, .75, .55]} rotation={[0, .2, .25]}><octahedronGeometry args={[.36, 0]} /><meshStandardMaterial color="#ba73ff" emissive="#8c40ff" emissiveIntensity={2} /></mesh>
  </group>
}

function Core({ color }: { color: string }) {
  const ring = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (ring.current) { ring.current.rotation.y += dt * .65; ring.current.rotation.z += dt * .16 } })
  return <group ref={ring}>
    <mesh><sphereGeometry args={[.25, 24, 24]} /><meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={4} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.62, .035, 10, 64]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} metalness={.8} /></mesh>
    <mesh rotation={[.6, .25, 0]}><torusGeometry args={[.47, .025, 10, 64]} /><meshStandardMaterial color="#ff58cd" emissive="#ff58cd" emissiveIntensity={3} /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.094) * .62, 0, Math.sin(i * 2.094) * .62]}><sphereGeometry args={[.07, 12, 12]} /><meshBasicMaterial color="#fff" /></mesh>)}
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
    {selectedId === entity.id && <mesh><sphereGeometry args={[.78, 16, 12]} /><meshBasicMaterial color="#9bf8ff" wireframe transparent opacity={.16} depthWrite={false} /></mesh>}
  </group>
  if (selectedId !== entity.id || entity.locked) return group
  return <TransformControls mode={mode} size={.72} onMouseUp={() => {
    const o = ref.current; if (!o) return
    update(entity.id, { position: o.position.toArray() as [number, number, number], rotation: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray() as [number, number, number] })
  }}>{group}</TransformControls>
}

function World() {
  const entities = useKachmoholStore(s => s.entities)
  const env = useKachmoholStore(s => s.environment)
  const select = useKachmoholStore(s => s.select)
  const isDay = env.mode === 'day'
  return <>
    <color attach="background" args={[isDay ? '#27364c' : '#03050d']} />
    <fog attach="fog" args={[isDay ? '#334966' : '#050714', 9, 22]} />
    <ambientLight intensity={isDay ? 1.8 : .45} />
    <directionalLight position={[5, 7, 5]} intensity={isDay ? 3 : .45} color={isDay ? '#fff4d8' : '#78caff'} />
    <pointLight position={[0, 1, 2]} intensity={35} color={env.auraColor} distance={7} />
    <Stars radius={45} depth={20} count={isDay ? 450 : 1800} factor={2} fade speed={.25} />
    <group onPointerMissed={() => select(null)}>
      <mesh><sphereGeometry args={[3.45, 64, 32]} /><meshPhysicalMaterial color={env.auraColor} transparent opacity={.065} transmission={.88} roughness={.04} metalness={.08} side={THREE.BackSide} /></mesh>
      <mesh><torusGeometry args={[3.42, .025, 8, 128]} /><meshBasicMaterial color={env.auraColor} transparent opacity={.75} /></mesh>
      <mesh position={[0, -2.05, 0]} scale={[1, .18, 1]}><sphereGeometry args={[2.5, 48, 24]} /><meshStandardMaterial color={isDay ? '#415448' : '#10292b'} roughness={.86} emissive={isDay ? '#17251b' : '#06242a'} emissiveIntensity={.8} /></mesh>
      {entities.map(entity => env.float && entity.type === 'core' ? <Float key={entity.id} speed={1.2} rotationIntensity={.08} floatIntensity={.24}><Artifact entity={entity} /></Float> : <Artifact key={entity.id} entity={entity} />)}
    </group>
    <OrbitControls makeDefault enableDamping minDistance={5} maxDistance={11} maxPolarAngle={Math.PI * .85} />
  </>
}

export function TerrariumCanvas() {
  return <Canvas id="terrarium-canvas" gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ position: [0, 1.2, 7.4], fov: 46 }} dpr={[1, 1.7]}>
    <Suspense fallback={null}><World /></Suspense>
  </Canvas>
}
