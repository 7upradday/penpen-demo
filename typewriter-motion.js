// One strike per committed character. Native composition and on-screen IME share this path.
export function attachTypewriter(textarea,root){
 const arm=root.querySelector('#striker'),marker=root.querySelector('#carriage-marker');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let previous=textarea.value,queue=0,running=false,sequence=0;
 const measure=document.createElement('canvas').getContext('2d');
 function caret(){
  const style=getComputedStyle(textarea);measure.font=`${style.fontSize} ${style.fontFamily}`;
  const prefix=textarea.value.slice(0,textarea.selectionStart).split('\n').at(-1);
  const width=Math.max(1,textarea.clientWidth-8);let x=0;
  for(const c of prefix){const advance=measure.measureText(c).width+(parseFloat(style.letterSpacing)||0);if(x+advance>width)x=0;x+=advance}
  const area=textarea.getBoundingClientRect(),base=root.getBoundingClientRect();
  marker.style.left=`${Math.max(20,Math.min(root.clientWidth-20,area.left-base.left+x))}px`;
 }
 async function strike(){
  if(running||!queue)return;running=true;
  while(queue){queue--;const side=sequence++%2?12:-12;
   if(!reduce.matches){
    const animation=arm.animate([{transform:`rotateX(68deg) rotateZ(${side}deg)`},{transform:'rotateX(0deg) rotateZ(0deg)',offset:.4},{transform:'rotateX(0deg) rotateZ(0deg)',offset:.52},{transform:`rotateX(68deg) rotateZ(${side}deg)`}],{duration:145,easing:'ease-in-out'});
    root.querySelector('.ribbon').animate([{filter:'brightness(1)'},{filter:'brightness(1.35)',offset:.42},{filter:'brightness(1)'}],{duration:145});
    await animation.finished.catch(()=>{});
   }
  }running=false;
 }
 function sync(){
  const value=textarea.value;let a=0;while(a<value.length&&a<previous.length&&value[a]===previous[a])a++;
  let b=0;while(b<value.length-a&&b<previous.length-a&&value[value.length-1-b]===previous[previous.length-1-b])b++;
  const added=value.slice(a,value.length-b);previous=value;caret();
  const count=[...added].filter(c=>c!=='\n'&&c!=='\r').length;
  if(count){queue=Math.min(queue+count,8);strike()}
  if(added.includes('\n')&&!reduce.matches)root.querySelector('.platen').animate([{transform:'translateY(0)'},{transform:'translateY(-2px)'},{transform:'translateY(0)'}],{duration:180});
 }
 textarea.addEventListener('click',caret);textarea.addEventListener('keyup',caret);
 new ResizeObserver(caret).observe(textarea);document.fonts.ready.then(caret);
 return {sync,reset(){previous=textarea.value;queue=0;caret()},caret};
}
