/* Phone motion: turns the phone's gyroscope into a smoothed -1..1 tilt (PhoneTilt.x left/right, PhoneTilt.y toward/away)
   that the 3D flier, speaker cards and loader coin read. Hold the phone any way you like: the first reading is "level",
   and it re-levels slowly. iOS needs a tap for permission, so a small button appears there when that is still needed. */
(function(){
'use strict';
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(typeof DeviceOrientationEvent==='undefined')return;
var root=document.documentElement;
var clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};
var T=window.PhoneTilt={x:0,y:0,active:false,enable:enable};
var base=null,sx=0,sy=0,listening=false,needsPerm=typeof DeviceOrientationEvent.requestPermission==='function';

function angle(){return (screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(window.orientation||0);}
function onOrient(e){
  if(e.gamma==null||e.beta==null)return;                 /* desktops fire one empty event */
  var g=e.gamma,b=e.beta,a=angle(),gg=g,bb=b;
  if(a===90){gg=b;bb=-g;}else if(a===270||a===-90){gg=-b;bb=g;}else if(a===180){gg=-g;bb=-b;}
  if(!base)base={g:gg,b:bb};
  base.g+=(gg-base.g)*.004;base.b+=(bb-base.b)*.004;     /* slow re-levelling */
  sx+=(clamp((gg-base.g)/28,-1,1)-sx)*.2;
  sy+=(clamp((bb-base.b)/28,-1,1)-sy)*.2;
  T.x=sx;T.y=sy;
  if(!T.active){T.active=true;root.classList.add('tilt-live');var btn=document.getElementById('tiltBtn');if(btn)btn.remove();}
}
function listen(){if(listening)return;listening=true;addEventListener('deviceorientation',onOrient,true);}
function enable(){
  if(!needsPerm){listen();return Promise.resolve(true);}
  return DeviceOrientationEvent.requestPermission().then(function(r){if(r==='granted'){listen();return true;}return false;}).catch(function(){return false;});
}
/* Android, desktop and Chrome: events just flow, so always listen. iOS only sends them once permission is granted
   (asked for on the intro screen's buttons); if nothing has arrived a moment after load, offer a button for it. */
listen();
if(needsPerm&&matchMedia('(pointer:coarse)').matches){
  addEventListener('load',function(){
    setTimeout(function(){
      if(T.active||document.getElementById('tiltBtn'))return;
      var b=document.createElement('button');b.id='tiltBtn';b.type='button';b.setAttribute('aria-label','Enable phone motion tilt');
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M4 9l-2 3 2 3M20 9l2 3-2 3"/></svg>';
      b.addEventListener('click',function(){enable().then(function(ok){if(ok)b.remove();});});
      document.body.appendChild(b);
    },2500);
  });
}
})();
