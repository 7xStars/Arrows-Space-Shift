// Presentation identity follows one physical projectile through its joins.
export function projectileIdentity(state,shot){
  if(!shot.objectId){state.projectileSerial=(state.projectileSerial||0)+1;shot.objectId=`shot:${state.runSeed||0}:${state.projectileSerial}`;}
  return shot.objectId;
}
