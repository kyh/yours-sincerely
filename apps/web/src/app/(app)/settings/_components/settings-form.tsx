"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserInput } from "@repo/contracts/user";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { themes, useTheme } from "@/components/theme";
import { toast } from "@repo/ui/components/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleHelpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { UpdateUserInput } from "@repo/contracts/user";
import {
  refreshPostContent,
  refreshProfileData,
  refreshWorkspaceIdentity,
} from "@/lib/query-policies";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { useTRPC } from "@/trpc/react";

export const SettingsForm = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const user = useWorkspaceUser();

  const updateUser = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: () =>
        Promise.all([
          refreshProfileData(queryClient, trpc),
          refreshWorkspaceIdentity(queryClient, trpc),
        ]),
    }),
  );

  // No invalidation policy: this only sends an email. It changes nothing that
  // is held in the query cache.
  const requestPasswordReset = useMutation(trpc.auth.requestPasswordReset.mutationOptions());

  const signOut = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: async () => {
        // Identity, and every identity-scoped field on the feed (isLiked, block
        // filtering), are now stale. Refresh before navigating so the home page
        // does not render as the signed-out user's predecessor.
        await Promise.all([
          refreshWorkspaceIdentity(queryClient, trpc),
          refreshPostContent(queryClient, trpc),
        ]);
        router.replace("/");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  // No invalidation policy needed: this does a full document load, which throws
  // the whole query cache away.
  const deleteUser = useMutation(
    trpc.user.deleteUser.mutationOptions({
      onSuccess: () => window.location.assign("/"),
      onError: () => toast.error("Could not delete account. Please try again."),
    }),
  );

  const form = useForm({
    resolver: zodResolver(updateUserInput),
    defaultValues: {
      email: user?.email ?? "",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: UpdateUserInput) => {
    const promise = updateUser.mutateAsync(data);
    toast.promise(promise, {
      loading: "Updating Settings...",
      success: "Settings successfully updated",
      error: "Could not update Settings. Please try again.",
    });
  };

  const handleRequestPasswordReset = () => {
    const promise = requestPasswordReset.mutateAsync({
      email: user?.email ?? "",
    });
    toast.promise(promise, {
      loading: "Requesting password reset...",
      success: "Password reset email sent",
      error: "Could not send password reset email. Please try again.",
    });
  };

  const onChangeTheme = (value: string) => {
    setTheme(value);
  };

  return (
    <div className="-space-y-px">
      <Form {...form}>
        <form onBlur={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="last-of-type:rounded-b-none">
                <FormLabel>
                  Email
                  <Tooltip>
                    <TooltipTrigger render={<CircleHelpIcon className="size-3" />} />
                    <TooltipContent>
                      You will continue to be anonymous, this email is just used for account
                      recovery.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <input placeholder="Your email" {...field} />
                </FormControl>
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
      <div className="outline-border space-y-4 px-3 py-4 outline -outline-offset-1">
        <Label>Appearance</Label>
        <RadioGroup
          className="grid grid-cols-4 gap-4 md:grid-cols-6"
          onValueChange={onChangeTheme}
          value={theme}
        >
          {themes.map((theme) => (
            <label className="flex flex-col items-center gap-1" key={theme.id}>
              <RadioGroupItem
                id={theme.id}
                value={theme.value}
                className="peer sr-only after:absolute after:inset-0"
              />
              <div
                style={{ background: theme.color }}
                className="border-border peer-data-checked:border-ring size-10 cursor-pointer rounded-full border shadow-xs transition-colors"
              />
              <span className="peer-data-unchecked:text-muted-foreground text-center text-xs">
                {theme.label}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>
      <div className="outline-border flex gap-2 rounded-b-md px-3 py-4 outline -outline-offset-1">
        <Button
          type="button"
          variant="outline"
          loading={signOut.isPending}
          onClick={() => signOut.mutate()}
        >
          Log out
        </Button>
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="destructive" />}>
            Delete account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your account, letters, and likes. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Button
              type="button"
              variant="destructive"
              loading={deleteUser.isPending}
              onClick={() => deleteUser.mutate()}
            >
              Delete my account
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
