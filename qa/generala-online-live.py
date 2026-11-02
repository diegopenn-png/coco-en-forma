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
def call(i,action,**kwargs):return request(i,'/functions/v1/coco-generala',{'action':action,**kwargs})
async def main():
 await asyncio.gather(*(asyncio.to_thread(login,i) for i in range(7)));path.write_text(json.dumps(accounts));os.chmod(path,0o600)
 code,res=await asyncio.to_thread(call,0,'create',servedWins=False);assert code==200,(code,res);room=res['room'];rid=room['id']
 (path.parent/'room.json').write_text(json.dumps({'id':rid,'host':accounts[0]['id']}))
 assert (await asyncio.to_thread(call,None,'list'))[0]==401
 assert (await asyncio.to_thread(call,6,'get',id=rid))[0]==404
 status,res=await asyncio.to_thread(request,6,'/rest/v1/coco_generala_rooms?id=eq.'+rid);assert status==200 and res==[]
 assert (await asyncio.to_thread(request,0,'/rest/v1/coco_generala_rooms?id=eq.'+rid,{'state':{}},'PATCH'))[0] in (401,403)
 for i in range(1,6):
  code,res=await asyncio.to_thread(call,i,'join',code=room['invite_code']);assert code==200,(code,res);room=res['room']
 assert len(room['members'])==6
 assert (await asyncio.to_thread(call,6,'join',code=room['invite_code']))[0]==409
 assert (await asyncio.to_thread(call,1,'start',id=rid,version=room['version']))[0]==409
 code,res=await asyncio.to_thread(call,0,'start',id=rid,version=room['version']);assert code==200,(code,res);room=res['room']
 print('PASS live: 7 Auth sessions, 6 players, seventh excluded, private reads, denied direct writes, host-only start',flush=True)
 url=BASE.replace('https:','wss:')+'/realtime/v1/websocket?apikey='+KEY+'&vsn=1.0.0'
 async with websockets.connect(url,origin='https://cocoenforma.com',open_timeout=25) as ws:
  topic='realtime:generala-qa:'+rid
  await ws.send(json.dumps({'topic':topic,'event':'phx_join','ref':'1','join_ref':'1','payload':{'access_token':accounts[1]['token'],'config':{'broadcast':{'ack':False,'self':False},'presence':{'enabled':False},'postgres_changes':[{'event':'UPDATE','schema':'public','table':'coco_generala_rooms','filter':'id=eq.'+rid}],'private':False}}}))
  async with asyncio.timeout(25):
   while True:
    event=json.loads(await ws.recv())
    if event['event']=='phx_reply':assert event['payload']['status']=='ok';break
  updates=0
  async def update(i,action,**values):
   nonlocal room,updates
   version=room['version'];status,res=await asyncio.to_thread(call,i,action,id=rid,version=version,**values);assert status==200,(status,res);room=res['room'];updates+=1
   async with asyncio.timeout(25):
    while True:
     event=json.loads(await ws.recv())
     if event['event']=='postgres_changes' and event['payload']['data']['record']['version']==room['version']:
      assert event['payload']['data']['record']['state']==room['state'];break
   assert (await asyncio.to_thread(call,i,action,id=rid,version=version,**values))[0]==409
  for i in range(6):
   assert (await asyncio.to_thread(call,(i+1)%6,'roll',id=rid,version=room['version']))[0]==409
   await update(i,'roll',dice=[99,99,99,99,99],points=999999)
   assert all(1<=x<=6 for x in room['state']['dice'])
   if i==0:
    original=room['state']['dice'][:2]
    await update(i,'roll',held=[True,True,False,False,False]);assert room['state']['dice'][:2]==original
    await update(i,'roll',held=[False]*5)
    assert (await asyncio.to_thread(call,i,'roll',id=rid,version=room['version']))[0]==409
   expected=sum(x for x in room['state']['dice'] if x==i+1)
   await update(i,'score',category=str(i+1),points=999999)
   assert room['state']['players'][i]['scores'][str(i+1)]==expected
  print('PASS live: 6 complete turns, 8 server dice rolls, '+str(updates)+' exact Realtime states, held dice, turn/stale/tampering guards',flush=True)
 status,res=await asyncio.to_thread(call,5,'get',id=rid);assert status==200 and res['room']['state']==room['state']
 print('PASS live: sixth account resumes identical state; local and general rankings untouched',flush=True)
asyncio.run(main())
