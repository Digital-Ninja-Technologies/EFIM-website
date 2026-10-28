/* Footer wordmark: keeps the 3D flier / coin "docks" next to a word without nesting them inside the gradient-clipped text
   (Safari drops background-clip:text for any element that contains positioned children, which hid the word). The dock is a
   sibling; here we measure the word's text and put the dock at its right-hand end. */
(function(){
'use strict';
var g=document.querySelector('.giant');
if(!g)return;
var docks=[].slice.call(g.querySelectorAll('.giant-dock'));
if(!docks.length)return;
var last='';
function place(){
  var gr=g.getBoundingClientRect(),moved=false;
  docks.forEach(function(d){
    var w=g.children[+d.getAttribute('data-word')];if(!w)return;
    var rg=document.createRange();rg.selectNodeContents(w);
    var b=rg.getBoundingClientRect();if(!b.width)return;
    var dx=Math.round(b.right-gr.left)+'px',dy=Math.round(b.top+b.height/2-gr.top)+'px';
    if(d.style.getPropertyValue('--dx')!==dx||d.style.getPropertyValue('--dy')!==dy){d.style.setProperty('--dx',dx);d.style.setProperty('--dy',dy);moved=true;}
  });
  /* tell the 3D scripts their dock moved (they re-measure on resize); only when it really moved, so this cannot loop */
  if(moved)setTimeout(function(){dispatchEvent(new Event('resize'));},0);
}
place();
addEventListener('DOMContentLoaded',place);
addEventListener('load',place);
addEventListener('resize',place);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
if(window.ResizeObserver)new ResizeObserver(place).observe(g);
})();
