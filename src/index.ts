import { stateBorders } from './state-borders-publicamundi';
import { stateCenters } from './state-centers-wikipedia';
// import * as LatLonSpherical from './latlon';
import haversine = require('haversine');
import { getDistance, convertDistance, getGreatCircleBearing } from 'geolib';


(window as any).stateBorders = stateBorders;
(window as any).stateCenters = stateCenters;
(window as any).haversine = haversine;
// console.log(haversine);

// console.log(new LatLonSpherical());

// const start = {
//   latitude: 30.849635,
//   longitude: -83.24559
// }
//
// const end = {
//   latitude: 27.950575,
//   longitude: -82.457178
// }
//
// console.log(haversine(start, end))

// console.log(haversine(start, end, {unit: 'mile'}))


const canvasHeight = 500;
const canvasWidth = 500;

type Point = [number, number];
type Shape = Point[];

function x(p: Point): number {
  return p[0];
}

function y(p: Point): number {
  return p[1];
}

const canvas = document.getElementById('state') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const triangle = [
  [5, 5],
  [100, 100],
  [5, 100],
] as Shape;

type LinearScale = (x: number) => number;
type LinearScaleWithEquation = LinearScale & { m: number, b: number };

function fromPoints(p1: Point, p2: Point): LinearScaleWithEquation {
  const m = (y(p2) - y(p1)) / (x(p2) - x(p1));
  const b = y(p1) - m * x(p1);
  const result = (x: number) => m * x + b;
  result.m = m;
  result.b = b;
  return result;
}

function compose(s1: LinearScale, s2: LinearScale): LinearScale {
  return (x: number) => s2(s1(x));
}

function drawShape(shape: Shape) {
  const xMin = Math.min(...shape.map(p => x(p)));
  const xMax = Math.max(...shape.map(p => x(p)));
  const yMin = Math.min(...shape.map(p => y(p)));
  const yMax = Math.max(...shape.map(p => y(p)));

  let xScale: LinearScale = fromPoints([xMin, 0], [xMax, canvasWidth]);
  let yScale: LinearScale = fromPoints([yMin, canvasHeight], [yMax, 0]);

  const xScaleFactor = (xScale as LinearScaleWithEquation).m;
  const yScaleFactor = -(yScale as LinearScaleWithEquation).m;

  if (xScaleFactor > yScaleFactor) {
    xScale = compose(xScale, x => x * yScaleFactor / xScaleFactor);
  } else {
    yScale = compose(yScale, y => y * xScaleFactor / yScaleFactor);
  }

  // console.log(xScale.m, yScale.m);

  ctx.beginPath();
  for (let point of shape) {
    ctx.lineTo(xScale(x(point)), yScale(y(point)));
  }
  ctx.closePath();
  ctx.stroke();
}

function drawDirection(direction: number) {
  const canvas = document.getElementById('direction') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.lineTo(50, 50);

  const radius = 40;

  const DEG_TO_RADIANS = 1 / 360 * 2 * Math.PI;

  const x = -Math.sin(direction * DEG_TO_RADIANS) * radius + 50;
  const y = -Math.cos(direction * DEG_TO_RADIANS) * radius + 50;

  ctx.lineTo(x, y);
  ctx.stroke();
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function rotate(shape: Shape, angleRad: number): Shape {
  return shape.map(p => [
    x(p) * Math.cos(angleRad) - y(p) * Math.sin(angleRad),
    y(p) * Math.cos(angleRad) + x(p) * Math.sin(angleRad),
  ]);
}

// console.log(convertDistance(getDistance(stateCenters.California, stateCenters.Nevada), 'mi'))

// counterclockwise from north, with the N+ W+ sign convention that i chose (not sure if geolib has a convention)
// drawDirection(getGreatCircleBearing(stateCenters.California, stateCenters.Oregon));

let rotation = Math.random() * Math.PI * 2;
let secretState = randomChoice(stateBorders);

// secretState = stateBorders.filter(state => state.properties.name === 'California')[0];
// rotation = 0;

const secretStateName = secretState.properties.name;
const secretStateShape = rotate(secretState.geometry.coordinates[0] as any, rotation);


drawShape(secretStateShape);
// console.log(secretStateName);

function keypress(event: KeyboardEvent, element: HTMLInputElement) {
  if (event.key !== 'Enter') {
    return;
  }
  const guess = element.value.trim();
  if (!stateCenters.hasOwnProperty(guess)) {
    element.value = 'INVALID STATE';
    return;
  }
  element.value = '';

  if (guess === secretStateName) {
    console.log(guess, 'WIN');
  } else {
    // @ts-ignore
    console.log(guess, convertDistance(getDistance(stateCenters[guess], stateCenters[secretStateName]), 'mi'));
    // @ts-ignore
    drawDirection(getGreatCircleBearing(stateCenters[guess], stateCenters[secretStateName]));
  }
}
(window as any).keypress = keypress;
