import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export async function createMailbox(container){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;container.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(31,1,.1,50);camera.position.set(-4,3.7,10.5);camera.lookAt(0,2.32,0);
 scene.add(new THREE.HemisphereLight(0xfff7e6,0xa08874,2.1));const key=new THREE.DirectionalLight(0xfff6e4,3.5);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4,right:4,top:6,bottom:-3,near:.1,far:20});key.shadow.bias=-.0005;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key);
 const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(4,4,1);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x96734e,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=.02;scene.add(floor);
 const model=(await new GLTFLoader().loadAsync('./assets/models/mailbox.glb')).scene;
 const noise=document.createElement('canvas');noise.width=noise.height=128;const ctx=noise.getContext('2d'),pixels=ctx.createImageData(128,128);for(let i=0;i<pixels.data.length;i+=4){const v=100+Math.random()*110;pixels.data.set([v,v,v,255],i)}ctx.putImageData(pixels,0,0);const bump=new THREE.CanvasTexture(noise);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(7,7);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material.roughness>.5){o.material.bumpMap=bump;o.material.bumpScale=.012;o.material.roughness=.95;o.material.needsUpdate=true}}});scene.add(model);
 const letter=new THREE.Group(),paper=new THREE.MeshStandardMaterial({color:0xfff5df,roughness:.86,side:THREE.DoubleSide});const sheet=new THREE.Mesh(new THREE.BoxGeometry(1.06,.64,.022),paper);sheet.castShadow=true;letter.add(sheet);
 const flapShape=new THREE.Shape();flapShape.moveTo(-.53,.32);flapShape.lineTo(.53,.32);flapShape.lineTo(0,-.05);flapShape.closePath();const flap=new THREE.Mesh(new THREE.ShapeGeometry(flapShape),new THREE.MeshStandardMaterial({color:0xf0e2c5,roughness:.9,side:THREE.DoubleSide}));flap.position.z=.015;letter.add(flap);letter.visible=false;scene.add(letter);
 // A full-size sheet feeds downward. Clipping at the slot hides its unprinted portion.
 renderer.localClippingEnabled=true;
 const foxTexture=await new THREE.TextureLoader().loadAsync('./assets/letter-paper/fox.png');foxTexture.colorSpace=THREE.SRGBColorSpace;foxTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const paperWidth=1.27,paperHeight=paperWidth*1492/1054,slotY=2.73;
 const foxPaper=new THREE.Mesh(new THREE.PlaneGeometry(paperWidth,paperHeight),new THREE.MeshBasicMaterial({map:foxTexture,side:THREE.DoubleSide,toneMapped:false,clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,-1,0),slotY)]}));
 foxPaper.visible=false;foxPaper.position.set(0,slotY+paperHeight/2,.62);scene.add(foxPaper);
 let animation=null,receiveAnimation=null,received=false,onOpen=()=>{};const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function paperProgress(progress){foxPaper.position.y=slotY+paperHeight/2-(paperHeight+.025)*progress;foxPaper.visible=progress>0;}
 function feed(reverse=false){if(animation||receiveAnimation)return Promise.reject(new Error('Mailbox is busy'));received=false;container.dataset.receivePhase=reverse?'retracting':'feeding';return new Promise(resolve=>{receiveAnimation={start:performance.now(),duration:reduce?1:reverse?1600:4700,reverse,resolve}})}
 const raycaster=new THREE.Raycaster();
 renderer.domElement.addEventListener('click',event=>{if(!received)return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);if(raycaster.intersectObject(foxPaper).length)onOpen()});
 function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(container);resize();
 function frame(time){requestAnimationFrame(frame);if(animation){const t=Math.min((time-animation.start)/2400,1),ease=n=>n*n*(3-2*n);letter.visible=t<.96;
 if(t<.35){const k=ease(t/.35);letter.position.set(0,1.95+.78*k,1.7);letter.rotation.set(-Math.PI/2*k,0,0)}else{const k=ease((t-.35)/.65);letter.position.set(0,2.73,1.7-1.72*k);letter.rotation.set(-Math.PI/2,0,0)}
 if(t===1){letter.visible=false;const resolve=animation.resolve;animation=null;resolve()}}
 if(receiveAnimation){const a=receiveAnimation,t=Math.min((time-a.start)/a.duration,1);const progress=a.reverse?1-t:Math.max(0,Math.min(1,(t-.055)/.90));paperProgress(progress);if(t===1){received=!a.reverse;container.dataset.receivePhase=received?'ready':'idle';receiveAnimation=null;a.resolve()}}
 if(!document.hidden&&container.clientHeight)renderer.render(scene,camera)}requestAnimationFrame(frame);
 return {post(){foxPaper.visible=false;received=false;if(reduce)return Promise.resolve();return new Promise(resolve=>{animation={start:performance.now(),resolve};letter.visible=true})},receive:()=>feed(),retract:()=>feed(true),onOpen(callback){onOpen=callback},resetReceived(){if(!receiveAnimation){received=false;foxPaper.visible=false;container.dataset.receivePhase='idle'}}};
}
