/* Convention page: 3D flier that shrinks and travels left to right as you scroll, plus a 3D flier cursor.
   Needs js/three.min.js (r128). Skipped entirely for reduced motion or when WebGL is unavailable. */
(function(){
'use strict';
var root=document.documentElement;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
var SRC='images/convention-flier-2026.webp';
var ASPECT=1080/863;
var clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};
var lerp=function(a,b,t){return a+(b-a)*t;};
var easeOut=function(t){return 1-Math.pow(1-t,3);};
var easeInOut=function(t){return -(Math.cos(Math.PI*t)-1)/2;};

/* ---------------- 3D cursor ---------------- */
function initCursor(){
  if(!fine||reduce)return;
  var el=document.createElement('div');
  el.className='cur3d';el.setAttribute('aria-hidden','true');
  var layers='';
  for(var i=1;i<=7;i++)layers+='<i style="transform:translateZ(-'+(i*.9).toFixed(1)+'px)"></i>';
  el.innerHTML='<div class="cur-card"><b></b>'+layers+'<u></u></div>';
  document.body.appendChild(el);
  var card=el.firstChild;
  var tx=-100,ty=-100,x=-100,y=-100,vx=0,vy=0,spin=0,hot=false,shown=false,last=performance.now();
  var INTERACTIVE='a,button,summary,label,select,[role=tab],.chip,.step-n button';
  var TEXTUAL='input:not([type=checkbox]):not([type=radio]),textarea,select';
  root.classList.add('cur3d-on');
  addEventListener('pointermove',function(e){
    if(e.pointerType&&e.pointerType!=='mouse')return;
    tx=e.clientX;ty=e.clientY;
    if(!shown){x=tx;y=ty;shown=true;el.style.opacity='1';}
    var t=e.target&&e.target.closest?e.target:null;
    hot=!!(t&&t.closest(INTERACTIVE));
    el.classList.toggle('hot',hot);
    el.classList.toggle('txt',!!(t&&t.closest(TEXTUAL)));
  },{passive:true});
  document.addEventListener('mouseleave',function(){el.style.opacity='0';shown=false;});
  addEventListener('pointerdown',function(){spin+=hot?9:5;});
  var lb=document.getElementById('lb');
  if(lb)new MutationObserver(function(){
    var open=lb.hasAttribute('open');
    root.classList.toggle('cur-native',open);
    el.classList.toggle('away',open);
  }).observe(lb,{attributes:true,attributeFilter:['open']});
  (function frame(now){
    var dt=Math.min(.05,(now-last)/1000);last=now;
    var a=1-Math.pow(.0006,dt);
    var nx=lerp(x,tx,a),ny=lerp(y,ty,a);
    vx=lerp(vx,(nx-x)/Math.max(dt,.001),.2);vy=lerp(vy,(ny-y)/Math.max(dt,.001),.2);
    x=nx;y=ny;
    spin*=Math.pow(.02,dt);
    var ry=clamp(vx*.05,-70,70)+Math.sin(now/700)*14+spin*60;
    var rx=clamp(-vy*.05,-55,55)+Math.cos(now/900)*6;
    var rz=clamp(vx*.012,-14,14);
    el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
    card.style.transform='rotateX('+rx.toFixed(1)+'deg) rotateY('+ry.toFixed(1)+'deg) rotateZ('+rz.toFixed(1)+'deg)';
    requestAnimationFrame(frame);
  })(performance.now());
}

/* ---------------- 3D scroll flier ---------------- */
function initScene(){
  if(reduce||!window.THREE)return false;
  var ph=document.getElementById('flierBtn');
  if(!ph)return false;
  var T=THREE,renderer;
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(err){return false;}
  if(!renderer.getContext())return false;
  var canvas=renderer.domElement;
  canvas.id='gl3d';canvas.setAttribute('aria-hidden','true');
  document.body.appendChild(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputEncoding=T.sRGBEncoding;
  var scene=new T.Scene();
  var FOV=30;
  var camera=new T.PerspectiveCamera(FOV,1,10,6000);
  scene.add(new T.AmbientLight(0xffffff,.7));
  var key=new T.DirectionalLight(0xffffff,.8);key.position.set(-.6,.8,1);scene.add(key);
  var glare=new T.PointLight(0xffe0a0,1.1,1400,1.6);glare.position.set(0,0,420);scene.add(glare);

  var pivot=new T.Group();scene.add(pivot);
  var gold=new T.MeshStandardMaterial({color:0xe0a93a,metalness:.85,roughness:.32});
  var front=new T.MeshStandardMaterial({color:0xffffff,roughness:.42,metalness:.04,emissive:0xffffff,emissiveIntensity:.32,transparent:true});
  var back=new T.MeshStandardMaterial({color:0xffffff,roughness:.5,metalness:.1,transparent:true});
  gold.transparent=true;
  /* BoxGeometry order: +x -x +y -y +z -z */
  var mesh=new T.Mesh(new T.BoxGeometry(1,ASPECT,.03),[gold,gold,gold,gold,front,back]);
  pivot.add(mesh);
  pivot.visible=false;

  var loader=new T.TextureLoader();
  loader.load(SRC,function(tex){
    tex.encoding=T.sRGBEncoding;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    front.map=tex;front.emissiveMap=tex;front.needsUpdate=true;
    pivot.visible=true;t0=performance.now();
    root.classList.add('gl');
  });
  /* back face: drawn on a canvas so the flier has a proper reverse side */
  (function(){
    var c=document.createElement('canvas');c.width=512;c.height=Math.round(512*ASPECT);
    var g=c.getContext('2d');
    var bg=g.createLinearGradient(0,0,c.width,c.height);bg.addColorStop(0,'#0b3a22');bg.addColorStop(1,'#04140c');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);
    g.strokeStyle='rgba(255,178,62,.7)';g.lineWidth=6;g.strokeRect(22,22,c.width-44,c.height-44);
    function words(){
      g.fillStyle='#ffd57a';g.textAlign='center';
      g.font='800 54px "Bricolage Grotesque",Arial Black,sans-serif';
      g.fillText('NEW THINGS',c.width/2,c.height*.64);g.fillText('BY HIS SPIRIT',c.width/2,c.height*.64+60);
      g.fillStyle='#eef0fa';g.font='600 26px "JetBrains Mono",monospace';
      g.fillText('2026 NATIONAL CONVENTION',c.width/2,c.height*.64+112);
      g.fillStyle='#6dff9c';g.fillText('20 - 22 NOVEMBER',c.width/2,c.height*.64+150);
    }
    words();
    var tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;back.map=tx;back.needsUpdate=true;
    var logo=new Image();
    logo.onload=function(){var s=240;g.save();g.beginPath();g.arc(c.width/2,c.height*.34,s/2,0,7);g.clip();g.drawImage(logo,c.width/2-s/2,c.height*.34-s/2,s,s);g.restore();tx.needsUpdate=true;};
    logo.src='logo.webp';
  })();

  /* layout metrics, refreshed on resize / layout shifts */
  /* landing pads: the flier docks into each .dock as it nears the middle of the screen; data-hold pads keep it once reached */
  var docks=[].slice.call(document.querySelectorAll('.dock')).map(function(el){return {el:el,hold:el.getAttribute('data-hold')==='1',last:el.getAttribute('data-last')==='1',wobble:el.getAttribute('data-wobble')==='1',cx:0,top:0,w:0,h:0};});
  var vw=1,vh=1,w0=300,docCx=0,docCy=0,docTop=0,maxS=0;
  function measure(){
    vw=innerWidth;vh=innerHeight;maxS=Math.max(0,document.documentElement.scrollHeight-vh);
    renderer.setSize(vw,vh,false);
    camera.aspect=vw/vh;
    camera.position.z=(vh/2)/Math.tan(FOV*Math.PI/360);
    camera.updateProjectionMatrix();
    var r=ph.getBoundingClientRect(),sy=scrollY;
    w0=Math.max(120,r.width);docCx=r.left+r.width/2;docCy=r.top+sy+r.height/2;docTop=r.top+sy;
    docks.forEach(function(k){var d=k.el.getBoundingClientRect();k.w=d.width;k.h=d.height;k.cx=d.left+d.width/2;k.top=d.top+sy;});
  }
  measure();
  addEventListener('resize',measure);
  if(window.ResizeObserver)new ResizeObserver(measure).observe(document.body);
  addEventListener('load',measure);

  var px=0,py=0,pnx=0,pny=0,t0=performance.now();
  addEventListener('pointermove',function(e){pnx=e.clientX/vw*2-1;pny=e.clientY/vh*2-1;glare.position.x=e.clientX-vw/2;glare.position.y=-(e.clientY-vh/2);},{passive:true});
  var st={x:null,y:0,w:300,yaw:0,pitch:0,roll:0},spin=0,lastS=scrollY,lastT=performance.now();

  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||!pivot.visible)return;
    if(root.classList.contains('cvloading')){t0=now;lastT=now;return;}
    var dt=Math.min(.05,(now-lastT)/1000);lastT=now;
    var s=scrollY;
    var vel=(s-lastS)/Math.max(dt,.001);lastS=s;
    spin=clamp(spin+vel*.00006,-5,5);
    spin*=Math.pow(.05,dt);

    var intro=easeOut(clamp((now-t0)/1500,0,1));
    /* progress starts once the placeholder reaches the upper half of the screen (matters on phones) */
    var s0=Math.max(0,docTop-vh*.5);
    var sp=Math.max(0,s-s0);
    var small=vw<700;
    var wEnd=small?54:clamp(w0*.27,84,128);
    var tSize=easeOut(clamp(sp/(vh*1.1),0,1));
    var width=lerp(w0,wEnd,tSize)*(.55+.45*intro);
    var tx=easeInOut(clamp(sp/(vh*3.4),0,1));
    var xStart=docCx,xEnd=vw-wEnd/2-Math.max(10,vw*.012);
    var targetX=lerp(xStart,xEnd,tx)+Math.sin(s*.004)*16*tSize;
    var yLive=docCy-s,yPin=vh*.52;
    var targetY=Math.max(yLive,yPin)+Math.sin(now/1000*1.3)*7*tSize;
    /* landing pad: while the pad is near the middle of the screen the flier eases into it and fills it */
    var dw=0,ww=0;
    docks.forEach(function(k){
      if(k.w<=0)return;
      var dyc=k.top+k.h/2-s;
      var w;
      if(k.hold&&dyc<vh*.5){
        /* hold: stays put until the pad has risen past 30% of the screen, then lets go over the next 60% */
        w=dyc>=vh*.3?1:easeInOut(1-clamp((vh*.3-dyc)/(vh*.6),0,1));
      }else{
        var dist=Math.abs(dyc-vh*.5)/vh;
        w=easeInOut(1-clamp((dist-.1)/.5,0,1));
      }
      /* the last pad (footer) takes over for good as the page runs out */
      if(k.last)w=Math.max(w,easeInOut(1-clamp((maxS-s)/(vh*.7),0,1)));
      targetX=lerp(targetX,k.cx,w);targetY=lerp(targetY,dyc,w);width=lerp(width,k.w,w);
      dw=Math.max(dw,w);
      if(k.wobble)ww=Math.max(ww,w);
    });
    targetY+=Math.sin(now/1000*2.8)*9*ww;
    var a=1-Math.pow(.0012,dt);
    if(st.x===null){st.x=targetX;st.y=targetY;st.w=width;}
    /* y is locked to the page scroll (no easing) so the flier can never trail behind the content and float over text during a fast flick */
    var ax=1-Math.pow(.00008,dt);
    st.x=lerp(st.x,targetX,ax);st.y=targetY;st.w=lerp(st.w,width,ax);
    px=lerp(px,pnx,.06);py=lerp(py,pny,.06);
    var free=1-dw*.85;
    var yawT=(-.3+Math.sin(sp*.0034)*.6*tSize+px*.35)*free+spin+(1-intro)*Math.PI*1.2;
    var pitchT=(-py*.22+Math.sin(sp*.0021)*.1*tSize)*free;
    var rollT=Math.sin(sp*.002)*.07*tSize*free;
    /* wobble while perched on the footer S */
    var tt=now/1000;
    yawT+=Math.sin(tt*2.4)*.5*ww;pitchT+=Math.sin(tt*1.9+2)*.16*ww;rollT+=Math.sin(tt*3.3+1)*.24*ww;
    st.yaw=lerp(st.yaw,yawT,a);st.pitch=lerp(st.pitch,pitchT,a);st.roll=lerp(st.roll,rollT,a);
    /* on phones the travelling flier is tiny and see-through so it never hides copy; docked it is fully opaque */
    var op=lerp(1,small?.55:1,(1-dw)*tSize);
    front.opacity=back.opacity=gold.opacity=op;
    pivot.position.set(st.x-vw/2,-(st.y-vh/2),0);
    pivot.scale.setScalar(st.w);
    pivot.rotation.set(st.pitch,st.yaw,st.roll,'YXZ');
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
  return true;
}

initCursor();
initScene();
})();
