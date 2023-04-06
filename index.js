const canvas = document.getElementById("brot");

const RESOLUTION = canvas.clientWidth;

// number of iterations we stop at to define a pixel as in the mandelbrot set (black)
// lower is faster but will give you a less defined final image
let MAX_ITER = 0x100;

class Complex {
  constructor(r, i) {
    this.r = r;
    this.i = i;
  }

  toString() {
    return `${this.r} ${this.i < 0 ? "-" : "+"} ${Math.abs(this.i)}i`;
  }

  add(x) {
    let r;
    let i;
    if (x instanceof Complex) {
      r = this.r + x.r;
      i = this.i + x.i;
    } else if (typeof x === "number") {
      r = this.r + x;
      i = this.i;
    }
    return new Complex(r, i);
  }

  sub(x) {
    let r;
    let i;
    if (x instanceof Complex) {
      r = this.r - x.r;
      i = this.i - x.i;
    } else if (typeof x === "number") {
      r = this.r - x;
      i = this.i;
    }
    return new Complex(r, i);
  }

  mul(x) {
    let r;
    let i;
    if (x instanceof Complex) {
      r = (this.r * x.r) - (this.i * x.i);
      i = (this.r * this.i) + (x.r * x.i);
    } else if (typeof x === "number") {
      r = this.r * x;
      i = this.i * x;
    }
    return new Complex(r, i);
  }

  square() {
    return this.mul(this);
  }

  // distance from point to (0, 0)
  abs() {
    return Math.sqrt((this.r ** 2) + (this.i ** 2));
  }

  // next.square().add(this) is the equivalent to `Z(n) = Z(n-1)^2 + c`
  juliaFunction(next) {
    return next.square().add(this);
  }

  stepsToInfinity() {
    let iterations = 0;
    let next = new Complex(0, 0);
    while (iterations < MAX_ITER && next.abs() < 2 && this.abs() < 2) {
      ++iterations;
      next = this.juliaFunction(next);
    }
    return iterations;
  }
}

// const invertSteps = (n) => (n * -1) + MAX_ITER;

const getColor = (n) => {
  if (n >= MAX_ITER) return [0, 0, 0];
  if (n <= 0) return [0xff, 0xff, 0xff];
  const r = n < (MAX_ITER / 2) ? (n % 0x80) * 2 : 0x80;
  const g = (n % 0x40) * 4;
  const b = n < (MAX_ITER / 2) ? 0x80 : ((n % 2) * 0x80 * -1) + 0xff;
  return [r, g, b];
};

// const getGreyscale = (n) => (invertSteps(n) / MAX_ITER) * 0xff;

const scale = (value, outMin, outMax) => ((value) * (outMax - outMin)) / RESOLUTION + outMin;
let CENTER; let SCALE; let MAX_X; let MAX_Y; let MIN_X; let
  MIN_Y;

const setStaticUIValues = () => {
  document.getElementById("centered-value").textContent = CENTER.toString();
  document.getElementById("scale-value").textContent = `2^${Math.log2(1 / SCALE)}`;
};

const initValues = () => {
  CENTER = new Complex(0, 0);
  SCALE = 1;
  MAX_X = SCALE * (2 + CENTER.r);
  MIN_X = SCALE * (-2 + CENTER.r);
  MAX_Y = SCALE * (-2 + CENTER.i);
  MIN_Y = SCALE * (2 + CENTER.i);

  setStaticUIValues();
};

const recenterAndZoom = (newCenter) => {
  CENTER = newCenter;
  SCALE *= 0.5;
  MAX_X = (SCALE * 2) + CENTER.r;
  MIN_X = (SCALE * -2) + CENTER.r;
  MAX_Y = (SCALE * -2) + CENTER.i;
  MIN_Y = (SCALE * 2) + CENTER.i;
};

const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });

const doWork = () => {
  const imageData = ctx.getImageData(0, 0, RESOLUTION, RESOLUTION);
  const pixels = imageData.data;

  for (let y = 0; y <= RESOLUTION; ++y) {
    for (let x = 0; x <= RESOLUTION; ++x) {
      const normX = scale(x, MIN_X, MAX_X);
      const normY = scale(y, MIN_Y, MAX_Y);
      const complex = new Complex(normX, normY);
      const steps = complex.stepsToInfinity();
      const offset = ((y * RESOLUTION) + x) * 4;

      // const gs = getGreyscale(steps); // brightness of given pixel
      const [r, g, b] = getColor(steps); // tuple of RGB values between 0 and 255
      // r
      pixels[offset] = r;
      // g
      pixels[offset + 1] = g;
      // b
      pixels[offset + 2] = b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const handleHover = (event) => {
  const bounding = canvas.getBoundingClientRect();
  const x = event.clientX - bounding.left;
  const y = event.clientY - bounding.top;
  const complex = new Complex(scale(x, MIN_X, MAX_X), scale(y, MIN_Y, MAX_Y));

  document.getElementById("hovered-value").textContent = `hovered at: (${complex.stepsToInfinity()} steps) ${complex.toString()}`;
};

const handleClick = (event) => {
  const bounding = canvas.getBoundingClientRect();
  const x = event.clientX - bounding.left;
  const y = event.clientY - bounding.top;
  const complex = new Complex(scale(x, MIN_X, MAX_X), scale(y, MIN_Y, MAX_Y));

  recenterAndZoom(complex);
  setStaticUIValues();
  const h = document.getElementById("helper");
  if (h) {
    h.remove();
  }
  doWork();
};

const clearHoveredValue = () => {
  document.getElementById("hovered-value").textContent = "";
};

canvas.addEventListener("mousemove", handleHover);
canvas.addEventListener("mouseover", handleHover);
canvas.addEventListener("mouseout", clearHoveredValue);
canvas.addEventListener("click", handleClick);

document.getElementById("fidelity").addEventListener("change", (e) => {
  MAX_ITER = [0x100, 0x200, 0x400, 0x800, 0x1000][e.target.value];
  doWork();
});

const initAndDoWork = () => {
  initValues();
  doWork();
};

document.getElementById("reset-button").addEventListener("click", initAndDoWork);

initAndDoWork();
