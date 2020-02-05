const icons = {
  level: String.fromCodePoint(0x1f396),
  attack: String.fromCodePoint(0x2694),
  defence: String.fromCodePoint(0x1f6e1),
  health: String.fromCodePoint(0x2764),
};

const tooltips = ({
  level, attack, defence, health,
}) => {
  return `${icons.level}${level} ${icons.attack}${attack} ${icons.defence}${defence} ${icons.health}${health}`;
};

export default tooltips;
