"use client";

import type { Label as LabelPrimitive } from "radix-ui";
import type {
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormProps,
} from "react-hook-form";
import type { ZodType, ZodTypeDef } from "zod";
import * as React from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { cn } from "@repo/ui/utils";
import { Slot } from "radix-ui";
import {
  useForm as __useForm,
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { Label } from "./label";

const useForm = <
  TOut extends FieldValues,
  TDef extends ZodTypeDef,
  TIn extends FieldValues,
>(
  props: Omit<UseFormProps<TIn>, "resolver"> & {
    schema: ZodType<TOut, TDef, TIn>;
  },
) => {
  const form = __useForm<TIn, unknown, any>({
    ...props,
    resolver: standardSchemaResolver(props.schema, undefined),
  });

  return form;
};

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

export const FormItem = ({
  className,
  noStyles,
  ...props
}: React.ComponentProps<"div"> & { noStyles?: boolean }) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        className={cn(
          noStyles
            ? null
            : "group outline-border focus-within:outline-primary flex flex-col gap-0.5 px-3 pt-2.5 pb-1.5 outline -outline-offset-1 first-of-type:rounded-t-md last-of-type:rounded-b-md focus-within:relative focus-within:outline focus-within:-outline-offset-1",
          className,
        )}
        {...props}
      />
    </FormItemContext.Provider>
  );
};

export const FormLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn(
        "group-focus-within:text-primary",
        error && "text-destructive",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
};

export const FormControl = ({
  ...props
}: React.ComponentProps<typeof Slot.Root>) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
};

export const FormDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-muted-foreground text-[0.8rem]", className)}
      {...props}
    />
  );
};

export const FormMessage = ({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      className={cn("text-destructive text-[0.8rem]", className)}
      {...props}
    >
      {body}
    </p>
  );
};

export { useForm, useFormField, Form, FormField };

export { useFieldArray } from "react-hook-form";
