export class PixelArt{
  constructor(){this.manifest=null;this.image=null;this.error=null;this.used=new Set();}
  async load(){
    try{
      const url=new URL('../assets/crossing/manifest.json',import.meta.url),response=await fetch(url);
      if(!response.ok)throw Error(`Sprite manifest: ${response.status}`);
      this.manifest=await response.json();const image=new Image();image.src=new URL(this.manifest.atlas,url).href;await image.decode();this.image=image;this.error=null;
    }catch(error){this.error=error.message;}
  }
  draw(ctx,id,x,y,scale=3){
    const frame=this.manifest?.frames[id];if(!this.image||!frame)return false;
    scale=Math.max(1,Math.round(scale));return this.drawSized(ctx,id,x,y,frame.width*scale,frame.height*scale);
  }
  /** Center a sprite in the supplied projected world rectangle. Native art never sets collider size. */
  drawSized(ctx,id,x,y,width,height){
    const frame=this.manifest?.frames[id];
    if(!this.image||!frame||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return false;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.image,frame.x,frame.y,frame.width,frame.height,x-width/2,y-height/2,width,height);
    ctx.restore();this.used.add(id);return true;
  }
  status(){return {ready:Boolean(this.image),id:this.manifest?.id||null,error:this.error,used:[...this.used]};}
  animationFrame(id,timeMs){
    const animation=this.manifest?.animations[id];if(!animation||!Number.isFinite(timeMs))return null;
    const duration=animation.durationsMs.reduce((sum,value)=>sum+value,0);if(duration<=0)return null;
    timeMs=Math.max(0,timeMs);if(animation.loop)timeMs%=duration;else if(timeMs>=duration)return null;
    for(let i=0;i<animation.frames.length;i++){timeMs-=animation.durationsMs[i];if(timeMs<0)return animation.frames[i];}
    return null;
  }
}
export function enemyArt(enemy,kleinRoute=false){
  if(enemy.boss)return enemy.name==='Core'?'boss.core':'boss.escort';
  const kind=kleinRoute?'klein':enemy.maxHp===1||enemy.hp===1&&!enemy.maxHp?'scout':enemy.id%2?'heavy':'gunner';
  return `enemy.${kind}${kind==='heavy'&&enemy.hp<(enemy.maxHp||enemy.hp)?'-damaged':''}`;
}
