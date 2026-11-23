import { useAuth } from "../auth";

/** Whether the signed-in account keeps notes (D-074). */
export function useCanKeepNotes(): boolean {
  const { state } = useAuth();
  return (
    state.status === "signed-in" &&
    state.user.permissions.includes("notes.manage")
  );
}
