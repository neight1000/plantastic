// Plantasia Instrumentation - JavaScript Logic

function $(id) { return document.getElementById(id); }
let currentWaveColor = "#00FF7F";
const drawer = $("drawer"), openDrawerBtn = $("openDrawer"), closeDrawerBtn = $("closeDrawer");
openDrawerBtn.addEventListener('click', () => { drawer.classList.remove('closed'); drawer.classList.add('open'); openDrawerBtn.style.display = 'none'; });
closeDrawerBtn.addEventListener('click', () => { drawer.classList.remove('open'); drawer.classList.add('closed'); openDrawerBtn.style.display = ''; });

// --- Growth visuals ---
let growthMode = false, growthBtn = $("growthModeToggle"), vine = null, vineAnimId = null;
function getVinePresetProps() {
  // You can expand this for detailed mold/bacteria visuals as in previous code blocks
  return { color: "#00FF7F", glow: "#caffc4", leaf: "#d7ffd7", spiral: false, zigzag: false, vineWidth: 3.3, leafSize: 9, growthRate: 0.11, leafInterval: 17, edgeBehavior: "wrap", bloom: false };
}
function resetVine() {
  const props = getVinePresetProps();
  vine = { props, points: [], tipAngle: -Math.PI/2, tipX: window.innerWidth/2, tipY: window.innerHeight-30, pulse: 0 };
  vine.points.push({x: vine.tipX, y: vine.tipY, angle: vine.tipAngle, age: 0});
}
function growVineFrame() {
  let canvas = $("waveCanvas"), ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let props = vine.props;
  if (!vine.growSlow) vine.growSlow = 0;
  vine.growSlow += props.growthRate;
  if (vine.growSlow >= 1) {
    vine.growSlow -= 1;
    let angleDelta = 0;
    if (props.spiral) angleDelta += 0.07;
    if (props.zigzag) angleDelta += ((Math.floor(vine.points.length/props.leafInterval)%2)===0 ? 0.22 : -0.22);
    angleDelta += (Math.random()-0.5)*0.16;
    vine.tipAngle += angleDelta;
    let len = 7 + Math.random()*2;
    let nx = vine.tipX + Math.cos(vine.tipAngle)*len;
    let ny = vine.tipY + Math.sin(vine.tipAngle)*len;
    if (props.edgeBehavior === "wrap") {
      if (nx < 0) nx = canvas.width+nx; if (nx > canvas.width) nx -= canvas.width;
      if (ny < 0) ny = canvas.height+ny; if (ny > canvas.height) ny -= canvas.height;
    }
    vine.tipX = nx; vine.tipY = ny;
    vine.points.push({x: nx, y: ny, angle: vine.tipAngle, age: 0});
    if (vine.points.length > 1200) vine.points.shift();
  }
  vine.pulse *= 0.96;
  ctx.save(); ctx.shadowBlur = 24 + vine.pulse*8; ctx.shadowColor = props.glow;
  ctx.strokeStyle = props.color; ctx.lineWidth = props.vineWidth + vine.pulse*2;
  ctx.beginPath();
  for (let i=0; i<vine.points.length; ++i) {
    let p = vine.points[i];
    if (i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
  if (growthMode) vineAnimId = requestAnimationFrame(growVineFrame);
}
function vinePulse() { if (vine) vine.pulse = 1.25; }
function setGrowthMode(on) {
  growthMode = !!on;
  if (growthMode) {
    growthBtn.classList.add("active"); cancelAnimationFrame(vineAnimId); vineAnimId = null;
    resetVine(); growVineFrame();
  } else {
    growthBtn.classList.remove("active"); cancelAnimationFrame(vineAnimId); vineAnimId = null; vine = null; animate();
  }
}
growthBtn.addEventListener("click", function() { setGrowthMode(!growthMode); });
window.addEventListener('resize', function() {
  let c = $("waveCanvas");
  c.width = window.innerWidth; c.height = window.innerHeight;
  if (growthMode) { resetVine(); growVineFrame(); } else animate();
});

// --- Plantasia-style synth ---
let audioCtx, analyser, masterGain, bufferLength, dataArray, bpmTimer = null, stopped = true;
let canvas = $("waveCanvas"); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
let trailFrames = [];

function getScaleFromPreset() {
  const scales = {
    plants: [174,220,285,396,528,660], mold: [432,639,741,852], bacteria: [528,554,585,728,311], mushrooms: [417,444,528,639,392], harmony: [261,329,392,466,528,639], plantasiaClassic: [174,220,261.63,329.63,392,523.25], greenhouse: [432,512,538,576,648], cosmicdew: [528,1056,792,1584,2112], daybeam: [440,660,880,990,1320], spiralback: [321.9,521.3,843.2,987,1598.3], rockflora: [440,660,880,1350,1760], mycomurk: [198,259,396,420,792], microburst: [333,666,999,555,777], fibonaccishift: [233,377,610,987,1597]
  }; return scales[$("preset").value] || [220,330,440];
}
function plantasiaSynth({freq, velocity=1, duration=1}) {
  if (!audioCtx) initAudio();
  let now = audioCtx.currentTime;
  let mainType = $("waveformSelect").value;
  let filterFreq = parseFloat($("filter").value);

  // Oscillators
  let o1 = audioCtx.createOscillator();
  let o2 = audioCtx.createOscillator();
  o1.type = mainType;
  o2.type = mainType;
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.005;

  // Stereo width
  let pan1 = audioCtx.createStereoPanner();
  let pan2 = audioCtx.createStereoPanner();
  pan1.pan.value = -0.22;
  pan2.pan.value = 0.22;

  // Envelope
  let g = audioCtx.createGain();
  let attack = 0.17, hold = 0.12, release = 0.93;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.33*velocity, now + attack);
  g.gain.linearRampToValueAtTime(0.28*velocity, now + attack + hold);
  g.gain.linearRampToValueAtTime(0, now + attack + hold + release);

  // Filter
  let filt = audioCtx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(filterFreq, now);

  // LFO
  let lfoRate = parseFloat($("lfoRate").value);
  let lfoAmt = parseFloat($("lfoAmt").value);
  let lfoDest = $("lfoDest").value;
  let lfo, lfoGain;
  if (lfoAmt > 0) {
    lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = lfoRate;
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = lfoAmt;
    if (lfoDest === "filter") lfo.connect(lfoGain).connect(filt.frequency);
    if (lfoDest === "pitch") lfo.connect(lfoGain).connect(o1.frequency);
    if (lfoDest === "pan") lfo.connect(lfoGain).connect(pan1.pan);
    lfo.start(now); lfo.stop(now + attack + hold + release + 0.1);
  }

  // Routing
  o1.connect(pan1).connect(g);
  o2.connect(pan2).connect(g);
  g.connect(filt).connect(masterGain);

  o1.start(now); o2.start(now);
  o1.stop(now + attack + hold + release + 0.08);
  o2.stop(now + attack + hold + release + 0.08);
}

function scheduleNotes(scale) {
  clearInterval(bpmTimer);
  bpmTimer = setInterval(() => {
    if (!stopped) {
      let freq = scale[Math.floor(Math.random()*scale.length)];
      plantasiaSynth({freq});
      if (growthMode) vinePulse();
    }
  }, 60000 / parseInt($("bpm").value));
}

// MIDI support
let midiChannel = -1;
let midiAccess = null, midiInEnabled = true;
const midiChannelSelect = $("midiChannelSelect");
midiChannelSelect.value = midiChannel;
midiChannelSelect.addEventListener('change', function() { midiChannel = Number(this.value); });
$("toggleMidiIn").addEventListener('click', () => {
  midiInEnabled = !midiInEnabled;
  $("toggleMidiIn").textContent = "midi" + (midiInEnabled ? "" : " off");
});
function setupMidi() {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess().then(midi => {
    midiAccess = midi;
    function registerInputs() {
      midiAccess.inputs.forEach(input => { input.onmidimessage = handleMidiMessage; });
    }
    registerInputs();
    midiAccess.onstatechange = function(event) {
      if (event.port.type === "input" && event.port.state === "connected") registerInputs();
    };
  });
}
function midiNoteToFreq(note) { return 440 * Math.pow(2, (note - 69) / 12);}
function handleMidiMessage(e) {
  const [status, note, velocity] = e.data;
  const type = status & 0xf0;
  const channel = status & 0x0f;
  if (!midiInEnabled) return;
  if (type === 0x90 && velocity > 0 && (midiChannel === -1 || channel === midiChannel)) {
    let freq = midiNoteToFreq(note);
    plantasiaSynth({freq, velocity: velocity / 127});
    if (growthMode) vinePulse();
  }
}
setupMidi();

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'});
  analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048;
  bufferLength = analyser.frequencyBinCount; dataArray = new Uint8Array(bufferLength);
  masterGain = audioCtx.createGain(); masterGain.gain.value = parseFloat($("volume").value) / 100;
  masterGain.connect(audioCtx.destination); masterGain.connect(analyser);
  animate();
}
$("play").addEventListener('click', () => {
  initAudio(); stopped = false; const scale = getScaleFromPreset();
  scheduleNotes(scale);
  if (growthMode) { resetVine(); growVineFrame(); } else animate();
});
$("stop").addEventListener('click', () => { stopped = true; clearInterval(bpmTimer); });
$("preset").addEventListener('change', () => {
  currentWaveColor = getVinePresetProps().color;
  if (!stopped) scheduleNotes(getScaleFromPreset());
  if (growthMode) { resetVine(); growVineFrame(); } else animate();
});
$("bpm").addEventListener('input', e => {
  if (!stopped) scheduleNotes(getScaleFromPreset());
});
$("volume").addEventListener('input', e => {
  if (masterGain) masterGain.gain.value = parseFloat(e.target.value) / 100;
});
$("waveformSelect").addEventListener('change', () => {
  if (growthMode) { resetVine(); growVineFrame(); } else animate();
});
$("filter").addEventListener('input', () => {
  if (growthMode) { resetVine(); growVineFrame(); } else animate();
});
$("freq").addEventListener('input', () => {});

// Visualizer (EQ)
function animate() {
  if (growthMode) return;
  let ctx = canvas.getContext("2d");
  if (!analyser) return requestAnimationFrame(animate);
  analyser.getByteTimeDomainData(dataArray);
  ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (trailFrames.length > 12) trailFrames.shift();
  trailFrames.push([...dataArray]);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, currentWaveColor); grad.addColorStop(1, "#000000");
  for (let t = 0; t < trailFrames.length; t++) {
    const data = trailFrames[t];
    const slice = canvas.width / data.length;
    ctx.beginPath();
    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128.0;
      const y = (v * canvas.height / 2.0 * 0.9) + canvas.height / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += slice;
    }
    const alpha = 0.06 + (t / trailFrames.length) * 0.13;
    ctx.strokeStyle = grad; ctx.globalAlpha = alpha;
    ctx.shadowBlur = 15; ctx.shadowColor = currentWaveColor; ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
  }
  requestAnimationFrame(animate);
}
animate();
