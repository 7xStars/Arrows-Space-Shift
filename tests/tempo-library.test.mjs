import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCatalog,libraryCollection,LIBRARY_COLLECTIONS} from '../src/music-library-app.js';

function tempoCatalog(){
  return {revision:'stc-tempo-r2',tracks:[[120,136,144],[152,168],[200,240],[184,220]].flatMap((tempos,index)=>tempos.map((bpm,slot)=>{
    const act=index+1,id=`tempo-act${act}-0${slot+1}`;
    return {id,act,slot:slot+1,title:`Study ${bpm}`,seconds:120,bpm,core:`${id}-core.ogg`,atmosphere:`${id}-atmosphere.ogg`,full:`${id}.ogg`,preview:`${id}-preview.ogg`};
  }))};
}

test('the tempo collection retains all nine required tempos and four Act groups',()=>{
  const data=tempoCatalog(),before=structuredClone(data);
  const tracks=validateCatalog(data,'stc-tempo-r2');
  assert.equal(tracks.length,9);
  assert.deepEqual(tracks.map(track=>track.bpm).sort((a,b)=>a-b),[120,136,144,152,168,184,200,220,240]);
  assert.deepEqual(data,before);
  assert.throws(()=>validateCatalog(data),/incomplete/);
});

test('collection validation rejects missing 144 BPM, changed tempo, foreign paths, and duplicate identities',()=>{
  const data=tempoCatalog();
  assert.throws(()=>validateCatalog({...data,tracks:data.tracks.filter(track=>track.bpm!==144)},'stc-tempo-r2'),/incomplete/);
  for(const mutation of [track=>track.bpm=145,track=>track.core='../other.ogg',track=>track.seconds=121,track=>track.id='act1-01']){
    const changed=structuredClone(data);mutation(changed.tracks[0]);assert.throws(()=>validateCatalog(changed,'stc-tempo-r2'),/valid/);
  }
  const duplicate=structuredClone(data);duplicate.tracks[1]={...duplicate.tracks[0]};
  assert.throws(()=>validateCatalog(duplicate,'stc-tempo-r2'),/valid/);
});

test('the collection selector permits only known local catalog identities',()=>{
  assert.equal(libraryCollection('tempo'),LIBRARY_COLLECTIONS.tempo);
  for(const key of ['original',null,'constructor','__proto__','https://example.test/catalog.json','../private'])
    assert.equal(libraryCollection(key),LIBRARY_COLLECTIONS.original);
});
