package com.liquidglassmorphism

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

/**
 * Fabric ViewManager for [LiquidGlassBackdropView].
 *
 * Extends the stock `View` manager rather than a bare ViewGroupManager so that
 * every ordinary style prop — `borderRadius`, `overflow`, `backgroundColor` —
 * keeps working on it: to the layout it is a plain container, and it should
 * accept whatever a plain container accepts.
 */
@ReactModule(name = LiquidGlassBackdropViewManager.NAME)
class LiquidGlassBackdropViewManager : ReactViewManager() {

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): ReactViewGroup =
    LiquidGlassBackdropView(context)

  companion object {
    const val NAME = "LiquidGlassBackdrop"
  }
}
