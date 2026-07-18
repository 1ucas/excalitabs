import { fireEvent, render, screen, within } from "@testing-library/react";
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
  it("keeps the selected drawing name visible in the active tab", () => {
    render(
      <DrawingTabs
        activeDrawingId="drawing-2"
        drawings={[
          createDrawing("drawing-1", "Drawing 1"),
          createDrawing("drawing-2", "Brainstorming Notes"),
        ]}
        onCreate={vi.fn()}
        onRename={vi.fn()}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    const activeTab = screen.getByRole("tab", {
      name: "Brainstorming Notes",
    });

    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(activeTab).toHaveTextContent("Brainstorming Notes");
    expect(activeTab.closest(".drawing-tabs__tab-item")).toHaveClass(
      "drawing-tabs__tab-item--active",
    );
  });

  it("keeps tab overflow separate from the pinned new drawing button", () => {
    render(
      <DrawingTabs
        activeDrawingId="drawing-1"
        drawings={[
          createDrawing("drawing-1", "Drawing 1"),
          createDrawing("drawing-2", "Drawing 2"),
        ]}
        onCreate={vi.fn()}
        onRename={vi.fn()}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Drawings" });

    expect(within(tablist).getAllByRole("tab")).toHaveLength(2);
    expect(
      within(tablist).queryByRole("button", { name: "New drawing" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New drawing" }),
    ).toBeInTheDocument();
  });

  it("renames the active drawing when the rename input loses focus", () => {
    const onRename = vi.fn();

    render(
      <DrawingTabs
        activeDrawingId="drawing-1"
        drawings={[
          createDrawing("drawing-1", "Drawing 1"),
          createDrawing("drawing-2", "Drawing 2"),
        ]}
        onCreate={vi.fn()}
        onRename={onRename}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Drawing 1" }));

    const input = screen.getByRole("textbox", {
      name: "Rename Drawing 1",
    });
    fireEvent.change(input, { target: { value: "Renamed drawing" } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith("drawing-1", "Renamed drawing");
  });

  it("cancels active drawing renaming on escape", () => {
    const onRename = vi.fn();

    render(
      <DrawingTabs
        activeDrawingId="drawing-1"
        drawings={[
          createDrawing("drawing-1", "Drawing 1"),
          createDrawing("drawing-2", "Drawing 2"),
        ]}
        onCreate={vi.fn()}
        onRename={onRename}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Drawing 1" }));

    const input = screen.getByRole("textbox", {
      name: "Rename Drawing 1",
    });
    fireEvent.change(input, { target: { value: "Renamed drawing" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Drawing 1" })).toBeInTheDocument();
  });

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
        onRename={vi.fn()}
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
        onRename={vi.fn()}
        onRequestDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Close Drawing 1" }),
    ).not.toBeInTheDocument();
  });
});
