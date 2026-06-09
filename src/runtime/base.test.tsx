import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import base from './base.js';

const Icon = base('M10 10h4v4h-4z');

describe('base icon component', () => {
  it('renders an svg with the path and Material Symbols defaults', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('viewBox')).toBe('0 -960 960 960');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M10 10h4v4h-4z'
    );
  });

  it('defaults width and height to 1em', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('1em');
    expect(svg.getAttribute('height')).toBe('1em');
  });

  it('applies the size prop to both dimensions', () => {
    const { container } = render(<Icon size={32} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('forwards a ref to the underlying svg element', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current?.tagName.toLowerCase()).toBe('svg');
  });

  it('forwards arbitrary svg props, with explicit props overriding defaults', () => {
    const { container } = render(
      <Icon className="my-icon" data-testid="i" fill="red" width={48} />
    );
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toBe('my-icon');
    expect(svg.getAttribute('fill')).toBe('red');
    expect(svg.getAttribute('width')).toBe('48');
    expect(svg.getAttribute('data-testid')).toBe('i');
  });
});
