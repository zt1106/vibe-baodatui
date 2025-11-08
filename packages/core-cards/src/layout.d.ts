import type { CardLayout } from './types';
export interface FanLayoutOptions {
    maxAngle?: number;
    radius?: number;
    pivot?: 'left' | 'center' | 'right';
    verticalLift?: number;
}
export declare function fanLayout(count: number, options?: FanLayoutOptions): CardLayout[];
