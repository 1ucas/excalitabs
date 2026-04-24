import {
  CANVAS_SEARCH_TAB,
  DEFAULT_SIDEBAR,
  randomId,
} from "@excalidraw/common";
import {
  clearAppStateForLocalStorage,
  getDefaultAppState,
} from "@excalidraw/excalidraw/appState";
import { getNonDeletedElements } from "@excalidraw/element";

import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/element/types";

import { STORAGE_KEYS } from "../app_constants";

export type LocalDrawing = {
  id: string;
  name: string;
  elements: readonly ExcalidrawElement[];
  appState: ImportedDataState["appState"];
  created: number;
  updated: number;
};

export type LocalDrawingsState = {
  activeDrawingId: string;
  drawings: LocalDrawing[];
};

const LOCAL_DRAWINGS_VERSION = 1;

type StoredLocalDrawingsState = LocalDrawingsState & {
  version: number;
};

const createDrawingName = (index: number) => `Drawing ${index + 1}`;

const prepareAppState = (
  appState: Partial<AppState> | null | undefined,
): ImportedDataState["appState"] => {
  if (!appState) {
    return null;
  }

  const nextAppState = clearAppStateForLocalStorage(appState);

  if (
    nextAppState.openSidebar?.name === DEFAULT_SIDEBAR.name &&
    nextAppState.openSidebar.tab === CANVAS_SEARCH_TAB
  ) {
    nextAppState.openSidebar = null;
  }

  return nextAppState;
};

export const getDrawingDisplayName = (
  drawing: Pick<LocalDrawing, "appState" | "name">,
  index = 0,
) => {
  return drawing.appState?.name || drawing.name || createDrawingName(index);
};

const createLocalDrawing = ({
  id = randomId(),
  name,
  elements = [],
  appState = null,
  created = Date.now(),
  updated = created,
}: {
  id?: string;
  name?: string | null;
  elements?: readonly ExcalidrawElement[] | null;
  appState?: ImportedDataState["appState"];
  created?: number;
  updated?: number;
}): LocalDrawing => {
  const preparedAppState = prepareAppState(appState);

  return {
    id,
    name: preparedAppState?.name || name || createDrawingName(0),
    elements: getNonDeletedElements(elements || []),
    appState: preparedAppState,
    created,
    updated,
  };
};

const normalizeDrawingsState = (
  data: Partial<StoredLocalDrawingsState> | null,
): LocalDrawingsState | null => {
  if (!data || !Array.isArray(data.drawings) || !data.drawings.length) {
    return null;
  }

  const drawings = data.drawings
    .filter((drawing): drawing is LocalDrawing => {
      return (
        !!drawing &&
        typeof drawing.id === "string" &&
        Array.isArray(drawing.elements)
      );
    })
    .map((drawing, index) =>
      createLocalDrawing({
        ...drawing,
        name: getDrawingDisplayName(drawing, index),
      }),
    );

  if (!drawings.length) {
    return null;
  }

  const activeDrawingId = drawings.some(
    (drawing) => drawing.id === data.activeDrawingId,
  )
    ? data.activeDrawingId!
    : drawings[0].id;

  return {
    activeDrawingId,
    drawings,
  };
};

export const saveDrawingsToLocalStorage = (state: LocalDrawingsState) => {
  const data: StoredLocalDrawingsState = {
    version: LOCAL_DRAWINGS_VERSION,
    activeDrawingId: state.activeDrawingId,
    drawings: state.drawings,
  };

  localStorage.setItem(
    STORAGE_KEYS.LOCAL_STORAGE_DRAWINGS,
    JSON.stringify(data),
  );
};

export const importDrawingsFromLocalStorage = (
  fallbackData?: ImportedDataState,
): LocalDrawingsState => {
  let savedDrawings: string | null = null;

  try {
    savedDrawings = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_DRAWINGS);
  } catch (error: any) {
    console.error(error);
  }

  if (savedDrawings) {
    try {
      const restored = normalizeDrawingsState(JSON.parse(savedDrawings));
      if (restored) {
        return restored;
      }
    } catch (error: any) {
      console.error(error);
    }
  }

  const drawing = createLocalDrawing({
    elements: fallbackData?.elements,
    appState: fallbackData?.appState,
    name: fallbackData?.appState?.name,
  });
  const state = {
    activeDrawingId: drawing.id,
    drawings: [drawing],
  };

  try {
    saveDrawingsToLocalStorage(state);
  } catch (error: any) {
    console.error(error);
  }

  return state;
};

export const getActiveDrawing = (state: LocalDrawingsState) => {
  return (
    state.drawings.find((drawing) => drawing.id === state.activeDrawingId) ||
    state.drawings[0]
  );
};

export const updateActiveDrawing = (
  state: LocalDrawingsState,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
): LocalDrawingsState => {
  const activeDrawing = getActiveDrawing(state);
  const updatedDrawing = createLocalDrawing({
    ...activeDrawing,
    name: appState.name || activeDrawing.name,
    elements,
    appState,
    updated: Date.now(),
  });

  return {
    activeDrawingId: updatedDrawing.id,
    drawings: state.drawings.map((drawing) =>
      drawing.id === updatedDrawing.id ? updatedDrawing : drawing,
    ),
  };
};

export const updateActiveDrawingInLocalStorage = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const state = updateActiveDrawing(
    importDrawingsFromLocalStorage({ elements, appState }),
    elements,
    appState,
  );
  saveDrawingsToLocalStorage(state);
  return state;
};

export const createEmptyDrawing = (
  state: LocalDrawingsState,
  appState: AppState,
): { state: LocalDrawingsState; drawing: LocalDrawing } => {
  const drawing = createLocalDrawing({
    name: createDrawingName(state.drawings.length),
    appState: {
      ...getDefaultAppState(),
      theme: appState.theme,
      penMode: appState.penMode,
      penDetected: appState.penDetected,
      name: createDrawingName(state.drawings.length),
      showWelcomeScreen: true,
    },
  });

  return {
    drawing,
    state: {
      activeDrawingId: drawing.id,
      drawings: state.drawings.concat(drawing),
    },
  };
};

export const addImportedDrawing = (
  state: LocalDrawingsState,
  data: Pick<ImportedDataState, "appState" | "elements">,
): { state: LocalDrawingsState; drawing: LocalDrawing } => {
  const activeDrawing = getActiveDrawing(state);
  const activeDrawingIndex = state.drawings.findIndex(
    (drawing) => drawing.id === activeDrawing.id,
  );
  const shouldReuseActiveDrawing = activeDrawing.elements.length === 0;

  const importedDrawing = createLocalDrawing({
    id: shouldReuseActiveDrawing ? activeDrawing.id : undefined,
    name:
      data.appState?.name ||
      createDrawingName(
        shouldReuseActiveDrawing ? activeDrawingIndex : state.drawings.length,
      ),
    elements: data.elements,
    appState: data.appState,
    created: shouldReuseActiveDrawing ? activeDrawing.created : undefined,
  });

  return {
    drawing: importedDrawing,
    state: {
      activeDrawingId: importedDrawing.id,
      drawings: shouldReuseActiveDrawing
        ? state.drawings.map((drawing) =>
            drawing.id === activeDrawing.id ? importedDrawing : drawing,
          )
        : state.drawings.concat(importedDrawing),
    },
  };
};
