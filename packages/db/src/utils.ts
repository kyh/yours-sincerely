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

type DefaultValueFields = { id?: string; updatedAt?: string };

export const getDefaultValues = <O extends DefaultValuesOptions>(options?: O): DefaultValues<O> => {
  const values: DefaultValueFields = {};
  if (options?.withId !== false) values.id = randomUUID();
  if (options?.withUpdatedAt !== false) values.updatedAt = new Date().toISOString();
  // SAFETY: a key is present exactly when its option is not `false`, which is
  // the mapping `DefaultValues<O>` encodes; TypeScript cannot connect the
  // runtime branches to the conditional type.
  return values as DefaultValues<O>;
};
