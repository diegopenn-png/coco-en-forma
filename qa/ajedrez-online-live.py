"""Live API/RLS/Realtime verification with three disposable, separately authenticated QA accounts.
Pass a mode-0600 JSON fixture file with [{id,token}, ...]. Never commit credentials.
"""
import asyncio,json,sys,urllib.request,urllib.error
from pathlib import Path
import websockets
BASE='https://fcatttsfufjiphgohgwp.supabase.co'
KEY='sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X'
accounts=json.loads(Path(sys.argv[1]).read_text())
def request(i,path,body=None,method=None):
 headers={'apikey':KEY,'Content-Type':'application/json','Origin':'https://cocoenforma.com'}
 if i is not None:headers['Authorization']='Bearer '+accounts[i]['token']
 req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=25) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def call(i,action,**values):return request(i,'/functions/v1/coco-chess',{'action':action,**values})
async def main():
 status,data=await asyncio.to_thread(call,0,'create');assert status==200,(status,data);room=data['room'];rid=room['id']
 assert (await asyncio.to_thread(call,None,'list'))[0]==401
 assert (await asyncio.to_thread(call,2,'get',id=rid))[0]==404
 status,data=await asyncio.to_thread(request,2,'/rest/v1/coco_chess_games?id=eq.'+rid);assert status==200 and data==[],(status,data)
 assert (await asyncio.to_thread(request,0,'/rest/v1/coco_chess_games?id=eq.'+rid,{'status':'finished'},'PATCH'))[0] in (401,403)
 status,data=await asyncio.to_thread(call,1,'join',code=room['invite_code']);assert status==200,(status,data);room=data['room']
 assert (await asyncio.to_thread(call,2,'join',code=room['invite_code']))[0]==409
 print('PASS live: registered accounts, private room, two-player limit, outsider RLS and direct-write denial',flush=True)
 url=BASE.replace('https:','wss:')+'/realtime/v1/websocket?apikey='+KEY+'&vsn=1.0.0'
 async with websockets.connect(url,origin='https://cocoenforma.com',open_timeout=20) as ws:
  topic='realtime:chess-qa:'+rid
  await ws.send(json.dumps({'topic':topic,'event':'phx_join','ref':'1','join_ref':'1','payload':{'access_token':accounts[1]['token'],'config':{'broadcast':{'ack':False,'self':False},'presence':{'enabled':False},'postgres_changes':[{'event':'UPDATE','schema':'public','table':'coco_chess_games','filter':'id=eq.'+rid}],'private':False}}}))
  async with asyncio.timeout(20):
   while True:
    event=json.loads(await ws.recv())
    if event['event']=='phx_reply':assert event['payload']['status']=='ok',event;break
  assert (await asyncio.to_thread(call,1,'move',id=rid,version=room['version'],**{'from':'e7','to':'e5'}))[0]==409
  assert (await asyncio.to_thread(call,0,'move',id=rid,version=room['version'],**{'from':'e2','to':'e5'}))[0]==400
  for i,origin,target in [(0,'f2','f3'),(1,'e7','e5'),(0,'g2','g4'),(1,'d8','h4')]:
   before=room['version'];status,data=await asyncio.to_thread(call,i,'move',id=rid,version=before,**{'from':origin,'to':target});assert status==200,(status,data);room=data['room']
   async with asyncio.timeout(20):
    while True:
     event=json.loads(await ws.recv())
     if event['event']=='postgres_changes' and event['payload']['data']['record']['version']==room['version']:
      assert event['payload']['data']['record']['pgn']==room['pgn'];break
   assert (await asyncio.to_thread(call,i,'move',id=rid,version=before,**{'from':origin,'to':target}))[0]==409
  assert room['status']=='finished' and room['result']=='0-1'
  print('PASS live: turn ownership, legal moves, four WebSocket updates, stale retries and checkmate',flush=True)
 status,data=await asyncio.to_thread(call,1,'get',id=rid);assert status==200 and data['room']['pgn']==room['pgn'];print('PASS live: authenticated resume returns the final shared board',flush=True)
asyncio.run(main())
