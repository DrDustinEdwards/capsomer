import type { EnhanceOptions, EnhancedChart } from "enarratio/enhance";
import { type RedrawnChart } from "enarratio/redraw";
export declare function enhanceFrames(root?: ParentNode, options?: EnhanceOptions): Array<EnhancedChart | RedrawnChart>;
export declare function watchFrames(options?: EnhanceOptions): () => void;
