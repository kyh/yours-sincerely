import { useSyncExternalStore } from "react";
import { noop } from "@tanstack/react-query";

const subscribe = () => noop;

const readYear = () => new Date().getFullYear();

/** The clock's calendar year, read through React's external-store hook so render stays pure. */
export const useCurrentYear = () => useSyncExternalStore(subscribe, readYear, readYear);
