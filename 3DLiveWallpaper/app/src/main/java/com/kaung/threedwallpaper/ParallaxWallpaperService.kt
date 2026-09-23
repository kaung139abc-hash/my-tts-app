package com.kaung.threedwallpaper

import android.graphics.*
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import kotlin.math.sin
import kotlin.random.Random

class ParallaxWallpaperService : WallpaperService() {
    override fun onCreateEngine() = Engine()

    inner class Engine : WallpaperService.Engine() {
        private var running=false
        private var xOffset=0.5f
        private var frame=0L
        private val stars=Array(90) { Pair(Random.nextFloat(), Random.nextFloat()) }

        override fun onVisibilityChanged(visible:Boolean) {
            running=visible
            if (visible) draw()
        }
        override fun onSurfaceChanged(h:SurfaceHolder, f:Int, w:Int, ht:Int) {
            super.onSurfaceChanged(h,f,w,ht); draw()
        }
        override fun onOffsetsChanged(x:Float, y:Float, xStep:Float, yStep:Float, xPixels:Float, yPixels:Float) {
            xOffset=x; draw()
        }
        private fun draw() {
            if (!running) return
            val holder=surfaceHolder
            val canvas=try { holder.lockCanvas() } catch(_:Exception){ null } ?: return
            try {
                val w=canvas.width.toFloat(); val h=canvas.height.toFloat()
                val t=(frame++ % 100000)/18f
                canvas.drawColor(Color.BLACK)
                val bg=LinearGradient(0f,0f,w,h,
                    Color.rgb(8,10,30),Color.rgb(30,5,55),Shader.TileMode.CLAMP)
                canvas.drawRect(0f,0f,w,h,Paint().apply{shader=bg})
                val glow=Paint(Paint.ANTI_ALIAS_FLAG)
                stars.forEachIndexed { i,p ->
                    val depth=1f+(i%5)*0.7f
                    val sx=(p.first*w + (xOffset-.5f)*w*.25f/depth)%w
                    val sy=p.second*h
                    glow.color=Color.WHITE; glow.alpha=120+(i%120)
                    canvas.drawCircle((sx+w)%w,sy,1f+(i%3),glow)
                }
                val cx=w*(.5f+(xOffset-.5f)*.35f)+sin(t*.8)*w*.03f
                val cy=h*.48f+sin(t*.55)*h*.04f
                val r=h*.24f
                val orb=RadialGradient(cx,cy,r,
                    intArrayOf(Color.rgb(120,210,255),Color.rgb(80,40,180),Color.TRANSPARENT),
                    floatArrayOf(0f,.45f,1f),Shader.TileMode.CLAMP)
                glow.shader=orb; glow.alpha=255
                canvas.drawCircle(cx,cy,r,glow)
            } finally { holder.unlockCanvasAndPost(canvas) }
            if (running) surfaceHolder.surface?.let { Thread.sleep(33) }
            if (running) draw()
        }
    }
}
