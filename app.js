import {createMailbox} from './scene.js';
import {attachKeyboard} from './ime.js';
import {attachTypewriter} from './typewriter-motion.js';
import {attachReceiving} from './receive.js';
const $=s=>document.querySelector(s),home=$('#home'),writing=$('#writing'),letter=$('#letter'),next=$('#next'),app=$('#app');
let model,composing=false,sending=false,pending=false;
const receiving=attachReceiving({getModel:()=>model,home,app});
createMailbox($('#stage')).then(result=>{model=result;$('#loading').hidden=true;receiving.ready()}).catch(e=>{$('#loading').textContent='立体信箱加载失败，请刷新重试';console.error(e)});
try{letter.value=localStorage.getItem('xiaodou-draft')||''}catch{}
const motion=attachTypewriter(letter,$('#typewriter'));
function written(){if(!composing)motion.sync();update()}
document.fonts.load('20px LXGWWenKai').then(()=>motion.caret());
$('#date').textContent=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date());
function update(){next.disabled=!letter.value.trim()||composing||sending||pending;if(composing){$('#draft-state').textContent='正在输入…';return}try{localStorage.setItem('xiaodou-draft',letter.value);$('#draft-state').textContent=pending?'请选择候选词。':letter.value?'草稿已收好。':'想到哪里，就写到哪里。'}catch{$('#draft-state').textContent='草稿暂未保存，请勿关闭页面。'}}
function compose(){receiving.reset();home.hidden=true;writing.hidden=false;app.classList.add('editing');letter.focus();motion.reset();update()}
function back(){keyboard.flush();writing.hidden=true;home.hidden=false;app.classList.remove('editing');letter.blur();app.style.height=''}
$('#compose').onclick=compose;$('#back').onclick=back;
letter.addEventListener('compositionstart',()=>{composing=true;next.disabled=true});letter.addEventListener('compositionend',()=>{composing=false;written()});
letter.addEventListener('input',written);
const keyboard=attachKeyboard({textarea:letter,container:$('#keyboard'),onChange:written,onPending:value=>{pending=value;update()}});
for(let angle=-72;angle<=72;angle+=6){const i=document.createElement('i');i.style.transform=`rotate(${angle}deg)`;$('#typebasket').append(i)}
next.onclick=async()=>{if(!letter.value.trim()||composing||sending||pending)return;
 if(!model){$('#notice').textContent='信箱还没准备好，再等一下。';$('#notice').hidden=false;return}
 sending=true;next.disabled=true;
 try{const sent=JSON.parse(localStorage.getItem('xiaodou-letters')||'[]');sent.push({body:letter.value,date:new Date().toISOString()});localStorage.setItem('xiaodou-letters',JSON.stringify(sent));localStorage.removeItem('xiaodou-draft')}catch{sending=false;update();$('#notice').textContent='信还没有存好，请保留正文后再试。';$('#notice').hidden=false;return}
 $('#notice').hidden=true;letter.value='';back();home.classList.add('posting');await model.post();home.classList.remove('posting');home.classList.add('posted');$('#delivered').hidden=false;sending=false;receiving.schedule();$('#done').focus();
};
$('#done').onclick=()=>{home.classList.remove('posted');$('#delivered').hidden=true;$('#compose').focus()};
if(window.visualViewport&&matchMedia('(pointer:coarse)').matches)visualViewport.addEventListener('resize',()=>{if(!writing.hidden){app.style.height=visualViewport.height+'px';app.classList.toggle('native-keyboard',window.innerHeight-visualViewport.height>120)}});
update();
