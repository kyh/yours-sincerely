import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "@/lib/api";
import { deleteRegisteredPushDevice, type RegisteredPushDevice } from "@/lib/push-token-store";

/** Releases a registered push device: server cleanup is authoritative — a
    failure throws before the local record is deleted, so the capability
    survives for a later retry. Native unregistration stays with callers
    (logout wants it even when the server is unreachable). */
export const usePushDeviceCleanup = () => {
  const { mutateAsync: cleanupPushDevice } = useMutation(
    trpc.auth.cleanupPushDevice.mutationOptions({ networkMode: "always" }),
  );

  return useCallback(
    async (device: RegisteredPushDevice) => {
      await cleanupPushDevice({ capability: device.cleanupCapability, token: device.token });
      await deleteRegisteredPushDevice();
    },
    [cleanupPushDevice],
  );
};
