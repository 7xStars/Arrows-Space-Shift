export class PixelArt{
  constructor(){this.manifest=null;this.image=null;this.error=null;this.used=new Set();}
  async load(){
    try{
      const url=new URL('../assets/crossing/manifest.json',import.meta.url),response=await fetch(url);
      if(!response.ok)throw Error(`Sprite manifest: ${response.status}`);
      this.manifest=await response.json();const image=new Image();image.src=new URL(this.manifest.atlas,url).href;await image.decode();this.image=image;
    }catch(error){this.error=error.message;}
  }
  draw(ctx,id,x,y,scale=3){
    const frame=this.manifest?.frames[id];if(!this.image||!frame)return false;
    scale=Math.max(1,Math.round(scale));const w=frame.width*scale,h=frame.height*scale;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.image,frame.x,frame.y,frame.width,frame.height,Math.round(x-w/2),Math.round(y-h/2),w,h);ctx.restore();this.used.add(id);return true;
  }
  status(){return {ready:Boolean(this.image),id:this.manifest?.id||null,error:this.error,used:[...this.used]};}
  animationFrame(id,timeMs){const animation=this.manifest?.animations[id];if(!animation)return null;for(let i=0;i<animation.frames.length;i++){timeMs-=animation.durationsMs[i];if(timeMs<0)return animation.frames[i];}return null;}
}
export function enemyArt(enemy,kleinRoute=false){
  const kind=kleinRoute?'klein':enemy.boss?enemy.name==='Core'?'heavy':'gunner':enemy.maxHp===1||enemy.hp===1&&!enemy.maxHp?'scout':enemy.id%2?'heavy':'gunner';
  return `enemy.${kind}${kind==='heavy'&&enemy.hp<(enemy.maxHp||enemy.hp)?'-damaged':''}`;
}
