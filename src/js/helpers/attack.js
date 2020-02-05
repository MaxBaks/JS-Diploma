export const calculateAttack = ({character: allie}, {character: enemy}) => {
    return Math.max(allie.attack - enemy.defence, allie.attack * 0.1);
}

export const healthAfterAttack = (allie, enemy) => {
    return enemy.character.health - calculateAttack(allie, enemy) < 0 ? 0 : enemy.character.health - calculateAttack(allie, enemy);
}