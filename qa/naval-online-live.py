"""Live API/RLS/Realtime check with three disposable QA sessions.
Usage: python qa/naval-online-live.py /path/to/mode-0600-session-fixture.json
Fixture contains [{id,token}, ...]. Never commit the fixture or credentials.
"""
import asyncio, json, sys, urllib.request, urllib.error
from pathlib import Path
import websockets

BASE = 'https://fcatttsfufjiphgohgwp.supabase.co'
KEY = 'sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X'
accounts = json.loads(Path(sys.argv[1]).read_text())
fleet = [{'id':name,'cells':list(range(row*10,row*10+size))} for row,(name,size) in enumerate([('carrier',5),('cruiser',4),('frigate',3),('submarine',3),('patrol',2)])]

def request(i,path,body=None,method=None):
    headers={'apikey':KEY,'Content-Type':'application/json','Origin':'https://cocoenforma.com'}
    if i is not None: headers['Authorization']='Bearer '+accounts[i]['token']
    req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
    try:
        with urllib.request.urlopen(req,timeout=25) as r: return r.status,json.load(r)
    except urllib.error.HTTPError as e: return e.code,json.load(e)

def call(i,action,**values): return request(i,'/functions/v1/coco-naval',{'action':action,**values})

async def main():
    status,data=await asyncio.to_thread(call,0,'create');assert status==200,(status,data)
    room=data['room'];rid=room['id'];Path('/tmp/coco-naval-live-room-id').write_text(rid)
    assert (await asyncio.to_thread(call,None,'list'))[0]==401
    assert (await asyncio.to_thread(call,2,'get',id=rid))[0]==404
    assert (await asyncio.to_thread(request,2,'/rest/v1/coco_naval_rooms?id=eq.'+rid))==(200,[])
    assert (await asyncio.to_thread(request,0,'/rest/v1/coco_naval_rooms?id=eq.'+rid,{'status':'finished'},'PATCH'))[0] in (401,403)
    assert (await asyncio.to_thread(request,0,'/rest/v1/rpc/coco_naval_load',{'p_id':rid}))[0] in (401,403,404)
    status,data=await asyncio.to_thread(call,1,'join',code=room['invite_code']);assert status==200,(status,data);room=data['room']
    assert (await asyncio.to_thread(call,2,'join',code=room['invite_code']))[0]==409
    print('PASS live private rooms: authenticated join, two-player limit, outsider RLS, denied direct writes and private fleet RPC.',flush=True)
    for i in [0,1]:
        status,data=await asyncio.to_thread(call,i,'ready',id=rid,version=room['version'],fleet=fleet);assert status==200,(status,data);room=data['room']
        assert room['game']['opponent'].get('fleet') is None
    assert room['status']=='battle'
    for i in [0,1]:
        status,data=await asyncio.to_thread(call,i,'get',id=rid);assert status==200
        assert data['room']['game']['me']['fleet']==fleet and data['room']['game']['opponent'].get('fleet') is None
    url=BASE.replace('https:','wss:')+'/realtime/v1/websocket?apikey='+KEY+'&vsn=1.0.0'
    async with websockets.connect(url,origin='https://cocoenforma.com',open_timeout=20) as ws:
        topic='realtime:naval-qa:'+rid
        await ws.send(json.dumps({'topic':topic,'event':'phx_join','ref':'1','join_ref':'1','payload':{'access_token':accounts[1]['token'],'config':{'broadcast':{'ack':False,'self':False},'presence':{'enabled':False},'postgres_changes':[{'event':'UPDATE','schema':'public','table':'coco_naval_rooms','filter':'id=eq.'+rid}],'private':False}}}))
        async with asyncio.timeout(20):
            while True:
                event=json.loads(await ws.recv())
                if event['event']=='phx_reply': assert event['payload']['status']=='ok',event;break
        targets=[c for ship in fleet for c in ship['cells']];count=[0,0];events=0
        while room['status']=='battle':
            i=next(i for i in [0,1] if accounts[i]['id']==room['game']['turn'])
            assert (await asyncio.to_thread(call,1-i,'fire',id=rid,version=room['version'],cell=99))[0]==409
            if count[i]: assert (await asyncio.to_thread(call,i,'fire',id=rid,version=room['version'],cell=targets[0]))[0]==409
            before=room['version'];status,data=await asyncio.to_thread(call,i,'fire',id=rid,version=before,cell=targets[count[i]])
            assert status==200,(status,data);room=data['room'];count[i]+=1
            assert (await asyncio.to_thread(call,i,'fire',id=rid,version=before,cell=99))[0]==409
            async with asyncio.timeout(20):
                while True:
                    event=json.loads(await ws.recv())
                    if event['event']=='postgres_changes' and event['payload']['data']['record']['version']==room['version']:
                        record=event['payload']['data']['record'];assert not any(k in record for k in ['state','fleet','game','players']);events+=1;break
            if room['status']=='battle': assert room['game']['opponent'].get('fleet') is None
        assert room['game']['winner'] and max(count)==17 and events==33
        assert room['game']['opponent']['fleet']==fleet
        print('PASS live complete battle: 33 confirmed shots and Realtime updates, alternating turns, repeated/stale shot rejection, sunk ships, victory and final reveal.',flush=True)
    status,data=await asyncio.to_thread(call,1,'get',id=rid);assert status==200 and data['room']['game']['phase']=='finished'
    print('PASS live authenticated resume and final result.',flush=True)

asyncio.run(main())
