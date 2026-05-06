import type {JSX} from 'react';
import {createRef} from 'react';
import {screen} from '@testing-library/react';
import type {ARIARole} from 'aria-query';
import {render} from '../../utils/test';
import type {BoxStyle} from '.';
import {Box} from '.';

describe('<Box />', () => {
    it('should render a box', () => {
        render(<Box aria-label="Box" />);

        expect(screen.getByLabelText('Box')).toBeInTheDocument();
    });

    it('should render a styled box', () => {
        const style: BoxStyle = {margin: 4};

        render(<Box aria-label="Box" style={style} />);

        expect(screen.getByLabelText('Box')).toMatchSnapshot();
    });

    it('should forward the ref to the underlying DOM element', () => {
        const ref = createRef<HTMLDivElement>();

        render(<Box aria-label="Box" ref={ref} />);

        expect(screen.getByLabelText('Box')).toBe(ref.current);
    });

    it.each<[keyof JSX.IntrinsicElements, ARIARole]>([
        ['button', 'button'],
        ['input', 'textbox'],
        ['h1', 'heading'],
    ])('should render the box as a custom element', (element, role) => {
        render(<Box as={element} />);

        expect(screen.getByRole(role)).toBeInTheDocument();
    });
});
