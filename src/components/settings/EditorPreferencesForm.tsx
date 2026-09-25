"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEditorPreferences } from "@/components/editor/EditorPreferencesProvider";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  EDITOR_THEME_LABELS,
  type EditorTheme,
} from "@/lib/editor-preferences";

const fontSizeItems = EDITOR_FONT_SIZES.map((size) => ({ value: size, label: `${size}px` }));
const tabSizeItems = EDITOR_TAB_SIZES.map((size) => ({ value: size, label: `${size} spaces` }));
const themeItems = EDITOR_THEMES.map((theme) => ({ value: theme, label: EDITOR_THEME_LABELS[theme] }));

function SettingRow({
  id,
  label,
  description,
  children,
}: {
  id: string;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences();

  return (
    <div className="space-y-5">
      <SettingRow id="editor-font-size" label="Font size" description="Text size in the code editor.">
        <Select
          items={fontSizeItems}
          value={preferences.fontSize}
          onValueChange={(value) => value !== null && updatePreference("fontSize", value)}
        >
          <SelectTrigger id="editor-font-size" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontSizeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow id="editor-tab-size" label="Tab size" description="Spaces inserted per indent level.">
        <Select
          items={tabSizeItems}
          value={preferences.tabSize}
          onValueChange={(value) => value !== null && updatePreference("tabSize", value)}
        >
          <SelectTrigger id="editor-tab-size" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabSizeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow id="editor-theme" label="Theme" description="Color scheme for code.">
        <Select
          items={themeItems}
          value={preferences.theme}
          onValueChange={(value) => value !== null && updatePreference("theme", value as EditorTheme)}
        >
          <SelectTrigger id="editor-theme" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow id="editor-word-wrap" label="Word wrap" description="Wrap long lines instead of scrolling.">
        <Switch
          id="editor-word-wrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => updatePreference("wordWrap", checked)}
        />
      </SettingRow>

      <SettingRow id="editor-minimap" label="Minimap" description="Show a code overview beside the editor.">
        <Switch
          id="editor-minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => updatePreference("minimap", checked)}
        />
      </SettingRow>
    </div>
  );
}
