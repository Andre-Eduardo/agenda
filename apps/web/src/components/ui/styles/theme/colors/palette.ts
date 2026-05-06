export type ColorScale = {
    25: string;
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
};

type GrayVariants = {
    light: ColorScale;
    dark: ColorScale;
};

type Primary = {
    white: string;
    black: string;
    transparent: string;
    gray: GrayVariants;
    brand: ColorScale & {850: string};
    success: ColorScale;
    warning: ColorScale;
    danger: ColorScale;
    info: ColorScale;
    accent: {muted: string; base: string; soft: string; 'gradient-light': string; 'gradient-dark': string};
};

type Secondary = {
    grayBlue: ColorScale;
    grayIron: ColorScale;
    green: ColorScale;
    indigo: ColorScale;
    red: Omit<ColorScale, 25 | 950>;
    yellow: ColorScale;
    copper: ColorScale;
    orange: ColorScale;
    orangeDark: ColorScale;
    violet: ColorScale;
    purple: ColorScale;
    fuchsia: ColorScale;
    pink: ColorScale;
    blue: ColorScale;
    blueLight: ColorScale;
    teal: ColorScale;
};

export const primary = {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    accent: {
        muted: '#1AA5B233',
        soft: '#1BCEB0',
        base: '#1AA5B2',
        'gradient-light': 'linear-gradient(138deg,rgba(26, 117, 187, 1) 0%, rgba(27, 206, 176, 1) 100%);',
        'gradient-dark': 'linear-gradient(138deg,rgba(27, 206, 176, 1) 0%, rgba(26, 117, 187, 1) 100%)',
    },
    gray: {
        light: {
            25: '#FCFCFD',
            50: '#F9FAFB',
            100: '#F2F4F7',
            200: '#EAECF0',
            300: '#D0D5DD',
            400: '#98A2B3',
            500: '#667085',
            600: '#475467',
            700: '#344054',
            800: '#182230',
            900: '#101828',
            950: '#0C111D',
        },
        dark: {
            25: '#FAFAFA',
            50: '#F5F5F6',
            100: '#F0F1F1',
            200: '#ECECED',
            300: '#CECFD2',
            400: '#94969C',
            500: '#85888E',
            600: '#61646C',
            700: '#333741',
            800: '#1F242F',
            900: '#161B26',
            950: '#0C111D',
        },
    },
    brand: {
        25: '#EEF1FB',
        50: '#DDE3F7',
        100: '#CCD5F4',
        200: '#BBC7F0',
        300: '#9AABE8',
        400: '#788FE1',
        500: '#5673D9',
        600: '#455CAF',
        700: '#344685',
        800: '#232F5A',
        850: '#1B2445',
        900: '#121930',
        950: '#0A0D1B',
    },
    success: {
        25: '#F6FEF9',
        50: '#ECFDF3',
        100: '#DCFAE6',
        200: '#A9EFC5',
        300: '#75E0A7',
        400: '#47CD89',
        500: '#17B26A',
        600: '#079455',
        700: '#067647',
        800: '#085D3A',
        900: '#074D31',
        950: '#053321',
    },
    warning: {
        25: '#FFFCF5',
        50: '#FFFAEB',
        100: '#FEF0C7',
        200: '#FEDF89',
        300: '#FEC84B',
        400: '#FDB022',
        500: '#F79009',
        600: '#DC6803',
        700: '#B54708',
        800: '#93370D',
        900: '#7A2E0E',
        950: '#4E1D09',
    },
    danger: {
        25: '#FFFBFA',
        50: '#FEF3F2',
        100: '#FEE4E2',
        200: '#FECDCA',
        300: '#FDA29B',
        400: '#F97066',
        500: '#F04438',
        600: '#D92D20',
        700: '#B42318',
        800: '#912018',
        900: '#7A271A',
        950: '#55160C',
    },
    info: {
        25: '#F5FAFF',
        50: '#EFF8FF',
        100: '#D1E9FF',
        200: '#B2DDFF',
        300: '#84CAFF',
        400: '#53B1FD',
        500: '#2E90FA',
        600: '#1570EF',
        700: '#175CD3',
        800: '#1849A9',
        900: '#194185',
        950: '#102A56',
    },
} satisfies Primary;

export const secondary = {
    grayBlue: {
        25: '#FCFCFD',
        50: '#F8F9FC',
        100: '#EAECF5',
        200: '#D5D9EB',
        300: '#B3B8DB',
        400: '#717BBC',
        500: '#4E5BA6',
        600: '#3E4784',
        700: '#363F72',
        800: '#293056',
        900: '#101323',
        950: '#0D0F1C',
    },
    grayIron: {
        25: '#F0F2F7',
        50: '#F0F1F1',
        100: '#D8DBE5',
        200: '#CACED9',
        300: '#9AA1B2',
        400: '#7E8696',
        500: '#666F84',
        600: '#545B70',
        700: '#444957',
        800: '#33363D',
        900: '#23252B',
        950: '#17181C',
    },
    green: {
        25: '#FAFEF5',
        50: '#F3FEE7',
        100: '#E3FBCC',
        200: '#D0F8AB',
        300: '#A6EF67',
        400: '#85E13A',
        500: '#66C61C',
        600: '#4CA30D',
        700: '#3B7C0F',
        800: '#326212',
        900: '#2B5314',
        950: '#15290A',
    },
    indigo: {
        25: '#F5F8FF',
        50: '#EEF4FF',
        100: '#E0EAFF',
        200: '#C7D7FE',
        300: '#A4BCFD',
        400: '#8098F9',
        500: '#6172F3',
        600: '#444CE7',
        700: '#3538CD',
        800: '#2D31A6',
        900: '#2D3282',
        950: '#1E1F5B',
    },
    red: {
        50: '#FFF5F6',
        100: '#FFE0E4',
        200: '#FAC8CE',
        300: '#FEA0AB',
        400: '#FC7282',
        500: '#F55467',
        600: '#D94254',
        700: '#B53241',
        800: '#912B37',
        900: '#782B34',
    },
    yellow: {
        25: '#FEFDF0',
        50: '#FEFBE8',
        100: '#FEF7C3',
        200: '#FEEE95',
        300: '#FDE16F',
        400: '#FFD54A',
        500: '#FFC404',
        600: '#CF8B04',
        700: '#A16907',
        800: '#87570F',
        900: '#714B12',
        950: '#4F3409',
    },
    copper: {
        25: '#FFF9F2',
        50: '#FFF5E8',
        100: '#FFEFD9',
        200: '#E3C79F',
        300: '#D1A669',
        400: '#B88339',
        500: '#996114',
        600: '#80510F',
        700: '#6B430C',
        800: '#573A13',
        900: '#452C0A',
        950: '#362003',
    },
    orange: {
        25: '#FEFAF5',
        50: '#FEF6EE',
        100: '#FDEAD7',
        200: '#F9DBAF',
        300: '#F7B27A',
        400: '#F38744',
        500: '#EF6820',
        600: '#E04F16',
        700: '#B93815',
        800: '#932F19',
        900: '#772917',
        950: '#511A0C',
    },
    orangeDark: {
        25: '#FEF5F4',
        50: '#FEEAE7',
        100: '#FED9D3',
        200: '#FECCC4',
        300: '#FFA799',
        400: '#FF654A',
        500: '#FC2A05',
        600: '#E62E05',
        700: '#BC1B06',
        800: '#97180C',
        900: '#771A0D',
        950: '#57130A',
    },
    violet: {
        25: '#FBFAFF',
        50: '#F5F3FF',
        100: '#ECE9FE',
        200: '#DDD6FE',
        300: '#C3B5FD',
        400: '#A48AFB',
        500: '#875BF7',
        600: '#7839EE',
        700: '#6927DA',
        800: '#5720B7',
        900: '#491C96',
        950: '#2E125E',
    },
    purple: {
        25: '#FAFAFF',
        50: '#F4F3FF',
        100: '#EBE9FE',
        200: '#D9D6FE',
        300: '#BDB4FE',
        400: '#9B8AFB',
        500: '#7A5AF8',
        600: '#6938EF',
        700: '#5925DC',
        800: '#4A1FB8',
        900: '#3E1C96',
        950: '#27115F',
    },
    fuchsia: {
        25: '#FEFAFF',
        50: '#FDF4FF',
        100: '#FBE8FF',
        200: '#F6D0FE',
        300: '#EEAAFD',
        400: '#E478FA',
        500: '#D444F1',
        600: '#BA24D5',
        700: '#9F1AB1',
        800: '#821890',
        900: '#6F1877',
        950: '#47104C',
    },
    pink: {
        25: '#FEF6FB',
        50: '#FDF2FA',
        100: '#FCE7F6',
        200: '#FCCEEE',
        300: '#FAA7E0',
        400: '#F670C7',
        500: '#EE46BC',
        600: '#DD2590',
        700: '#C11574',
        800: '#9E165F',
        900: '#851651',
        950: '#4E0D30',
    },
    blue: {
        25: '#F5FAFF',
        50: '#EFF8FF',
        100: '#D1E9FF',
        200: '#B2DDFF',
        300: '#84CAFF',
        400: '#53B1FD',
        500: '#2E90FA',
        600: '#1570EF',
        700: '#175CD3',
        800: '#1849A9',
        900: '#194185',
        950: '#102A56',
    },
    blueLight: {
        25: '#F5FBFF',
        50: '#F0F9FF',
        100: '#E0F2FE',
        200: '#B9E6FE',
        300: '#7CD4FD',
        400: '#36BFFA',
        500: '#0BA5EC',
        600: '#0086C9',
        700: '#026AA2',
        800: '#065986',
        900: '#0B4A6F',
        950: '#062C41',
    },
    teal: {
        25: '#F6FEFC',
        50: '#F0FDF9',
        100: '#CCFBEF',
        200: '#99F6E0',
        300: '#5FE9D0',
        400: '#2ED3B7',
        500: '#15B79E',
        600: '#0E9384',
        700: '#107569',
        800: '#125D56',
        900: '#134E48',
        950: '#0A2926',
    },
} satisfies Secondary;
