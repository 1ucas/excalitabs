import { getDefaultAppState } from "@excalidraw/excalidraw/appState";

import type { AppState } from "@excalidraw/excalidraw/types";

import { STORAGE_KEYS } from "../app_constants";
import {
  createEmptyDrawing,
  importDrawingsFromLocalStorage,
  removeDrawing,
  renameDrawing,
  updateActiveDrawing,
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
});
