import { calcTileType, calcHealthLevel } from '../js/utils';

test('should return top-left', () => {
  const received = calcTileType(0, 8);
  expect(received).toEqual('top-left');
});

test('should return top', () => {
  const received = calcTileType(5, 8);
  expect(received).toEqual('top');
});

test('should return top-right', () => {
  const received = calcTileType(7, 8);
  expect(received).toEqual('top-right');
});

test('should return left', () => {
  const received = calcTileType(16, 8);
  expect(received).toEqual('left');
});

test('should return center', () => {
  const received = calcTileType(18, 8);
  expect(received).toEqual('center');
});

test('should return right', () => {
  const received = calcTileType(23, 8);
  expect(received).toEqual('right');
});

test('should return bottom-left', () => {
  const received = calcTileType(56, 8);
  expect(received).toEqual('bottom-left');
});

test('should return bottom', () => {
  const received = calcTileType(60, 8);
  expect(received).toEqual('bottom');
});

test('should return bottom-right', () => {
  const received = calcTileType(63, 8);
  expect(received).toEqual('bottom-right');
});

test('health level should be critical', () => {
  const expected = 'critical';
  const received = calcHealthLevel(10);
  expect(received).toEqual(expected);
});

test('health level should be normal', () => {
  const expected = 'normal';
  const received = calcHealthLevel(40);
  expect(received).toEqual(expected);
});

test('health level should be high', () => {
  const expected = 'high';
  const received = calcHealthLevel(90);
  expect(received).toEqual(expected);
});
