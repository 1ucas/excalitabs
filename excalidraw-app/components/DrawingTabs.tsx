import { CloseIcon, PlusIcon } from "@excalidraw/excalidraw/components/icons";
import React from "react";

import { getDrawingDisplayName, type LocalDrawing } from "../data/drawings";

import "./DrawingTabs.scss";

export const DrawingTabs = React.memo(
  ({
    drawings,
    activeDrawingId,
    onSelect,
    onCreate,
    onRequestDelete,
  }: {
    drawings: readonly LocalDrawing[];
    activeDrawingId: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onRequestDelete: (id: string) => void;
  }) => {
    const canDeleteDrawing = drawings.length > 1;

    return (
      <div className="drawing-tabs" role="tablist" aria-label="Drawings">
        {drawings.map((drawing, index) => {
          const isActive = drawing.id === activeDrawingId;
          const name = getDrawingDisplayName(drawing, index);

          return (
            <div
              key={drawing.id}
              className={
                isActive
                  ? "drawing-tabs__tab-item drawing-tabs__tab-item--active"
                  : "drawing-tabs__tab-item"
              }
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="drawing-tabs__tab"
                title={name}
                onClick={() => onSelect(drawing.id)}
              >
                <span className="drawing-tabs__tab-label">{name}</span>
              </button>
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
