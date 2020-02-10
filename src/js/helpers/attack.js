export const calculateAttack = ({ character: allie }, { character: enemy }) => Math.max(allie.attack - enemy.defence, allie.attack * 0.1);

export const healthAfterAttack = (allie, enemy) => (enemy.character.health - calculateAttack(allie, enemy) < 0 ? 0 : enemy.character.health - calculateAttack(allie, enemy));
