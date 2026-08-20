#import "LiquidGlassContainer.h"

#import <react/renderer/components/LiquidGlassmorphismViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/EventEmitters.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/Props.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

/**
 * Cross-view glass merging on iOS.
 *
 * This is almost nothing, because iOS 26 does the work: a `UIVisualEffectView`
 * carrying a `UIGlassContainerEffect` merges the glass of any descendant
 * effect views that come within `spacing` of each other. We do not compute a
 * field, blend silhouettes, or touch the children — the OS composites them.
 *
 * Below iOS 26 there is no such effect, so children simply render as ordinary
 * separate glass. That is a graceful degradation rather than a failure: the UI
 * still works, the bodies just do not fuse.
 */
@implementation LiquidGlassContainer {
  UIVisualEffectView *_containerView;
  CGFloat _spacing;
  BOOL _supported;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LiquidGlassContainerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LiquidGlassContainerProps>();
    _props = defaultProps;
    _spacing = 0;

#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
    _supported = @available(iOS 26.0, *) ? YES : NO;
#else
    _supported = NO;
#endif

    if (_supported) {
      _containerView = [[UIVisualEffectView alloc] initWithEffect:nil];
      _containerView.userInteractionEnabled = YES;
      [self addSubview:_containerView];
      [self applyEffect];
    }
  }
  return self;
}

- (void)applyEffect
{
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    UIGlassContainerEffect *effect = [[UIGlassContainerEffect alloc] init];
    effect.spacing = _spacing;
    _containerView.effect = effect;
  }
#endif
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _containerView.frame = self.bounds;
}

/**
 * Children go into the effect view's contentView, not onto us.
 *
 * `UIGlassContainerEffect` only merges effect views inside its own content
 * hierarchy — parenting them to the container itself would leave them
 * unmerged and look exactly like the bug this component exists to fix.
 */
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index
{
  if (_supported) {
    [_containerView.contentView insertSubview:childComponentView atIndex:index];
    // A merged neck is drawn OUTSIDE each child's own bounds, so a child that
    // clips to them shaves the merge off and the bodies read as two separate
    // panes touching. The glass view clips by default to keep its children
    // inside its rounded shape; inside a container that has to give way.
    childComponentView.clipsToBounds = NO;
  } else {
    [super mountChildComponentView:childComponentView index:index];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index
{
  if (_supported) {
    [childComponentView removeFromSuperview];
  } else {
    [super unmountChildComponentView:childComponentView index:index];
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<LiquidGlassContainerProps const>(props);

  if (newProps.spacing != _spacing) {
    _spacing = newProps.spacing;
    [self applyEffect];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // Fabric reuses views; a recycled container would otherwise keep the last
  // spacing until new props happened to differ from it.
  _spacing = 0;
  [self applyEffect];
}

@end
