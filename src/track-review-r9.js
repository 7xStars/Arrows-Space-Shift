/* Use one native player for all music comparisons. */
(()=>{
  const track=document.getElementById('track'),player=document.getElementById('player'),status=document.getElementById('status');
  const positions=[...document.querySelectorAll('[data-time]')],scriptURL=document.currentScript.src;
  let generation=0,pendingTime=null;
  const selected=()=>track.selectedOptions[0];
  const name=()=>selected().textContent;
  function seek(){
    if(pendingTime?.generation!==generation||player.readyState<1||!Number.isFinite(player.duration))return;
    player.currentTime=Math.min(player.duration,pendingTime.time);
    status.textContent='Moving to the selected position. Playback is paused.';
  }
  function replace(){
    generation++;pendingTime=selected().dataset.start?{generation,time:Number(selected().dataset.start),label:'Percussion response'}:null;player.pause();
    player.src=new URL(`../audio/stc-study/foxdot-percussion-r9/${track.value}`,scriptURL).href;
    player.load();positions.forEach(button=>button.disabled=selected().dataset.full!=='true');
    status.textContent=`Ready: ${name()}. Select Play in the audio controls.`;
  }
  track.addEventListener('change',replace);
  positions.forEach(button=>button.addEventListener('click',()=>{
    player.pause();pendingTime={generation,time:Number(button.dataset.time),label:button.textContent};seek();
  }));
  player.addEventListener('loadedmetadata',seek);
  player.addEventListener('seeked',()=>{if(pendingTime?.generation!==generation)return;
    const reached=Math.abs(player.currentTime-Math.min(player.duration,pendingTime.time))<.1;
    status.textContent=reached?`Position selected: ${pendingTime.label}. Playback is paused.`:'The position is not available. Use the native audio controls.';pendingTime=null;
  });
  player.addEventListener('play',()=>{if(!player.paused)status.textContent=`Playing: ${name()}.`;});
  player.addEventListener('pause',()=>{if(!player.ended)status.textContent=`Paused: ${name()}.`;});
  player.addEventListener('ended',()=>{status.textContent=`Ended: ${name()}.`;});
  player.addEventListener('error',()=>{status.textContent='The audio file is not available. Keep the complete extracted folder. Select another track to try again.';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
  window.addEventListener('pagehide',()=>player.pause());
  replace();
})();
