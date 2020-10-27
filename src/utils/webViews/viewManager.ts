import { AbstractWebView } from '../../runtime';
import { ext } from '../../extensionGlobals';

export function registerWebviews(...views: AbstractWebView[]): void {
    views.forEach(view => {
        ext.webViews.push(view);
    });
}

export function disposeWebviews(shouldRemoveWebViews?: boolean, shouldCloseGlobalViews?: boolean): void {
    ext.webViews.forEach(view => {
        if (view !== undefined && view.getPanel() !== undefined) {
            // If global dispose is true, dispose all else dispose only the non global views.
            if (shouldCloseGlobalViews !== undefined && shouldCloseGlobalViews) {
                view.dispose();
            } else if (!view.getIsGlobal()) {
                view.dispose();
            }
        }
    });
    // Remove existing web views when resetting the workspace.
    if (shouldRemoveWebViews !== undefined && shouldRemoveWebViews) {
        removeWebViews();
    }
}

function removeWebViews(): void {
    ext.webViews.splice(0, ext.webViews.length); 
}