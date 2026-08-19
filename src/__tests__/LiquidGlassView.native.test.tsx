/**
 * Unit tests for the native `<LiquidGlassView>` wrapper's prop mapping.
 *
 * These assert the contract between the friendly public props and the codegen
 * native component, without needing a renderer: the wrapper is a pure function
 * component, so we invoke it and inspect the returned React element.
 */
import { createElement } from 'react';

// Mock the codegen native component so importing the wrapper doesn't try to
// register a real Fabric component in the test environment.
jest.mock('../LiquidGlassmorphismViewNativeComponent', () => ({
  __esModule: true,
  default: 'LiquidGlassmorphismView',
}));

import { LiquidGlassView } from '../LiquidGlassView.native';
import NativeLiquidGlass from '../LiquidGlassmorphismViewNativeComponent';

const render = (props = {}) => LiquidGlassView(props as any) as any;

describe('LiquidGlassView (native) prop mapping', () => {
  it('renders the native codegen component', () => {
    expect(render().type).toBe(NativeLiquidGlass);
  });

  it('applies the documented defaults', () => {
    const { props } = render();
    expect(props.variant).toBe('regular');
    expect(props.intensity).toBe(60);
    expect(props.interactive).toBe(false);
    expect(props.refraction).toBe(true);
    expect(props.glassCornerRadius).toBe(0);
  });

  it('maps the public `borderRadius` prop onto native `glassCornerRadius`', () => {
    expect(render({ borderRadius: 24 }).props.glassCornerRadius).toBe(24);
  });

  // Regression: the native layer selects UIGlassEffect.Style from `variant`, so
  // the JS wrapper must forward it verbatim for both regular and clear.
  it.each(['regular', 'clear'] as const)(
    'forwards variant "%s" to the native component',
    (variant) => {
      expect(render({ variant }).props.variant).toBe(variant);
    }
  );

  it('also reflects borderRadius into the style so children clip to the curve', () => {
    const { props } = render({ borderRadius: 16, style: { padding: 8 } });
    expect(props.style).toStrictEqual([{ borderRadius: 16 }, { padding: 8 }]);
  });

  it('passes explicit values through, overriding defaults', () => {
    const { props } = render({
      variant: 'clear',
      intensity: 90,
      interactive: true,
      refraction: false,
      tintColor: '#FF0000',
    });
    expect(props.variant).toBe('clear');
    expect(props.intensity).toBe(90);
    expect(props.interactive).toBe(true);
    expect(props.refraction).toBe(false);
    expect(props.tintColor).toBe('#FF0000');
  });

  it('forwards children and arbitrary ViewProps (e.g. testID)', () => {
    const child = createElement('Text', null, 'hi');
    const { props } = render({ testID: 'glass', children: child });
    expect(props.testID).toBe('glass');
    expect(props.children).toBe(child);
  });

  // Custom shapes: the wrapper normalises to a path + view-box and stops
  // rounding the outer container (that would clip the shape's corners).
  // The composition primitives reach BOTH platforms: iOS uses them to decide
  // between UIGlassEffect and a plain UIBlurEffect material.
  it('defaults the primitives to the full glass treatment', () => {
    const { props } = render();
    expect(props.dim).toBe(0);
    expect(props.rim).toBe(true);
    expect(props.specular).toBe(true);
    expect(props.thickness).toBe(1);
    // Negative sentinel: codegen floats cannot be null, so this is "unset".
    expect(props.blurRadius).toBe(-1);
  });

  it('forwards the primitives on iOS too, not just Android', () => {
    const { props } = render({
      rim: false,
      specular: false,
      thickness: 0,
      blurRadius: 20,
      dim: 0.4,
    });
    expect(props.rim).toBe(false);
    expect(props.specular).toBe(false);
    expect(props.thickness).toBe(0);
    expect(props.blurRadius).toBe(20);
    expect(props.dim).toBe(0.4);
  });

  it('clamps a negative blurRadius rather than passing the unset sentinel', () => {
    expect(render({ blurRadius: -5 }).props.blurRadius).toBe(0);
  });

  it('keeps the genuinely Android-only optics off iOS', () => {
    const { props } = render({
      edgeReflectionStrength: 0.5,
      legibilityFloor: 0.5,
    });
    expect(props.edgeReflectionStrength).toBeUndefined();
    expect(props.legibilityFloor).toBeUndefined();
  });

  it('sends no shape by default', () => {
    const { props } = render();
    expect(props.shapePath).toBe('');
    expect(props.shapeViewBoxWidth).toBe(0);
    expect(props.shapeViewBoxHeight).toBe(0);
  });

  it('normalises a `shape` prop into path + view-box props', () => {
    const { props } = render({ shape: { type: 'circle' } });
    expect(props.shapePath).toContain('M');
    expect(props.shapeViewBoxWidth).toBe(100);
    expect(props.shapeViewBoxHeight).toBe(100);
  });

  it('omits the container borderRadius when a shape is set', () => {
    const { props } = render({ shape: { type: 'circle' }, style: { padding: 8 } });
    // First slot is null (no rounding) rather than a { borderRadius } object.
    expect(props.style).toStrictEqual([null, { padding: 8 }]);
  });
});
