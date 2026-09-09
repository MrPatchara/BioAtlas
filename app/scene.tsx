import {useEffect,useRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createExplosionLayout} from './explosion-layout';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,type Atlas,type SceneState} from './anatomy';
import type {SeniamAnchor} from '@/lib/seniam';
import type {MarkerAnchor} from '@/lib/markers';
import type {Lang} from '@/lib/i18n';
interface Props {atlas:Atlas;state:SceneState;emgAnchors:SeniamAnchor[];emgVisible:boolean;mocapAnchors:MarkerAnchor[];mocapVisible:boolean;lang:Lang;onSelect:(id:string)=>void;onMocapSelect:(key:string)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void}
export default function AnatomyScene({atlas,state,emgAnchors,emgVisible,mocapAnchors,mocapVisible,lang,onSelect,onMocapSelect,onProgress,onError}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect),mocapSelect=useRef(onMocapSelect);
 const emgRef=useRef<SeniamAnchor[]>(emgAnchors),visibleRef=useRef(emgVisible);
 const mocapRef=useRef<MarkerAnchor[]>(mocapAnchors),mocapVisibleRef=useRef(mocapVisible);
 latest.current=state;select.current=onSelect;mocapSelect.current=onMocapSelect;emgRef.current=emgAnchors;visibleRef.current=emgVisible;mocapRef.current=mocapAnchors;mocapVisibleRef.current=mocapVisible;
 useEffect(()=>{
  const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',layoutKey='',amount=0;
  let lastState:SceneState|null=null;
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#f2f3f3');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label',lang==='th'?'โมเดลกายวิภาค 3 มิติ ลากเพื่อหมุน บีบหรือเลื่อนเพื่อซูม และแตะโครงสร้างเพื่อดูรายละเอียด':'Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100),controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);controls.target.set(0,.85,0);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=.07;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.96;controls.addEventListener('change',()=>{dirty=true;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0xa7acb2,1.05));
  const key=new T.DirectionalLight(0xfffaf4,2.3);key.position.set(-2,4,3);scene.add(key);
  const rim=new T.DirectionalLight(0xe9f0ff,1.8);rim.position.set(2,2,-3);scene.add(rim);
  const ground=new T.Mesh(new T.CircleGeometry(30,96),new T.MeshStandardMaterial({color:0xd5d9dc,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.019;scene.add(ground);
  const platform=new T.Mesh(new T.CylinderGeometry(.68,.7,.028,100),new T.MeshStandardMaterial({color:0xeeeeec,metalness:.12,roughness:.67}));platform.position.y=-.016;scene.add(platform);
  const ring=new T.Mesh(new T.RingGeometry(.63,.632,128),new T.MeshBasicMaterial({color:0x8c969f,transparent:true,opacity:.4,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
  const innerRing=new T.Mesh(new T.RingGeometry(.55,.551,128),new T.MeshBasicMaterial({color:0xa4aeb8,transparent:true,opacity:.16,side:T.DoubleSide}));innerRing.rotation.x=-Math.PI/2;innerRing.position.y=.001;scene.add(innerRing);
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType);partTexture.needsUpdate=true;
  const selectedData=new Uint8Array(width*4),selectionTexture=new T.DataTexture(selectedData,width,1);selectionTexture.needsUpdate=true;
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const offsets:T.Vector3[]=[],bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  let packingWidth=1,packingHeight=1;
  const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
  const markerMaterial=new T.PointsMaterial({color:0x64748b,size:5,sizeAttenuation:false,transparent:true,opacity:.72,depthTest:false});
  markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.renderOrder=10;markers.visible=false;scene.add(markers);
  const EMG_MAX=64,emgPositions=new Float32Array(EMG_MAX*3),emgGeometry=new T.BufferGeometry();emgGeometry.setAttribute('position',new T.BufferAttribute(emgPositions,3));
  const emgHaloPositions=new Float32Array(EMG_MAX*3),emgHaloGeometry=new T.BufferGeometry();emgHaloGeometry.setAttribute('position',new T.BufferAttribute(emgHaloPositions,3));
  const emgHaloMaterial=new T.PointsMaterial({color:0xffffff,size:9,sizeAttenuation:false,transparent:true,opacity:.8,depthTest:true,depthWrite:false});
  emgHaloMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const emgHalo=new T.Points(emgHaloGeometry,emgHaloMaterial);emgHalo.frustumCulled=false;emgHalo.renderOrder=10;emgHalo.visible=false;scene.add(emgHalo);
  const emgMaterial=new T.PointsMaterial({color:0x0d9488,size:6,sizeAttenuation:false,transparent:true,opacity:.95,depthTest:true,depthWrite:false});
  emgMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const emgPoints=new T.Points(emgGeometry,emgMaterial);emgPoints.frustumCulled=false;emgPoints.renderOrder=11;emgPoints.visible=false;scene.add(emgPoints);
  const MOCAP_MAX=48,mocapPositions=new Float32Array(MOCAP_MAX*3),mocapGeometry=new T.BufferGeometry();mocapGeometry.setAttribute('position',new T.BufferAttribute(mocapPositions,3));
  const mocapHaloPositions=new Float32Array(MOCAP_MAX*3),mocapHaloGeometry=new T.BufferGeometry();mocapHaloGeometry.setAttribute('position',new T.BufferAttribute(mocapHaloPositions,3));
  const mocapHaloMaterial=new T.PointsMaterial({color:0x1f2937,size:10,sizeAttenuation:false,transparent:true,opacity:.55,depthTest:true,depthWrite:false});
  mocapHaloMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const mocapHalo=new T.Points(mocapHaloGeometry,mocapHaloMaterial);mocapHalo.frustumCulled=false;mocapHalo.renderOrder=12;mocapHalo.visible=false;scene.add(mocapHalo);
  const mocapMaterial=new T.PointsMaterial({color:0xf97316,size:7,sizeAttenuation:false,transparent:true,opacity:.95,depthTest:true,depthWrite:false});
  mocapMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');};
  const mocapPoints=new T.Points(mocapGeometry,mocapMaterial);mocapPoints.frustumCulled=false;mocapPoints.renderOrder=13;mocapPoints.visible=false;scene.add(mocapPoints);
  // Surface-projected anchor points (recomputed when the anchor list changes).
  // Uses closest-point-on-mesh so thin diagonal sheets (e.g. lower trapezius,
  // sartorius) always get a dot exactly on the muscle — no misses.
  const emgSurface=new Float32Array(EMG_MAX*3).fill(10000);
  let emgSurfaceKey='';
  const emgTarget=new T.Vector3(),emgA=new T.Vector3(),emgB=new T.Vector3(),emgC=new T.Vector3(),emgClosest=new T.Vector3(),emgBest=new T.Vector3(),emgN=new T.Vector3(),emgTri=new T.Triangle();
  const projectEmgToSurface=()=>{
   const list=emgRef.current,n=Math.min(list.length,EMG_MAX);
   const key=list.slice(0,n).map(a=>a.key).join('|');
   if(key===emgSurfaceKey) return;
   emgSurfaceKey=key;
   for(let k=0;k<EMG_MAX;k++){
    if(k>=n){emgSurface.set([10000,10000,10000],k*3);continue;}
    const a=list[k];
    if(!a.centroid||!a.partIds.length){emgSurface.set([10000,10000,10000],k*3);continue;}
    emgTarget.set(a.centroid[0],a.centroid[1],a.centroid[2]);
    let bestD=Infinity,found=false;
    for(const pid of a.partIds){
     const i=partIndexById.get(pid),mesh=pickers[i??-1];
     if(i===undefined||!mesh) continue;
     mesh.updateMatrixWorld(true);
     const posAttr=mesh.geometry.getAttribute('position') as T.BufferAttribute;
     const index=mesh.geometry.getIndex();
     if(!index) continue;
     const arr=index.array;
     for(let t=0;t<arr.length;t+=3){
      emgA.fromBufferAttribute(posAttr,arr[t]).applyMatrix4(mesh.matrixWorld);
      emgB.fromBufferAttribute(posAttr,arr[t+1]).applyMatrix4(mesh.matrixWorld);
      emgC.fromBufferAttribute(posAttr,arr[t+2]).applyMatrix4(mesh.matrixWorld);
      emgTri.set(emgA,emgB,emgC);
      emgTri.closestPointToPoint(emgTarget,emgClosest);
      const d=emgClosest.distanceToSquared(emgTarget);
      if(d<bestD){bestD=d;emgBest.copy(emgClosest);emgTri.getNormal(emgN);found=true;}
     }
    }
    if(found){
     emgSurface.set([emgBest.x+emgN.x*.004,emgBest.y+emgN.y*.004,emgBest.z+emgN.z*.004],k*3);
    } else {
     emgSurface.set([a.centroid[0]+a.surface[0],a.centroid[1]+a.surface[1],a.centroid[2]+a.surface[2]],k*3);
    }
   }
  };
  const partIndexById=new Map(atlas.parts.map((p,i)=>[p.id,i] as const));
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  type Target={index:number;x:number;y:number;left:number;right:number;top:number;bottom:number};let targets:Target[]=[];
  const projected=new T.Vector3();
  const findTarget=(x:number,y:number,radius:number)=>{
   let best=-1,score=Infinity;
   for(const t of targets){const dx=Math.max(t.left-x,0,x-t.right),dy=Math.max(t.top-y,0,y-t.bottom),distance=Math.hypot(dx,dy);if(distance>radius)continue;const candidate=distance+Math.hypot(t.x-x,t.y-y)*.025;if(candidate<score){score=candidate;best=t.index;}}
   return best;
  };
  const materialFor=(system:string)=>{
   const m=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:.08,roughness:.53,side:T.DoubleSide,transparent:system==='integumentary',opacity:system==='integumentary'?.1:1,depthWrite:system!=='integumentary'});
   m.onBeforeCompile=shader=>{
    shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;');
    shader.fragmentShader='varying float partVisible; varying float partSelected;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);');
   };materials.push(m);return m;
  };
  const mats=new Map(SYSTEMS.map(s=>[s.id,materialFor(s.id)]));
  let loaded=0;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    // GPU normalized signed-short normals keep the complete atlas compact in memory.
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
    g.boundingBox=bounds[i].clone();g.computeBoundingSphere();const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const list=groups.get(p.system)??[];list.push(g);groups.set(p.system,list);
   });
   groups.forEach((gs,system)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mats.get(system as never));mesh.frustumCulled=false;scene.add(mesh);});
   lastState=null;loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
  (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'Could not load the anatomy.');}})();
  const fit=(view:string,extent=0)=>{
   const aspect=camera.aspect,mobile=el.clientWidth<768,normalDistance=mobile?Math.max(4.5,1.8*el.clientHeight/Math.max(160,el.clientHeight-350)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))):4;
   const reservedHeight=mobile?350:270;const availableAspect=Math.max(.35,(el.clientWidth-(mobile?40:340))/Math.max(160,el.clientHeight-reservedHeight));const atlasDistance=Math.max(packingHeight,packingWidth/availableAspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*(el.clientHeight/Math.max(160,el.clientHeight-reservedHeight))*1.08;
   const distance=T.MathUtils.lerp(normalDistance,Math.max(.2,atlasDistance),extent);if(extent>.8)view='front';
   const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
   controls.target.set(extent>.1&&el.clientWidth>767?-packingWidth*.12:0,extent>.1||mobile?.85:.68,0);camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;
  };
  const resize=()=>{layoutKey='';lastState=null;renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);fit(latest.current.view,amount);};const observer=new ResizeObserver(resize);observer.observe(el);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  raycaster.params.Points={threshold:.04} as never;
  const emgHit=(e:PointerEvent)=>{
    if(!visibleRef.current||!ready) return -1;
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(emgPoints,false);
    if(!hits.length) return -1;
    const idx=(hits[0] as {index?:number}).index??-1;
    const anchor=emgRef.current[idx];
    if(!anchor||!anchor.partIds.length) return -1;
    const pid=anchor.partIds.find(id=>{const i=partIndexById.get(id);return i!==undefined&&data[i*4+3]>.5;})??anchor.partIds[0];
    const i=partIndexById.get(pid);
    return i??-1;
  };
  const down=(e:PointerEvent)=>{hover.hidden=true;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);};
  const mocapHit=(e:PointerEvent)=>{
    if(!mocapVisibleRef.current||!ready) return '';
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(mocapPoints,false);
    if(!hits.length) return '';
    const idx=(hits[0] as {index?:number}).index??-1;
    const anchor=mocapRef.current[idx];
    return anchor?.key??'';
  };
  const move=(e:PointerEvent)=>{tap.move(e.pointerId,e.clientX,e.clientY);if(e.buttons||e.pointerType==='touch'){hover.hidden=true;return;}const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
   if(amount<.5){const proj=new T.Vector3(),list=emgRef.current,n=Math.min(list.length,EMG_MAX);let bi=-1,bd=16;
    if(visibleRef.current&&ready){for(let k=0;k<n;k++){const a=list[k];if(!a.centroid)continue;proj.set(emgPositions[k*3],emgPositions[k*3+1],emgPositions[k*3+2]);if(proj.x>9000)continue;proj.project(camera);if(proj.z>1)continue;const sx=(proj.x+1)*el.clientWidth/2,sy=(1-proj.y)*el.clientHeight/2,d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;bi=k;}}}
    if(bi>=0){const a=list[bi];hover.hidden=false;hover.textContent=`EMG · ${a.entry.muscle}${a.entry.subdivision?` ${a.entry.subdivision}`:''}${a.side!=='midline'?` (${a.side})`:''}`;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;renderer.domElement.style.cursor='pointer';return;}
    const mlist=mocapRef.current,mn=Math.min(mlist.length,MOCAP_MAX);let mi=-1,md=16;
    if(mocapVisibleRef.current&&ready){for(let k=0;k<mn;k++){const a=mlist[k];if(!a.pos)continue;proj.set(mocapPositions[k*3],mocapPositions[k*3+1],mocapPositions[k*3+2]);if(proj.x>9000)continue;proj.project(camera);if(proj.z>1)continue;const sx=(proj.x+1)*el.clientWidth/2,sy=(1-proj.y)*el.clientHeight/2,d=Math.hypot(sx-x,sy-y);if(d<md){md=d;mi=k;}}}
    if(mi>=0){const a=mlist[mi];hover.hidden=false;hover.textContent=`${a.markerId} · ${a.label}`;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;renderer.domElement.style.cursor='pointer';return;}}
   if(amount<.5){hover.hidden=true;renderer.domElement.style.cursor='grab';return;}
   const index=findTarget(x,y,12);hover.hidden=index<0;renderer.domElement.style.cursor=index<0?'grab':'pointer';if(index>=0){hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;}};
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  const up=(e:PointerEvent)=>{
   const validTap=tap.up(e.pointerId,e.clientX,e.clientY);if(!validTap||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   const emgIndex=emgHit(e);
   if(emgIndex>=0){hover.hidden=true;select.current(atlas.parts[emgIndex].id);return;}
   const mocapKey=mocapHit(e);
   if(mocapKey){hover.hidden=true;mocapSelect.current(mocapKey);return;}
   let nearest=Infinity,found=-1;const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);
   pickers.forEach((mesh,i)=>{if(!mesh||data[i*4+3]<.5||(hasSolid&&atlas.parts[i].system==='integumentary'))return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);if(hits[0]&&hits[0].distance<nearest){nearest=hits[0].distance;found=i;}});
   if(found<0&&amount>.45)found=findTarget(e.clientX-rect.left,e.clientY-rect.top,e.pointerType==='touch'?24:16);if(found>=0){hover.hidden=true;select.current(atlas.parts[found].id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
   const clock=new T.Clock();let lastExtent=-1,lastEmgShow=false,lastMocapShow=false;
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),s=latest.current;
   const changed=lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate;
   const moving=Math.abs(amount-s.explode)>.0001;
   if(moving){amount=T.MathUtils.damp(amount,s.explode,8,dt);dirty=true;}
   if(changed||moving||lastExtent<0){
    const visible=new Set(s.visible),selection=new Set(s.selected);
    const visibleParts=atlas.parts.filter(p=>s.isolate?selection.has(p.id):visible.has(p.system)||selection.has(p.id));
    const nextLayoutKey=visibleParts.map(p=>p.id).join(',')+':'+camera.aspect.toFixed(3);
    if(nextLayoutKey!==layoutKey){const layout=createExplosionLayout(visibleParts,camera.aspect);packingWidth=layout.width;packingHeight=layout.height;atlas.parts.forEach((p,i)=>{const cell=layout.cells.get(p.id);offsets[i]=cell?new T.Vector3(cell.x,cell.y+.85,0):centers[i].clone();});layoutKey=nextLayoutKey;if(amount>.05&&!s.isolate)fit(s.view,Math.max(0,(amount-.3)/.7));}

    atlas.parts.forEach((p,i)=>{
     const c=centers[i],destination=offsets[i];let dx=0,dy=0,dz=0;
     if(amount<=.45){const t=amount/.45;const group=SYSTEMS.findIndex(sys=>sys.id===p.system);const angle=group/SYSTEMS.length*Math.PI*2;dx=Math.sin(angle)*t*.48;dy=(c.y-.85)*t*.28;dz=Math.cos(angle)*t*.48;}
     else {const t=(amount-.45)/.55,group=SYSTEMS.findIndex(sys=>sys.id===p.system),angle=group/SYSTEMS.length*Math.PI*2;dx=T.MathUtils.lerp(Math.sin(angle)*.48,destination.x-c.x,t);dy=T.MathUtils.lerp((c.y-.85)*.28,destination.y-c.y,t);dz=T.MathUtils.lerp(Math.cos(angle)*.48,-c.z,t);}
     const selected=selection.has(p.id);data.set([dx,dy,dz,(s.isolate?selected:visible.has(p.system)||selected)?1:0],i*4);selectedData[i*4]=selected?255:0;
     markerPositions.set(data[i*4+3]>.5?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);const mesh=pickers[i];if(mesh){mesh.position.set(dx,dy,dz);mesh.updateMatrix();mesh.updateMatrixWorld(true);}
     });partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;markerGeometry.attributes.position.needsUpdate=true;lastState=s;lastExtent=amount;dirty=true;
    }
    // SENIAM electrode markers follow their muscle parts (hidden when exploded/isolated).
    {
     const list=emgRef.current,show=visibleRef.current&&amount<.45&&!s.isolate;
     if(show!==lastEmgShow){lastEmgShow=show;dirty=true;}
     if(show&&ready) projectEmgToSurface();
     emgPoints.visible=show&&ready;emgHalo.visible=show&&ready;
     if(show){
      const n=Math.min(list.length,EMG_MAX);
      for(let k=0;k<EMG_MAX;k++){
       if(k>=n){emgPositions.set([10000,10000,10000],k*3);emgHaloPositions.set([10000,10000,10000],k*3);continue;}
       const a=list[k];
       if(!a.centroid||!a.partIds.length){emgPositions.set([10000,10000,10000],k*3);emgHaloPositions.set([10000,10000,10000],k*3);continue;}
       let dx=0,dy=0,dz=0,cnt=0,vis=0;
       for(const pid of a.partIds){const i=partIndexById.get(pid);if(i===undefined)continue;dx+=data[i*4];dy+=data[i*4+1];dz+=data[i*4+2];cnt++;if(data[i*4+3]>.5)vis++;}
       if(!cnt||!vis){emgPositions.set([10000,10000,10000],k*3);emgHaloPositions.set([10000,10000,10000],k*3);continue;}
       dx/=cnt;dy/=cnt;dz/=cnt;
       emgPositions.set([emgSurface[k*3]+dx,emgSurface[k*3+1]+dy,emgSurface[k*3+2]+dz],k*3);
       emgHaloPositions.set([emgSurface[k*3]+dx,emgSurface[k*3+1]+dy,emgSurface[k*3+2]+dz],k*3);
      }
      emgGeometry.attributes.position.needsUpdate=true;emgHaloGeometry.attributes.position.needsUpdate=true;
      if(visibleRef.current) dirty=true;
     } else {if(emgPoints.visible!==false){emgPoints.visible=false;}if(emgHalo.visible!==false){emgHalo.visible=false;}}
    }
    // Motion-capture markers sit on bony landmarks (hidden when exploded/isolated).
    {
     const list=mocapRef.current,show=mocapVisibleRef.current&&amount<.45&&!s.isolate;
     if(show!==lastMocapShow){lastMocapShow=show;dirty=true;}
     mocapPoints.visible=show&&ready;mocapHalo.visible=show&&ready;
     if(show){
      const n=Math.min(list.length,MOCAP_MAX);
      for(let k=0;k<MOCAP_MAX;k++){
       if(k>=n){mocapPositions.set([10000,10000,10000],k*3);mocapHaloPositions.set([10000,10000,10000],k*3);continue;}
       const a=list[k];
       if(!a.pos||!a.partIds.length){mocapPositions.set([10000,10000,10000],k*3);mocapHaloPositions.set([10000,10000,10000],k*3);continue;}
       let dx=0,dy=0,dz=0,cnt=0,vis=0;
       for(const pid of a.partIds){const i=partIndexById.get(pid);if(i===undefined)continue;dx+=data[i*4];dy+=data[i*4+1];dz+=data[i*4+2];cnt++;if(data[i*4+3]>.5)vis++;}
       if(!cnt||!vis){mocapPositions.set([10000,10000,10000],k*3);mocapHaloPositions.set([10000,10000,10000],k*3);continue;}
       dx/=cnt;dy/=cnt;dz/=cnt;
       mocapPositions.set([a.pos[0]+dx,a.pos[1]+dy,a.pos[2]+dz],k*3);
       mocapHaloPositions.set([a.pos[0]+dx,a.pos[1]+dy,a.pos[2]+dz],k*3);
      }
      mocapGeometry.attributes.position.needsUpdate=true;mocapHaloGeometry.attributes.position.needsUpdate=true;
      dirty=true;
     } else {if(mocapPoints.visible!==false){mocapPoints.visible=false;}if(mocapHalo.visible!==false){mocapHalo.visible=false;}}
    }
   if(s.view!==lastView||s.reset!==lastReset){fit(s.view,amount);lastView=s.view;lastReset=s.reset;}
   if(moving&&!s.isolate)fit(amount>.5?'front':s.view,Math.max(0,(amount-.3)/.7));
   const isolateKey=s.isolate?s.selected.join(',')+':'+s.reset+':'+s.inspectorOpen+':'+camera.aspect:'';
   if(isolateKey!==lastIsolate||(s.isolate&&moving)){
    if(s.isolate){const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(s.selected.includes(p.id))box.union(bounds[i].clone().translate(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])));});
     if(!box.isEmpty()){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const w=el.clientWidth,h=el.clientHeight,mobile=w<768,landscape=w>h&&h<=600;let left=20,right=w-20,top=mobile?175:110,bottom=h-80;if(s.inspectorOpen){if(landscape){right=w-335;top=100;bottom=h-125;}else if(mobile){const sheet=document.querySelector('.detail-sheet')?.getBoundingClientRect(),header=document.querySelector('.identity')?.getBoundingClientRect();top=(header?.bottom??94)+16;bottom=(sheet?.top??h*.58-139)-16;}else{right=w-510;left=w>1100?285:25;}}const availableWidth=Math.max(150,right-left),availableHeight=Math.max(40,bottom-top);camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(.07,Math.max(size.y*h/availableHeight,size.x*w/availableWidth/camera.aspect,size.z)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.35);controls.maxDistance=Math.max(40,distance*2);controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(.2,.1,1).normalize().multiplyScalar(distance));controls.update();dirty=true;}
    }else if(lastIsolate){camera.clearViewOffset();fit(s.view,amount);}
    lastIsolate=isolateKey;
   }
   controls.enableRotate=amount<.8;controls.mouseButtons.LEFT=amount<.8?T.MOUSE.ROTATE:T.MOUSE.PAN;controls.touches.ONE=amount<.8?T.TOUCH.ROTATE:T.TOUCH.PAN;ground.visible=platform.visible=ring.visible=innerRing.visible=amount<.5&&!s.isolate;markers.visible=amount>.75;controls.autoRotate=s.rotate&&!s.isolate&&amount<.4;controls.autoRotateSpeed=.65;controls.update();if(controls.autoRotate)dirty=true;
   if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>p.system!=='integumentary'&&data[i*4+3]>.5);atlas.parts.forEach((p,i)=>{if(data[i*4+3]<.5||(hasSolid&&p.system==='integumentary'))return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;}

  };animate();
  const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D session was paused by your device. Reload to continue.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();markerGeometry.dispose();markerMaterial.dispose();emgGeometry.dispose();emgMaterial.dispose();emgHaloGeometry.dispose();emgHaloMaterial.dispose();mocapGeometry.dispose();mocapMaterial.dispose();mocapHaloGeometry.dispose();mocapHaloMaterial.dispose();hover.remove();renderer.dispose();renderer.domElement.remove();};
 },[atlas]);
 return <div className="scene" ref={host}/>;
}
