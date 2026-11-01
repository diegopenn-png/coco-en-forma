"""Exercise the real Auth, private room, six-player limit, writes and WebSocket.
Supply seven disposable accounts in a mode-0600 JSON file. Never commit that file.
"""
import asyncio,json,sys,urllib.request,urllib.error,os
from pathlib import Path
import websockets
BASE='https://fcatttsfufjiphgohgwp.supabase.co';KEY='sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X'
path=Path(sys.argv[1]);accounts=json.loads(path.read_text())
def request(i,route,body=None,method=None):
 h={'apikey':KEY,'Content-Type':'application/json','Origin':'https://cocoenforma.com'}
 if i is not None and accounts[i].get('token'):h['Authorization']='Bearer '+accounts[i]['token']
 req=urllib.request.Request(BASE+route,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def login(i):
 a=accounts[i];status,r=request(None,'/auth/v1/token?grant_type=password',{'email':a['email'],'password':a['password']});assert status==200,('login failed',status,r.get('msg',r.get('error_description')));a['token']=r['access_token'];assert r['user']['id']==a['id']
def call(i,action,**kwargs):return request(i,'/functions/v1/coco-city',{'action':action,**kwargs})
def actor(s):
 if s['phase']=='draw':return s['draw']['queue'][s['draw']['index']]
 if s['phase']=='offer':return s['offer']['to']
 if s['phase']=='auction':return s['auction']['queue'][s['auction']['index']]
 return s['order'][s['turn']]
async def main():
 await asyncio.gather(*(asyncio.to_thread(login,i) for i in range(7)));path.write_text(json.dumps(accounts));os.chmod(path,0o600)
 code,res=await asyncio.to_thread(call,0,'create');assert code==200,(code,res);room=res['room'];rid=room['id']
 assert (await asyncio.to_thread(call,None,'list'))[0]==401
 assert (await asyncio.to_thread(call,6,'get',id=rid))[0]==404
 status,res=await asyncio.to_thread(request,6,'/rest/v1/coco_city_rooms?id=eq.'+rid);assert status==200 and res==[]
 assert (await asyncio.to_thread(request,0,'/rest/v1/coco_city_rooms?id=eq.'+rid,{'state':{}},'PATCH'))[0] in (401,403)
 for i in range(1,6):
  code,res=await asyncio.to_thread(call,i,'join',code=room['invite_code']);assert code==200,(code,res);room=res['room']
 assert len(room['members'])==6
 assert (await asyncio.to_thread(call,6,'join',code=room['invite_code']))[0]==409
 assert (await asyncio.to_thread(call,1,'start',id=rid,version=room['version']))[0]==409
 code,res=await asyncio.to_thread(call,0,'start',id=rid,version=room['version']);assert code==200,(code,res);room=res['room']
 print('PASS live: seven real Auth sessions; six-player room; seventh excluded; private reads; denied direct writes; host-only start',flush=True)
 url=BASE.replace('https:','wss:')+'/realtime/v1/websocket?apikey='+KEY+'&vsn=1.0.0'
 async with websockets.connect(url,origin='https://cocoenforma.com',open_timeout=25) as ws:
  topic='realtime:city-qa:'+rid
  await ws.send(json.dumps({'topic':topic,'event':'phx_join','ref':'1','join_ref':'1','payload':{'access_token':accounts[1]['token'],'config':{'broadcast':{'ack':False,'self':False},'presence':{'enabled':False},'postgres_changes':[{'event':'UPDATE','schema':'public','table':'coco_city_rooms','filter':'id=eq.'+rid}],'private':False}}}))
  async with asyncio.timeout(25):
   while True:
    event=json.loads(await ws.recv())
    if event['event']=='phx_reply':assert event['payload']['status']=='ok';break
  rolls=0;updates=0;turns=0
  while turns<6:
   s=room['state'];i=actor(s);phase=s['phase'];before=room['version'];values={}
   if phase in ['draw','roll']:
    assert (await asyncio.to_thread(call,(i+1)%6,'roll',id=rid,version=before))[0]==409
    action='roll';values={'value':99,'money':999999};rolls+=1
   elif phase=='choice':action='choose';values={'option':0 if s['card']['id'].startswith('cost-') else 2}
   elif phase=='property':action='buy'
   elif phase=='end':action='end';turns+=1
   else:raise AssertionError(phase)
   status,res=await asyncio.to_thread(call,i,action,id=rid,version=before,**values);assert status==200,(status,res);room=res['room'];updates+=1
   if action=='roll':assert 1<=room['state']['lastRoll']['value']<=6
   async with asyncio.timeout(25):
    while True:
     event=json.loads(await ws.recv())
     if event['event']=='postgres_changes' and event['payload']['data']['record']['version']==room['version']:
      assert event['payload']['data']['record']['state']==room['state'];break
   assert (await asyncio.to_thread(call,i,action,id=rid,version=before,**values))[0]==409
  print('PASS live: '+str(rolls)+' dice rolls, six complete turns, '+str(updates)+' matching WebSocket states, denied wrong turns and stale retries',flush=True)
 status,res=await asyncio.to_thread(call,5,'get',id=rid);assert status==200 and res['room']['state']==room['state']
 print('PASS live: sixth account resumes exactly the shared board; room '+rid,flush=True)
asyncio.run(main())
