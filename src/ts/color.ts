export type HslColor = {
    h: number; // 0..360
    s: number; // 0..100
    l: number; // 0..100
};

export function hexToHsl(hex: string): HslColor {
    let raw: string = hex.replace("#", "");

    if (raw.length === 3) {
        raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    } else if (raw.length !== 6) {
        console.error(`[hexToHsl] Invalid hex color: ${hex}`);
        throw new Error("Invalid hex");
    }

    let r: number = parseInt(raw.slice(0, 2), 16) / 255;
    let g: number = parseInt(raw.slice(2, 4), 16) / 255;
    let b: number = parseInt(raw.slice(4, 6), 16) / 255;

    let max: number = Math.max(r, g, b);
    let min: number = Math.min(r, g, b);

    let l: number = (max + min) / 2;
    let d: number = max - min;
    let h: number = 0;
    let s: number = 0;

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));

        if (max === r) {
            h = ((g - b) / d) % 6;
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else {
            h = (r - g) / d + 4;
        }

        h = h * 60;

        if (h < 0) {
            h = h + 360;
        }
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

export function rgbToHex(r: number, g: number, b: number): string {
    let rr: number = Math.max(0, Math.min(255, Math.round(r)));
    let gg: number = Math.max(0, Math.min(255, Math.round(g)));
    let bb: number = Math.max(0, Math.min(255, Math.round(b)));

    let to2: (n: number) => string = (n: number): string => {
        let s: string = n.toString(16).toUpperCase();
        if (s.length === 1) {
            return "0" + s;
        } else {
            return s;
        }
    };

    return "#" + to2(rr) + to2(gg) + to2(bb);
}

export function rgbStringToHex(rgb: string): string {
    let match: RegExpMatchArray | null =
        rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

    if (match === null) {
        throw new Error("Invalid rgb() string");
    }

    let r: number = Number(match[1]);
    let g: number = Number(match[2]);
    let b: number = Number(match[3]);

    if (
        Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ||
        r < 0 || r > 255 ||
        g < 0 || g > 255 ||
        b < 0 || b > 255
    ) {
        throw new Error("RGB values out of range");
    }

    let toHex2 = (n: number): string => {
        let s: string = n.toString(16).toUpperCase();
        if (s.length === 1) {
            return "0" + s;
        } else {
            return s;
        }
    };

    return "#" + toHex2(r) + toHex2(g) + toHex2(b);
}

type AfterBiasFn = (prev: string | null, next: string, baseWeight: number) => number;
type ForbidAdjacencyFn = (prev: string | null, next: string) => boolean;

type LightPatternOptions = {
    rng?: () => number;
    minContrast?: number;
    contrastBiasPower?: number;
    forbidABA?: boolean;
    forbidAdjacency?: ForbidAdjacencyFn;
    afterBias?: AfterBiasFn;

    evenDistribution?: boolean;   // default true
    evennessStrength?: number;    // default 2.0 (higher = more even)
};

export function generateLightPattern(
    colors: string[],
    weights: number[],
    num_lights: number,
    start_index: number,
    options?: LightPatternOptions
): string[] {
    if (colors.length === 0) throw new Error("colors must not be empty.");
    if (colors.length !== weights.length) throw new Error("colors and weights must have the same length.");
    if (!Number.isFinite(num_lights) || num_lights < 0) throw new Error("num_lights must be >= 0.");

    let i: number = 0;
    for (i = 0; i < colors.length; i += 1) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(colors[i])) throw new Error(`Invalid hex color at index ${i}: ${colors[i]}`);
        if (!Number.isFinite(weights[i]) || weights[i] < 0) throw new Error(`Invalid weight at index ${i}: ${weights[i]}`);
    }

    let n: number = colors.length;
    let idx0: number = ((start_index % n) + n) % n;

    let rng: (() => number) | undefined = options?.rng;
    let configuredMinContrast: number = options?.minContrast ?? 0;
    let contrastBiasPower: number = options?.contrastBiasPower ?? 1.5;
    let configuredForbidABA: boolean = options?.forbidABA ?? true;

    let forbidAdjacency: ForbidAdjacencyFn | undefined = options?.forbidAdjacency;
    let afterBias: AfterBiasFn | undefined = options?.afterBias;

    let evenDistribution: boolean = options?.evenDistribution ?? true;
    let evennessStrength: number = options?.evennessStrength ?? 2.0;

    function hexToRgb01(hex: string): [number, number, number] {
        let r: number = parseInt(hex.slice(1, 3), 16) / 255;
        let g: number = parseInt(hex.slice(3, 5), 16) / 255;
        let b: number = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    }

    function srgbToLinear(c: number): number {
        if (c <= 0.04045) return c / 12.92;
        return Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(hex: string): number {
        let rgb: [number, number, number] = hexToRgb01(hex);
        let r: number = srgbToLinear(rgb[0]);
        let g: number = srgbToLinear(rgb[1]);
        let b: number = srgbToLinear(rgb[2]);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(hexA: string, hexB: string): number {
        let la: number = relativeLuminance(hexA);
        let lb: number = relativeLuminance(hexB);
        let lighter: number = la > lb ? la : lb;
        let darker: number = la > lb ? lb : la;
        return (lighter + 0.05) / (darker + 0.05);
    }

    function rotatedOrderIndex(candidateIndex: number): number {
        let shifted: number = (candidateIndex - idx0 + n) % n;
        return shifted;
    }

    // Build target counts that sum to num_lights.
    let sumWeights: number = 0;
    for (i = 0; i < n; i += 1) sumWeights += weights[i];

    let remaining: number[] = new Array(n);
    let target: number[] = new Array(n);

    if (sumWeights <= 0) {
        for (i = 0; i < n; i += 1) {
            remaining[i] = 0;
            target[i] = 0;
        }
    } else {
        let raw: number[] = new Array(n);
        for (i = 0; i < n; i += 1) raw[i] = (weights[i] / sumWeights) * num_lights;

        let total: number = 0;
        for (i = 0; i < n; i += 1) {
            target[i] = Math.floor(raw[i]);
            total += target[i];
        }

        let leftover: number = num_lights - total;
        while (leftover > 0) {
            let bestIndex: number = 0;
            let bestFrac: number = -1;
            for (i = 0; i < n; i += 1) {
                let frac: number = raw[i] - Math.floor(raw[i]);
                if (frac > bestFrac) {
                    bestFrac = frac;
                    bestIndex = i;
                } else if (frac === bestFrac) {
                    if (rotatedOrderIndex(i) < rotatedOrderIndex(bestIndex)) bestIndex = i;
                }
            }
            target[bestIndex] += 1;
            raw[bestIndex] = Math.floor(raw[bestIndex]);
            leftover -= 1;
        }

        for (i = 0; i < n; i += 1) remaining[i] = target[i];
    }

    let sumRemaining: number = 0;
    for (i = 0; i < n; i += 1) sumRemaining += remaining[i];

    let used: number[] = new Array(n);
    for (i = 0; i < n; i += 1) used[i] = 0;

    function pickDeterministic(candidates: number[], candidateWeights: number[]): number {
        let bestIndex: number = candidates[0];
        let bestWeight: number = candidateWeights[0];
        let j: number = 0;

        for (j = 1; j < candidates.length; j += 1) {
            let ci: number = candidates[j];
            let cw: number = candidateWeights[j];
            if (cw > bestWeight) {
                bestWeight = cw;
                bestIndex = ci;
            } else if (cw === bestWeight) {
                if (rotatedOrderIndex(ci) < rotatedOrderIndex(bestIndex)) bestIndex = ci;
            }
        }
        return bestIndex;
    }

    function pickWeighted(candidates: number[], candidateWeights: number[]): number {
        let total: number = 0;
        let j: number = 0;

        for (j = 0; j < candidateWeights.length; j += 1) total += candidateWeights[j];
        if (total <= 0) return pickDeterministic(candidates, candidateWeights);

        let r: number = (rng ? rng() : 0) * total;
        let acc: number = 0;

        for (j = 0; j < candidates.length; j += 1) {
            acc += candidateWeights[j];
            if (r < acc) return candidates[j];
        }
        return candidates[candidates.length - 1];
    }

    function evennessMultiplier(colorIndex: number, stepIndex: number): number {
        if (!evenDistribution) return 1;

        let t: number = target[colorIndex];
        if (t <= 0) return 1;

        // expected used by now (inclusive-ish), scaled across the string
        let progress: number = (stepIndex + 1) / num_lights;
        let expected: number = t * progress;
        let behind: number = expected - used[colorIndex];

        // exponential makes “behind” matter early, preventing end-clumping
        return Math.exp(behind * evennessStrength);
    }

    function buildCandidates(
        prev: string | null,
        prev2: string | null,
        stepIndex: number,
        minContrast: number,
        forbidABA: boolean,
        applyAdjacencyRules: boolean,
        useRemainingCounts: boolean
    ): { indices: number[]; weights: number[] } {
        let indices: number[] = [];
        let candidateWeights: number[] = [];
        let j: number = 0;

        for (j = 0; j < n; j += 1) {
            let next: string = colors[j];

            if (prev !== null && next === prev) continue;
            if (forbidABA && prev2 !== null && next === prev2) continue;
            if (applyAdjacencyRules && forbidAdjacency && forbidAdjacency(prev, next)) continue;
            if (useRemainingCounts && sumRemaining > 0 && remaining[j] <= 0) continue;

            let base: number = 1;

            if (useRemainingCounts && sumRemaining > 0) base = remaining[j];
            else if (sumWeights > 0) base = weights[j];
            else base = 1;

            if (prev !== null) {
                let cr: number = contrastRatio(prev, next);
                if (cr < minContrast) continue;
                base *= Math.pow(cr, contrastBiasPower);
            }

            base *= evennessMultiplier(j, stepIndex);

            if (afterBias) {
                base = afterBias(prev, next, base);
            }

            indices.push(j);
            candidateWeights.push(base);
        }

        return { indices: indices, weights: candidateWeights };
    }

    let output: string[] = [];
    let prev: string | null = null;
    let prev2: string | null = null;

    let k: number = 0;
    for (k = 0; k < num_lights; k += 1) {
        let pack: { indices: number[]; weights: number[] };

        pack = buildCandidates(prev, prev2, k, configuredMinContrast, configuredForbidABA, true, true);
        if (pack.indices.length === 0) pack = buildCandidates(prev, prev2, k, 0, configuredForbidABA, true, true);
        if (pack.indices.length === 0) pack = buildCandidates(prev, prev2, k, 0, false, true, true);
        if (pack.indices.length === 0) pack = buildCandidates(prev, prev2, k, 0, false, false, true);
        if (pack.indices.length === 0) pack = buildCandidates(prev, prev2, k, 0, false, false, false);

        if (pack.indices.length === 0) {
            if (n === 1) {
                output.push(colors[0]);
                used[0] += 1;
                prev2 = prev;
                prev = colors[0];
                continue;
            }

            // emergency deterministic: pick rotated next that is not equal to prev
            let fallback: number = 0;
            for (i = 0; i < n; i += 1) {
                let cand: number = (idx0 + i) % n;
                if (prev === null || colors[cand] !== prev) {
                    fallback = cand;
                    break;
                }
            }

            output.push(colors[fallback]);
            used[fallback] += 1;
            prev2 = prev;
            prev = colors[fallback];
            continue;
        }

        let nextIndex: number = rng ? pickWeighted(pack.indices, pack.weights) : pickDeterministic(pack.indices, pack.weights);
        let nextColor: string = colors[nextIndex];

        output.push(nextColor);

        used[nextIndex] += 1;

        if (sumRemaining > 0 && remaining[nextIndex] > 0) {
            remaining[nextIndex] -= 1;
            sumRemaining -= 1;
        }

        prev2 = prev;
        prev = nextColor;
    }

    return output;
}
