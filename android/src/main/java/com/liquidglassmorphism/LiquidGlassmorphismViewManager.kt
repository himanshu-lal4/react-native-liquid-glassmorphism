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

  override fun setInteractive(view: LiquidGlassmorphismView, value: Boolean) {
    view.setInteractiveValue(value)
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

  override fun setShapePath(view: LiquidGlassmorphismView, value: String?) {
    view.setShapePathData(value)
  }

  override fun setShapeViewBoxWidth(view: LiquidGlassmorphismView, value: Float) {
    view.setShapeViewBoxWidth(value)
  }

  override fun setShapeViewBoxHeight(view: LiquidGlassmorphismView, value: Float) {
    view.setShapeViewBoxHeight(value)
  }

  companion object {
    const val NAME = "LiquidGlassmorphismView"
  }
}
