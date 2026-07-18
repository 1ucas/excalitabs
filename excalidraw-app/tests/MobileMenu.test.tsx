import { Excalidraw, WelcomeScreen } from "@excalidraw/excalidraw";
import { UI } from "@excalidraw/excalidraw/tests/helpers/ui";
import {
  fireEvent,
  mockBoundingClientRect,
  render,
  restoreOriginalGetBoundingClientRect,
  screen,
} from "@excalidraw/excalidraw/tests/test-utils";

import { AppMainMenu } from "../components/AppMainMenu";

import type { LocalDrawing } from "../data/drawings";

const drawings: LocalDrawing[] = [
  {
    id: "drawing-1",
    name: "Drawing 1",
    elements: [],
    appState: null,
    created: 1,
    updated: 1,
  },
];

describe("Test MobileMenu", () => {
  const { h } = window;
  const dimensions = { height: 400, width: 800 };

  beforeAll(() => {
    mockBoundingClientRect(dimensions);
  });

  beforeEach(async () => {
    await render(
      <Excalidraw>
        <AppMainMenu
          activeDrawingId={drawings[0].id}
          drawings={drawings}
          onLoadScene={() => {}}
          onCollabDialogOpen={() => {}}
          isCollaborating={false}
          isCollabEnabled={false}
          onCreateDrawing={() => {}}
          onRequestDeleteDrawing={() => {}}
          onSelectDrawing={() => {}}
          theme="light"
          refresh={() => {}}
        />
        <WelcomeScreen />
      </Excalidraw>,
    );
    h.app.refreshEditorInterface();
  });

  afterAll(() => {
    restoreOriginalGetBoundingClientRect();
  });

  it("should set editor interface correctly", () => {
    expect(h.app.editorInterface.formFactor).toBe("phone");
  });

  it("should initialize with welcome screen and hide once user interacts", async () => {
    expect(document.querySelector(".welcome-screen-center")).toMatchSnapshot();
    UI.clickTool("rectangle");
    expect(document.querySelector(".welcome-screen-center")).toBeNull();
  });

  it("should expose drawings from the mobile main menu", () => {
    fireEvent.click(screen.getByTestId("main-menu-trigger"));

    expect(screen.getByText("Drawings")).toBeInTheDocument();
  });
});
