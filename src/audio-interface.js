/** Enable sound and music for each launch. Keep other saved preferences. */
export function launchAudioPreferences(saved){
  return {...saved,sound:true,music:true,
    volume:saved.volume>0?saved.volume:.5,musicVolume:saved.musicVolume>0?saved.musicVolume:.55};
}

/** Report actual music loading and playback. Do not change game state. */
export function mountAudioStatus(audio,container){
  const group=document.createElement('section'),message=document.createElement('p'),retry=document.createElement('button');
  group.className='music-source';message.className='small';message.setAttribute('role','status');
  retry.type='button';retry.textContent='Retry music';retry.hidden=true;
  group.append(message,retry);container.append(group);
  retry.addEventListener('click',async()=>{await audio.retryMusic?.();update();});
  function update(){
    const state=audio.diagnosticState().recorded;
    const text=!audio.options.sound?'Sound is off.':!audio.options.music?'Music is off.':state?.error?
      'Music could not load. SFX remain available. Select Retry music.':state?.state==='loading'?`Loading music: ${state.title||'recorded techno'}.`:
      state?.title?`Recorded music: ${state.title}.`:'Recorded techno is ready after a start action.';
    if(message.textContent!==text)message.textContent=text;
    retry.hidden=!state?.error;
  }
  update();return {update,element:group};
}
