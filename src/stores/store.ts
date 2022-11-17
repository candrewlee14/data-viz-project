import { writable, type Writable } from "svelte/store";

export const years : Writable<Array<number>> = writable([2020]);