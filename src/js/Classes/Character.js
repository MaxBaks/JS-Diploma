export default class Character {
  constructor(level, type = 'generic', attack = 0, defence = 0, health = 50) {
    if (new.target === Character) {
      throw new Error('You cannot create a nonclassed Character!');
    }
    this.level = level;
    this.attack = attack;
    this.defence = defence;
    this.health = health;
    this.type = type;
  }
}
