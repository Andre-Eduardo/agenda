import {ROBOTO_FONT_FAMILY, robotoFonts, robotoVirtualFs} from '../pdfmake-fonts';

describe('robotoFonts', () => {
    it.each(['normal', 'bold', 'italics', 'bolditalics'] as const)(
        'should reference the "%s" variant as a filename that the virtual fs can resolve',
        (variant) => {
            const fileName = robotoFonts[ROBOTO_FONT_FAMILY]?.[variant];

            expect(typeof fileName).toBe('string');
            expect(robotoVirtualFs.existsSync(fileName as string)).toBe(true);
        }
    );
});

describe('robotoVirtualFs', () => {
    it('should decode a known font file into a valid, non-empty buffer', () => {
        const fileName = robotoFonts[ROBOTO_FONT_FAMILY]?.normal as string;
        const buffer = robotoVirtualFs.readFileSync(fileName);

        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    });

    it('should report an unknown filename as not existing', () => {
        expect(robotoVirtualFs.existsSync('does-not-exist.ttf')).toBe(false);
    });
});
