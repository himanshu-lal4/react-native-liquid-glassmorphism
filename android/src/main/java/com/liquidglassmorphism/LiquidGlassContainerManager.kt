package com.liquidglassmorphism

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.LiquidGlassContainerManagerDelegate
import com.facebook.react.viewmanagers.LiquidGlassContainerManagerInterface

@ReactModule(name = LiquidGlassContainerManager.NAME)
class LiquidGlassContainerManager :
  ViewGroupManager<LiquidGlassContainer>(),
  LiquidGlassContainerManagerInterface<LiquidGlassContainer> {

  private val delegate = LiquidGlassContainerManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<LiquidGlassContainer> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext) = LiquidGlassContainer(context)

  override fun setSpacing(view: LiquidGlassContainer, value: Float) {
    view.setSpacingValue(value)
  }

  companion object {
    const val NAME = "LiquidGlassContainer"
  }
}
