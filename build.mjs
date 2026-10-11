import {mkdir,copyFile,cp,readFile,writeFile,access} from 'node:fs/promises';
import {fontCoverage,unicodeRanges} from './inspect-fonts.mjs';
// The reviewed, externalized partner.html is committed; the original archive stays local.
const hasOriginal=await access('reference/partner-original/penpen后段/penpen_demo.html').then(()=>true,()=>false);
if(hasOriginal)await import('./import-partner.mjs');
let fontCSS='';
for(const [family,file] of [['MakiCircle','makiirclehand.ttf'],['Makiba','MakibaFont13.ttf']])fontCSS+=`@font-face{font-family:${family};src:url('./${file}') format('truetype');font-display:swap;unicode-range:${unicodeRanges(await fontCoverage(file))}}\n`;
await writeFile('assets/fonts/maki-coverage.css',fontCSS);
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','typography-motion.css','receive.css','integration.css','partner.html','partner-integration.css','app.js','scene.js','ime.js','typewriter-motion.js','receive.js']) await copyFile(file,`dist/${file}`);
await mkdir('vendor',{recursive:true});
// Adapter for pinned simple-ime 1.2.4: keep its offline engine, omit its global UI.
const imeSource=await readFile('node_modules/simple-ime/dist/simple-ime.es.js','utf8');
if(!imeSource.includes('function ji(g, n = 3)')||!imeSource.includes('const di =')) throw Error('Review simple-ime adapter before upgrading');
await writeFile('vendor/pinyin-engine.js','// simple-ime 1.2.4, MIT, nieyuyao. Offline engine adapter.\n'+imeSource.slice(0,imeSource.indexOf('const di ='))+'\nexport { ji as requestCandidates };\n');
await copyFile('node_modules/three/build/three.module.js','vendor/three.module.js');
await copyFile('node_modules/three/build/three.core.js','vendor/three.core.js');
await cp('node_modules/three/examples/jsm','vendor/addons',{recursive:true});
await cp('vendor','dist/vendor',{recursive:true});
await cp('assets','dist/assets',{recursive:true});
console.log('Build complete: dist/');
