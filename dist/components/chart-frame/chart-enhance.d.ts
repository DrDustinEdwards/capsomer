import { type EnhanceOptions, type EnhancedChart } from "enarratio/enhance";
import { type RedrawnChart } from "enarratio/redraw";
export declare function enhanceCharts(root?: ParentNode, options?: EnhanceOptions): Array<EnhancedChart | RedrawnChart>;
export declare function watchCharts(options?: EnhanceOptions): () => void;
