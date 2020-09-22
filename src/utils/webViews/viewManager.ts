import { AbstractWebView } from '../../runtime';

const webviews: AbstractWebView[] = [];

export function registerWebviews(...views: AbstractWebView[]): void {
    views.forEach(view => {
        webviews.push(view);
    });
}

export function disposeWebviews(shouldRemoveWebViews?: boolean, shouldCloseGlobalViews?: boolean): void {
    webviews.forEach(view => {
        if (view && view.getPanel()) {
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
    webviews.splice(0, webviews.length); 
}