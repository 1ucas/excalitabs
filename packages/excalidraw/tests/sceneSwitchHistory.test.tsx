import React from "react";
import { queryByTestId } from "@testing-library/react";
import { vi } from "vitest";

import { reseed } from "@excalidraw/common";
import { CaptureUpdateAction } from "@excalidraw/element";

import "@excalidraw/utils/test-utils";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import "../global.d.ts";

import { getDefaultAppState } from "../appState";
import { restoreAppState, restoreElements } from "../data/restore";
import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { Keyboard, UI } from "./helpers/ui";
import { act, render, unmountComponent } from "./test-utils";

import type { ImportedDataState } from "../data/types";

const { h } = window;

/**
 * Mirrors how a host app (e.g. excalidraw-app's drawing tabs) swaps the
 * whole scene for another drawing: replace elements & appState without
 * recording history, then clear the undo/redo stacks.
 */
const switchToDrawing = (
  elements: readonly ExcalidrawElement[],
  appState: ImportedDataState["appState"] = null,
) => {
  act(() => {
    const restored = restoreElements(elements, null, {
      repairBindings: true,
      deleteInvisibleElements: true,
    });

    API.updateScene({
      elements: restored,
      appState: {
        ...restoreAppState(appState, getDefaultAppState()),
        isLoading: false,
        openDialog: null,
        openMenu: null,
        openPopup: null,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
    // what `excalidrawAPI.history.clear()` invokes under the hood
    h.history.clear();
  });
};

describe("switching drawings (updateScene + history.clear)", () => {
  let container: HTMLElement;

  beforeEach(async () => {
    unmountComponent();
    vi.clearAllMocks();
    reseed(7);

    const result = await render(<Excalidraw handleKeyboardGlobally={true} />);
    container = result.container;
  });

  it("clears undo/redo stacks and disables the undo/redo buttons", () => {
    const rectAId = UI.createElement("rectangle", {
      x: 10,
      y: 10,
      width: 50,
      height: 50,
    }).id;

    UI.createElement("rectangle", {
      x: 100,
      y: 10,
      width: 50,
      height: 50,
    });

    Keyboard.undo();

    expect(API.getUndoStack().length).toBe(1);
    expect(API.getRedoStack().length).toBe(1);
    expect(queryByTestId(container, "button-undo")).not.toBeDisabled();
    expect(queryByTestId(container, "button-redo")).not.toBeDisabled();

    const tabAElements = h.elements.map((el) => ({ ...el }));

    // switch to an empty drawing
    switchToDrawing([]);

    expect(API.getUndoStack().length).toBe(0);
    expect(API.getRedoStack().length).toBe(0);
    // buttons must reflect the cleared stacks, not the pre-switch state
    expect(queryByTestId(container, "button-undo")).toBeDisabled();
    expect(queryByTestId(container, "button-redo")).toBeDisabled();

    // undo/redo in the new drawing must not resurrect the old drawing
    Keyboard.undo();
    Keyboard.redo();
    expect(h.elements.filter((el) => !el.isDeleted)).toEqual([]);

    // drawing in the new tab and undoing removes only the new element
    const rectBId = UI.createElement("rectangle", {
      x: 200,
      y: 200,
      width: 30,
      height: 30,
    }).id;

    Keyboard.undo();
    expect(h.elements.filter((el) => !el.isDeleted)).toEqual([]);
    Keyboard.redo();
    expect(h.elements.filter((el) => !el.isDeleted).map((el) => el.id)).toEqual(
      [rectBId],
    );

    // switching back restores the previous drawing (rectA visible, the
    // undone rectangle stays deleted) with a fresh history
    switchToDrawing(tabAElements);

    expect(h.elements.filter((el) => !el.isDeleted).map((el) => el.id)).toEqual(
      [rectAId],
    );
    expect(API.getUndoStack().length).toBe(0);
    expect(queryByTestId(container, "button-undo")).toBeDisabled();
    expect(queryByTestId(container, "button-redo")).toBeDisabled();

    const rectA2Id = UI.createElement("rectangle", {
      x: 300,
      y: 300,
      width: 20,
      height: 20,
    }).id;

    Keyboard.undo();
    Keyboard.undo();

    const visibleIds = h.elements
      .filter((el) => !el.isDeleted)
      .map((el) => el.id);
    expect(visibleIds).toEqual([rectAId]);
    expect(visibleIds).not.toContain(rectA2Id);
  });
});
