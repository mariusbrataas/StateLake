import { IKeys } from "./interfaces";

export function is(x: any, y: any) {
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
}

export function generateIdentifier() {
  return Math.random().toString().substr(2, 8);
}

export const generateID = (function () {
  // Available tokens
  const TOKENS =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

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
      .map((idx) => TOKENS[idx % TOKENS.length])
      .join("")}-${count.toString(36)}`;
  };
})();

interface IStore {
  show: boolean;
  people: {
    [id: string]: {
      name: string;
      email: string;
      phone: string;
      address: {
        planet: "earth" | "mars";
        country: string;
      };
    };
  };
}

const store: IStore = null;

type Keys<
  T,
  K0 extends IKeys<T>,
  K1 extends IKeys<T[K0]>,
  K2 extends IKeys<T[K0][K1]>,
  K3 extends IKeys<T[K0][K1][K2]>
> = [K0, K1, K2, K3];

type IKey = string | number;

interface IStruct {
  [key: string]: IStruct | any;
}

function f<
  T extends IStruct,
  K0 extends IKeys<T>,
  K1 extends IKeys<T[K0]>,
  K2 extends IKeys<T[K0][K1]>,
  K3 extends IKeys<T[K0][K1][K2]>,
  K4 extends IKeys<T[K0][K1][K2][K3]>
>(
  state: T,
  ...args: [K0?, K1?, K2?, K3?, K4?]
): K0 extends IKey
  ? K1 extends IKey
    ? K2 extends IKey
      ? K3 extends IKey
        ? K4 extends IKey
          ? T[K0][K1][K2][K3][K4]
          : T[K0][K1][K2][K3]
        : T[K0][K1][K2]
      : T[K0][K1]
    : T[K0]
  : T {
  console.log("Key");
  return null;
}

const k = f(store, "people", "sfasdf", "address", "country");
