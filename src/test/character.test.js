import Character from '../js/Classes/Character';
import Daemon from '../js/Classes/Daemon';
import Swordsman from '../js/Classes/Swordsman';

test('Should throw error when creating nonclassed character', () => {
  const received = () => new Character();
  expect(received).toThrow('You cannot create a nonclassed Character!');
});

test('Should be ok error when create Daemon', () => {
  const received = new Daemon(1);
  const expected = {
    level: 1,
    attack: 10,
    defence: 40,
    health: 50,
    type: 'daemon',
  };
  expect(received).toEqual(expected);
});


test('Should be ok when create Swordsman', () => {
  const received = new Swordsman(1);
  const expected = {
    level: 1,
    attack: 40,
    defence: 10,
    health: 50,
    type: 'swordsman',
  };
  expect(received).toEqual(expected);
});