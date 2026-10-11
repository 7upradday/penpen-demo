// Preserve the supplied demo and its motion; only externalize embedded assets and add the app bridge.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
let html=await readFile('reference/partner-original/penpen后段/penpen_demo.html','utf8');
await mkdir('assets/partner',{recursive:true});
const match=html.match(/const ASSETS=(\{[^\n]+\});/);
if(!match)throw Error('Partner asset manifest missing');
const assets=JSON.parse(match[1]);
async function extract(data,name){const m=data.match(/^data:([^;]+);base64,(.+)$/s);if(!m)throw Error(name);const ext=m[1].includes('png')?'png':'ttf';const path=`assets/partner/${name}.${ext}`;await writeFile(path,Buffer.from(m[2],'base64'));return path}
for(const [key,value]of Object.entries(assets)){assets[key]=Array.isArray(value)?await Promise.all(value.map((v,i)=>extract(v,`${key}-${i}`))):await extract(value,key)}
html=html.replace(match[0],`const ASSETS=${JSON.stringify(assets)};`);
// Use the existing glyph-filtered Maki family, with a readable Chinese fallback.
html=html.replace(/@font-face\s*\{[^}]*\}/,'');
html=html.replace('</head>','<link rel="stylesheet" href="assets/fonts/maki-coverage.css"><link rel="stylesheet" href="partner-integration.css"></head>');
html=html.replace('let current=0,', 'let current=4,');
html=html.replace("$('#restart').disabled=['loading','opening','closing'].includes(s)","$('#restart').disabled=['loading','opening','closing'].includes(s); document.querySelector('#return-mailbox').disabled=['loading','opening','closing','reading'].includes(s)");
html=html.replace('<header>','<header>');
html=html.replace('<nav class="nav" aria-label="主导航">', '<nav class="nav" aria-label="主导航"><button id="return-mailbox">回到信箱</button>');
html=html.replace('window.penpenReady=true','window.penpenReady=true;parent.postMessage({type:"penpen-ready"},location.origin)');
html=html.replace('</script></body>',`\nlet bridgeRequest=null;
function bridgeStart(){if(!window.penpenReady||!bridgeRequest)return;fit();const action=bridgeRequest;bridgeRequest=null;if(['opening','closing'].includes(state))return;current=4;updateMonth();if(action==='archive'){showArchive();return}arrive();requestAnimationFrame(()=>openLetter())}
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(['penpen-open','penpen-archive'].includes(e.data?.type)){bridgeRequest=e.data.type==='penpen-open'?'open':'archive';bridgeStart()}});
document.querySelector('#return-mailbox').onclick=()=>parent.postMessage({type:'penpen-home'},location.origin);
const readyCheck=setInterval(()=>{if(window.penpenReady){clearInterval(readyCheck);bridgeStart()}},100);
</script></body>`);
await writeFile('partner.html',html);
await writeFile('assets/partner/logo.svg',`<svg viewBox="955 1125 195 88" xmlns="http://www.w3.org/2000/svg"><image href="closed.png" width="1212" height="1297"/></svg>`);
console.log('Partner demo imported: original motion + 26 external image assets.');
