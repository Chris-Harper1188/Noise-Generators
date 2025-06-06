//Mulberry32 Seeded Random
export function seededRandom(seed) {
    let t = seed;
    return function() {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }
}

//Converts a string to a number that can be interpreted as a seed
export function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return hash;
}

//From Super simplex implementation by kdotjpg
export function fastFloor(x) {
    const xi = Math.floor(x);
    return x < xi ? xi - 1 : xi;
}