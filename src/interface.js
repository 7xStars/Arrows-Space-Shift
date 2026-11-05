export function mountInterface({pause,phase,development=false}){
  const $=id=>document.getElementById(id),flight=document.querySelector('.flight');
  const dialogs={};
  for(const [key,title] of [['equipment','Equipment'],['guide','Flight guide'],['options','Options']]){
    const dialog=document.createElement('dialog');dialog.id=`${key}-dialog`;dialog.className='game-dialog';dialog.setAttribute('aria-labelledby',`${key}-heading`);
    dialog.innerHTML=`<div class="dialog-heading"><h2 id="${key}-heading">${title}</h2><button type="button" data-close>Close ${title.toLowerCase()}</button></div><p class="dialog-note">Play stays paused when you close this panel. Select Resume to continue.</p><div class="dialog-content"></div>`;
    document.body.append(dialog);dialogs[key]=dialog;
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  }
  const move=(node,key)=>dialogs[key].querySelector('.dialog-content').append(node);
  const equipment=$('inventory').closest('details');equipment.open=true;move(equipment,'equipment');
  move($('upgrade-panel'),'equipment');
  move($('campaign-help'),'guide');
  const mission=document.querySelector('.mission');move(mission.querySelector('.setup'),'options');
  mission.querySelector('.controls').querySelectorAll('div')[1].hidden=true;
  dialogs.options.querySelector('.setup').hidden=!development;
  const route=mission.querySelector('.route-readout');flight.insertBefore(route,flight.querySelector('.viewport'));
  move(mission,'guide');move(document.querySelector('.instruments'),'guide');move($('counter-graphs'),'guide');
  const records=$('save-results').closest('details');records.hidden=!development;move(records,'options');
  const settings=document.createElement('section');settings.className='reset-actions';
  settings.innerHTML='<h3>Restart controls</h3><p>Retry restores this section’s equipment and score checkpoint. New run clears the campaign. Reloading also clears progress.</p>';
  settings.append($('restart'),$('new-run'));move(settings,'options');
  settings.append($('sound'));
  const toolbar=document.querySelector('.flight-bar');
  const brand=document.createElement('strong');brand.className='cockpit-brand';brand.textContent='Arrow Space Shift';toolbar.prepend(brand);
  const marker=document.createElement('img');marker.id='route-marker';marker.width=16;marker.height=16;marker.alt='';marker.hidden=true;toolbar.insertBefore(marker,$('flight-state'));
  for(const [key,title] of [['equipment','Equipment'],['guide','Guide'],['options','Options']]){
    const button=document.createElement('button');button.id=`open-${key}`;button.type='button';button.textContent=title;button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click',()=>{if(phase()==='running')pause(`${title} open. Flight paused.`);button.focus();dialogs[key].showModal();});toolbar.lastElementChild.append(button);
  }
  const telemetry=document.createElement('div');telemetry.className='live-state';telemetry.innerHTML='<span id="space-status"></span><span id="live-debt"></span>';
  flight.insertBefore(telemetry,flight.querySelector('.viewport'));
  const viewport=flight.querySelector('.viewport'),dock=document.createElement('div');dock.className='viewport-dock';
  move($('campaign-panel'),'guide');
  dock.append(toolbar,viewport.querySelector('.hud'),$('encounter-panel'),$('combat-loadout'),telemetry,route);viewport.append(dock);
  move(flight.querySelector('.action-bar'),'guide');
  const event=$('event');viewport.append(event);event.classList.add('viewport-event');
  const tutorial=document.createElement('div');tutorial.id='tutorial-prompt';tutorial.className='tutorial-prompt';tutorial.hidden=true;tutorial.setAttribute('role','status');viewport.append(tutorial);
  const confirmation=document.createElement('dialog');confirmation.className='game-dialog';confirmation.id='reset-dialog';confirmation.setAttribute('aria-labelledby','reset-heading');
  confirmation.innerHTML='<h2 id="reset-heading">Restart this section?</h2><p id="reset-consequence"></p><div class="reset-buttons"><button type="button" id="cancel-reset" autofocus>Keep progress</button><button type="button" id="confirm-reset">Restart section</button></div>';
  document.body.append(confirmation);let resetAction;
  $('cancel-reset').addEventListener('click',()=>confirmation.close());
  $('confirm-reset').addEventListener('click',()=>{confirmation.close();dialogs.options.close();resetAction?.();});
  return {dialogs,confirmReset(action,newRun=false){
    if(phase()==='ready'){dialogs.options.close();action();return;}
    pause('Restart requested. Flight paused.');resetAction=action;
    $('reset-heading').textContent=newRun?'Clear this campaign?':'Restart this section?';
    $('reset-consequence').textContent=newRun?'This removes the current campaign, equipment, and score. It starts a new layout.':'This restores the section checkpoint. Progress made in this section will be removed. Earlier sections remain complete.';
    $('confirm-reset').textContent=newRun?'Clear campaign':'Restart section';confirmation.showModal();
  }};
}
