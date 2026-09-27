"use client";

import { useSyncExternalStore } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserInput } from "@repo/contracts/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { themes, useTheme } from "@/components/theme";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "cn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { UpdateUserInput } from "@repo/contracts/user";
import {
  refreshProfileData,
  refreshWorkspaceIdentity,
  resetAfterSessionChanged,
} from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";

const subscribeToNothing = () => () => {
  // Hydration happens once; there is no later change to hear about.
};

/** The one section that needs no account, so signed-out /settings renders it alone. */
export const AppearanceSettings = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  // The stored theme is only readable in the browser, so the server cannot
  // render the checked radio; show it once hydration is done.
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const onChangeTheme = (value: string) => {
    setTheme(value);
  };

  return (
    <div className={cn("outline-border space-y-4 px-3 py-4 outline -outline-offset-1", className)}>
      <Label>Appearance</Label>
      <RadioGroup
        className="grid grid-cols-4 gap-4 md:grid-cols-6"
        onValueChange={onChangeTheme}
        value={hydrated ? theme : null}
      >
        {themes.map((option) => (
          <label className="flex flex-col items-center gap-1" key={option.id}>
            <RadioGroupItem
              id={option.id}
              value={option.id}
              className="peer sr-only after:absolute after:inset-0"
            />
            <div
              style={{ background: option.color }}
              className="border-border peer-data-checked:border-ring size-10 cursor-pointer rounded-full border shadow-xs transition-colors"
            />
            <span className="peer-data-unchecked:text-muted-foreground text-center text-xs">
              {option.label}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};

export const SettingsForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useWorkspaceUser();
  const updateUser = useMutation(
    orpc.user.updateUser.mutationOptions({
      onSuccess: () =>
        Promise.all([refreshProfileData(queryClient), refreshWorkspaceIdentity(queryClient)]),
    }),
  );

  // No invalidation policy: this only sends an email. It changes nothing that
  // is held in the query cache.
  const requestPasswordReset = useMutation(orpc.auth.requestPasswordReset.mutationOptions());

  const signOut = useMutation(
    orpc.auth.signOut.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        // Reset before navigating so the home page does not render as the
        // signed-out user's predecessor.
        await resetAfterSessionChanged(queryClient);
        router.replace("/");
        // signOut is a fetch, not a Server Action, so nothing else evicts the
        // signed-in pages Back would otherwise restore from Next's client cache.
        router.refresh();
      },
    }),
  );

  // No invalidation policy needed: this does a full document load, which throws
  // the whole query cache away.
  const deleteUser = useMutation(
    orpc.user.deleteUser.mutationOptions({
      onError: () => toast.error("Could not delete account. Please try again."),
      onSuccess: () => window.location.assign("/"),
    }),
  );

  const form = useForm({
    defaultValues: {
      email: user?.email ?? "",
    },
    resolver: zodResolver(updateUserInput),
  });

  const onSubmit = (data: UpdateUserInput) => {
    const submitted = form.getValues("email");
    const promise = updateUser.mutateAsync(data, {
      // Typing during the save keeps its text, and stays dirty for the next blur.
      onSuccess: () => form.reset(data, { keepValues: form.getValues("email") !== submitted }),
    });
    toast.promise(promise, {
      error: "Could not update Settings. Please try again.",
      loading: "Updating Settings...",
      success: "Settings successfully updated",
    });
  };

  const handleRequestPasswordReset = () => {
    const promise = requestPasswordReset.mutateAsync({
      email: user?.email ?? "",
    });
    toast.promise(promise, {
      error: "Could not send password reset email. Please try again.",
      loading: "Requesting password reset...",
      success: "Password reset email sent",
    });
  };

  return (
    <div className="-space-y-px">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="last-of-type:rounded-b-none">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <input
                    placeholder="Your email"
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      if (form.getFieldState("email").isDirty && !updateUser.isPending) {
                        void form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  You will continue to be anonymous, this email is just used for account recovery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <div className="outline-border space-y-2 px-3 py-4 outline -outline-offset-1">
        <Label>Password</Label>
        <Button type="button" variant="secondary" onClick={handleRequestPasswordReset}>
          Request password reset
        </Button>
      </div>
      <AppearanceSettings />
      <div className="outline-border flex gap-2 rounded-b-md px-3 py-4 outline -outline-offset-1">
        <Button
          type="button"
          variant="outline"
          loading={signOut.isPending}
          onClick={() => signOut.mutate()}
        >
          Log out
        </Button>
        <AlertDialog>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes your account, letters, and likes. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                loading={deleteUser.isPending}
                onClick={() => deleteUser.mutate()}
              >
                Delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
