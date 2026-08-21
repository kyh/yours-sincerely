import { Gesture } from "react-native-gesture-handler";

/**
 * `Gesture.Pan` is a gesture factory, but its capitalized name makes React's
 * compiler lint read every call inside a component as a component call. The
 * React Compiler has an allowlist for that check; oxlint's port of it does not,
 * and calls from module scope are outside the check's reach.
 */
export const panGesture = () => Gesture.Pan();
