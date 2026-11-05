export const PALETTE={O:'#1B1626',L:'#D8C9A8',M:'#9C8B6E',H:'#5A4E40',D:'#2E2740',G:'#FFE9A0',F:'#E4572E',U:'#3E7CB1',a:'#E8E4DC',b:'#F2A541',c:'#E8D44D',d:'#7BC043',e:'#2FA4A0',f:'#7E5BC2',g:'#C45AA8'};
export const STAGES=['a','b','c','d','e','f','g','split'];
const centered=rows=>rows.map(row=>'.'.repeat(Math.floor((16-row.length)/2))+row+'.'.repeat(Math.ceil((16-row.length)/2)));
const masks={
  player:centered(['##','##','####','####','######','######','########','##########','############','##############','################','################','#####..##..#####','###....##....###','##.....##.....##','......####......']),
  scout:centered(['..##..##..','..######..','########','########','########','########','########','########','######','######','####','####','##','##','','']),
  gunner:centered(['##....##','##....##','########','##########','############','##############','################','################','##############','##############','##..######..##','##..######..##','##...####...##','##....##....##','......##......','']),
  heavy:centered(['..####..####..','##############','################','################','################','################','################','################','################','##############','############','##########','########','######','####','##']),
  klein:centered(['##','####','####','##','####','######','######','########','##########','##########','########','######','####','####','##','##']),
  rock:centered(['','######','##########','############','#############','##############','################','################','################','################','###############','##############','############','##########','######','']),
};
function shaded(mask){
  return mask.map((row,y)=>[...row].map((v,x)=>{
    if(v!== '#')return '.';
    if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([a,b])=>mask[b]?.[a]!=='#'))return 'O';
    return y<5&&x<10?'L':x<8?'M':'H';
  }));
}
const paint=(p,x,y,color)=>{if(p[y]?.[x]&&p[y][x]!=='.')p[y][x]=color;};
const copy=p=>p.map(row=>[...row]);
const ship=name=>{
  const p=shaded(masks[name]);
  if(name==='player')for(const [x,y,c] of [[7,3,'G'],[8,3,'G'],[7,4,'G'],[8,4,'G'],[7,13,'U'],[8,13,'U'],[7,14,'G'],[8,14,'G'],[3,10,'L'],[12,10,'M']])paint(p,x,y,c);
  else if(name==='klein'){
    for(const [x,y,c] of [[7,0,'F'],[8,1,'F'],[7,2,'U'],[6,2,'U'],[7,3,'F'],[8,3,'F'],[8,4,'U'],[7,5,'G'],[7,7,'L'],[8,9,'F']])paint(p,x,y,c);
  }else{
    paint(p,7,7,'F');paint(p,8,7,'G');
    if(name==='gunner')for(const x of [2,3,12,13])for(let y=7;y<13;y++)paint(p,x,y,y%3===0?'O':'M');
    if(name==='heavy'){
      for(let x=3;x<13;x++)paint(p,x,4,x<7?'L':'M');
      for(let y=6;y<11;y++){paint(p,4,y,'O');paint(p,11,y,'O');}
      for(let x=5;x<11;x++)paint(p,x,11,'O');
    }
  }
  return p;
};
const scale=(p,n)=>p.flatMap(row=>Array.from({length:n},()=>row.flatMap(c=>Array(n).fill(c))));
const blank=(w=16,h=w)=>Array.from({length:h},()=>Array(w).fill('.'));
const asteroid=()=>{
  const p=shaded(masks.rock);
  for(const [x,y,c] of [[5,3,'L'],[6,3,'L'],[4,4,'L'],[9,5,'O'],[10,5,'H'],[9,6,'H'],[6,9,'O'],[5,10,'H'],[4,9,'M'],[11,11,'M'],[9,12,'M']])paint(p,x,y,c);
  return p;
};
const arrow=(direction,color)=>{
  const p=blank();
  for(let y=3;y<=10;y++)for(let x=6;x<=9;x++)p[y][x]=x===6||x===9?'O':color;
  for(let y=8;y<14;y++)for(let x=2+y-8;x<=13-(y-8);x++)p[y][x]=(x===2+y-8||x===13-(y-8)||y===13)?'O':color;
  if(direction==='up')return p.toReversed();
  if(direction==='right')return p[0].map((_,x)=>p.map(row=>row[p[0].length-1-x]));
  return p;
};
const twist=()=>{const p=blank();for(let y=1;y<15;y++){const x=[6,7,8,9,9,8,7][y%7];p[y][x-1]='O';p[y][x]=y<8?'F':'U';p[y][x+1]=y<8?'U':'F';p[y][x+2]='O';}return p;};
const edgeTile=kind=>{
  const p=arrow(kind==='left'?'up':kind==='right'?'down':'right',kind==='left'?'F':kind==='right'?'U':'M');
  for(let i=0;i<16;i++){
    if(kind==='left'){p[i][0]='O';p[i][1]='F';}
    if(kind==='right'){p[i][15]='O';p[i][14]='U';}
    if(kind==='top'){p[0][i]='O';p[1][i]='M';}
    if(kind==='bottom'){p[15][i]='O';p[14][i]='M';}
  }return p;
};
const marker=accent=>{
  const p=blank();for(let y=1;y<15;y++)for(let x=1;x<15;x++){
    const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));if(Math.abs(x-7.5)+Math.abs(y-7.5)>10)continue;
    p[y][x]=d>=6?'O':d>=4?(accent==='split'?(x+y<15?'F':'U'):accent):d>=3?'O':d>=1.5?'H':'G';
  }return p;
};
const sprites=[];
function add(id,p,purpose){sprites.push({id,width:p[0].length,height:p.length,pixels:p.map(row=>row.join('')),purpose});return p;}
add('player.arrow',ship('player'),'Player ship. Faces up.');
for(const name of ['scout','gunner','heavy','klein'])add(`enemy.${name}`,ship(name),'Enemy form. Faces down.');
const turned=p=>p.toReversed().map((row,y)=>row.map((c,x)=>['L','M','H'].includes(c)?y<5&&x<10?'L':x<8?'M':'H':c));
add('player.arrow-down',turned(ship('player')),'Player after a Klein side crossing. Faces down.');
for(const name of ['scout','gunner','heavy','klein'])add(`enemy.${name}-up`,turned(ship(name)),'Enemy after changing facing. Faces up.');
add('icon.klein',scale(ship('klein'),2),'Klein Runner inspection icon.');
const damaged=ship('heavy');for(const [x,y] of [[6,3],[7,4],[7,5],[8,6],[7,8],[8,9],[9,10]])paint(damaged,x,y,'O');add('enemy.heavy-damaged',damaged,'Damaged Heavy.');
add('enemy.heavy-damaged-up',turned(damaged),'Damaged Heavy facing up.');
for(let count=1;count<=4;count++){const p=blank();for(let i=0;i<count;i++)p[1][7-(count-1)+i*2]='G';add(`health.${count}`,p,'One-pixel health pips.');}
add('return.exit',arrow('down','F'),'Bottom exit.');add('return.entry',arrow('down','U'),'Top entry.');
const rock=asteroid();add('asteroid.medium',rock,'16-pixel asteroid.');
const large=scale(rock,2);for(const [x,y] of [[4,8],[5,8],[25,21],[26,21],[9,27],[10,27]])large[y][x]='.';add('asteroid.large',large,'32-pixel asteroid.');
add('asteroid.small',shaded(['..####..','.######.','########','########','########','.######.','..####..','...##...']),'8-pixel asteroid.');
for(let frame=0;frame<3;frame++){
  const p=blank();for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    if(rock[y][x]==='.'||x===7||y===8||(frame===2&&((x+y)%3===0)))continue;
    const nx=x+(x<7?-frame:frame),ny=y+(y<8?-frame:frame);if(p[ny]?.[nx]!==undefined)p[ny][nx]=rock[y][x];
  }add(`asteroid.break-${frame}`,p,'Asteroid break frame.');
}
const glint=blank();for(let d=-4;d<=4;d++){glint[7][7+d]='G';glint[7+d][7]='G';}glint[6][6]='L';add('effect.glint',glint,'Points glint.');
const flash=blank();flash[7][7]='F';add('effect.absorb',flash,'Single-pixel absorbed-shot flash.');
add('edge.left',edgeTile('left'),'Left side direction.');add('edge.right',edgeTile('right'),'Right side direction.');
add('edge.top',edgeTile('top'),'Top edge without twist.');add('edge.bottom',edgeTile('bottom'),'Bottom edge without twist.');add('edge.twist',twist(),'Side-edge half twist.');
for(let i=0;i<8;i++)add(`stage.${i}`,marker(STAGES[i]),`Route marker S${i}.`);
for(const [id,c] of [['shot.player','G'],['shot.enemy','F']]){const p=blank(4,8);for(let y=1;y<7;y++){p[y][1]=y===1?'L':c;p[y][2]=c;}add(id,p,'Projectile glint.');}
export {sprites};
