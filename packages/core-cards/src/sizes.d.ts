import type { CardSize } from './types';
export interface CardDimensions {
    width: number;
    height: number;
}
export declare function getCardDimensions(size?: CardSize): CardDimensions;
export declare function resolveCardCssVars(size?: CardSize): Record<string, string>;
