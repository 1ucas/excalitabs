import {
  loginIcon,
  ExcalLogo,
  eyeIcon,
  LoadIcon,
} from "@excalidraw/excalidraw/components/icons";
import { MainMenu, useEditorInterface } from "@excalidraw/excalidraw/index";
import React from "react";

import { isDevEnv } from "@excalidraw/common";
import { getShortcutFromShortcutName } from "@excalidraw/excalidraw/actions/shortcuts";
import { useI18n } from "@excalidraw/excalidraw/i18n";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";
import { isExcalidrawPlusSignedUser } from "../app_constants";

import { saveDebugState } from "./DebugCanvas";
import { MobileDrawingsMenu } from "./MobileDrawingsMenu";

import type { LocalDrawing } from "../data/drawings";

export const AppMainMenu: React.FC<{
  activeDrawingId: string;
  drawings: readonly LocalDrawing[];
  onLoadScene: () => void;
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  onCreateDrawing: () => void;
  onRequestDeleteDrawing: (id: string) => void;
  onSelectDrawing: (id: string) => void;
  theme: Theme | "system";
  refresh: () => void;
}> = React.memo((props) => {
  const { t } = useI18n();
  const editorInterface = useEditorInterface();
  const isMobile = editorInterface.formFactor === "phone";

  return (
    <MainMenu>
      <MainMenu.Item
        icon={LoadIcon}
        onSelect={props.onLoadScene}
        data-testid="load-button"
        shortcut={getShortcutFromShortcutName("loadScene")}
        aria-label={t("buttons.load")}
      >
        {t("buttons.load")}
      </MainMenu.Item>
      {isMobile && (
        <MobileDrawingsMenu
          activeDrawingId={props.activeDrawingId}
          drawings={props.drawings}
          onCreateDrawing={props.onCreateDrawing}
          onRequestDeleteDrawing={props.onRequestDeleteDrawing}
          onSelectDrawing={props.onSelectDrawing}
        />
      )}
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      {props.isCollabEnabled && (
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={props.isCollaborating}
          onSelect={() => props.onCollabDialogOpen()}
        />
      )}
      <MainMenu.DefaultItems.CommandPalette className="highlighted" />
      <MainMenu.DefaultItems.SearchMenu />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      <MainMenu.ItemLink
        icon={ExcalLogo}
        href={`${
          import.meta.env.VITE_APP_PLUS_LP
        }/plus?utm_source=excalidraw&utm_medium=app&utm_content=hamburger`}
        className=""
      >
        Excalidraw+
      </MainMenu.ItemLink>
      <MainMenu.DefaultItems.Socials />
      <MainMenu.ItemLink
        icon={loginIcon}
        href={`${import.meta.env.VITE_APP_PLUS_APP}${
          isExcalidrawPlusSignedUser ? "" : "/sign-up"
        }?utm_source=signin&utm_medium=app&utm_content=hamburger`}
        className="highlighted"
      >
        {isExcalidrawPlusSignedUser ? "Sign in" : "Sign up"}
      </MainMenu.ItemLink>
      {isDevEnv() && (
        <MainMenu.Item
          icon={eyeIcon}
          onSelect={() => {
            if (window.visualDebug) {
              delete window.visualDebug;
              saveDebugState({ enabled: false });
            } else {
              window.visualDebug = { data: [] };
              saveDebugState({ enabled: true });
            }
            props?.refresh();
          }}
        >
          Visual Debug
        </MainMenu.Item>
      )}
      <MainMenu.Separator />
      <MainMenu.DefaultItems.Preferences />
      <MainMenu.DefaultItems.ToggleTheme allowSystemTheme theme={props.theme} />
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  );
});
