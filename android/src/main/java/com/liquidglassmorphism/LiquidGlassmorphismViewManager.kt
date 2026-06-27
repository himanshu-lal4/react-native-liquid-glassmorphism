package com.liquidglassmorphism

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.LiquidGlassmorphismViewManagerInterface
import com.facebook.react.viewmanagers.LiquidGlassmorphismViewManagerDelegate

@ReactModule(name = LiquidGlassmorphismViewManager.NAME)
class LiquidGlassmorphismViewManager : SimpleViewManager<LiquidGlassmorphismView>(),
  LiquidGlassmorphismViewManagerInterface<LiquidGlassmorphismView> {
  private val mDelegate: ViewManagerDelegate<LiquidGlassmorphismView>

  init {
    mDelegate = LiquidGlassmorphismViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<LiquidGlassmorphismView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): LiquidGlassmorphismView {
    return LiquidGlassmorphismView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: LiquidGlassmorphismView?, color: Int?) {
    view?.setBackgroundColor(color ?: Color.TRANSPARENT)
  }

  companion object {
    const val NAME = "LiquidGlassmorphismView"
  }
}
