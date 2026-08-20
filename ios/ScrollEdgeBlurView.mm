#import "ScrollEdgeBlurView.h"

#import <react/renderer/components/LiquidGlassmorphismViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/EventEmitters.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/Props.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

/**
 * Progressive edge blur (#48).
 *
 * A `UIVisualEffectView` masked by a `CAGradientLayer`: opaque at the anchored
 * edge, transparent once the falloff is spent. Masking the effect view is what
 * makes the blur itself fade — setting `alpha` instead would cross-fade the
 * whole material toward transparent and wash the blur out uniformly rather
 * than progressively.
 *
 * UIKit exposes no continuous blur radius, so `maxBlurRadius` selects the
 * nearest discrete material, exactly as the pre-26 fallback in
 * LiquidGlassmorphismView does. It is the closest equivalent, not a literal
 * radius, and the docs say so.
 */
static UIBlurEffectStyle SEBStyleForRadius(float dp)
{
  if (dp >= 34) return UIBlurEffectStyleSystemThickMaterial;
  if (dp >= 20) return UIBlurEffectStyleSystemMaterial;
  if (dp >= 10) return UIBlurEffectStyleSystemThinMaterial;
  return UIBlurEffectStyleSystemUltraThinMaterial;
}

@implementation ScrollEdgeBlurView {
  UIVisualEffectView *_effectView;
  CAGradientLayer *_maskLayer;
  ScrollEdgeBlurViewEdge _edge;
  float _maxBlurRadius;
  float _falloff;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollEdgeBlurViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ScrollEdgeBlurViewProps>();
    _props = defaultProps;

    _edge = ScrollEdgeBlurViewEdge::Top;
    _maxBlurRadius = 24;
    _falloff = 1;

    _effectView = [[UIVisualEffectView alloc]
        initWithEffect:[UIBlurEffect effectWithStyle:SEBStyleForRadius(_maxBlurRadius)]];
    _effectView.userInteractionEnabled = NO;
    [self addSubview:_effectView];

    _maskLayer = [CAGradientLayer layer];
    // A mask reads only alpha, but CAGradientLayer needs real colours, so the
    // ramp runs white -> clear rather than varying an alpha channel alone.
    _maskLayer.colors = @[ (id)UIColor.whiteColor.CGColor, (id)UIColor.clearColor.CGColor ];
    _effectView.layer.mask = _maskLayer;

    self.userInteractionEnabled = NO;
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _effectView.frame = self.bounds;
  [self applyMaskGeometry];
}

/**
 * Point the gradient along the anchored edge.
 *
 * Unit coordinates, so this survives resize without recomputing anything: the
 * start point sits on the anchored edge and the end point is `falloff` of the
 * way across.
 */
- (void)applyMaskGeometry
{
  const CGFloat f = MAX(0.05, MIN(1.0, (CGFloat)_falloff));
  CGPoint start, end;

  switch (_edge) {
    case ScrollEdgeBlurViewEdge::Bottom:
      start = CGPointMake(0.5, 1.0);
      end = CGPointMake(0.5, 1.0 - f);
      break;
    case ScrollEdgeBlurViewEdge::Left:
      start = CGPointMake(0.0, 0.5);
      end = CGPointMake(f, 0.5);
      break;
    case ScrollEdgeBlurViewEdge::Right:
      start = CGPointMake(1.0, 0.5);
      end = CGPointMake(1.0 - f, 0.5);
      break;
    case ScrollEdgeBlurViewEdge::Top:
    default:
      start = CGPointMake(0.5, 0.0);
      end = CGPointMake(0.5, f);
      break;
  }

  // The mask layer is not in the animated layer tree, so implicit animations
  // on frame/points would lag a scroll by a frame. Disable them.
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  _maskLayer.frame = self.bounds;
  _maskLayer.startPoint = start;
  _maskLayer.endPoint = end;
  [CATransaction commit];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<ScrollEdgeBlurViewProps const>(props);

  BOOL geometryChanged = NO;

  if (newProps.edge != _edge) {
    _edge = newProps.edge;
    geometryChanged = YES;
  }

  if (newProps.falloff != _falloff) {
    _falloff = newProps.falloff;
    geometryChanged = YES;
  }

  if (newProps.maxBlurRadius != _maxBlurRadius) {
    _maxBlurRadius = newProps.maxBlurRadius;
    UIBlurEffectStyle style = SEBStyleForRadius(_maxBlurRadius);
    _effectView.effect = _maxBlurRadius <= 0 ? nil : [UIBlurEffect effectWithStyle:style];
  }

  if (geometryChanged) {
    [self applyMaskGeometry];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // Fabric reuses views; without this a recycled instance keeps the previous
  // edge and radius until the new props happen to differ from them.
  _edge = ScrollEdgeBlurViewEdge::Top;
  _maxBlurRadius = 24;
  _falloff = 1;
  _effectView.effect = [UIBlurEffect effectWithStyle:SEBStyleForRadius(_maxBlurRadius)];
  [self applyMaskGeometry];
}

@end
