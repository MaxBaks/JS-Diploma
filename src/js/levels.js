const levels = new Map([
  [1, 'prairie'],
  [2, 'desert'],
  [3, 'arctic'],
  [4, 'mountain'],
]);

export default levels;

export function levelUp(character) {
  const leveledUpCharacter = {};
  leveledUpCharacter.level = character.level + 1;
  leveledUpCharacter.health = character.health + 80 > 100 ? 100 : character.health + 80;
  leveledUpCharacter.attack = Math.round(Math.max(character.attack, character.attack * (1.8 - (1 - character.health / 100))));
  leveledUpCharacter.defence = Math.round(Math.max(character.defence, character.defence * (1.8 - (1 - character.health / 100))));
  leveledUpCharacter.type = character.type;
  return leveledUpCharacter;
}
