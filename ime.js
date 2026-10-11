import {requestCandidates} from './vendor/pinyin-engine.js';
export function candidatesFor(pinyin){
 if(!pinyin)return [];
 return requestCandidates(pinyin).candidates.filter(c=>c.matchLength>0&&c.matchLength<=pinyin.length);
}
export function attachKeyboard({textarea,container,onChange,onPending}){
 let mode='zh',buffer='',candidates=[],page=0;
 const switcher=container.querySelector('#language'),preedit=container.querySelector('#preedit'),choices=container.querySelector('#candidates');
 const previous=container.querySelector('#candidate-prev'),more=container.querySelector('#candidate-next');
 function insert(value){textarea.setRangeText(value,textarea.selectionStart,textarea.selectionEnd,'end');onChange();textarea.focus({preventScroll:true});textarea.scrollTop=textarea.scrollHeight;}
 function render(){
  candidates=candidatesFor(buffer);preedit.textContent=buffer|| (mode==='zh'?'中文 · 拼音选词':'English');choices.replaceChildren();
  candidates.slice(page*5,page*5+5).forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.textContent=c.w;b.setAttribute('aria-label',`候选词 ${c.w}`);b.title=`${i+1}. ${c.w}`;b.onclick=()=>choose(i);choices.append(b)});
  previous.disabled=page===0;more.disabled=(page+1)*5>=candidates.length;
  switcher.textContent=mode==='zh'?'中 / EN':'EN / 中';switcher.setAttribute('aria-label',mode==='zh'?'切换为英文输入':'切换为中文输入');
  onPending(Boolean(buffer));
 }
 function choose(index=0){const c=candidates[page*5+index];if(!c)return;const rest=buffer.slice(c.matchLength);buffer=rest;page=0;insert(c.w);render();}
 function flush(){let count=0;while(buffer&&count++<50){const before=buffer;if(candidates.length)choose(0);if(buffer===before){const raw=buffer;buffer='';insert(raw);render();}}}
 function erase(){if(buffer){buffer=buffer.slice(0,-1);page=0;render();return}const end=textarea.selectionEnd,start=textarea.selectionStart;const length=start===end?([...textarea.value.slice(0,start)].pop()?.length||0):0;textarea.setRangeText('',start-length,end,'end');onChange();textarea.focus({preventScroll:true})}
 function input(key){if(mode==='zh'&&/^[a-z']$/i.test(key)){buffer+=key.toLowerCase();page=0;render()}else{flush();insert(key)}}
 container.querySelectorAll('[data-keys]').forEach(row=>{for(const letter of row.dataset.keys){const b=document.createElement('button');b.type='button';b.className='type-key';b.textContent=letter;b.setAttribute('aria-label',`字母 ${letter}`);b.onclick=()=>input(letter.toLowerCase());row.append(b)}});
 container.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault()});
 switcher.onclick=()=>{flush();mode=mode==='zh'?'en':'zh';render();textarea.focus({preventScroll:true})};
 previous.onclick=()=>{page=Math.max(0,page-1);render()};more.onclick=()=>{if((page+1)*5<candidates.length)page++;render()};
 container.querySelector('#key-space').onclick=()=>buffer?choose():insert(' ');
 container.querySelector('#key-backspace').onclick=erase;
 container.querySelector('#key-enter').onclick=()=>{flush();insert('\n')};
 textarea.addEventListener('keydown',e=>{
  if(e.isComposing||e.keyCode===229||e.ctrlKey||e.metaKey||e.altKey||mode!=='zh')return;
  if(/^[a-z']$/i.test(e.key)){e.preventDefault();input(e.key);return}
  if(!buffer)return;
  if(/^[1-5]$/.test(e.key)){e.preventDefault();choose(Number(e.key)-1)}
  else if(e.key===' '||e.key==='Enter'){e.preventDefault();choose()}
  else if(e.key==='Backspace'){e.preventDefault();erase()}
  else if(e.key==='Escape'){e.preventDefault();buffer='';page=0;render()}
  else if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();more.click()}
  else if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();previous.click()}
  else if(e.key.length===1){e.preventDefault();flush();insert(({',':'，','.':'。','?':'？','!':'！'})[e.key]||e.key)}
 });
 // Native composition is left to the device IME; never synthesize its key events.
 textarea.addEventListener('compositionstart',()=>{if(buffer)flush()});
 textarea.addEventListener('pointerdown',()=>{if(buffer)flush()});
 render();return {flush,hasPending:()=>Boolean(buffer)};
}
