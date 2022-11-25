import { GridDefaults } from "constants/WidgetConstants";
import { APP_MODE } from "entities/App";
import { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getWidgetMetaProps, getWidgets } from "sagas/selectors";
import { previewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "selectors/entitiesSelector";

export function* shouldWidgetsCollapse() {
  const isPreviewMode: boolean = yield select(previewModeSelector);
  const appMode: APP_MODE = yield select(getAppMode);

  return isPreviewMode || appMode === APP_MODE.PUBLISHED;
}

export function* getChildOfContainerLikeWidget(
  containerLikeWidget: FlattenedWidgetProps,
) {
  // Todo: Abstraction leak (abhinav): This is an abstraction leak
  // I don't have a better solution right now.
  // What we're trying to acheive is to skip the canvas which
  // is not currently visible in the tabs widget.
  if (containerLikeWidget.type === "TABS_WIDGET") {
    // Get the current tabs widget meta
    const tabsMeta: { selectedTabWidgetId: string } | undefined = yield select(
      getWidgetMetaProps,
      containerLikeWidget.widgetId,
    );
    // If we have a meta for the tabs widget
    if (tabsMeta) return tabsMeta.selectedTabWidgetId;

    // If there are not meta values for the tabs widget
    // we get the first tab using the `index`
    const firstTab = Object.values(
      containerLikeWidget.tabsObj as Record<
        string,
        { widgetId: string; index: number }
      >,
    ).find((entry: { widgetId: string; index: number }) => entry.index === 0);

    return firstTab?.widgetId;
  } else if (Array.isArray(containerLikeWidget.children)) {
    // First child of a container like widget will be the canvas widget within in
    // Note: If we have this feature for List Widget, we will need to consider it.
    return containerLikeWidget.children[0];
  }
}

export function* getMinHeightBasedOnChildren(
  widgetId: string,
  changesSoFar: Record<string, { bottomRow: number; topRow: number }>,
  ignoreParent = false,
  tree: AutoHeightLayoutTreeReduxState,
) {
  // Starting with no height
  let minHeightInRows = 0;

  // Should we be able to collapse widgets
  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  // Get all widgets in the DSL
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  const { children = [], parentId } = stateWidgets[widgetId];
  // If we need to consider the parent height
  if (parentId && !ignoreParent) {
    // Get the parentHeight in rows
    let parentHeightInRows = tree[parentId].bottomRow - tree[parentId].topRow;

    // If the parent has changed so far.
    if (changesSoFar.hasOwnProperty(parentId)) {
      parentHeightInRows =
        changesSoFar[parentId].bottomRow - changesSoFar[parentId].topRow;
    }

    // The canvas will be an extension smaller than the parent?
    minHeightInRows = parentHeightInRows - GridDefaults.CANVAS_EXTENSION_OFFSET;
    // If the canvas is empty return the parent's height in rows, without
    // the canvas extension offset
    if (!children.length) {
      return minHeightInRows;
    }
  }

  // For each child widget id.
  for (const childWidgetId of children) {
    // If we've changed the widget's bottomRow via computations
    const { detachFromLayout } = stateWidgets[childWidgetId];
    // We ignore widgets like ModalWidget which don't occupy parent's space.
    // detachFromLayout helps us identify such widgets
    if (detachFromLayout) continue;

    // Get the child widget's dimenstions from the tree
    const { bottomRow, topRow } = tree[childWidgetId];

    // If this child has changed so far during computations
    if (changesSoFar.hasOwnProperty(childWidgetId)) {
      const collapsing =
        changesSoFar[childWidgetId].bottomRow ===
        changesSoFar[childWidgetId].topRow;

      // If this child is collapsing, don't consider it
      if (!(shouldCollapse && collapsing))
        minHeightInRows = Math.max(
          minHeightInRows,
          changesSoFar[childWidgetId].bottomRow,
        );
      // If we need to get the existing bottomRow from the state
    } else {
      // If this child is to collapse, don't consider it.
      if (!(shouldCollapse && bottomRow === topRow))
        minHeightInRows = Math.max(minHeightInRows, bottomRow);
    }
  }

  return minHeightInRows;
}