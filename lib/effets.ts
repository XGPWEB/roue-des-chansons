/* Sons (Web Audio) et confettis — aucun fichier externe. */

let ac: AudioContext | null = null;

export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ac) {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new Ctx();
    } catch {
      return null;
    }
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

export function tick() {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "square";
  o.frequency.value = 1800;
  g.gain.setValueAtTime(0.08, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.03);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.035);
}

export function fanfare() {
  const a = audio();
  if (!a) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + i * 0.13;
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.5);
  });
}

export function confettis(canvas: HTMLCanvasElement, couleurs: string[]) {
  const x = canvas.getContext("2d");
  if (!x) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const P = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 4,
    r: Math.random() * 6 + 4,
    c: couleurs[Math.floor(Math.random() * couleurs.length)],
    a: Math.random() * 6,
    va: (Math.random() - 0.5) * 0.4,
  }));
  let n = 0;
  const frame = () => {
    x.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of P) {
      p.vy += 0.4;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      x.save();
      x.translate(p.x, p.y);
      x.rotate(p.a);
      x.fillStyle = p.c;
      x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      x.restore();
    }
    if (++n < 150) requestAnimationFrame(frame);
    else x.clearRect(0, 0, canvas.width, canvas.height);
  };
  requestAnimationFrame(frame);
}
