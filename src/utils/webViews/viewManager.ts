import { AbstractWebView } from '../../runtime';

const webviews: AbstractWebView[] = [];

export function registerWebviews(...views: AbstractWebView[]): void {
    views.forEach(view => {
        webviews.push(view);
    });
}

export function disposeWebviews(): void {
    webviews.splice(0, webviews.length).forEach(view => {
        if (view && view.getPanel()) {
            view.dispose();
        }
    });
}