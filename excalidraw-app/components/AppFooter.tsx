import { Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { DrawingTabs } from "./DrawingTabs";
import { EncryptedIcon } from "./EncryptedIcon";

import type { LocalDrawing } from "../data/drawings";

export const AppFooter = React.memo(
  ({
    activeDrawingId,
    drawings,
    onChange,
    onCreateDrawing,
    onSelectDrawing,
  }: {
    activeDrawingId: string;
    drawings: readonly LocalDrawing[];
    onChange: () => void;
    onCreateDrawing: () => void;
    onSelectDrawing: (id: string) => void;
  }) => {
    return (
      <Footer>
        <div className="app-footer">
          <div className="app-footer__drawings">
            <DrawingTabs
              activeDrawingId={activeDrawingId}
              drawings={drawings}
              onCreate={onCreateDrawing}
              onSelect={onSelectDrawing}
            />
          </div>
          <div className="app-footer__status">
            {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
            {!isExcalidrawPlusSignedUser && <EncryptedIcon />}
          </div>
        </div>
      </Footer>
    );
  },
);
