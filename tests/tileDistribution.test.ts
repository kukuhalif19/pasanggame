import { describe, expect, it } from 'vitest';
import { createInitialTileBag } from '../src/game/wordBattleConstants';

describe('distribusi tile Word Battle', () => {
  it('menyediakan 120 tile untuk mode MIX', () => {
    const bag = createInitialTileBag('mix');

    expect(bag).toHaveLength(120);
    expect(bag.filter((tile) => tile.isBlank)).toHaveLength(2);
    expect(bag.filter((tile) => !tile.isBlank)).toHaveLength(118);
  });

  it('mempertahankan 100 tile untuk mode IND dan ENG', () => {
    expect(createInitialTileBag('id')).toHaveLength(100);
    expect(createInitialTileBag('en')).toHaveLength(100);
  });
});
