import { CloseIcon, PlusIcon } from "@excalidraw/excalidraw/components/icons";
import React from "react";

import { getDrawingDisplayName, type LocalDrawing } from "../data/drawings";

import "./DrawingTabs.scss";

type RenamingState = {
  drawingId: string;
  draftName: string;
  originalName: string;
};

export const DrawingTabs = React.memo(
  ({
    drawings,
    activeDrawingId,
    onSelect,
    onCreate,
    onRename,
    onRequestDelete,
  }: {
    drawings: readonly LocalDrawing[];
    activeDrawingId: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onRename: (id: string, name: string) => void;
    onRequestDelete: (id: string) => void;
  }) => {
    const canDeleteDrawing = drawings.length > 1;
    const activeTabRef = React.useRef<HTMLDivElement | null>(null);
    const renameInputRef = React.useRef<HTMLInputElement | null>(null);
    const renamingRef = React.useRef<RenamingState | null>(null);
    const [renaming, setRenaming] = React.useState<RenamingState | null>(null);

    const setRenamingState = React.useCallback(
      (nextRenaming: RenamingState | null) => {
        renamingRef.current = nextRenaming;
        setRenaming(nextRenaming);
      },
      [],
    );

    const startRenaming = React.useCallback(
      (drawingId: string, name: string) => {
        setRenamingState({
          drawingId,
          draftName: name,
          originalName: name,
        });
      },
      [setRenamingState],
    );

    const commitRenaming = React.useCallback(() => {
      const currentRenaming = renamingRef.current;

      if (!currentRenaming) {
        return;
      }

      const nextName = currentRenaming.draftName.trim();
      renamingRef.current = null;
      setRenaming(null);

      if (nextName && nextName !== currentRenaming.originalName) {
        onRename(currentRenaming.drawingId, nextName);
      }
    }, [onRename]);

    const cancelRenaming = React.useCallback(() => {
      renamingRef.current = null;
      setRenaming(null);
    }, []);

    React.useEffect(() => {
      activeTabRef.current?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
    }, [activeDrawingId, drawings.length]);

    React.useEffect(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, [renaming?.drawingId]);

    React.useEffect(() => {
      if (
        renaming &&
        !drawings.some((drawing) => drawing.id === renaming.drawingId)
      ) {
        cancelRenaming();
      }
    }, [cancelRenaming, drawings, renaming]);

    return (
      <div className="drawing-tabs">
        <div
          className="drawing-tabs__scroll"
          role="tablist"
          aria-label="Drawings"
        >
          {drawings.map((drawing, index) => {
            const isActive = drawing.id === activeDrawingId;
            const name = getDrawingDisplayName(drawing, index);
            const isRenaming = renaming?.drawingId === drawing.id;

            return (
              <div
                key={drawing.id}
                ref={isActive ? activeTabRef : undefined}
                className={
                  isActive
                    ? "drawing-tabs__tab-item drawing-tabs__tab-item--active"
                    : "drawing-tabs__tab-item"
                }
              >
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    aria-label={`Rename ${name}`}
                    className="drawing-tabs__rename-input"
                    value={renaming.draftName}
                    onBlur={commitRenaming}
                    onChange={(event) => {
                      const currentRenaming = renamingRef.current;

                      if (!currentRenaming) {
                        return;
                      }

                      setRenamingState({
                        ...currentRenaming,
                        draftName: event.target.value,
                      });
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.stopPropagation();
                        commitRenaming();
                        return;
                      }

                      if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        cancelRenaming();
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className="drawing-tabs__tab"
                    title={name}
                    onClick={() => {
                      if (isActive) {
                        startRenaming(drawing.id, name);
                        return;
                      }

                      onSelect(drawing.id);
                    }}
                  >
                    <span className="drawing-tabs__tab-label">{name}</span>
                  </button>
                )}
                {canDeleteDrawing && (
                  <button
                    type="button"
                    className="drawing-tabs__close"
                    title={`Close ${name}`}
                    aria-label={`Close ${name}`}
                    onClick={() => onRequestDelete(drawing.id)}
                  >
                    {CloseIcon}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="drawing-tabs__new"
          title="New drawing"
          aria-label="New drawing"
          onClick={onCreate}
        >
          {PlusIcon}
        </button>
      </div>
    );
  },
);

DrawingTabs.displayName = "DrawingTabs";
