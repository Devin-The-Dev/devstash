"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/lib/editor-preferences";

type EditorPreferencesContextValue = {
  preferences: EditorPreferences;
  updatePreference: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void;
};

export const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  // Last state the server confirmed — what we roll back to if a save fails.
  const savedRef = useRef(initialPreferences);
  const latestRef = useRef(initialPreferences);

  const updatePreference = useCallback<EditorPreferencesContextValue["updatePreference"]>(
    async (key, value) => {
      const next = { ...latestRef.current, [key]: value };
      latestRef.current = next;
      setPreferences(next);

      const result = await updateEditorPreferences(next);
      if (result.success) {
        savedRef.current = result.data;
        toast.success("Editor preferences saved");
      } else {
        latestRef.current = savedRef.current;
        setPreferences(savedRef.current);
        toast.error(result.error);
      }
    },
    [],
  );

  const value = useMemo(() => ({ preferences, updatePreference }), [preferences, updatePreference]);

  return <EditorPreferencesContext.Provider value={value}>{children}</EditorPreferencesContext.Provider>;
}

/** Falls back to defaults outside a provider so editors still render (e.g. in isolation). */
export function useEditorPreferences(): EditorPreferencesContextValue {
  const context = useContext(EditorPreferencesContext);
  return (
    context ?? {
      preferences: DEFAULT_EDITOR_PREFERENCES,
      updatePreference: () => {},
    }
  );
}
