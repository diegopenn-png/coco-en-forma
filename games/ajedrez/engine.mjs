// Browser-local opponent. No network requests or paid inference.
const VALUE={p:100,n:320,b:335,r:500,q:900,k:0};
function evaluate(game){let score=0,nonPawn=0;const board=game.board();for(const row of board)for(const p of row)if(p&&p.type!=='p'&&p.type!=='k')nonPawn+=VALUE[p.type];
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=board[r][c];if(!p)continue;const advance=p.color==='w'?6-r:r-1,center=7-(Math.abs(c-3.5)+Math.abs(r-3.5));let bonus=0;
 if(p.type==='p')bonus=advance*9+center*3;
 if(p.type==='n')bonus=center*12;
 if(p.type==='b')bonus=center*7;
 if(p.type==='r')bonus=advance*2;
 if(p.type==='q')bonus=center*3;
 if(p.type==='k')bonus=nonPawn<1600?center*10:-(p.color==='w'?7-r:r)*14+([2,6].includes(c)?24:0);
 score+=(p.color==='w'?1:-1)*(VALUE[p.type]+bonus);
 }return score*(game.turn()==='w'?1:-1)}
function priority(m){return(m.captured?VALUE[m.captured]*10-VALUE[m.piece]:0)+(m.promotion?VALUE[m.promotion]:0)+(m.san.includes('+')?30:0)+(m.san.includes('#')?100000:0)}
export function chooseMove(game,{level=2,timeMs=700,maxDepth}={}){
 const before=game.fen(),deadline=Date.now()+timeMs;let nodes=0,timedOut=false;
 const root=game.moves({verbose:true}).sort((a,b)=>priority(b)-priority(a));if(!root.length)return null;
 let best=root[0],completedDepth=0;
 function search(depth,alpha,beta,ply){if((++nodes&31)===0&&Date.now()>deadline){timedOut=true;return evaluate(game)}if(game.isCheckmate())return-100000+ply;if(game.isDraw())return 0;if(depth===0)return evaluate(game);
  let value=-Infinity;const moves=game.moves({verbose:true}).sort((a,b)=>priority(b)-priority(a));
  for(const m of moves){game.move(m);const next=-search(depth-1,-beta,-alpha,ply+1);game.undo();if(timedOut)return 0;value=Math.max(value,next);alpha=Math.max(alpha,next);if(alpha>=beta)break}return value;
 }
 const limit=maxDepth||({1:1,2:2,3:3}[level]||2);
 for(let depth=1;depth<=limit;depth++){let iterationBest=best,value=-Infinity;const ordered=[best,...root.filter(m=>m!==best)];
  for(const m of ordered){game.move(m);const score=-search(depth-1,-Infinity,-value,1);game.undo();if(timedOut)break;if(score>value){value=score;iterationBest=m}}
  if(!timedOut){best=iterationBest;completedDepth=depth}else break;
 }
 if(game.fen()!==before)throw Error('Engine position changed');
 return{from:best.from,to:best.to,promotion:best.promotion,san:best.san,depth:completedDepth,nodes};
}
