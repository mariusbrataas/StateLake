export function is(x: any, y: any) {
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
}

export function generateIdentifier() {
  return Math.random().toString().substr(2, 8);
}

export const generateID = (function () {
  // Available tokens
  const TOKENS =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

  // Base ID
  const day_one = 1577833200000; // Midnight, new years eve, 2020
  const timestamp = day_one - new Date().getTime();
  const base_id = `${timestamp.toString(36)}`;

  // Prevent collisions
  var count = -1;

  // Return id generator
  return function () {
    count++;
    return `${base_id}-${Array.from(
      window.crypto.getRandomValues(new Uint8Array(4))
    )
      .map(idx => TOKENS[idx % TOKENS.length])
      .join('')}-${count.toString(36)}`;
  };
})();
