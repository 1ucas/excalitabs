import {
  checkIcon,
  CloseIcon,
  emptyIcon,
  file as fileIcon,
  PlusIcon,
} from "@excalidraw/excalidraw/components/icons";
import { useExcalidrawSetAppState } from "@excalidraw/excalidraw/components/App";
import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import { getDrawingDisplayName, type LocalDrawing } from "../data/drawings";

import "./MobileDrawingsMenu.scss";

export const MobileDrawingsMenu = React.memo(
  ({
    activeDrawingId,
    drawings,
    onCreateDrawing,
    onRequestDeleteDrawing,
    onSelectDrawing,
  }: {
    activeDrawingId: string;
    drawings: readonly LocalDrawing[];
    onCreateDrawing: () => void;
    onRequestDeleteDrawing: (id: string) => void;
    onSelectDrawing: (id: string) => void;
  }) => {
    const setAppState = useExcalidrawSetAppState();
    const canDeleteDrawing = drawings.length > 1;

    const closeMenu = React.useCallback(() => {
      setAppState({ openMenu: null });
    }, [setAppState]);

    return (
      <MainMenu.Sub>
        <MainMenu.Sub.Trigger icon={fileIcon}>Drawings</MainMenu.Sub.Trigger>
        <MainMenu.Sub.Content className="mobile-drawings-menu">
          <MainMenu.Item icon={PlusIcon} onSelect={onCreateDrawing}>
            New drawing
          </MainMenu.Item>
          <MainMenu.Separator />
          <div
            className="mobile-drawings-menu__list"
            role="group"
            aria-label="Drawings"
          >
            {drawings.map((drawing, index) => {
              const name = getDrawingDisplayName(drawing, index);
              const isActive = drawing.id === activeDrawingId;

              return (
                <div className="mobile-drawings-menu__row" key={drawing.id}>
                  <button
                    type="button"
                    className={`dropdown-menu-item dropdown-menu-item-base mobile-drawings-menu__drawing ${
                      isActive ? "dropdown-menu-item--selected" : ""
                    }`.trim()}
                    aria-current={isActive ? "true" : undefined}
                    title={name}
                    onClick={() => {
                      onSelectDrawing(drawing.id);
                      closeMenu();
                    }}
                  >
                    <div className="dropdown-menu-item__icon">
                      {isActive ? checkIcon : emptyIcon}
                    </div>
                    <div className="dropdown-menu-item__text">
                      <span className="mobile-drawings-menu__drawing-name">
                        {name}
                      </span>
                    </div>
                  </button>
                  {canDeleteDrawing && (
                    <button
                      type="button"
                      className="mobile-drawings-menu__close"
                      title={`Close ${name}`}
                      aria-label={`Close ${name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRequestDeleteDrawing(drawing.id);
                        closeMenu();
                      }}
                    >
                      {CloseIcon}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </MainMenu.Sub.Content>
      </MainMenu.Sub>
    );
  },
);

MobileDrawingsMenu.displayName = "MobileDrawingsMenu";
