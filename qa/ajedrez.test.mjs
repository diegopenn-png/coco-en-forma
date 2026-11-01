import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Chess} from '../games/ajedrez/vendor/chess.mjs';
import {LESSONS,CHALLENGES,challengeSolved} from '../games/ajedrez/content.mjs';
import {chooseMove} from '../games/ajedrez/engine.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('offline first visit to the chess directory opens its cached game, including query links',async()=>{
 const origin='https://cocoenforma.com';
 const cache=new Map([[origin+'/index.html',new Response('Coco menu')],[origin+'/games/ajedrez/index.html',new Response('Chess game')]]);
 const context=vm.createContext({URL,Request,Response,Promise,self:{registration:{scope:origin+'/'},location:{origin},navigator:{userAgent:''},addEventListener(){}},caches:{match:async input=>cache.get(typeof input==='string'?input:input.url)}});
 vm.runInContext(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
 for(const path of ['/games/ajedrez/','/games/ajedrez','/games/ajedrez/?source=share']){
  context.request=new Request(origin+path);
  assert.equal(await (await vm.runInContext('offlineFallback(request)',context)).clone().text(),'Chess game');
 }
 context.request=new Request(origin+'/another-page');
 assert.equal(await (await vm.runInContext('offlineFallback(request)',context)).clone().text(),'Coco menu');
});
test('standard board starts with all 32 pieces and 20 legal moves',()=>{const c=new Chess();assert.equal(c.board().flat().filter(Boolean).length,32);assert.equal(c.moves().length,20)});
test('all six interactive lessons have legal target moves',()=>{for(const x of LESSONS){const c=new Chess(x.fen);assert.ok(c.move({from:x.from,to:x.to}),x.id)}});
test('all six challenges have a verified solution',()=>{for(const x of CHALLENGES){const c=new Chess(x.fen);assert.equal(c.isGameOver(),false,x.id+' already over');const m=c.move({from:x.solution.slice(0,2),to:x.solution.slice(2,4),promotion:x.solution[4]});assert.ok(challengeSolved(x,c,m),x.id)}});
test('castling moves both pieces and cannot cross check',()=>{const c=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');c.move('O-O');assert.equal(c.get('g1').type,'k');assert.equal(c.get('f1').type,'r');const unsafe=new Chess('r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');assert.ok(!unsafe.moves().includes('O-O'))});
test('en passant removes the captured pawn',()=>{const c=new Chess();for(const m of ['e4','a6','e5','d5','exd6'])c.move(m);assert.equal(c.get('d5'),undefined);assert.equal(c.get('d6').color,'w')});
test('promotion supports all four choices',()=>{for(const p of ['q','r','b','n']){const c=new Chess('7k/4P3/6K1/8/8/8/8/8 w - - 0 1');c.move({from:'e7',to:'e8',promotion:p});assert.equal(c.get('e8').type,p)}});
test('checkmate and stalemate are distinguished',()=>{const c=new Chess();for(const m of ['f3','e5','g4','Qh4#'])c.move(m);assert.ok(c.isCheckmate());const d=new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1');assert.ok(d.isStalemate());assert.ok(!d.isCheckmate())});
test('saving a PGN preserves repetition and supports undo',()=>{const c=new Chess();for(const m of ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'])c.move(m);const copy=new Chess();copy.loadPgn(c.pgn());assert.ok(copy.isThreefoldRepetition());copy.undo();assert.ok(!copy.isThreefoldRepetition());assert.equal(copy.history().length,7)});
test('all AI levels return legal moves without changing the caller position',()=>{for(const level of [1,2,3]){const c=new Chess();c.move('e4');const fen=c.fen(),history=c.pgn();const m=chooseMove(c,{level,timeMs:250});assert.equal(c.fen(),fen);assert.equal(c.pgn(),history);assert.ok(c.move(m))}});
test('AI finds each of the mate-in-one challenges',()=>{for(const item of CHALLENGES.filter(x=>x.goal==='mate')){const c=new Chess(item.fen);const move=chooseMove(c,{level:2,timeMs:600});c.move(move);assert.ok(c.isCheckmate(),item.id)}});
