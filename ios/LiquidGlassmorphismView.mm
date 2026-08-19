#import "LiquidGlassmorphismView.h"

#include <cctype>
#include <cstdlib>
#include <cstring>

#import <React/RCTConversions.h>

#import <react/renderer/components/LiquidGlassmorphismViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/EventEmitters.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/Props.h>
#import <react/renderer/components/LiquidGlassmorphismViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

#pragma mark - SVG path parsing

// Minimal SVG-path (`d`) parser → UIBezierPath. Supports M/L/H/V/C/S/Q/T/Z in
// both absolute (upper) and relative (lower) forms — the command set our JS
// shape generator emits, plus hand-authored paths. Elliptic arcs (`A`) are
// intentionally unsupported (express curves as béziers). Coordinates are in the
// path's own view-box; the caller scales the result to the view bounds.
static UIBezierPath *LGMBezierPathFromSVG(NSString *d)
{
  if (d.length == 0) {
    return nil;
  }

  UIBezierPath *path = [UIBezierPath bezierPath];
  const char *s = d.UTF8String;
  const char *end = s + strlen(s);

  CGPoint cur = CGPointZero;    // current point
  CGPoint start = CGPointZero;  // sub-path start (for Z)
  CGPoint lastCtrl = CGPointZero; // last cubic/quad control (for S/T smoothing)
  char lastCmd = 0;
  BOOL hasStarted = NO;

  auto skipSep = [&]() {
    while (s < end && (*s == ' ' || *s == ',' || *s == '\n' || *s == '\r' || *s == '\t')) s++;
  };
  auto readNum = [&](CGFloat *out) -> BOOL {
    skipSep();
    if (s >= end) return NO;
    char *next = nullptr;
    double v = strtod(s, &next);
    if (next == s) return NO;
    s = next;
    *out = (CGFloat)v;
    return YES;
  };

  while (s < end) {
    skipSep();
    if (s >= end) break;

    char cmd = *s;
    if (isalpha(cmd)) {
      s++;
    } else {
      // Implicit repeat of the previous command (SVG allows omitting it).
      cmd = lastCmd;
      if (cmd == 0) break;
    }

    BOOL rel = islower(cmd);
    char c = toupper(cmd);

    if (c == 'M') {
      CGFloat x, y;
      if (!readNum(&x) || !readNum(&y)) break;
      cur = rel && hasStarted ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path moveToPoint:cur];
      start = cur;
      hasStarted = YES;
      // Subsequent coordinate pairs after an M are implicit L (per spec).
      lastCmd = rel ? 'l' : 'L';
      lastCtrl = cur;
      continue;
    } else if (c == 'L') {
      CGFloat x, y;
      if (!readNum(&x) || !readNum(&y)) break;
      cur = rel ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path addLineToPoint:cur];
      lastCtrl = cur;
    } else if (c == 'H') {
      CGFloat x;
      if (!readNum(&x)) break;
      cur = CGPointMake(rel ? cur.x + x : x, cur.y);
      [path addLineToPoint:cur];
      lastCtrl = cur;
    } else if (c == 'V') {
      CGFloat y;
      if (!readNum(&y)) break;
      cur = CGPointMake(cur.x, rel ? cur.y + y : y);
      [path addLineToPoint:cur];
      lastCtrl = cur;
    } else if (c == 'C') {
      CGFloat x1, y1, x2, y2, x, y;
      if (!readNum(&x1) || !readNum(&y1) || !readNum(&x2) || !readNum(&y2) ||
          !readNum(&x) || !readNum(&y)) break;
      CGPoint c1 = rel ? CGPointMake(cur.x + x1, cur.y + y1) : CGPointMake(x1, y1);
      CGPoint c2 = rel ? CGPointMake(cur.x + x2, cur.y + y2) : CGPointMake(x2, y2);
      cur = rel ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path addCurveToPoint:cur controlPoint1:c1 controlPoint2:c2];
      lastCtrl = c2;
    } else if (c == 'S') {
      CGFloat x2, y2, x, y;
      if (!readNum(&x2) || !readNum(&y2) || !readNum(&x) || !readNum(&y)) break;
      // Reflect the previous control point across the current point.
      char pc = toupper(lastCmd);
      CGPoint c1 = (pc == 'C' || pc == 'S')
          ? CGPointMake(2 * cur.x - lastCtrl.x, 2 * cur.y - lastCtrl.y)
          : cur;
      CGPoint c2 = rel ? CGPointMake(cur.x + x2, cur.y + y2) : CGPointMake(x2, y2);
      cur = rel ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path addCurveToPoint:cur controlPoint1:c1 controlPoint2:c2];
      lastCtrl = c2;
    } else if (c == 'Q') {
      CGFloat x1, y1, x, y;
      if (!readNum(&x1) || !readNum(&y1) || !readNum(&x) || !readNum(&y)) break;
      CGPoint cp = rel ? CGPointMake(cur.x + x1, cur.y + y1) : CGPointMake(x1, y1);
      cur = rel ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path addQuadCurveToPoint:cur controlPoint:cp];
      lastCtrl = cp;
    } else if (c == 'T') {
      CGFloat x, y;
      if (!readNum(&x) || !readNum(&y)) break;
      char pc = toupper(lastCmd);
      CGPoint cp = (pc == 'Q' || pc == 'T')
          ? CGPointMake(2 * cur.x - lastCtrl.x, 2 * cur.y - lastCtrl.y)
          : cur;
      cur = rel ? CGPointMake(cur.x + x, cur.y + y) : CGPointMake(x, y);
      [path addQuadCurveToPoint:cur controlPoint:cp];
      lastCtrl = cp;
    } else if (c == 'Z') {
      [path closePath];
      cur = start;
      lastCtrl = cur;
    } else {
      // Unknown / unsupported command (e.g. 'A') — stop rather than misparse.
      break;
    }

    lastCmd = cmd;
  }

  return path.empty ? nil : path;
}

@interface LiquidGlassmorphismView ()
@property (nonatomic, strong, nullable) CAShapeLayer *shapeMaskLayer;
@property (nonatomic, copy, nullable) NSString *shapePath;
@property (nonatomic, assign) CGFloat shapeVBWidth;
@property (nonatomic, assign) CGFloat shapeVBHeight;
@end

@implementation LiquidGlassmorphismView {
  // The live glass / blur. Its `contentView` is the canonical Liquid Glass
  // content layer: subviews placed there render crisply *above* the material,
  // while the effect blurs/refracts the backdrop behind the view. This is the
  // only placement that stays crisp for interactive `UIGlassEffect` too.
  UIVisualEffectView *_effectView;

  // Sits *below* `_effectView` and blurs the backdrop before the glass ever
  // sees it. This is what makes `blurRadius` mean something while the view is
  // rendering real Liquid Glass: UIKit gives no radius knob on `UIGlassEffect`
  // — the OS owns that blur — so instead of fighting it we hand the glass an
  // already-blurred backdrop to refract. Effect is nil (and the view is a
  // no-op) whenever `blurRadius` is unset.
  UIVisualEffectView *_blurUnderlay;

  // Drives `_blurUnderlay` to a *fraction* of a blur effect. UIKit exposes no
  // blur radius, only a handful of discrete materials — but a paused
  // UIViewPropertyAnimator interpolates the effect's real filter parameters, so
  // holding one at `fractionComplete` gives continuous control between "no
  // blur" and the target material. This is the same technique expo-blur uses
  // for its 0-100 intensity, and it is genuinely different from fading a
  // blurred layer in with alpha: alpha composites a blurred copy *over* the
  // sharp backdrop, which reads as a ghost rather than a blur.
  UIViewPropertyAnimator *_underlayAnimator;

  // Subtle tint wash, sits at the bottom of the effect's contentView (above the
  // material, below the app's children). Only used for the pre-iOS-26 fallback;
  // on iOS 26 the glass is tinted natively instead.
  UIView *_tintOverlay;

  // Flat dimming scrim, above the material and below the app's children —
  // the same place the Android shader applies it.
  UIView *_dimOverlay;

  // Cached prop state so we only rebuild the effect when its inputs change.
  std::string _variant;
  int _intensity;
  BOOL _interactive;
  UIColor *_appliedTint;

  // `onPipelineReady` is a one-shot per mounted view. Fabric recycles views, so
  // this is reset in -prepareForRecycle rather than only in -init.
  BOOL _reportedPipeline;

  // The composition primitives. When the caller has switched every glass
  // layer off, this stops being liquid glass and becomes a plain blur view,
  // which on iOS means a UIBlurEffect material rather than UIGlassEffect.
  BOOL _plainBlur;
  float _blurRadiusDp;
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
    _plainBlur = NO;
    _blurRadiusDp = -1;
    _appliedTint = nil;
    _reportedPipeline = NO;

    // Clip the glass and children to the rounded card shape.
    self.clipsToBounds = YES;

    // Created up front (with no effect yet) so children can mount into its
    // contentView before the first prop update arrives.
    // Added first so it renders underneath the glass — the glass samples what
    // is already on screen behind it, which now includes this.
    _blurUnderlay = [[UIVisualEffectView alloc] initWithEffect:nil];
    _blurUnderlay.frame = self.bounds;
    _blurUnderlay.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _blurUnderlay.userInteractionEnabled = NO;
    [self addSubview:_blurUnderlay];

    _effectView = [[UIVisualEffectView alloc] initWithEffect:nil];
    _effectView.frame = self.bounds;
    _effectView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_effectView];

    _tintOverlay = [[UIView alloc] initWithFrame:_effectView.bounds];
    _tintOverlay.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _tintOverlay.userInteractionEnabled = NO;
    [_effectView.contentView addSubview:_tintOverlay];

    _dimOverlay = [[UIView alloc] initWithFrame:_effectView.bounds];
    _dimOverlay.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _dimOverlay.userInteractionEnabled = NO;
    _dimOverlay.backgroundColor = UIColor.clearColor;
    [_effectView.contentView addSubview:_dimOverlay];
  }

  return self;
}

#pragma mark - Child mounting

// Host React children inside the effect's contentView (above the tint overlay)
// so they render crisply on top of the glass material.
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // +2: the tint wash and the dim scrim both sit below the app's children.
  [_effectView.contentView insertSubview:childComponentView atIndex:index + 2];
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
  // The mask is scaled to the current bounds, so re-derive it on every layout.
  [self applyShapeMask];
}

#pragma mark - Custom shape mask

// Mask the whole view (glass + children) to a custom silhouette. The path is
// authored in a view-box and stretched to fill the bounds — matching the
// Android SDF behaviour, and the plan's "CAShapeLayer from the path" approach.
- (void)applyShapeMask
{
  BOOL hasShape = _shapePath.length > 0 && _shapeVBWidth > 0 && _shapeVBHeight > 0 &&
      !CGRectIsEmpty(self.bounds);

  if (!hasShape) {
    if (_shapeMaskLayer) {
      self.layer.mask = nil;
      _shapeMaskLayer = nil;
    }
    return;
  }

  UIBezierPath *bezier = LGMBezierPathFromSVG(_shapePath);
  if (!bezier) {
    self.layer.mask = nil;
    _shapeMaskLayer = nil;
    return;
  }

  CGAffineTransform t = CGAffineTransformMakeScale(self.bounds.size.width / _shapeVBWidth,
                                                   self.bounds.size.height / _shapeVBHeight);
  [bezier applyTransform:t];

  if (!_shapeMaskLayer) {
    _shapeMaskLayer = [CAShapeLayer layer];
    _shapeMaskLayer.fillColor = UIColor.blackColor.CGColor;
  }
  _shapeMaskLayer.frame = self.bounds;
  _shapeMaskLayer.path = bezier.CGPath;
  self.layer.mask = _shapeMaskLayer;
}

#pragma mark - Effect construction

// `UIBlurEffect`'s materials are discrete, so an exact radius is not on offer —
// this is the nearest bucket. Shared by the plain-blur path and the underlay
// that gives `blurRadius` meaning under real Liquid Glass.
static UIBlurEffectStyle LGMBlurStyleForRadius(float dp)
{
  if (dp <= 6) return UIBlurEffectStyleSystemUltraThinMaterial;
  if (dp <= 12) return UIBlurEffectStyleSystemThinMaterial;
  if (dp <= 20) return UIBlurEffectStyleSystemMaterial;
  if (dp <= 30) return UIBlurEffectStyleSystemThickMaterial;
  return UIBlurEffectStyleSystemChromeMaterial;
}

// Builds the platform glass effect for the current variant/intensity/interactive
// /tint state. On iOS 26+ this is a real `UIGlassEffect` honouring the
// regular/clear style and native tint; below that it degrades to a frosted
// `UIBlurEffect` material (tinted via the overlay).
- (UIVisualEffect *)makeEffectWithTint:(UIColor *)tint explicitTint:(BOOL)explicitTint
{
  BOOL isClear = _variant == "clear";

#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    if (!_plainBlur) {
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
  }
#endif

  // A plain blur view: every glass layer was switched off, so give back the
  // classic frosted material instead of Liquid Glass. `blurRadius` picks the
  // bucket when it is set — UIBlurEffect's materials are discrete, so this is
  // the nearest equivalent to an exact radius rather than a literal one.
  if (_plainBlur) {
    UIBlurEffectStyle plain;
    if (_blurRadiusDp >= 0) {
      plain = LGMBlurStyleForRadius(_blurRadiusDp);
    } else if (_intensity >= 80) {
      plain = UIBlurEffectStyleSystemThickMaterial;
    } else if (_intensity >= 50) {
      plain = UIBlurEffectStyleSystemMaterial;
    } else if (_intensity >= 25) {
      plain = UIBlurEffectStyleSystemThinMaterial;
    } else {
      plain = UIBlurEffectStyleSystemUltraThinMaterial;
    }
    return [UIBlurEffect effectWithStyle:plain];
  }

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

  // "Every glass layer off" is the signal for a plain blur view. It is not a
  // separate mode — it falls out of the primitives the caller already set.
  BOOL newPlainBlur = !newViewProps.rim && !newViewProps.specular &&
      newViewProps.thickness == 0.0f;
  float newBlurRadius = newViewProps.blurRadius;

  // Resolve the tint: explicit tintColor, else a subtle adaptive wash so a bare
  // <LiquidGlassView> still reads as glass.
  UIColor *explicitTint = RCTUIColorFromSharedColor(newViewProps.tintColor);
  BOOL hasExplicitTint = explicitTint != nil;
  UIColor *tint = explicitTint
      ?: [UIColor.whiteColor colorWithAlphaComponent:(newVariant == "clear" ? 0.05 : 0.12)];

  BOOL effectChanged = (_effectView.effect == nil) || newVariant != _variant ||
      newIntensity != _intensity || newInteractive != _interactive ||
      newPlainBlur != _plainBlur || newBlurRadius != _blurRadiusDp ||
      ![tint isEqual:_appliedTint];

  _variant = newVariant;
  _intensity = newIntensity;
  _interactive = newInteractive;
  _plainBlur = newPlainBlur;
  _blurRadiusDp = newBlurRadius;
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

    // Pre-blur the backdrop only when the glass itself cannot honour the
    // radius. In plain-blur mode the material *is* the radius, and below
    // iOS 26 the fallback material already tracks `intensity`, so in both
    // cases a second blur underneath would just double-frost the view.
    BOOL underlayWanted = nativeGlass && !_plainBlur && _blurRadiusDp > 0;
    if (underlayWanted) {
      [self setUnderlayFraction:MIN(1.0, _blurRadiusDp / 26.0)];
    } else {
      [self tearDownUnderlay];
    }
  }

  CGFloat dim = MAX(0.0, MIN(1.0, (CGFloat)newViewProps.dim));
  _dimOverlay.backgroundColor =
      dim > 0 ? [UIColor.blackColor colorWithAlphaComponent:dim] : UIColor.clearColor;

  // Custom silhouette (SVG path + view-box). When present it masks the whole
  // view and the rounded-corner treatment below is skipped entirely.
  NSString *newShapePath = newViewProps.shapePath.empty()
      ? nil
      : [NSString stringWithUTF8String:newViewProps.shapePath.c_str()];
  CGFloat newVBWidth = newViewProps.shapeViewBoxWidth;
  CGFloat newVBHeight = newViewProps.shapeViewBoxHeight;
  BOOL shapeChanged = ![newShapePath isEqualToString:_shapePath] ||
      newVBWidth != _shapeVBWidth || newVBHeight != _shapeVBHeight;
  _shapePath = newShapePath;
  _shapeVBWidth = newVBWidth;
  _shapeVBHeight = newVBHeight;
  BOOL hasShape = newShapePath.length > 0 && newVBWidth > 0 && newVBHeight > 0;

  CGFloat radius = newViewProps.glassCornerRadius;
  if (hasShape) {
    // A custom silhouette is defined entirely by the CAShapeLayer mask applied
    // in -applyShapeMask, so we deliberately DON'T touch `cornerConfiguration`
    // here: on iOS 26 mutating it on a `UIGlassEffect` view during the initial
    // mount (before layout) segfaults inside UIKit. Just square off the plain
    // corner radius and let the mask do the shaping.
    self.layer.cornerRadius = 0;
    _effectView.layer.cornerRadius = 0;
    self.clipsToBounds = NO;
    _effectView.clipsToBounds = NO;
    if (shapeChanged) {
      [self applyShapeMask];
    }
  } else
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
    if (shapeChanged) [self applyShapeMask]; // clears a previously-set mask
  } else
#endif
  {
    self.layer.cornerRadius = radius;
    self.layer.cornerCurve = kCACornerCurveContinuous;
    self.clipsToBounds = YES;
    _effectView.layer.cornerRadius = radius;
    _effectView.layer.cornerCurve = kCACornerCurveContinuous;
    _effectView.clipsToBounds = YES;
    if (shapeChanged) [self applyShapeMask];
  }

  [super updateProps:props oldProps:oldProps];

  [self reportPipelineIfNeeded];
}

#pragma mark - Events

// Reported after the first prop commit rather than from -updateEventEmitter,
// so the effect view has actually been built and the answer describes what is
// on screen instead of what is about to be.
- (void)reportPipelineIfNeeded
{
  if (_reportedPipeline || !_eventEmitter) {
    return;
  }
  _reportedPipeline = YES;

  BOOL nativeGlass = NO;
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    nativeGlass = [_effectView.effect isKindOfClass:[UIGlassEffect class]];
  }
#endif

  const auto emitter =
      std::static_pointer_cast<LiquidGlassmorphismViewEventEmitter const>(_eventEmitter);

  emitter->onPipelineReady({
      // Real system glass, or the UIBlurEffect material standing in for it.
      .tier = nativeGlass ? "glass" : "blur",
      .osVersion = (int)NSProcessInfo.processInfo.operatingSystemVersion.majorVersion,
      // Android-only concept; the field exists so the payload is identical on
      // both platforms.
      .shaderCompiled = false,
      .supportsNativeGlass = (bool)nativeGlass,
  });

  if (!nativeGlass) {
    emitter->onError({
        .code = "GLASS_UNAVAILABLE",
        .message = "UIGlassEffect needs iOS 26; this device is running iOS " +
            std::to_string(NSProcessInfo.processInfo.operatingSystemVersion.majorVersion) +
            ", so a UIBlurEffect material is standing in. It blurs, but it does "
            "not refract.",
        .fatal = false,
    });
  }
}

// Fabric recycles component views. Without this the next mount would inherit
// this one's cached prop state and its already-reported latch, so the effect
// would not be rebuilt and onPipelineReady would never fire again.
#pragma mark - Variable-radius underlay

// Holds the underlay at `f` (0-1) of a full blur. The animator is never
// started — `fractionComplete` on a paused animator is what interpolates the
// filter, and running it would animate away from the value just set.
- (void)setUnderlayFraction:(CGFloat)f
{
  if (_underlayAnimator == nil) {
    _blurUnderlay.effect = nil;
    __weak __typeof__(self) weakSelf = self;
    _underlayAnimator =
        [[UIViewPropertyAnimator alloc] initWithDuration:1.0
                                                   curve:UIViewAnimationCurveLinear
                                              animations:^{
          __typeof__(self) strongSelf = weakSelf;
          // The lightest material on purpose. Heavier ones reach full blur a
          // third of the way through the range and then spend the rest of it
          // just whitening: measured against the Android shader over 0-25dp,
          // `thick` killed all detail by 10dp and pushed luminance to 181,
          // where Android holds 120.
          strongSelf->_blurUnderlay.effect =
              [UIBlurEffect effectWithStyle:UIBlurEffectStyleSystemUltraThinMaterial];
        }];
    // Without this the animator completes and discards its interpolated state
    // the first time fractionComplete reaches 1.
    _underlayAnimator.pausesOnCompletion = YES;
  }
  _underlayAnimator.fractionComplete = f;
}

- (void)tearDownUnderlay
{
  // A property animator left un-stopped when it deallocs raises. Stop it
  // before clearing the effect so the final state is ours, not the animator's.
  if (_underlayAnimator) {
    [_underlayAnimator stopAnimation:YES];
    _underlayAnimator = nil;
  }
  _blurUnderlay.effect = nil;
}

- (void)dealloc
{
  [self tearDownUnderlay];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  _variant = "";
  _intensity = -1;
  _interactive = NO;
  _appliedTint = nil;
  _reportedPipeline = NO;
  _plainBlur = NO;
  _blurRadiusDp = -1;
  _dimOverlay.backgroundColor = UIColor.clearColor;
  [self tearDownUnderlay];

  // The silhouette is cached too, and a stale mask would survive onto whatever
  // view reuses this instance.
  self.shapePath = nil;
  self.shapeVBWidth = 0;
  self.shapeVBHeight = 0;
  self.shapeMaskLayer = nil;
  self.layer.mask = nil;
}

@end
