import {
  CANVAS_SEARCH_TAB,
  DEFAULT_SIDEBAR,
  DEFAULT_FILENAME,
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

const DRAWING_NAME_REGEXP = /^Drawing (\d+)$/;

const createNextDrawingName = (state: LocalDrawingsState) => {
  const highestDrawingNumber = state.drawings.reduce((highest, drawing) => {
    const match = drawing.name.match(DRAWING_NAME_REGEXP);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return createDrawingName(
    Math.max(highestDrawingNumber, state.drawings.length),
  );
};

const isDefaultExcalidrawName = (name: string | null | undefined) => {
  return (
    !!name &&
    (name === DEFAULT_FILENAME || name.startsWith(`${DEFAULT_FILENAME}-`))
  );
};

export const getDrawingNameForAppState = (
  appStateName: string | null | undefined,
  drawingName: string | null | undefined,
  index = 0,
) => {
  const fallbackName = drawingName || createDrawingName(index);

  if (
    isDefaultExcalidrawName(appStateName) &&
    !isDefaultExcalidrawName(fallbackName)
  ) {
    return fallbackName;
  }

  return appStateName || fallbackName;
};

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
  return getDrawingNameForAppState(drawing.appState?.name, drawing.name, index);
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
  const drawingName = getDrawingNameForAppState(preparedAppState?.name, name);

  return {
    id,
    name: drawingName,
    elements: getNonDeletedElements(elements || []),
    appState: preparedAppState
      ? {
          ...preparedAppState,
          name: drawingName,
        }
      : preparedAppState,
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
    .map((drawing, index) => {
      const shouldUseGeneratedName =
        index === 0 &&
        isDefaultExcalidrawName(drawing.name) &&
        isDefaultExcalidrawName(drawing.appState?.name);
      const name = shouldUseGeneratedName
        ? createDrawingName(index)
        : getDrawingDisplayName(drawing, index);

      return createLocalDrawing({
        ...drawing,
        appState: drawing.appState
          ? {
              ...drawing.appState,
              name,
            }
          : drawing.appState,
        name,
      });
    });

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
    appState: fallbackData?.appState
      ? {
          ...fallbackData.appState,
          name: createDrawingName(0),
        }
      : {
          ...getDefaultAppState(),
          name: createDrawingName(0),
        },
    name: createDrawingName(0),
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

export const updateDrawing = (
  state: LocalDrawingsState,
  drawingId: string,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
): LocalDrawingsState => {
  const drawing = state.drawings.find(({ id }) => id === drawingId);

  if (!drawing) {
    return state;
  }

  const nextName = getDrawingNameForAppState(appState.name, drawing.name);
  const updatedDrawing = createLocalDrawing({
    ...drawing,
    name: nextName,
    elements,
    appState: {
      ...appState,
      name: nextName,
    },
    updated: Date.now(),
  });

  return {
    ...state,
    drawings: state.drawings.map((existingDrawing) =>
      existingDrawing.id === updatedDrawing.id
        ? updatedDrawing
        : existingDrawing,
    ),
  };
};

export const updateActiveDrawing = (
  state: LocalDrawingsState,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
): LocalDrawingsState => {
  const activeDrawing = getActiveDrawing(state);

  return {
    ...updateDrawing(state, activeDrawing.id, elements, appState),
    activeDrawingId: activeDrawing.id,
  };
};

export const removeDrawing = (
  state: LocalDrawingsState,
  drawingId: string,
): { state: LocalDrawingsState; activeDrawing: LocalDrawing } => {
  if (state.drawings.length <= 1) {
    return {
      state,
      activeDrawing: getActiveDrawing(state),
    };
  }

  const removedDrawingIndex = state.drawings.findIndex(
    (drawing) => drawing.id === drawingId,
  );

  if (removedDrawingIndex === -1) {
    return {
      state,
      activeDrawing: getActiveDrawing(state),
    };
  }

  const drawings = state.drawings.filter((drawing) => drawing.id !== drawingId);
  const activeDrawingId =
    state.activeDrawingId === drawingId
      ? drawings[Math.min(removedDrawingIndex, drawings.length - 1)].id
      : state.activeDrawingId;
  const activeDrawing =
    drawings.find((drawing) => drawing.id === activeDrawingId) || drawings[0];

  return {
    activeDrawing,
    state: {
      activeDrawingId: activeDrawing.id,
      drawings,
    },
  };
};

export const renameDrawing = (
  state: LocalDrawingsState,
  drawingId: string,
  name: string,
): LocalDrawingsState => {
  const nextName = name.trim();

  if (!nextName) {
    return state;
  }

  let didRename = false;
  const drawings = state.drawings.map((drawing, index) => {
    if (drawing.id !== drawingId) {
      return drawing;
    }

    if (getDrawingDisplayName(drawing, index) === nextName) {
      return drawing;
    }

    didRename = true;

    return {
      ...drawing,
      name: nextName,
      appState: drawing.appState
        ? {
            ...drawing.appState,
            name: nextName,
          }
        : drawing.appState,
      updated: Date.now(),
    };
  });

  if (!didRename) {
    return state;
  }

  return {
    ...state,
    drawings,
  };
};

export const updateDrawingInLocalStorage = (
  drawingId: string,
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  // the drawing content must be written under the id the editor is actually
  // showing — the stored activeDrawingId may have been moved by another
  // browser tab in the meantime. If the drawing no longer exists (deleted
  // in another browser tab), the deletion wins and the write is skipped.
  const state = importDrawingsFromLocalStorage({ elements, appState });
  const nextState = updateDrawing(state, drawingId, elements, appState);

  if (nextState !== state) {
    saveDrawingsToLocalStorage(nextState);
  }

  return nextState;
};

export const createEmptyDrawing = (
  state: LocalDrawingsState,
  appState: AppState,
): { state: LocalDrawingsState; drawing: LocalDrawing } => {
  const name = createNextDrawingName(state);
  const drawing = createLocalDrawing({
    name,
    appState: {
      ...getDefaultAppState(),
      theme: appState.theme,
      penMode: appState.penMode,
      penDetected: appState.penDetected,
      name,
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
  const fallbackName = shouldReuseActiveDrawing
    ? createDrawingName(activeDrawingIndex)
    : createNextDrawingName(state);
  const name = isDefaultExcalidrawName(data.appState?.name)
    ? fallbackName
    : data.appState?.name || fallbackName;

  const importedDrawing = createLocalDrawing({
    id: shouldReuseActiveDrawing ? activeDrawing.id : undefined,
    name,
    elements: data.elements,
    appState: data.appState
      ? {
          ...data.appState,
          name,
        }
      : data.appState,
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
