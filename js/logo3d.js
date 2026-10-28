/* Landing page footer: the church seal as a 3D gold coin that spins in, wobbles and follows the pointer.
   Renders into small canvases inside each .logo-dock and only while visible. Needs js/three.min.js. */
(function(){
'use strict';
var docks=[].slice.call(document.querySelectorAll('.logo-dock'));
if(!docks.length||!window.THREE)return;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce)return;
var T=THREE;
var clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};
var easeOut=function(t){return 1-Math.pow(1-t,3);};

docks.forEach(function(dock){
  var renderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){return;}
  if(!renderer.getContext())return;
  var canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');
  dock.appendChild(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputEncoding=T.sRGBEncoding;
  var scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.1,20);
  camera.position.z=2.5;
  scene.add(new T.AmbientLight(0xffffff,.75));
  var key=new T.DirectionalLight(0xffffff,.9);key.position.set(-.6,.9,1.2);scene.add(key);
  var glare=new T.PointLight(0xffe2a0,1.3,6,1.6);glare.position.set(.8,.6,1.4);scene.add(glare);

  /* face texture: gold bezel disc with the seal inside (the seal art has transparent corners) */
  var c=document.createElement('canvas');c.width=c.height=512;var g=c.getContext('2d');
  var bez=g.createRadialGradient(256,256,150,256,256,256);bez.addColorStop(0,'#8a5a14');bez.addColorStop(.55,'#e8b84e');bez.addColorStop(1,'#b8821f');
  g.fillStyle=bez;g.beginPath();g.arc(256,256,256,0,7);g.fill();
  g.strokeStyle='rgba(255,236,170,.55)';g.lineWidth=5;g.beginPath();g.arc(256,256,238,0,7);g.stroke();
  g.fillStyle='#08101c';g.beginPath();g.arc(256,256,206,0,7);g.fill();
  var tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
  /* cylinder caps use a quarter-turned UV layout, so turn the art back upright */
  tex.center.set(.5,.5);tex.rotation=Math.PI/2;
  var face=new T.MeshStandardMaterial({map:tex,roughness:.38,metalness:.25,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.22});
  var gold=new T.MeshStandardMaterial({color:0xe2ab3a,metalness:.9,roughness:.28});
  var coin=new T.Mesh(new T.CylinderGeometry(.46,.46,.08,72,1),[gold,face,face]);
  coin.rotation.x=Math.PI/2;                         /* caps face the camera */
  var rim=new T.Mesh(new T.TorusGeometry(.46,.03,16,72),gold);
  var group=new T.Group();group.add(coin);group.add(rim);scene.add(group);
  var img=new Image();
  img.onload=function(){g.save();g.beginPath();g.arc(256,256,198,0,7);g.clip();g.drawImage(img,58,58,396,396);g.restore();tex.needsUpdate=true;dock.classList.add('gl');};
  img.src='logo.webp';

  function size(){var w=dock.clientWidth||200,h=dock.clientHeight||200;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  size();addEventListener('resize',size);
  if(window.ResizeObserver)new ResizeObserver(size).observe(dock);

  var visible=false,t0=0,nx=0,ny=0,px=0,py=0,spin=0,lastS=scrollY,last=performance.now();
  new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible&&!t0)t0=performance.now();},{threshold:.15}).observe(dock);
  addEventListener('pointermove',function(e){
    var r=dock.getBoundingClientRect();
    nx=clamp((e.clientX-(r.left+r.width/2))/(innerWidth*.5),-1,1);
    ny=clamp((e.clientY-(r.top+r.height/2))/(innerHeight*.5),-1,1);
  },{passive:true});
  (function frame(now){
    requestAnimationFrame(frame);
    if(!visible||document.hidden)return;
    var dt=Math.min(.05,(now-last)/1000);last=now;
    var s=scrollY;spin=clamp(spin+(s-lastS)/Math.max(dt,.001)*.00005,-4,4);lastS=s;spin*=Math.pow(.05,dt);
    var t=(now-t0)/1000;
    var intro=easeOut(clamp(t/1.8,0,1));
    px+=(nx-px)*.08;py+=(ny-py)*.08;
    /* wobble: three slow oscillations that never line up, plus pointer lean and scroll spin */
    group.rotation.y=(1-intro)*Math.PI*4+Math.sin(t*1.6)*.6*intro+px*.55+spin;
    group.rotation.x=Math.sin(t*1.9+1)*.22*intro+py*.35;
    group.rotation.z=Math.sin(t*2.7)*.1*intro;
    group.position.y=Math.sin(t*2.2)*.03*intro;
    group.scale.setScalar(.6+.4*intro);
    glare.position.x=.8+px*1.2;glare.position.y=.6-py*1.2;
    renderer.render(scene,camera);
  })(performance.now());
});
})();
