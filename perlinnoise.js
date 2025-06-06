import { seededRandom } from "../utils/utils";

export function generatePerlinNoise(canvasElement, noiseSeed, perlinGridSizeX, perlinGridSizeY, colorGradient, seamless){
    var width = canvasElement.width;
    var height = canvasElement.height;

    const gradients = generateSquareGridGradients(perlinGridSizeX, perlinGridSizeY, noiseSeed, seamless);

    var ctx = canvasElement.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;

            const gridSpaceX = x/(width/perlinGridSizeX);
            const gridSpaceY = y/(height/perlinGridSizeY);
            const value = perlin(gridSpaceX,gridSpaceY, gradients, perlinGridSizeX, perlinGridSizeY, seamless);
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

//Generates the perlin grid given an X and Y size
function generateSquareGridGradients(gridSizeX, gridSizeY, noiseSeed, seamless){
    const gradients = [];
    const rng = seededRandom(noiseSeed);

    for(let y=0; y<=gridSizeY; y++){
        gradients[y] = [];
        for (let x=0;x<=gridSizeX; x++){
            const angle = rng() * 2 * Math.PI;
            gradients[y][x] = [Math.cos(angle), Math.sin(angle)];
        }
    }

    if (seamless) {
        // Copy edge gradients to opposite sides
        for (let y = 0; y <= gridSizeY; y++) {
            gradients[y][gridSizeX] = gradients[y][0];
        }
        for (let x = 0; x <= gridSizeX; x++) {
            gradients[gridSizeY][x] = gradients[0][x];
        }
    }

    return gradients;
}

//Finds the dot product between the grid points and the vector to the pixel
function dotGridGradient(gridX, gridY, x, y, gradients){
    const dx = x - gridX;
    const dy = y - gridY;
    const gradient = gradients[gridY][gridX];
    return dx * gradient[0] + dy * gradient[1];
}

//Smootherstep: 6x^5 - 15x^4 +10x^3
function perlinSmootherStep(t){
    return (6*t*t*t*t*t - 15*t*t*t*t + 10*t*t*t);
}

//Linear Interpolation between a and b
function lerp(a, b, t) {
    return a + t * (b - a);
}

//x and y are in grid space
function perlin(x, y, gradients, perlinGridSizeX, perlinGridSizeY, seamless){
    let gridSizeX = perlinGridSizeX;
    let gridSizeY = perlinGridSizeY;
    if (seamless) {
        x = x % gridSizeX;
        y = y % gridSizeY;
        if (x < 0) x += gridSizeX;
        if (y < 0) y += gridSizeY;
    }

    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    //This are the smoothed fractional positions inside the grid
    const smoothedFracX = perlinSmootherStep(x - gridX);
    const smoothedFracY = perlinSmootherStep(y - gridY);

    //The distance-gradient dot products
    const dot00 = dotGridGradient(gridX, gridY, x, y, gradients); //Top-Left (00)
    const dot10 = dotGridGradient(gridX+1, gridY, x, y, gradients); //Top-Right (10)
    const dot01 = dotGridGradient(gridX, gridY+1, x, y, gradients); //Bottom-Left (01) 
    const dot11 = dotGridGradient(gridX+1, gridY+1, x, y, gradients); //Bottom-Right (11) 

    //Finding the linear value across the top and bottom edge and then towards the middle
    const lerpTopEdge = lerp(dot00, dot10, smoothedFracX);
    const lerpBotEdge = lerp(dot01, dot11, smoothedFracX);
    return lerp(lerpTopEdge, lerpBotEdge, smoothedFracY);
}