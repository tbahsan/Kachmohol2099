import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Float, MeshTransmissionMaterial, OrbitControls, Sparkles, Stars, TransformControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useKachmoholStore, type Entity, type EntityType, type Vec3 } from '../store/useKachmoholStore'

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

function Bonsai({ color }: { color: string }) {
  return <group><mesh position={[0,.35,0]} rotation={[0,0,-.12]} castShadow><cylinderGeometry args={[.09,.16,.72,18]} /><meshStandardMaterial color="#704837" roughness={.78} /></mesh>{[[-.35,.62,0],[.1,.82,0],[.38,.58,.04],[-.08,.52,.15]].map((p,i)=><mesh key={i} position={p as [number,number,number]} scale={[1.25,.72,1]} castShadow><sphereGeometry args={[.3,24,16]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={.42} roughness={.52} clearcoat={.3} /></mesh>)}<mesh position={[0,.02,0]}><cylinderGeometry args={[.46,.38,.16,32]} /><meshStandardMaterial color="#1d3040" metalness={.7} roughness={.25} /></mesh></group>
}
function Coral({ color }: { color: string }) {
  return <group>{[[-.25,.35,.1,-.25],[0,.48,0,.06],[.28,.32,-.05,.28],[-.05,.26,.2,-.5]].map((v,i)=><group key={i} position={[v[0],.05,v[2]]} rotation={[0,0,v[3]]}><mesh position={[0,v[1]/2,0]}><cylinderGeometry args={[.055,.1,v[1],14]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} roughness={.48} /></mesh><mesh position={[0,v[1],0]}><sphereGeometry args={[.11,16,12]} /><meshBasicMaterial color="#ffc4db" /></mesh></group>)}<mesh><cylinderGeometry args={[.5,.58,.1,32]} /><meshStandardMaterial color="#17313c" /></mesh></group>
}
function WaterOrb({ color }: { color: string }) {
  const orb=useRef<THREE.Group>(null);useFrame((_,d)=>{if(orb.current)orb.current.rotation.y+=d*.18})
  return <group ref={orb}><mesh><sphereGeometry args={[.48,48,32]} /><MeshTransmissionMaterial color={color} transmission={.94} thickness={.8} roughness={.05} chromaticAberration={.05} distortion={.18} distortionScale={.35} /></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.62,.018,12,80]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh><Sparkles count={18} scale={.7} size={2} speed={.5} color="#e8ffff" /></group>
}
function SolarFlower({ color }: { color: string }) {
  const petals=useRef<THREE.Group>(null);useFrame((_,d)=>{if(petals.current)petals.current.rotation.y+=d*.12})
  return <group><mesh position={[0,.3,0]}><cylinderGeometry args={[.045,.075,.65,16]} /><meshStandardMaterial color="#6cb18a" /></mesh><group ref={petals} position={[0,.68,0]}>{Array.from({length:6},(_,i)=><mesh key={i} rotation={[.25,i*Math.PI/3,0]} position={[Math.cos(i*Math.PI/3)*.3,0,Math.sin(i*Math.PI/3)*.3]}><sphereGeometry args={[.24,20,12]} /><meshPhysicalMaterial color={color} emissive="#ffb52f" emissiveIntensity={.5} metalness={.35} roughness={.25} /></mesh>)}<mesh><sphereGeometry args={[.16,24,16]} /><meshBasicMaterial color="#fff4a3" toneMapped={false} /></mesh></group></group>
}
function Beacon({ color }: { color: string }) {
  const rings=useRef<THREE.Group>(null);useFrame((_,d)=>{if(rings.current){rings.current.rotation.y+=d*.5;rings.current.position.y=.6+Math.sin(performance.now()*.002)*.08}})
  return <group><mesh position={[0,.25,0]}><cylinderGeometry args={[.12,.3,.55,24]} /><meshStandardMaterial color="#21364c" metalness={.8} roughness={.2} /></mesh><group ref={rings} position={[0,.6,0]}>{[.24,.38,.52].map((r,i)=><mesh key={i} rotation={[Math.PI/2+i*.3,0,0]}><torusGeometry args={[r,.015,10,64]} /><meshBasicMaterial color={i===1?'#ff63d4':color} toneMapped={false} /></mesh>)}</group></group>
}
function Jellyfish({ color }: { color: string }) {
  const body=useRef<THREE.Group>(null);useFrame((state)=>{if(body.current){body.current.position.y=Math.sin(state.clock.elapsedTime*1.2)*.1;body.current.rotation.y+=.004}})
  return <group ref={body}><mesh scale={[1,.58,1]}><sphereGeometry args={[.42,32,20,0,Math.PI*2,0,Math.PI/1.8]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={.72} roughness={.15} transmission={.25} /></mesh>{[-.22,-.07,.08,.23].map((x,i)=><mesh key={i} position={[x,-.36,0]} rotation={[0,0,Math.sin(i)*.12]}><capsuleGeometry args={[.018,.48,6,10]} /><meshBasicMaterial color={i%2?'#7ff8ff':color} transparent opacity={.72} /></mesh>)}</group>
}
function DroneBee({ color }: { color: string }) {
  const drone=useRef<THREE.Group>(null);useFrame((state)=>{if(drone.current){drone.current.rotation.y=state.clock.elapsedTime*.8;drone.current.position.y=Math.sin(state.clock.elapsedTime*2)*.06}})
  return <group ref={drone}><mesh scale={[1.3,.65,.65]}><sphereGeometry args={[.24,24,16]} /><meshStandardMaterial color={color} emissive="#9b7100" emissiveIntensity={.45} metalness={.65} roughness={.28} /></mesh>{[-.12,.12].map((x,i)=><mesh key={i} position={[x,.2,0]} rotation={[0,0,i?.6:-.6]} scale={[1.6,.18,.8]}><sphereGeometry args={[.22,20,12]} /><meshPhysicalMaterial color="#bdfaff" transparent opacity={.5} transmission={.45} /></mesh>)}<pointLight color={color} intensity={2} distance={1.6} /></group>
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

function Artifact({ entity, advanced }: { entity: Entity; advanced: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const dragging = useRef(false)
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -entity.position[1]), [entity.position[1]])
  const dragPoint = useMemo(() => new THREE.Vector3(), [])
  const reactionGroup = useRef<THREE.Group>(null)
  const reaction = useRef(0)
  useEffect(() => { if ((entity.interactionCount ?? 0) > 0) reaction.current = 1 }, [entity.interactionCount])
  useFrame((_,delta) => { if (!reactionGroup.current || reaction.current <= 0) return; reaction.current=Math.max(0,reaction.current-delta*.72); const pulse=1+Math.sin((1-reaction.current)*Math.PI*7)*reaction.current*.16; reactionGroup.current.scale.setScalar(pulse) })
  const selectedId = useKachmoholStore(state => state.selectedId)
  const selectedIds = useKachmoholStore(state => state.selectedIds)
  const mode = useKachmoholStore(state => state.transformMode)
  const select = useKachmoholStore(state => state.select)
  const update = useKachmoholStore(state => state.updateEntity)
  if (entity.hidden) return null
  const visual = entity.type === 'mushroom' ? <Mushroom color={entity.color} /> : entity.type === 'bonsai' ? <Bonsai color={entity.color} /> : entity.type === 'coral' ? <Coral color={entity.color} /> : entity.type === 'waterOrb' ? <WaterOrb color={entity.color} /> : entity.type === 'crystal' ? <Crystal color={entity.color} /> : entity.type === 'solarFlower' ? <SolarFlower color={entity.color} /> : entity.type === 'beacon' ? <Beacon color={entity.color} /> : entity.type === 'jellyfish' ? <Jellyfish color={entity.color} /> : entity.type === 'droneBee' ? <DroneBee color={entity.color} /> : <Core color={entity.color} />
  const finishDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !ref.current) return
    dragging.current = false
    ;(event.target as Element).releasePointerCapture?.(event.pointerId)
    const object = ref.current
    update(entity.id, { position: object.position.toArray() as [number, number, number] })
  }
  const group = <group ref={ref} position={entity.position} rotation={entity.rotation} scale={entity.scale}
    onClick={event => { event.stopPropagation(); select(entity.id,event.shiftKey) }}
    onPointerDown={event => {
      if (advanced || entity.locked) return
      event.stopPropagation(); if(event.shiftKey){select(entity.id,true);return} select(entity.id); dragging.current = true
      ;(event.target as Element).setPointerCapture?.(event.pointerId)
      document.body.classList.add('dragging-artifact')
    }}
    onPointerMove={event => {
      if (!dragging.current || !ref.current || advanced) return
      event.stopPropagation()
      if (event.ray.intersectPlane(dragPlane, dragPoint)) {
        const length = Math.hypot(dragPoint.x, dragPoint.z); const limit = 2.05; const factor = length > limit ? limit / length : 1
        ref.current.position.set(dragPoint.x * factor, entity.position[1], dragPoint.z * factor)
      }
    }}
    onPointerUp={event => { document.body.classList.remove('dragging-artifact'); finishDrag(event) }}>
    <group ref={reactionGroup}>{visual}</group>
    {selectedIds.includes(entity.id) && <mesh position={[0,.35,0]}><sphereGeometry args={[.82, 32, 20]} /><meshBasicMaterial color="#9bf8ff" transparent opacity={.035} depthWrite={false} /></mesh>}
  </group>
  if (!advanced || selectedId !== entity.id || entity.locked) return group
  return <TransformControls mode={mode} size={.65} onMouseUp={() => {
    const object = ref.current; if (!object) return
    update(entity.id, { position: object.position.toArray() as [number, number, number], rotation: [object.rotation.x, object.rotation.y, object.rotation.z], scale: object.scale.toArray() as [number, number, number] })
  }}>{group}</TransformControls>
}
function DaySky() {
  const clouds = useRef<THREE.Group>(null)
  const sun = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (clouds.current) clouds.current.rotation.y += delta*.018; if(sun.current) sun.current.rotation.y-=delta*.01 })
  const cloudLocations=useMemo(()=>Array.from({length:12},(_,i)=>{const angle=i/12*Math.PI*2;const radius=13+(i%3);return [Math.cos(angle)*radius,1.5+(i%4)*1.15,Math.sin(angle)*radius] as [number,number,number]}),[])
  return <>
    <mesh scale={38}><sphereGeometry args={[1,48,24]} /><shaderMaterial side={THREE.BackSide} depthWrite={false} vertexShader={`varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={`varying vec3 vPos; void main(){float h=normalize(vPos).y*.5+.5;vec3 low=vec3(.68,.88,.91);vec3 mid=vec3(.28,.66,.79);vec3 high=vec3(.08,.30,.56);vec3 c=mix(low,mid,smoothstep(.12,.62,h));c=mix(c,high,smoothstep(.62,1.0,h));gl_FragColor=vec4(c,1.0);}`} /></mesh>
    <group ref={sun}><group position={[-12,8,-16]}><mesh><sphereGeometry args={[.85,32,32]} /><meshBasicMaterial color="#fff1a3" toneMapped={false} /></mesh><pointLight color="#ffd98c" intensity={30} distance={38} /></group></group>
    <group ref={clouds}>{cloudLocations.map((location,index)=><group key={index} position={location} scale={.72+(index%3)*.26}>
      {[[-.8,0,0],[-.25,.22,0],[.35,.12,0],[.8,-.05,0]].map((position,i)=><mesh key={i} position={position as [number,number,number]}><sphereGeometry args={[.62+i%2*.18,24,16]} /><meshStandardMaterial color="#f7ffff" transparent opacity={.72} roughness={1} depthWrite={false} /></mesh>)}
    </group>)}</group>
  </>
}
function NightSky() {
  const galaxy = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count=2600; const data=new Float32Array(count*3)
    for(let i=0;i<count;i++){const longitude=Math.random()*Math.PI*2;const latitude=Math.sin(longitude*2.0)*.11+(Math.random()-.5)*.28;const radius=22+Math.random()*5;data[i*3]=Math.cos(latitude)*Math.cos(longitude)*radius;data[i*3+1]=Math.sin(latitude)*radius;data[i*3+2]=Math.cos(latitude)*Math.sin(longitude)*radius}
    return data
  },[])
  useFrame((state,delta)=>{if(galaxy.current){galaxy.current.rotation.y+=delta*.008;const material=galaxy.current.material as THREE.PointsMaterial;material.opacity=.62+Math.sin(state.clock.elapsedTime*.7)*.08}})
  return <>
    <mesh scale={38}><sphereGeometry args={[1,48,24]} /><meshBasicMaterial side={THREE.BackSide} color="#01040d" /></mesh>
    <points ref={galaxy} rotation={[.25,0,.35]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} /></bufferGeometry><pointsMaterial color="#a8c9ff" size={.075} transparent opacity={.68} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <mesh position={[-16,7,-12]} scale={[8,5,4]}><sphereGeometry args={[1,32,16]} /><meshBasicMaterial color="#521178" transparent opacity={.09} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh><mesh position={[15,-3,10]} scale={[7,4,5]}><sphereGeometry args={[1,32,16]} /><meshBasicMaterial color="#064f70" transparent opacity={.08} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <Stars radius={32} depth={28} count={3000} factor={2.4} fade speed={.38} />
  </>
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
    <mesh position={[0,-2.2,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[1.65,.58,64,1,true]} /><meshStandardMaterial color="#101b2c" metalness={.86} roughness={.2} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0,-2.47,0]}><sphereGeometry args={[.2,24,18]} /><meshBasicMaterial color={aura} toneMapped={false} /></mesh>
    {[1.05,1.65,2.2].map((radius,i)=><mesh key={radius} position={[0,-2.12-i*.08,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius,.018,10,96]} /><meshBasicMaterial color={i===1?'#b45cff':aura} transparent opacity={.75} toneMapped={false} /></mesh>)}
    {leafPositions.map((p,i)=><mesh key={i} position={p} rotation={[0,i*.73,(i%3-1)*.32]} scale={[.7+ i%4*.08,.25,1]}><sphereGeometry args={[.12,16,10]} /><meshStandardMaterial color={i%3===0?'#7ee6a3':'#2d8067'} emissive={isDay?'#173e2a':'#0a4b3d'} emissiveIntensity={.5} roughness={.66} /></mesh>)}
    <ContactShadows position={[0,-1.66,0]} opacity={isDay?.55:.8} scale={5.2} blur={2.6} far={3.5} color={isDay?'#1b3026':'#00181c'} />
  </>
}

function PlacementSurface({ type, onPlace }: { type: EntityType; onPlace: (position: Vec3) => void }) {
  const [point, setPoint] = useState<Vec3>([0, -1.58, 0])
  const y = type === 'core' ? -.65 : -1.58
  const visual = type === 'mushroom' ? <Mushroom color="#ff70d5" /> : type === 'crystal' ? <Crystal color="#58efff" /> : <Core color="#9982ff" />
  return <>
    <mesh position={[0,-1.56,0]} rotation={[-Math.PI/2,0,0]}
      onPointerMove={e => { e.stopPropagation(); const x=e.point.x,z=e.point.z; const length=Math.hypot(x,z); const limit=2.05; const k=length>limit?limit/length:1; setPoint([x*k,y,z*k]) }}
      onClick={e => { e.stopPropagation(); onPlace(point) }}>
      <circleGeometry args={[2.25,64]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <group position={point} scale={[.92,.92,.92]}><Float speed={1.5} floatIntensity={.06}>{visual}</Float><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.48,.54,48]} /><meshBasicMaterial color="#7ff7ff" transparent opacity={.8} toneMapped={false} /></mesh></group>
  </>
}

function CameraDirector({ preset }: { preset: string }) {
  const { camera } = useThree()
  useEffect(() => { const name=preset.split(':')[0];const positions:Record<string,[number,number,number]>={front:[0,.8,7.9],top:[0,8,.01],isometric:[5,4.2,5],interior:[0,.1,4.4],underside:[0,-6.5,3.2]};const position=positions[name];if(position){camera.position.set(...position);camera.lookAt(0,-.35,0);camera.updateProjectionMatrix()} },[preset,camera])
  return null
}

function World({ pendingType, onPlace, advanced, relax, stability, cameraPreset }: { pendingType: EntityType | null; onPlace: (position: Vec3) => void; advanced: boolean; relax: boolean; stability: number; cameraPreset: string }) {
  const entities = useKachmoholStore(s => s.entities)
  const env = useKachmoholStore(s => s.environment)
  const select = useKachmoholStore(s => s.select)
  const isDay = env.mode === 'day'
  return <>
    <CameraDirector preset={cameraPreset} />
    <color attach="background" args={[isDay ? '#6f98a1' : '#01040b']} />
    <fog attach="fog" args={[isDay ? '#5d9bb2' : '#030713', isDay ? 28 : 14, isDay ? 70 : 44]} />
    <ambientLight intensity={(isDay ? 1.4 : .32) * (.72 + stability/360)} />
    <hemisphereLight intensity={isDay ? 2.1 : .55} color={isDay?'#fff4d5':'#7ccfff'} groundColor={isDay?'#325843':'#061323'} />
    <directionalLight castShadow position={[4, 7, 5]} intensity={isDay ? 3.8 : .5} color={isDay ? '#fff0c2' : '#8cc8ff'} shadow-mapSize={[1024,1024]} />
    <pointLight position={[-3, 1, 2]} intensity={isDay?4:18} color={isDay?'#ffd59c':'#24dfff'} distance={9} />
    <pointLight position={[3, -1, -2]} intensity={isDay?2:14} color="#d43cff" distance={8} />
    {isDay ? <DaySky /> : <NightSky />}
    <Sparkles count={(isDay?35:70)+Math.round(stability*.45)} scale={[6,5,5]} size={isDay?1.6:2.5} speed={.18} opacity={isDay?.3:.65} color={isDay?'#f7e8b2':env.auraColor} />
    <group onPointerMissed={() => select(null)}>
      <mesh><sphereGeometry args={[3.55, 96, 64]} /><MeshTransmissionMaterial backside color={isDay?'#d9fff0':env.auraColor} transmission={.96} thickness={.18} roughness={.08} chromaticAberration={.025} anisotropy={.1} distortion={.04} distortionScale={.16} temporalDistortion={.02} transparent opacity={.25} /></mesh>
      <mesh rotation={[0,0,.02]}><torusGeometry args={[3.52,.018,12,160]} /><meshBasicMaterial color={env.auraColor} transparent opacity={.72} toneMapped={false} /></mesh>
      <Habitat isDay={isDay} aura={env.auraColor} />
      {pendingType && <PlacementSurface type={pendingType} onPlace={onPlace} />}
      {entities.map(entity => env.float && ['core','waterOrb','jellyfish','droneBee'].includes(entity.type) ? <Float key={entity.id} speed={1.05} rotationIntensity={.05} floatIntensity={.18}><Artifact entity={entity} advanced={advanced} /></Float> : <Artifact key={entity.id} entity={entity} advanced={advanced} />)}
    </group>
    <OrbitControls makeDefault enableDamping dampingFactor={.055} minDistance={5.8} maxDistance={9.2} maxPolarAngle={Math.PI-.06} minPolarAngle={.06} autoRotate={relax} autoRotateSpeed={.38} enablePan={false} />
    <EffectComposer multisampling={0}><Bloom mipmapBlur intensity={isDay?.45:1.25} luminanceThreshold={isDay?.92:.48} radius={.72} /><Vignette eskil={false} offset={.18} darkness={isDay?.35:.66} /></EffectComposer>
  </>
}

export function TerrariumCanvas({ pendingType, onPlace, advanced, relax, stability, cameraPreset }: { pendingType: EntityType | null; onPlace: (position: Vec3) => void; advanced: boolean; relax: boolean; stability: number; cameraPreset: string }) {
  return <Canvas id="terrarium-canvas" shadows gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }} camera={{ position: [0, .8, 7.9], fov: 42 }} dpr={[1, 1.65]}>
    <Suspense fallback={null}><World pendingType={pendingType} onPlace={onPlace} advanced={advanced} relax={relax} stability={stability} cameraPreset={cameraPreset} /></Suspense>
  </Canvas>
}
