import { Entries } from "https://esm.sh/v135/type-fest@4.8.3";

declare global {
  interface ObjectConstructor {
    entries<T extends object>(o: T): Entries<T>;
  }
}
