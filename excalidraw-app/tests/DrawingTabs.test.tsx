import { fireEvent, render, screen } from "@testing-library/react";
import { getDefaultAppState } from "@excalidraw/excalidraw/appState";
import { vi } from "vitest";

import { DrawingTabs } from "../components/DrawingTabs";

import type { LocalDrawing } from "../data/drawings";

const createDrawing = (id: string, name: string): LocalDrawing => ({
  id,
  name,
  elements: [],
  appState: {
    ...getDefaultAppState(),
    name,
  },
  created: 1,
  updated: 1,
});

describe("DrawingTabs", () => {
  it("renders a close button for each tab when multiple drawings are open", () => {
    const onRequestDelete = vi.fn();

    render(
      <DrawingTabs
        activeDrawingId="drawing-1"
        drawings={[
          createDrawing("drawing-1", "Drawing 1"),
          createDrawing("drawing-2", "Drawing 2"),
        ]}
        onCreate={vi.fn()}
        onRequestDelete={onRequestDelete}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close Drawing 2" }));

    expect(onRequestDelete).toHaveBeenCalledWith("drawing-2");
  });

  it("keeps the last remaining drawing open", () => {
    render(
      <DrawingTabs
        activeDrawingId="drawing-1"
        drawings={[createDrawing("drawing-1", "Drawing 1")]}
        onCreate={vi.fn()}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Close Drawing 1" }),
    ).not.toBeInTheDocument();
  });
});
