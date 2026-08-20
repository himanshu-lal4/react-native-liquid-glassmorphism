package com.liquidglassmorphism

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.ScrollEdgeBlurViewManagerDelegate
import com.facebook.react.viewmanagers.ScrollEdgeBlurViewManagerInterface

@ReactModule(name = ScrollEdgeBlurViewManager.NAME)
class ScrollEdgeBlurViewManager :
  SimpleViewManager<ScrollEdgeBlurView>(),
  ScrollEdgeBlurViewManagerInterface<ScrollEdgeBlurView> {

  private val delegate = ScrollEdgeBlurViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<ScrollEdgeBlurView> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext) = ScrollEdgeBlurView(context)

  override fun setEdge(view: ScrollEdgeBlurView, value: String?) {
    view.setEdgeValue(value)
  }

  override fun setMaxBlurRadius(view: ScrollEdgeBlurView, value: Float) {
    view.setMaxBlurRadiusValue(value)
  }

  override fun setFalloff(view: ScrollEdgeBlurView, value: Float) {
    view.setFalloffValue(value)
  }

  companion object {
    const val NAME = "ScrollEdgeBlurView"
  }
}
