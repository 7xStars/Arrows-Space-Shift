import {mountAudioStatus} from './audio-interface.js';
import {isActAvailable} from './build.js';
const laterActGuide="<h3>Act IV \u00b7 The Double Torus</h3><p>The extracted Curvature Seed unlocks a separate playable hyperbolic field campaign. Eight lessons and a ninth encounter use the Bolza genus-two quotient: actual Poincar\u00e9 metric and paired sides A\u2013D / A\u2032\u2013D\u2032. Turn, thrust, manually shoot, capture (C), release (E) and choose a temporary two-sided speed fold (Shift). Real collidable shots are filled; hollow predicted images have no separate hitbox. The field campaign has its own checkpoint. Ship differences, manual fire, fold, capture, and release stay active. Equipment is stored, but its seven operation effects are inactive in Act IV. <a href=\"hyperbolic-act.html\">Open Act IV</a>.</p>";

/** Keep the sound action available outside the title panel. */
export function mountSoundToggle({container,onToggle}){
  const button=document.createElement('button'),description=document.createElement('span');
  button.id='sound-toggle';button.className='sound-toggle';button.type='button';
  button.setAttribute('aria-label','Enable sound');button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-describedby','sound-toggle-status');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="speaker-body" d="M3 9h4l5-4v14l-5-4H3Z"/><g class="sound-waves"><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></g><path class="sound-slash" d="m16 9 5 6m0-6-5 6"/></svg>';
  description.id='sound-toggle-status';description.className='sound-toggle-description';
  description.textContent='Select to start sound.';
  let requested=null;
  const retainAction=()=>{requested=button.getAttribute('aria-pressed')!=='true';};
  button.addEventListener('pointerdown',retainAction);
  button.addEventListener('keydown',event=>{if(!event.repeat&&['Enter',' '].includes(event.key))retainAction();});
  button.addEventListener('pointercancel',()=>{requested=null;});
  button.addEventListener('blur',()=>{requested=null;});
  button.addEventListener('click',()=>{const enable=requested??button.getAttribute('aria-pressed')!=='true';requested=null;onToggle(enable);});
  container.append(button,description);
  return {button,update({enabled,state,description:message}){
    button.setAttribute('aria-pressed',String(enabled));
    const action=enabled?'Mute sound':'Enable sound';
    button.setAttribute('aria-label',action);button.title=`${action}. ${message}`;
    button.dataset.audioState=state;
    if(description.textContent!==message)description.textContent=message;
  }};
}

export function isCampaignEntryMenu(state){
  return state?.mode==='campaign'&&(state.phase==='ready'||state.phase==='paused'&&state.restoredCheckpoint===true);
}

/** One instruction at a time. Mission transitions take priority over flight lessons. */
export function campaignNotice(s){
  const c=s.campaign;
  if(s.mode!=='campaign'||!c||s.phase!=='running')return null;
  if(c.announcement&&(c.introRemaining>0||s.time<c.announcement.until))return {kind:'arrival',text:c.announcement.text};
  if(Number.isFinite(s.drive?.warningUntil)&&s.drive.warningUntil>s.time)return {
    kind:'fault',text:`Damaged Warp Drive: space will fold in ${(s.drive.warningUntil-s.time).toFixed(1)} s. Right Shift removes the latest fold.`};
  if(c.bossPhase==='salvage'){
    const projective=c.repairPart?.id==='projective-module';
    return {kind:'objective',text:projective?'Hybrid intrusion defeated. Pick up the Projective Module.':'Fleet defeated. Recover the Klein Relay: this part makes the surface traversable. Then extract.'};
  }
  if(c.bossPhase==='exit'){
    const projective=c.repairPart?.id==='projective-module';
    return {kind:'objective',text:projective?'Projective Module secured. Cross the extraction line to bank it.':'Klein Relay aboard. Reach extraction to bank it and unlock Klein surface traversal.'};
  }
  if(c.index===-1){
    const movement=c.movement||{};
    const instruction={
      move:`Use Arrows to move (← →) · ${[['left','←'],['right','→']].map(([key,label])=>`${label} ${movement[key]>=24?'✓':'○'}`).join('  ')}`,
      shoot:'Hold Space · L.Shift folds distance',
      fold:'Hold Space · L.Shift folds distance',
      unfold:'Hold Space · R.Shift unfolds distance',
      engage:'Hold Space · Destroy the training enemy',
      complete:'Training complete · Level 1 begins next.'
    };return {kind:'lesson',text:instruction[c.lesson]||instruction.move};
  }
  if(c.index===0&&s.z<1050)return {kind:'lesson',text:c.hint||'The Warp Drive is damaged. Watch for a fold surge. Right Shift unfolds space.'};
  if(c.lessonNotices?.length&&Number.isFinite(c.routeLength)&&c.routeLength>0){
    const progress=Math.max(0,Math.min(1,(s.cameraZ||0)/c.routeLength));
    let notice=c.lessonNotices[0];
    for(const candidate of c.lessonNotices)if(progress>=candidate.at)notice=candidate;
    if(notice)return {kind:'lesson',text:notice.text};
  }
  return null;
}

export function mountInterface({pause,phase,development=false,patternDefinitions={},audio=null}){
  const $=id=>document.getElementById(id),flight=document.querySelector('.flight');
  const dialogs={};
  for(const [key,title] of [['equipment','Equipment'],['practice','Practice'],['guide','Flight guide'],['options','Options']]){
    const dialog=document.createElement('dialog');dialog.id=`${key}-dialog`;dialog.className='game-dialog';dialog.setAttribute('aria-labelledby',`${key}-heading`);
    dialog.innerHTML=`<div class="dialog-heading"><h2 id="${key}-heading">${title}</h2><button type="button" data-close>Close ${title.toLowerCase()}</button></div><p class="dialog-note">Play stays paused when you close this panel. Select Resume to continue.</p><div class="dialog-content"></div>`;
    document.body.append(dialog);dialogs[key]=dialog;
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  }
  const move=(node,key)=>dialogs[key].querySelector('.dialog-content').append(node);
  const equipment=$('inventory').closest('details');equipment.open=true;move(equipment,'equipment');
  move($('upgrade-panel'),'equipment');
  const hangar=document.createElement('section');hangar.id='fleet-hangar';hangar.className='fleet-hangar';hangar.hidden=true;hangar.setAttribute('aria-labelledby','fleet-heading');
  hangar.innerHTML='<p class="eyebrow">Recovered fleet</p><h3 id="fleet-heading">Choose your next ship</h3><p id="fleet-status"></p><div id="fleet-ships" class="fleet-ships"></div><p class="small" id="fleet-note">Ship selection applies to a new flight. The current ship keeps its handling.</p><p class="small fleet-save-note" id="fleet-save-note" role="status"></p><section id="fleet-foundry" class="fleet-foundry"><h4>Fleet Foundry</h4><p id="fabrication-summary" class="small"></p><button type="button" id="craft-aftwing">Construct Aftwing · 5 salvage</button><p id="fabrication-message" class="small" role="status"></p></section>';
  const equipmentContent=dialogs.equipment.querySelector('.dialog-content');equipmentContent.prepend(hangar);
  const practice=document.createElement('section');practice.id='practice-panel';practice.className='practice-panel';
  practice.innerHTML='<p class="eyebrow">Reached lessons</p><h3>Practice Act II</h3><p>Repeat a reached Klein lesson with the selected ship. Practice grants no campaign progress, parts, or records.</p><div id="practice-stages" class="practice-grid"></div><p id="practice-status" class="small" role="status"></p>';
  dialogs.practice.querySelector('.dialog-content').append(practice);
  const laterGuide=$('postjam-guide');
  if(laterGuide){if(isActAvailable(4))laterGuide.innerHTML=laterActGuide;else laterGuide.remove();}
  move($('campaign-help'),'guide');
  const glossary=document.createElement('section');glossary.className='pattern-glossary';glossary.innerHTML='<p class="eyebrow">Canonical grammar</p><h3>Bullet-pattern glossary</h3><p>The vocabulary stays stable while the geometry changes.</p>';
  const glossaryList=document.createElement('dl');glossaryList.className='glossary-grid';
  for(const [key,value] of Object.entries(patternDefinitions)){
    const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');
    term.textContent=value.name||key.toUpperCase();description.textContent=value.purpose||'';row.append(term,description);glossaryList.append(row);
  }
  glossary.append(glossaryList);dialogs.guide.querySelector('.dialog-content').append(glossary);
  const manifoldGuide=document.createElement('section');manifoldGuide.className='pattern-glossary';
  manifoldGuide.innerHTML=`<p class="eyebrow">Manifold visual language</p><h3>Real threats and chart previews</h3>
  <p><strong>● Solid shot and continuous trail</strong> = real projectile; normal collisions apply.</p>
  <p><strong>◯ Hollow circle and dashed lead-in</strong> = a future-position image, not an extra shot or extra hitbox. It does NOT guarantee the identified physical shot is harmless.</p>
  <p><strong>Pulsing paired-edge mark</strong> = projected crossing within a fraction of a second; its arrival can still change with folds or later motion.</p>
  <p><strong>K</strong> / single slanted notch = Klein twist; <strong>P</strong> / opposite ticks = projective join; <strong>K+P</strong> = mixed prototype. ${isActAvailable(4)?'<strong>A–D</strong> and matching primes in the hyperbolic lab are paired octagon edges.':''}</p>
  <p>The Klein bottle and mathematical Dyck surface are connected, nonorientable surfaces. The current K+P boss is a Dyck-inspired gameplay chart, not yet a mathematically verified K#RP² model. There is no global "other side" whose projectiles are automatically harmless. The displays distinguish live objects from additional render-only images, not alternate collision rules.</p>`;
  dialogs.guide.querySelector('.dialog-content').append(manifoldGuide);
  const hyperbolicResearch=document.createElement('section');hyperbolicResearch.className='pattern-glossary';
  const researchTitle=document.createElement('h3');researchTitle.textContent='Hyperbolic research room';
  const researchInfo=document.createElement('p');researchInfo.textContent='Experimental Poincaré-disk Bolza octagon with paired sides. This is a separate research room, not Act IV campaign progression.';
  const researchLink=document.createElement('a');researchLink.href='hyperbolic-lab.html';researchLink.textContent='Open the hyperbolic test room';researchLink.target='_blank';researchLink.rel='noopener';
  const actFourLink=document.createElement('a');actFourLink.href='hyperbolic-act.html';actFourLink.textContent='Open Act IV · eight lessons and final encounter';actFourLink.target='_blank';actFourLink.rel='noopener';
  hyperbolicResearch.append(researchTitle,researchInfo,researchLink,document.createElement('br'),actFourLink);
  if(development&&isActAvailable(4))dialogs.guide.querySelector('.dialog-content').append(hyperbolicResearch);

  const study=document.createElement('section');study.className='reset-actions';
  study.innerHTML='<h3>Optional blind playtest</h3><p>Play the normal campaign for five minutes without coaching, then describe what SHIFT let you do. This form saves a report locally; nothing is transmitted.</p><a href="playtest.html" target="_blank" rel="noopener">Open five-minute playtest form</a>';
  if(development)dialogs.guide.querySelector('.dialog-content').append(study);
  const mission=document.querySelector('.mission');move(mission.querySelector('.setup'),'options');
  const axialControl=mission.querySelector('.controls').querySelectorAll('div')[1];axialControl.id='axial-control-row';axialControl.hidden=true;
  dialogs.options.querySelector('.setup').hidden=!development;
  const route=mission.querySelector('.route-readout');flight.insertBefore(route,flight.querySelector('.viewport'));
  move(mission,'guide');move(document.querySelector('.instruments'),'guide');move($('counter-graphs'),'guide');
  const records=$('save-results').closest('details');records.hidden=!development;move(records,'options');
  const settings=document.createElement('section');settings.className='reset-actions';
  settings.innerHTML='<h3>Section checkpoints</h3><p id="checkpoint-status">Progress is saved at section boundaries in this browser. Reloading returns to the start of your current section with its equipment and score.</p>';
  settings.append($('restart'),$('new-run'));move(settings,'options');
  const progression=document.createElement('section');progression.className='progression-records';
  progression.innerHTML='<h3>Campaign records</h3><div id="stage-records" class="record-list"><p class="small">Complete an Act II stage to create a record.</p></div><h4>Recent attempts</h4><ol id="run-history" class="run-history"></ol><div class="progress-transfer"><button type="button" id="export-progress">Export progress</button><button type="button" id="import-progress-button">Import progress</button><input id="import-progress" type="file" accept="application/json,.json" hidden></div><p id="progress-transfer-status" class="small" role="status">Progress stays in this browser unless exported.</p>';
  move(progression,'options');
  const preferences=document.createElement('section');preferences.className='preferences';
  preferences.innerHTML='<h3>Sound & feel</h3><div class="sound-setting"></div><label class="volume-setting" for="volume">Sound volume <output id="volume-value">50%</output><input id="volume" type="range" min="0" max="100" step="5" value="50"></label><label class="check"><input id="music" type="checkbox">Original adaptive score (changes by Act)</label><label class="check"><input id="juice" type="checkbox" checked>Combat particles & engine trails</label><label class="check"><input id="reduced-motion" type="checkbox">Reduced motion</label><label class="check"><input id="collision-core" type="checkbox" checked>Always show the true collision core</label><label class="check"><input id="pattern-labels" type="checkbox" checked>Show pattern names during warnings</label><label class="check"><input id="manifold-cues" type="checkbox" checked>Show manifold projectile images & crossing cues</label><p class="small">Reduced motion removes decorative movement. Aiming warnings, hits, returns, and damage deadlines stay visible.</p><p class="small">Hold Space to fire. Release it to stop. Sound and feel settings are saved in this browser.</p><p class="small" id="best-score">Best score: 0</p>';
  preferences.querySelector('.sound-setting').append($('sound'));dialogs.options.querySelector('.dialog-content').prepend(preferences);
  preferences.querySelector('label.check').lastChild.textContent='Recorded techno music';
  const audioStatus=audio?mountAudioStatus(audio,preferences):null;
  for(const [id,label] of [['music-volume','Music level'],['effects-volume','Effects level'],['ambience-volume','Ambience level']]){
    const row=document.createElement('label');row.className='volume-setting';row.htmlFor=id;
    row.innerHTML=`${label} <output id="${id}-value"></output><input id="${id}" type="range" min="0" max="100" step="5">`;
    preferences.insertBefore(row,preferences.querySelector('label.check'));
  }
  const repairDockLink=document.createElement('p');repairDockLink.innerHTML='<a href="repair-dock.html">Repair dock and campaign completion</a>';
  if(isActAvailable(4))progression.append(repairDockLink);
  const toolbar=document.querySelector('.flight-bar');
  const brand=document.createElement('strong');brand.className='cockpit-brand';brand.textContent='Arrow Space Shift';toolbar.prepend(brand);
  const marker=document.createElement('img');marker.id='route-marker';marker.width=16;marker.height=16;marker.alt='';marker.hidden=true;toolbar.insertBefore(marker,$('flight-state'));
  for(const [key,title] of [['equipment','Equipment'],['practice','Practice'],['guide','Guide'],['options','Options']]){
    const button=document.createElement('button');button.id=`open-${key}`;button.type='button';button.textContent=title;button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click',()=>{if(phase()==='running')pause(`${title} open. Flight paused.`);button.focus();dialogs[key].showModal();});toolbar.lastElementChild.append(button);
  }
  const telemetry=document.createElement('div');telemetry.className='live-state';telemetry.innerHTML='<span id="space-status"></span><span id="live-debt"></span>';
  flight.insertBefore(telemetry,flight.querySelector('.viewport'));
  const viewport=flight.querySelector('.viewport'),dock=document.createElement('div');dock.className='viewport-dock';
  const grazeCell=document.createElement('div');grazeCell.innerHTML='<span>Graze</span><strong id="graze-count">0</strong>';viewport.querySelector('.hud').append(grazeCell);
  const scorecard=document.createElement('section');scorecard.id='stage-scorecard';scorecard.className='stage-scorecard';scorecard.hidden=true;
  scorecard.innerHTML='<p class="eyebrow">Stage grade</p><div class="grade-row"><strong id="grade-letter">—</strong><span id="grade-score">0 / 100</span></div><dl><div><dt>Survival</dt><dd id="grade-survival">0</dd></div><div><dt>Execution</dt><dd id="grade-execution">0</dd></div><div><dt>Precision</dt><dd id="grade-precision">0</dd></div><div><dt>Topology</dt><dd id="grade-topology">0</dd></div><div><dt>Control</dt><dd id="grade-control">0</dd></div></dl>';
  flight.querySelector('.brief').insertBefore(scorecard,document.getElementById('primary'));
  const completion=document.createElement('p');completion.id='campaign-completion';completion.className='small';completion.hidden=true;
  completion.innerHTML='Campaign complete. <a href="repair-dock.html">View the repaired drive or replay the repair.</a>';
  flight.querySelector('.brief').insertBefore(completion,document.getElementById('primary'));
  move($('campaign-panel'),'guide');
  dock.append(toolbar,viewport.querySelector('.hud'),$('encounter-panel'),$('combat-loadout'),telemetry,$('echo-panel'),route);viewport.append(dock);
  const controls=flight.querySelector('.action-bar');controls.classList.add('flight-controls');
  const steering=document.createElement('span');steering.className='steering-hint';steering.innerHTML='<span><kbd>←</kbd> <kbd>→</kbd> Steer</span><span><kbd>Space</kbd> Hold to fire</span>';
  controls.prepend(steering);viewport.append(controls);
  const event=$('event');viewport.append(event);event.classList.add('viewport-event');
  const geometryWarning=document.createElement('div');geometryWarning.id='geometry-warning';geometryWarning.className='geometry-warning';geometryWarning.hidden=true;
  geometryWarning.setAttribute('role','status');geometryWarning.setAttribute('aria-live','polite');viewport.append(geometryWarning);
  const tutorial=document.createElement('div');tutorial.id='tutorial-prompt';tutorial.className='tutorial-prompt';tutorial.hidden=true;tutorial.setAttribute('role','status');viewport.append(tutorial);
  const drive=document.createElement('div');drive.id='drive-status';drive.className='drive-status';drive.hidden=true;
  drive.innerHTML='<span id="drive-condition"></span><span id="current-ship"></span>';dock.insertBefore(drive,route);
  const left=document.createElement('aside');left.className='realm-aside realm-aside-left';left.setAttribute('aria-hidden','true');
  left.innerHTML='<p class="eyebrow">Flight log</p><h2 id="side-heading"></h2><p id="side-goal"></p><div class="side-rule"></div><p class="eyebrow">Read the warning</p><p>Enemy aim locks during the charge. Move after the line appears.</p><p class="side-foot" id="side-continuation">Reach the route exit. Fighting clears your path and earns score.</p>';
  const right=document.createElement('aside');right.className='realm-aside realm-aside-right';right.setAttribute('aria-hidden','true');
  right.innerHTML='<p class="eyebrow">Equipped operations</p><div id="side-loadout"></div><div class="side-rule"></div><p><span class="fold-ink">Fold</span> reaches the exit faster. Both sides’ shots accelerate.</p><p><span class="unfold-ink">Unfold</span> buys more reaction time.</p><p class="side-foot">Each change reverses the accepted side.</p>';
  viewport.append(left,right);
  const confirmation=document.createElement('dialog');confirmation.className='game-dialog';confirmation.id='reset-dialog';confirmation.setAttribute('aria-labelledby','reset-heading');
  confirmation.innerHTML='<h2 id="reset-heading">Restart this section?</h2><p id="reset-consequence"></p><div class="reset-buttons"><button type="button" id="cancel-reset" autofocus>Keep progress</button><button type="button" id="confirm-reset">Restart section</button></div>';
  document.body.append(confirmation);let resetAction;
  $('cancel-reset').addEventListener('click',()=>confirmation.close());
  $('confirm-reset').addEventListener('click',()=>{confirmation.close();dialogs.options.close();resetAction?.();});
  return {dialogs,audioStatus,placeHangar(preflight=false){
    const primary=$('primary'),destination=preflight?primary.closest('.brief'):equipmentContent;
    $('overlay').classList.toggle('choosing-ship',Boolean(preflight));
    // Move the existing section only when its location changes. Its controls,
    // selection, and listeners survive the move between preflight and Equipment.
    if(hangar.parentElement!==destination){
      if(preflight)destination.insertBefore(hangar,primary);else destination.prepend(hangar);
      hangar.scrollTop=0;
    }
  },confirmReset(action,newRun=false){
    if(phase()==='ready'){dialogs.options.close();action();return;}
    pause('Restart requested. Flight paused.');resetAction=action;
    $('reset-heading').textContent=newRun?'Clear this campaign?':'Restart this section?';
    $('reset-consequence').textContent=newRun?'This replaces the saved campaign, equipment, and score with a new layout. Recovered drive parts, unlocked ships, your best score, and settings are kept.':'This restores the section checkpoint. Progress made in this section will be removed. Earlier sections remain complete, and the route layout stays the same.';
    $('confirm-reset').textContent=newRun?'Clear campaign':'Restart section';confirmation.showModal();
  }};
}
