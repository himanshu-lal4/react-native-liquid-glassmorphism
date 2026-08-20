package com.liquidglassmorphism

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.LiquidGlassmorphismViewManagerDelegate
import com.facebook.react.viewmanagers.LiquidGlassmorphismViewManagerInterface

/**
 * Fabric ViewManager for [LiquidGlassmorphismView]. A [ViewGroupManager] (not
 * SimpleViewManager) so React children mount into the glass and render crisply
 * on top of the blurred backdrop.
 */
@ReactModule(name = LiquidGlassmorphismViewManager.NAME)
class LiquidGlassmorphismViewManager : ViewGroupManager<LiquidGlassmorphismView>(),
  LiquidGlassmorphismViewManagerInterface<LiquidGlassmorphismView> {

  private val mDelegate: ViewManagerDelegate<LiquidGlassmorphismView> =
    LiquidGlassmorphismViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<LiquidGlassmorphismView> = mDelegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): LiquidGlassmorphismView =
    LiquidGlassmorphismView(context)

  override fun setVariant(view: LiquidGlassmorphismView, value: String?) {
    view.setVariantClear(value == "clear")
  }

  override fun setTintColor(view: LiquidGlassmorphismView, value: Int?) {
    view.setTint(value)
  }

  override fun setIntensity(view: LiquidGlassmorphismView, value: Int) {
    view.setIntensityValue(value)
  }

  override fun setBlurRadius(view: LiquidGlassmorphismView, value: Float) {
    view.setBlurRadiusDpValue(value)
  }

  override fun setInteractive(view: LiquidGlassmorphismView, value: Boolean) {
    view.setInteractiveValue(value)
  }

  override fun setTilt(view: LiquidGlassmorphismView, value: Boolean) {
    view.setTiltValue(value)
  }

  override fun setGlassCornerRadius(view: LiquidGlassmorphismView, value: Int) {
    view.setCornerRadiusDp(value)
  }

  override fun setRefraction(view: LiquidGlassmorphismView, value: Boolean) {
    view.setRefractionValue(value)
  }

  override fun setThickness(view: LiquidGlassmorphismView, value: Float) {
    view.setThicknessValue(value)
  }

  override fun setEdgeReflectionStrength(view: LiquidGlassmorphismView, value: Float) {
    view.setEdgeReflectionStrengthValue(value)
  }

  override fun setIridescence(view: LiquidGlassmorphismView, value: Float) {
    view.setIridescenceValue(value)
  }

  override fun setGrain(view: LiquidGlassmorphismView, value: Float) {
    view.setGrainValue(value)
  }

  override fun setLightAngle(view: LiquidGlassmorphismView, value: Float) {
    view.setLightAngleValue(value)
  }

  override fun setSpecularSharpness(view: LiquidGlassmorphismView, value: Float) {
    view.setSpecularSharpnessValue(value)
  }

  override fun setSaturation(view: LiquidGlassmorphismView, value: Float) {
    view.setSaturationValue(value)
  }

  override fun setBrightness(view: LiquidGlassmorphismView, value: Float) {
    view.setBrightnessValue(value)
  }

  override fun setMagnification(view: LiquidGlassmorphismView, value: Float) {
    view.setMagnificationValue(value)
  }

  override fun setIor(view: LiquidGlassmorphismView, value: Float) {
    view.setIorValue(value)
  }

  override fun setFrameStatsInterval(view: LiquidGlassmorphismView, value: Int) {
    view.setFrameStatsIntervalValue(value)
  }

  override fun setRim(view: LiquidGlassmorphismView, value: Boolean) {
    view.setRimValue(value)
  }

  override fun setSpecular(view: LiquidGlassmorphismView, value: Boolean) {
    view.setSpecularValue(value)
  }

  override fun setDim(view: LiquidGlassmorphismView, value: Float) {
    view.setDimValue(value)
  }

  override fun setLegibilityFloor(view: LiquidGlassmorphismView, value: Float) {
    view.setLegibilityFloorValue(value)
  }

  override fun setPaused(view: LiquidGlassmorphismView, value: Boolean) {
    view.setPausedValue(value)
  }

  override fun setShapePath(view: LiquidGlassmorphismView, value: String?) {
    view.setShapePathData(value)
  }

  override fun setShapeViewBoxWidth(view: LiquidGlassmorphismView, value: Float) {
    view.setShapeViewBoxWidth(value)
  }

  override fun setShapeViewBoxHeight(view: LiquidGlassmorphismView, value: Float) {
    view.setShapeViewBoxHeight(value)
  }

  /**
   * Both the `top`-prefixed name and the `registrationName` entry are required.
   * Without an entry here the event is dispatched natively, matches nothing in
   * JS, and vanishes with no error on either side.
   */
  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      GlassPipelineReadyEvent.EVENT_NAME to
        mutableMapOf("registrationName" to "onPipelineReady"),
      GlassErrorEvent.EVENT_NAME to
        mutableMapOf("registrationName" to "onError"),
    )

  companion object {
    const val NAME = "LiquidGlassmorphismView"
  }
}
