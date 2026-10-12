export function attachReceiving({getModel,home,app}){
 const $=s=>document.querySelector(s),actions=$('#receive-actions'),title=home.querySelector('h1'),subtitle=$('#home-status');
 const initialTitle=title.textContent,initialSubtitle=subtitle.textContent;let busy=false,ready=false,timer=null,frameReady=false,pending=null;
 const pane=document.createElement('section');pane.className='partner-screen';pane.hidden=true;pane.setAttribute('aria-label','PENPEN 拆信与信盒');
 const frame=document.createElement('iframe');frame.src='./partner.html';frame.title='PENPEN 来信与月度信盒';pane.append(frame);app.append(pane);
 function cancel(){clearTimeout(timer);timer=null}
 function dispatch(){if(frameReady&&pending){frame.contentWindow.postMessage({type:pending},location.origin);pending=null}}
 function showPartner(type){cancel();pending=type;home.hidden=true;pane.hidden=false;app.classList.add('partner-reading');dispatch()}
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(event.data?.type==='penpen-ready'){frameReady=true;dispatch()}
 if(event.data?.type==='penpen-home'){pane.hidden=true;home.hidden=false;app.classList.remove('partner-reading');getModel()?.resetReceived();ready=false;original();$('#compose').disabled=false;$('#compose').focus()}});
 function original(){title.textContent=initialTitle;subtitle.textContent=initialSubtitle;home.classList.remove('receiving','received','posted');$('#delivered').hidden=true;actions.hidden=true;$('#compose').disabled=false}
 async function receive(){if(busy||!getModel())return;cancel();busy=true;ready=false;$('#compose').disabled=true;$('#archive-entry').disabled=true;actions.hidden=true;home.classList.remove('posted','received');$('#delivered').hidden=true;home.classList.add('receiving');title.textContent='有一封信，写给你。';subtitle.textContent='小狐狸的信，正在慢慢送出。';
  try{getModel().resetReceived();await getModel().receive();home.classList.remove('receiving');home.classList.add('received');ready=true;actions.hidden=false;subtitle.textContent='信到啦，轻轻点开。';$('#open-reply').focus()}
  catch{original();$('#notice').textContent='信纸还没准备好，请再试一次。';$('#notice').hidden=false}
  finally{busy=false;$('#archive-entry').disabled=false;if(!ready)$('#compose').disabled=false}
 }
 function open(){if(!ready||busy)return;showPartner('penpen-open')}
 $('#replay-reply').onclick=receive;$('#open-reply').onclick=open;
 $('#archive-entry').onclick=()=>{if(!busy)showPartner('penpen-archive')};
 return {ready(){getModel().onOpen(open)},schedule(){cancel();$('#compose').disabled=true;$('#delivered span').textContent='约五秒后，小狐狸会寄来回信';timer=setTimeout(receive,5000)},reset(){cancel();if(!busy){ready=false;getModel()?.resetReceived();original()}}};
}
