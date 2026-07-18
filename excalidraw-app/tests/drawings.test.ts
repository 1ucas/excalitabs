import { getDefaultAppState } from "@excalidraw/excalidraw/appState";

import type { AppState } from "@excalidraw/excalidraw/types";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { STORAGE_KEYS } from "../app_constants";
import {
  createEmptyDrawing,
  importDrawingsFromLocalStorage,
  removeDrawing,
  renameDrawing,
  updateActiveDrawing,
  updateDrawingInLocalStorage,
  type LocalDrawing,
  type LocalDrawingsState,
} from "../data/drawings";

const createAppState = (name: string): AppState => ({
  ...getDefaultAppState(),
  name,
  width: 1,
  height: 1,
  offsetTop: 0,
  offsetLeft: 0,
});

const createStoredDrawing = (
  id: string,
  name: string,
  created = 1,
): LocalDrawing => ({
  id,
  name,
  elements: [],
  appState: createAppState(name),
  created,
  updated: created,
});

describe("local drawings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("names the first drawing Drawing 1 instead of the default Excalidraw filename", () => {
    const state = importDrawingsFromLocalStorage({
      elements: [],
      appState: createAppState("Untitled-2026-04-25-1234"),
    });

    expect(state.drawings[0].name).toBe("Drawing 1");
    expect(state.drawings[0].appState?.name).toBe("Drawing 1");
  });

  it("migrates an existing default-named first drawing to Drawing 1", () => {
    const drawing = createStoredDrawing("drawing-1", "Untitled-2026-04-25");

    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_DRAWINGS,
      JSON.stringify({
        version: 1,
        activeDrawingId: drawing.id,
        drawings: [drawing],
      }),
    );

    const state = importDrawingsFromLocalStorage();

    expect(state.drawings[0].name).toBe("Drawing 1");
    expect(state.drawings[0].appState?.name).toBe("Drawing 1");
  });

  it("keeps Drawing 1 when saving the default Excalidraw filename", () => {
    const drawing = createStoredDrawing("drawing-1", "Drawing 1");
    const state = updateActiveDrawing(
      {
        activeDrawingId: drawing.id,
        drawings: [drawing],
      },
      [],
      createAppState("Untitled-2026-04-25-1234"),
    );

    expect(state.drawings[0].name).toBe("Drawing 1");
    expect(state.drawings[0].appState?.name).toBe("Drawing 1");
  });

  it("removes a drawing and selects the next available drawing when active", () => {
    const drawing1 = createStoredDrawing("drawing-1", "Drawing 1");
    const drawing2 = createStoredDrawing("drawing-2", "Drawing 2", 2);
    const drawing3 = createStoredDrawing("drawing-3", "Drawing 3", 3);
    const state: LocalDrawingsState = {
      activeDrawingId: drawing2.id,
      drawings: [drawing1, drawing2, drawing3],
    };

    const result = removeDrawing(state, drawing2.id);

    expect(result.state.activeDrawingId).toBe(drawing3.id);
    expect(result.activeDrawing.id).toBe(drawing3.id);
    expect(result.state.drawings.map((drawing) => drawing.id)).toEqual([
      drawing1.id,
      drawing3.id,
    ]);
  });

  it("creates the next drawing name without duplicating names after deletion", () => {
    const drawing2 = createStoredDrawing("drawing-2", "Drawing 2");
    const state: LocalDrawingsState = {
      activeDrawingId: drawing2.id,
      drawings: [drawing2],
    };

    const result = createEmptyDrawing(state, createAppState("Drawing 2"));

    expect(result.drawing.name).toBe("Drawing 3");
    expect(result.drawing.appState?.name).toBe("Drawing 3");
  });

  it("renames a drawing and keeps the stored app state name in sync", () => {
    const drawing = createStoredDrawing("drawing-1", "Drawing 1");
    const state = renameDrawing(
      {
        activeDrawingId: drawing.id,
        drawings: [drawing],
      },
      drawing.id,
      "  Planning  ",
    );

    expect(state.drawings[0].name).toBe("Planning");
    expect(state.drawings[0].appState?.name).toBe("Planning");
    expect(state.drawings[0].updated).not.toBe(drawing.updated);
  });

  it("keeps the current drawing name when renaming to an empty value", () => {
    const drawing = createStoredDrawing("drawing-1", "Drawing 1");
    const originalState: LocalDrawingsState = {
      activeDrawingId: drawing.id,
      drawings: [drawing],
    };
    const state = renameDrawing(originalState, drawing.id, "   ");

    expect(state).toBe(originalState);
  });

  it("saves under the editor's drawing even when another browser tab moved the active pointer", () => {
    const drawing1 = createStoredDrawing("drawing-1", "Drawing 1");
    const drawing2 = createStoredDrawing("drawing-2", "Drawing 2", 2);

    // another browser tab switched the stored active drawing to drawing-2,
    // while this tab is still editing drawing-1
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_DRAWINGS,
      JSON.stringify({
        version: 1,
        activeDrawingId: drawing2.id,
        drawings: [drawing1, drawing2],
      }),
    );

    const element = { id: "element-1", isDeleted: false } as ExcalidrawElement;
    updateDrawingInLocalStorage(
      drawing1.id,
      [element],
      createAppState("Drawing 1"),
    );

    const state = importDrawingsFromLocalStorage();
    const saved1 = state.drawings.find(({ id }) => id === drawing1.id);
    const saved2 = state.drawings.find(({ id }) => id === drawing2.id);

    expect(saved1?.elements.map(({ id }) => id)).toEqual([element.id]);
    expect(saved2?.elements).toEqual([]);
    // the other tab's active pointer must not be clobbered
    expect(state.activeDrawingId).toBe(drawing2.id);
  });

  it("skips saving when the drawing was deleted in another browser tab", () => {
    const drawing2 = createStoredDrawing("drawing-2", "Drawing 2", 2);

    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_DRAWINGS,
      JSON.stringify({
        version: 1,
        activeDrawingId: drawing2.id,
        drawings: [drawing2],
      }),
    );

    const element = { id: "element-1", isDeleted: false } as ExcalidrawElement;
    updateDrawingInLocalStorage(
      "drawing-1",
      [element],
      createAppState("Drawing 1"),
    );

    const state = importDrawingsFromLocalStorage();

    expect(state.drawings.map(({ id }) => id)).toEqual([drawing2.id]);
    expect(state.drawings[0].elements).toEqual([]);
  });
});
