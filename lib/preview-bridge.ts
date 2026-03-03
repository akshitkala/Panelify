 /**
 * Preview Bridge
 * Handles communication between Panelify Editor and the Site Iframe
 */

export const PREVIEW_MESSAGE_TYPE = 'PANELIFY_CONTENT_UPDATE';

export interface PreviewMessage {
    type: typeof PREVIEW_MESSAGE_TYPE;
    section: string;
    fields: Record<string, string>;
}

/**
 * Sender (Editor): Send updated fields to the iframe
 */
export function sendPreviewUpdate(iframe: HTMLIFrameElement, section: string, fields: Record<string, string>) {
    if (!iframe.contentWindow) return;

    const message: PreviewMessage = {
        type: PREVIEW_MESSAGE_TYPE,
        section,
        fields
    };

    iframe.contentWindow.postMessage(message, '*');
}

/**
 * Receiver (Site): Listen for updates and apply to state
 * In a real Next.js app, this would be a hook used in the layout
 */
export function registerPreviewListener(onUpdate: (section: string, fields: Record<string, string>) => void) {
    if (typeof window === 'undefined') return;

    const handler = (event: MessageEvent) => {
        const data = event.data as PreviewMessage;

        if (data && data.type === PREVIEW_MESSAGE_TYPE) {
            onUpdate(data.section, data.fields);
        }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
}
