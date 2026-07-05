export const NOTHING = 0;
export const WALL = 1;

// Wall extrusion height h (the original app calls this "channel"). Fixed at 1.
export const CHANNEL = 1;
// Half the gadget tile size: floor unit + strip half-width.
export const HG = 2 + CHANNEL;
// Full gadget tile size; each maze vertex owns a TILE x TILE square of paper.
export const TILE = 2 * HG;

// Stroke widths (in maze/CP units).
export const THIN = 0.09; // 90° folds
export const MEDIUM = 0.15; // 180° folds
export const THICK = 0.3; // paper boundary

export const CP_STYLES = `line, polygon { stroke-linecap: round; stroke-linejoin: round; }
.valley.f90 { stroke: #3030f0; stroke-width: ${THIN}; }
.valley.f180 { stroke: #0000f0; stroke-width: ${MEDIUM}; }
.mountain.f90 { stroke: #ff8080; stroke-width: ${THIN}; }
.mountain.f180 { stroke: #ff6060; stroke-width: ${MEDIUM}; }
.boundary { stroke: black; stroke-width: ${THICK}; fill: none; }
`;

// Origami Simulator convention: pure red/blue lines whose opacity encodes the
// target fold angle (0.5 -> 90°, 1 -> 180°).
export const CP_SIM_STYLES = `.valley { stroke: #00f; }
.mountain { stroke: #f00; }
.f90 { stroke-width: ${THIN}; opacity: 0.5; }
.f180 { stroke-width: ${MEDIUM}; opacity: 1; }
.boundary { stroke: black; stroke-width: ${THICK}; fill: none; }
`;
