import { seededRandom } from "../utils/utils";

export function generateWorleyNoise(canvasElement, cellSizeX, cellSizeY, noiseSeed, colorGradient, seamless){
    var width = canvasElement.width;
    var height = canvasElement.height;

    var ctx = canvasElement.getContext("2d");

    const featurePoints = generateFeaturePoints(cellSizeX, cellSizeY, width, height, noiseSeed);
    let maxDist = 0;
    const dists = [];

    //Find distances from feature point for each pixel
    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            const dist = getClosestDistance(x,y, cellSizeX, cellSizeY, width, height, featurePoints, seamless);
            dists.push(dist);
            if (dist > maxDist){
                maxDist = dist
            }
        }
    }

    drawWorleyImage(dists, maxDist, width, height, ctx, colorGradient);
}

//Points inside each cell that act as the "center" of that cell's circle
function generateFeaturePoints(cellSizeX, cellSizeY, canvasWidth, canvasHeight, noiseSeed){
    const featurePoints = [];
    const rng = seededRandom(noiseSeed);

    for (let y=0;y<(Math.floor(canvasHeight/cellSizeY));y++){
        featurePoints[y] = [];
        for (let x=0;x<(Math.floor(canvasWidth/cellSizeX));x++){
            featurePoints[y][x] = [
                x * cellSizeX + rng() * cellSizeX,
                y * cellSizeY + rng() * cellSizeY
            ];
        }
    }
    return featurePoints;
}

function getClosestDistance(px, py, cellSizeX, cellSizeY, canvasWidth, canvasHeight, featurePoints, seamless) {
    const cols = Math.floor(canvasWidth / cellSizeX);
    const rows = Math.floor(canvasHeight / cellSizeY);

    const cellX = Math.floor(px / cellSizeX);
    const cellY = Math.floor(py / cellSizeY);

    let minDist = Infinity;

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            let nx = cellX + x;
            let ny = cellY + y;

            if (seamless) {
                nx = (nx + cols) % cols;
                ny = (ny + rows) % rows;
            }

            if (seamless || (nx >= 0 && ny >= 0 && nx < cols && ny < rows)) {
                const fp = featurePoints[ny][nx]; // Feature point [fx, fy]
                let fx = fp[0];
                let fy = fp[1];

                if (seamless) {
                    // Compute seamless distance for seamless tiling
                    let dx = Math.abs(px - fx);
                    let dy = Math.abs(py - fy);

                    // Wrap around edges if shorter
                    if (dx > canvasWidth / 2) dx = canvasWidth - dx;
                    if (dy > canvasHeight / 2) dy = canvasHeight - dy;

                    dx /= cellSizeX;
                    dy /= cellSizeY;

                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) minDist = dist;
                } else {
                    const dx = (px - fx) / cellSizeX;
                    const dy = (py - fy) / cellSizeY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) minDist = dist;
                }
            }
        }
    }

    return minDist;
}

function drawWorleyImage(dists, maxDist, width, height, ctx, colorGradient) {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < dists.length; i++) {
        const value = Math.floor((dists[i] / maxDist) * 255);
        const t = value / 255;

        const r = Math.round(colorGradient.r1 * (1 - t) + colorGradient.r2 * t);
        const g = Math.round(colorGradient.g1 * (1 - t) + colorGradient.g2 * t);
        const b = Math.round(colorGradient.b1 * (1 - t) + colorGradient.b2 * t);

        data[i * 4] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b; 
        data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
}