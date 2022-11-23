import { writable, type Writable } from "svelte/store";

export const years : Writable<Array<number>> = writable([2020]);

export const sectors : Writable<Set<number>> = writable(new Set());

export const showExport : Writable<boolean> = writable(true);