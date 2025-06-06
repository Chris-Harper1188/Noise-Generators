import { seededRandom } from "../utils/utils";

export function generateWhiteNoise(canvasElement, noiseSeed, colorGradient){
    let width = canvasElement.width;
    let height = canvasElement.height;

    var ctx = canvasElement.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const rng = seededRandom(noiseSeed);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            const colorIndex = Math.floor(rng() * 256);
            const t = colorIndex / 255;

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
};