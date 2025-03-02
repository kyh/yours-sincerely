import { randomUUID } from "crypto";

type DefaultValuesOptions = {
  withId?: boolean;
  withUpdatedAt?: boolean;
};

type DefaultValues<O extends DefaultValuesOptions> = {
  id: O["withId"] extends false ? never : string;
  updatedAt: O["withUpdatedAt"] extends false ? never : string;
} extends infer T
  ? { [K in keyof T as T[K] extends never ? never : K]: T[K] }
  : never;

export const getDefaultValues = <O extends DefaultValuesOptions>(
  { withId = true, withUpdatedAt = true }: O = {} as O,
): DefaultValues<O> => {
  return {
    ...(withId ? { id: randomUUID() } : {}),
    ...(withUpdatedAt ? { updatedAt: new Date().toISOString() } : {}),
  } as DefaultValues<O>;
};
