export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

export function mat3Mul(a: Mat3, b: Mat3): Mat3 {
  const out: number[][] = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const row = a[i]!;
    for (let j = 0; j < 3; j++) {
      out[i]![j] = row[0] * b[0][j]! + row[1] * b[1][j]! + row[2] * b[2][j]!;
    }
  }
  return out as Mat3;
}

export function mat3Apply(a: Mat3, v: Vec3): Vec3 {
  return [
    a[0][0] * v[0] + a[0][1] * v[1] + a[0][2] * v[2],
    a[1][0] * v[0] + a[1][1] * v[1] + a[1][2] * v[2],
    a[2][0] * v[0] + a[2][1] * v[1] + a[2][2] * v[2],
  ];
}

const RAD = Math.PI / 180;

export function rotX(deg: number): Mat3 {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
}

export function rotZ(deg: number): Mat3 {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/** True modulo (result in [0, b) for b > 0, unlike JS %). */
export function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}
