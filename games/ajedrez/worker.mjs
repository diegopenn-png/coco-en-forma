import {Chess} from './vendor/chess.mjs';
import {chooseMove} from './engine.mjs';
self.onmessage=({data})=>{try{const game=new Chess();if(data.pgn)game.loadPgn(data.pgn);else if(data.fen)game.load(data.fen);const move=chooseMove(game,{level:data.level,timeMs:data.timeMs});self.postMessage({id:data.id,move})}catch{self.postMessage({id:data.id,error:true})}};
