// Short synthesized cues keep the game available offline without downloading audio.
const notes = {
  tap: [570], card: [310, 220], call: [440, 585], answer: [550, 440],
  deal: [270, 335, 400], trick: [495, 660], tie: [392, 392],
  envido: [523, 659, 784], hand: [392, 523, 659], victory: [523, 659, 784, 1047]
};
let context, output, previous;

export function unlockSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    if (!context) {
      context = new Audio();
      output = context.createGain();
      output.connect(context.destination);
    }
    output.gain.value = 1;
    if (context.state !== 'running') context.resume().catch(() => {});
  } catch { /* The table also works on devices without audio output. */ }
}

export function muteSound() {
  if (output) output.gain.value = 0;
}

export function cue(kind, delay = 0) {
  if (!context || context.state !== 'running' || !output?.gain.value || document.hidden) return;
  const short = ['tap', 'card', 'deal'].includes(kind);
  const step = short ? .036 : .08;
  for (const [i, frequency] of notes[kind].entries()) {
    const start = context.currentTime + delay + i * step;
    const osc = context.createOscillator(), volume = context.createGain();
    osc.type = short ? 'triangle' : 'sine';
    osc.frequency.value = frequency;
    volume.gain.setValueAtTime(.0001, start);
    volume.gain.exponentialRampToValueAtTime(short ? .055 : .09, start + .007);
    volume.gain.exponentialRampToValueAtTime(.0001, start + step + .035);
    osc.connect(volume);
    volume.connect(output);
    osc.onended = () => { osc.disconnect(); volume.disconnect(); };
    osc.start(start);
    osc.stop(start + step + .04);
  }
}

export function resetTableSound() { previous = null; }

export function tableSound(game) {
  const state = {hand: game.handNo, cards: game.played?.length || 0, events: game.events.length, phase: game.phase};
  const old = previous;
  previous = state;
  if (!old) return;
  const cues = [];
  const newHand = old.hand !== state.hand;
  if (newHand) cues.push('deal');
  if (state.cards > (newHand ? 0 : old.cards)) cues.push('card');
  for (const event of game.events.slice(newHand ? 0 : old.events)) {
    if (event.type === 'action') cues.push(['accept','decline','fold'].includes(event.action) ? 'answer' : 'call');
    if (event.type === 'trick') cues.push(event.team === -1 ? 'tie' : 'trick');
    if (event.type === 'envResult') cues.push('envido');
    if (event.type === 'award' && state.phase !== 'finished') cues.push('hand');
  }
  if (state.phase === 'finished' && old.phase !== 'finished') cues.push('victory');
  let delay = 0;
  for (const kind of cues) {
    cue(kind, delay);
    delay += notes[kind].length * (['card','deal'].includes(kind) ? .036 : .08) + .03;
  }
}
