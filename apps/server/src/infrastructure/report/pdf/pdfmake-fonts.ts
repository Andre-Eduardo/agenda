import vfs from 'pdfmake/build/vfs_fonts';
import type {TFontDictionary} from 'pdfmake/interfaces';

const FONT_FILES = {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
} as const;

export const ROBOTO_FONT_FAMILY = 'Roboto';

/**
 * pdfmake's `resolveUrls` step (added in 0.3.x, meant for remote font URLs) mutates any font
 * descriptor value it doesn't recognize as a plain string — passing decoded Buffers directly
 * corrupts them. The documented workaround is the same one pdfmake's own vfs_fonts bundle uses:
 * reference fonts by filename here, and hand the printer a `virtualfs` (see `robotoVirtualFs`
 * below) that resolves those filenames to Buffers only when a font is actually embedded.
 */
export const robotoFonts: TFontDictionary = {
    [ROBOTO_FONT_FAMILY]: FONT_FILES,
};

const decode = (fileName: string): Buffer => {
    const encoded = vfs[fileName];

    /* istanbul ignore if -- defensive guard against a pdfmake upgrade renaming/removing a vfs font file; unreachable while the shipped vfs stays intact */
    if (!encoded) {
        throw new Error(`pdfmake no longer ships "${fileName}"; the report PDF font source moved.`);
    }

    return Buffer.from(encoded, 'base64');
};

export const robotoVirtualFs = {
    existsSync: (fileName: string): boolean => fileName in vfs,
    readFileSync: (fileName: string): Buffer => decode(fileName),
};
