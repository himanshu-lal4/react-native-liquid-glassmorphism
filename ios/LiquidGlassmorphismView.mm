#import "LiquidGlassmorphismView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/LiquidGlassmorphismViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/Props.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation LiquidGlassmorphismView {
  // The live glass / blur. Its `contentView` is the canonical Liquid Glass
  // content layer: subviews placed there render crisply *above* the material,
  // while the effect blurs/refracts the backdrop behind the view. This is the
  // only placement that stays crisp for interactive `UIGlassEffect` too.
  UIVisualEffectView *_effectView;

  // Subtle tint wash, sits at the bottom of the effect's contentView (above the
  // material, below the app's children). Only used for the pre-iOS-26 fallback;
  // on iOS 26 the glass is tinted natively instead.
  UIView *_tintOverlay;

  // Cached prop state so we only rebuild the effect when its inputs change.
  std::string _variant;
  int _intensity;
  BOOL _interactive;
  UIColor *_appliedTint;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LiquidGlassmorphismViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LiquidGlassmorphismViewProps>();
    _props = defaultProps;

    _variant = "";
    _intensity = -1;
    _interactive = NO;
    _appliedTint = nil;

    // Clip the glass and children to the rounded card shape.
    self.clipsToBounds = YES;

    // Created up front (with no effect yet) so children can mount into its
    // contentView before the first prop update arrives.
    _effectView = [[UIVisualEffectView alloc] initWithEffect:nil];
    _effectView.frame = self.bounds;
    _effectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_effectView];

    _tintOverlay = [[UIView alloc] initWithFrame:_effectView.bounds];
    _tintOverlay.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _tintOverlay.userInteractionEnabled = NO;
    [_effectView.contentView addSubview:_tintOverlay];
  }

  return self;
}

#pragma mark - Child mounting

// Host React children inside the effect's contentView (above the tint overlay)
// so they render crisply on top of the glass material.
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_effectView.contentView insertSubview:childComponentView atIndex:index + 1];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _effectView.frame = self.bounds;
  _tintOverlay.frame = _effectView.bounds;
}

#pragma mark - Effect construction

// Builds the platform glass effect for the current variant/intensity/interactive
// /tint state. On iOS 26+ this is a real `UIGlassEffect` honouring the
// regular/clear style and native tint; below that it degrades to a frosted
// `UIBlurEffect` material (tinted via the overlay).
- (UIVisualEffect *)makeEffectWithTint:(UIColor *)tint explicitTint:(BOOL)explicitTint
{
  BOOL isClear = _variant == "clear";

#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    UIGlassEffect *glass =
        [UIGlassEffect effectWithStyle:(isClear ? UIGlassEffectStyleClear : UIGlassEffectStyleRegular)];
    glass.interactive = _interactive;
    // Tint the glass natively so the OS produces the vibrant adaptive variant.
    // Configure before assigning to the effect view (effects are value types).
    if (explicitTint) {
      glass.tintColor = tint;
    }
    return glass;
  }
#endif

  // Pre-iOS-26 fallback: choose a material whose heaviness tracks `intensity`.
  UIBlurEffectStyle style;
  if (isClear) {
    style = UIBlurEffectStyleSystemUltraThinMaterial;
  } else if (_intensity >= 80) {
    style = UIBlurEffectStyleSystemThickMaterial;
  } else if (_intensity >= 50) {
    style = UIBlurEffectStyleSystemMaterial;
  } else if (_intensity >= 25) {
    style = UIBlurEffectStyleSystemThinMaterial;
  } else {
    style = UIBlurEffectStyleSystemUltraThinMaterial;
  }
  return [UIBlurEffect effectWithStyle:style];
}

#pragma mark - Props

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newViewProps = *std::static_pointer_cast<LiquidGlassmorphismViewProps const>(props);

  std::string newVariant = newViewProps.variant == LiquidGlassmorphismViewVariant::Clear ? "clear" : "regular";
  int newIntensity = newViewProps.intensity;
  BOOL newInteractive = newViewProps.interactive;

  // Resolve the tint: explicit tintColor, else a subtle adaptive wash so a bare
  // <LiquidGlassView> still reads as glass.
  UIColor *explicitTint = RCTUIColorFromSharedColor(newViewProps.tintColor);
  BOOL hasExplicitTint = explicitTint != nil;
  UIColor *tint = explicitTint
      ?: [UIColor.whiteColor colorWithAlphaComponent:(newVariant == "clear" ? 0.05 : 0.12)];

  BOOL effectChanged = (_effectView.effect == nil) || newVariant != _variant ||
      newIntensity != _intensity || newInteractive != _interactive ||
      ![tint isEqual:_appliedTint];

  _variant = newVariant;
  _intensity = newIntensity;
  _interactive = newInteractive;
  _appliedTint = tint;

  if (effectChanged) {
    _effectView.effect = [self makeEffectWithTint:tint explicitTint:hasExplicitTint];

    // The flat overlay only tints the pre-26 blur fallback; on real glass the
    // native tint does the work, so keep the overlay clear there.
    BOOL nativeGlass = NO;
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
    if (@available(iOS 26.0, *)) {
      nativeGlass = [_effectView.effect isKindOfClass:[UIGlassEffect class]];
    }
#endif
    _tintOverlay.backgroundColor = nativeGlass ? UIColor.clearColor : tint;
  }

  CGFloat radius = newViewProps.glassCornerRadius;
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    // Native corner configuration lets `UIGlassEffect` render its rounded shape
    // *with* the proper edge lensing / specular highlights — matching system
    // glass. A hard `layer.cornerRadius` + `clipsToBounds` clip would shave those
    // refractive edges off, which is what made the glass look like a flat frost.
    UICornerConfiguration *corners =
        [UICornerConfiguration configurationWithUniformRadius:[UICornerRadius fixedRadius:radius]];
    self.cornerConfiguration = corners;
    _effectView.cornerConfiguration = corners;
    self.clipsToBounds = YES; // clip children to the rounded shape
    _effectView.clipsToBounds = NO; // let the glass draw its full edge treatment
  } else
#endif
  {
    self.layer.cornerRadius = radius;
    self.layer.cornerCurve = kCACornerCurveContinuous;
    self.clipsToBounds = YES;
    _effectView.layer.cornerRadius = radius;
    _effectView.layer.cornerCurve = kCACornerCurveContinuous;
    _effectView.clipsToBounds = YES;
  }

  [super updateProps:props oldProps:oldProps];
}

@end
