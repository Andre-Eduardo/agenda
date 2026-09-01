import {downloadFile} from '@agenda-app/client';

/**
 * Downloads a file from the API and hands it to the browser as a save.
 *
 * The server names the file through `Content-Disposition`; `fallbackName` only covers a
 * response that omits the header.
 *
 * @param url - The API endpoint that streams the file.
 * @param fallbackName - The file name to use when the response does not carry one.
 * @param params - Query parameters for the request.
 */
export const saveFile = async (url: string, fallbackName?: string, params?: Record<string, unknown>): Promise<void> => {
    const {content, fileName} = await downloadFile(url, params);
    const downloadName = fileName ?? fallbackName;
    const objectUrl = URL.createObjectURL(content);
    const anchor = window.document.createElement('a');

    anchor.href = objectUrl;
    // Always set (even to ''): an <a> with no `download` attribute navigates the current
    // tab to the blob instead of downloading it — browsers render PDFs inline when that happens.
    anchor.download = downloadName ?? '';

    anchor.click();

    URL.revokeObjectURL(objectUrl);
};
