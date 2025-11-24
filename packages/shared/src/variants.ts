import type {
  GameVariantId,
  GameVariantSummary,
  GameVariantCapacity
} from './messages';

export type GameVariantDefinition = Omit<GameVariantSummary, 'capacity'> & {
  capacity: GameVariantCapacity & { default: number };
  deck: { packs: number };
};
export type { GameVariantId };

const definitions: Record<GameVariantId, GameVariantDefinition> = {
  'dou-dizhu': {
    id: 'dou-dizhu',
    name: '斗地主',
    description: '三人对局，17 张手牌，保留 3 张底牌',
    capacity: { min: 3, max: 3, locked: 3, default: 3 },
    deck: { packs: 1 }
  }
};

export const DEFAULT_VARIANT_ID: GameVariantId = 'dou-dizhu';

function toSummary(def: GameVariantDefinition): GameVariantSummary {
  const { capacity, deck: _deck, ...rest } = def;
  const { default: _default, ...restCapacity } = capacity;
  return { ...rest, capacity: restCapacity };
}

export function getVariantSummary(id: GameVariantId): GameVariantSummary {
  const def = definitions[id] ?? definitions[DEFAULT_VARIANT_ID];
  return toSummary(def);
}

export function getVariantDefinition(id: GameVariantId): GameVariantDefinition {
  return definitions[id] ?? definitions[DEFAULT_VARIANT_ID];
}

export function listVariantDefinitions(): GameVariantDefinition[] {
  return Object.values(definitions).map(def => ({ ...def, capacity: { ...def.capacity } }));
}

export function listVariantSummaries(): GameVariantSummary[] {
  return listVariantDefinitions().map(toSummary);
}

export const GAME_VARIANTS_BY_ID = definitions;
export const GAME_VARIANTS = listVariantDefinitions();
