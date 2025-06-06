import { seededRandom, fastFloor } from "../utils/utils";

const OPENSIMPLEX_SKEW_2D = 0.366025403784439;   // (Math.sqrt(2+1)-1)/2
const OPENSIMPLEX_UNSKEW_2D = -0.21132486540518713; // (1/Math.sqrt(2+1)-1)/2
const GRAD_2D = [
    0.38268343236509,   0.923879532511287,
    0.923879532511287,  0.38268343236509,
    0.923879532511287, -0.38268343236509,
    0.38268343236509,  -0.923879532511287,
    -0.38268343236509,  -0.923879532511287,
    -0.923879532511287, -0.38268343236509,
    -0.923879532511287,  0.38268343236509,
    -0.38268343236509,   0.923879532511287
]
const N_GRADS_2D_EXPONENT = 7;
const N_GRADS_2D = 1 << N_GRADS_2D_EXPONENT;
const SUPERSIMPLEX_GRADIENTS_2D = new Array(N_GRADS_2D * 2)
const RSQUARED_2D = 2.0 / 3.0;
const NORMALIZER_2D = 0.05481866495625118;
const HASH_MULTIPLIER = 0x53A3F72DEEC546F5n;
const PRIME_X = 0x5205402B9270C86Fn;
const PRIME_Y = 0x598CD327003817B5n;

//This process was pulled from KdotJPG's https://github.com/KdotJPG/OpenSimplex2
export function generateSuperSimplexNoise(canvasElement, noiseFrequency, noiseSeed, colorGradient){
    var width = canvasElement.width;
    var height = canvasElement.height;

    var ctx = canvasElement.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const frequency = noiseFrequency;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = x * frequency;
            const ny = y * frequency;
            const index = (y * width + x) * 4;

            const value = superSimplex2D(nx, ny, noiseSeed);

            // Normalize value to [0,255]
            const normalized = Math.floor((value + 1) * 0.5 * 255);
            const t = normalized / 255;

            const r = Math.round(colorGradient.r1 * (1 - t) + colorGradient.r2 * t);
            const g = Math.round(colorGradient.g1 * (1 - t) + colorGradient.g2 * t);
            const b = Math.round(colorGradient.b1 * (1 - t) + colorGradient.b2 * t);

            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b; 
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

export function initializeSuperSimplexGradients2D(){
    // Normalize GRAD_2D by dividing each element by NORMALIZER_2D
    for (let i = 0; i < GRAD_2D.length; i++) {
        GRAD_2D[i] /= NORMALIZER_2D;
    }
    
    // Fill GRADIENTS_2D by repeating GRAD_2D if needed
    for (let i = 0, j = 0; i < SUPERSIMPLEX_GRADIENTS_2D.length; i++, j++) {
        if (j == GRAD_2D.length) j = 0;
        SUPERSIMPLEX_GRADIENTS_2D[i] = GRAD_2D[j];
    }
}

function superSimplex2D(x, y, noiseSeed) {
    //Convert x and y to the triangle lattice
    const s = OPENSIMPLEX_SKEW_2D * (x + y);
    const xs = x + s;
    const ys = y + s;

    //Base points on the lattice that x and y are in (which triangle x and y are in)
    const xsb = fastFloor(xs);
    const ysb = fastFloor(ys);

    //Converted x/y - Base x/y to get how far into the triangle Converted x/y are
    const xi = xs - xsb;
    const yi = ys - ysb;

    //Prime pre-multiplcation
    const xsbp = BigInt(xsb) * PRIME_X;
    const ysbp = BigInt(ysb) * PRIME_Y;

    //Convert x and y from the triangle lattice back to normal
    const t = (xi + yi) * OPENSIMPLEX_UNSKEW_2D;
    const dx0 = xi + t;
    const dy0 = yi + t;

    //First Vertex
    const a0 = RSQUARED_2D - dx0 * dx0 - dy0 * dy0;
    let value = (a0 * a0) * (a0 * a0) * superSimplexGrad(xsbp, ysbp, dx0, dy0, noiseSeed);

    //Second Vertex
    const a1 = (2 * (1 + 2 * OPENSIMPLEX_UNSKEW_2D) * (1 / OPENSIMPLEX_UNSKEW_2D + 2)) * t + ((-2 * (1 + 2 * OPENSIMPLEX_UNSKEW_2D) * (1 + 2 * OPENSIMPLEX_UNSKEW_2D)) + a0);
    const dx1 = dx0 - (1 + 2 * OPENSIMPLEX_UNSKEW_2D);
    const dy1 = dy0 - (1 + 2 * OPENSIMPLEX_UNSKEW_2D);
    value += (a1 * a1) * (a1 * a1) * superSimplexGrad(xsbp + PRIME_X, ysbp + PRIME_Y, dx1, dy1, noiseSeed);

    //Third and Fourth Vertices
    const xmyi = xi - yi;
    let dx2 = 0.0;
    let dy2 = 0.0;
    let a2 = 0.0;

    let dx3 = 0.0;
    let dy3 = 0.0;
    let a3 = 0.0;
    //Third
    if (t < OPENSIMPLEX_UNSKEW_2D){
        if (xi + xmyi > 1){
            dx2 = dx0 - (3 * OPENSIMPLEX_UNSKEW_2D + 2);
            dy2 = dy0 - (3 * OPENSIMPLEX_UNSKEW_2D + 1);
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0){
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp + (PRIME_X << 1n), ysbp + PRIME_Y, dx2, dy2, noiseSeed);
            }
        }
        else{
            dx2 = dx0 - OPENSIMPLEX_UNSKEW_2D;
            dy2 = dy0 - (OPENSIMPLEX_UNSKEW_2D + 1);
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp, ysbp + PRIME_Y, dx2, dy2, noiseSeed);
            }
        }

        //Fourth
        if (yi - xmyi > 1) {
            dx3 = dx0 - (3 * OPENSIMPLEX_UNSKEW_2D + 1);
            dy3 = dy0 - (3 * OPENSIMPLEX_UNSKEW_2D + 2);
            a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
            if (a3 > 0) {
                value += (a3 * a3) * (a3 * a3) * superSimplexGrad(xsbp + PRIME_X, ysbp + (PRIME_Y << 1n), dx3, dy3, noiseSeed);
            }
        }
        else
        {
            dx3 = dx0 - (OPENSIMPLEX_UNSKEW_2D + 1);
            dy3 = dy0 - OPENSIMPLEX_UNSKEW_2D;
            a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
            if (a3 > 0) {
                value += (a3 * a3) * (a3 * a3) * superSimplexGrad(xsbp + PRIME_X, ysbp, dx3, dy3, noiseSeed);
            }
        }
    }
    else{
        if (xi + xmyi < 0) {
            dx2 = dx0 + (1 + OPENSIMPLEX_UNSKEW_2D);
            dy2 = dy0 + OPENSIMPLEX_UNSKEW_2D;
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp - PRIME_X, ysbp, dx2, dy2, noiseSeed);
            }
        }
        else
        {
            dx2 = dx0 - (OPENSIMPLEX_UNSKEW_2D + 1);
            dy2 = dy0 - OPENSIMPLEX_UNSKEW_2D;
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp + PRIME_X, ysbp, dx2, dy2, noiseSeed);
            }
        }
        if (yi < xmyi) {
            dx2 = dx0 + OPENSIMPLEX_UNSKEW_2D;
            dy2 = dy0 + (OPENSIMPLEX_UNSKEW_2D + 1);
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp, ysbp - PRIME_Y, dx2, dy2, noiseSeed);
            }
        }
        else
        {
            dx2 = dx0 - OPENSIMPLEX_UNSKEW_2D;
            dy2 = dy0 - (OPENSIMPLEX_UNSKEW_2D + 1);
            a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
            if (a2 > 0) {
                value += (a2 * a2) * (a2 * a2) * superSimplexGrad(xsbp, ysbp + PRIME_Y, dx2, dy2, noiseSeed);
            }
        }
    }
    return value;
}

function superSimplexGrad(xsvp, ysvp, dx, dy, noiseSeed){
    var hash = BigInt(noiseSeed) ^ BigInt(xsvp) ^ BigInt(ysvp);
    hash *= HASH_MULTIPLIER;
    hash ^= hash >> BigInt(64 - N_GRADS_2D_EXPONENT + 1);
    const gi = Number(hash & BigInt((N_GRADS_2D - 1) << 1));
    return SUPERSIMPLEX_GRADIENTS_2D[gi] * dx + SUPERSIMPLEX_GRADIENTS_2D[gi+1] * dy
}