import {readFile} from 'node:fs/promises';
export async function fontCoverage(name){
 const b=await readFile('assets/fonts/'+name);const tables={};
 for(let i=0;i<b.readUInt16BE(4);i++){const o=12+i*16;tables[b.toString('ascii',o,o+4)]=b.readUInt32BE(o+8)}
 const cmap=tables.cmap,points=new Map();
 for(let t=0;t<b.readUInt16BE(cmap+2);t++){
  const entry=cmap+4+t*8,platform=b.readUInt16BE(entry),encoding=b.readUInt16BE(entry+2);if(platform!==0&&!(platform===3&&(encoding===1||encoding===10)))continue;
  const o=cmap+b.readUInt32BE(entry+4),format=b.readUInt16BE(o);
  if(format===12){for(let j=0;j<b.readUInt32BE(o+12);j++){const g=o+16+j*12,start=b.readUInt32BE(g),end=b.readUInt32BE(g+4),gid=b.readUInt32BE(g+8);for(let c=start;c<=end;c++)points.set(c,gid+c-start)}}
  if(format===4){const n=b.readUInt16BE(o+6)/2,end=o+14,start=end+2*n+2,delta=start+2*n,range=delta+2*n;for(let i=0;i<n;i++){for(let c=b.readUInt16BE(start+2*i);c<=b.readUInt16BE(end+2*i)&&c!==65535;c++){const r=b.readUInt16BE(range+2*i),d=b.readInt16BE(delta+2*i);let glyph=r?b.readUInt16BE(range+2*i+r+2*(c-b.readUInt16BE(start+2*i))):(c+d)&65535;if(r&&glyph)glyph=(glyph+d)&65535;if(glyph)points.set(c,glyph)}}}
 }
 if(tables.glyf&&tables.loca){const long=b.readInt16BE(tables.head+50)===1;const loc=g=>long?b.readUInt32BE(tables.loca+g*4):b.readUInt16BE(tables.loca+g*2)*2;for(const [cp,g] of points){if(cp===32)continue;const start=loc(g),end=loc(g+1);if(start===end||b.readInt16BE(tables.glyf+start)===0)points.delete(cp)}}
 return [...points.keys()].sort((a,b)=>a-b);
}
export function unicodeRanges(points){const runs=[];for(const p of points){const last=runs.at(-1);if(last&&last[1]+1===p)last[1]=p;else runs.push([p,p])}return runs.map(([a,b])=>'U+'+a.toString(16)+(a===b?'':'-'+b.toString(16))).join(',')}
if(process.argv[1]?.endsWith('inspect-fonts.mjs')){const sample='亲爱的小豆今天阳光很好我想告诉你一封中文信字体选择';for(const name of ['makiirclehand.ttf','MakibaFont13.ttf','underwood_champion.ttf']){const points=await fontCoverage(name);console.log(name,JSON.stringify({visibleGlyphs:points.length,missingSample:[...sample].filter(c=>!points.includes(c.codePointAt(0))).join('')}))}}
