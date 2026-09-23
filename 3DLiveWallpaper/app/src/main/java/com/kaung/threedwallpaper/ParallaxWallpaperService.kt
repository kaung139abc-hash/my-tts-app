package com.kaung.threedwallpaper

import android.graphics.*
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

class ParallaxWallpaperService : WallpaperService() {
    private data class Star(val x: Float, val y: Float, val size: Float, val speed: Float)

    override fun onCreateEngine() = Engine()

    inner class Engine : WallpaperService.Engine() {
        private var visible = false
        private var xOffset = 0.5f
        private var mode = getSharedPreferences("wallpaper", MODE_PRIVATE).getInt("mode", 0)
        private var time = 0f
        private val handler = android.os.Handler(android.os.Looper.getMainLooper())
        private val stars = Array(150) {
            Star(Random.nextFloat(), Random.nextFloat(), 0.4f + Random.nextFloat() * 2.2f, 0.4f + Random.nextFloat() * 1.6f)
        }
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        private val frame = object : Runnable {
            override fun run() {
                drawFrame()
                if (visible) handler.postDelayed(this, 33L)
            }
        }


        override fun onVisibilityChanged(v: Boolean) {
            visible = v
            handler.removeCallbacks(frame)
            if (v) handler.post(frame)
        }

        override fun onSurfaceChanged(h: SurfaceHolder, f: Int, w: Int, ht: Int) {
            super.onSurfaceChanged(h, f, w, ht)
            if (visible) drawFrame()
        }

        override fun onOffsetsChanged(x: Float, y: Float, xStep: Float, yStep: Float, xPixels: Int, yPixels: Int) {
            xOffset = x
            if (visible) drawFrame()
        }

        override fun onSurfaceDestroyed(holder: SurfaceHolder) {
            visible = false
            handler.removeCallbacks(frame)
            super.onSurfaceDestroyed(holder)
        }

        private fun drawFrame() {
            if (!visible) return
            val canvas = try { surfaceHolder.lockCanvas() } catch (_: Exception) { null } ?: return
            try {
                val w = canvas.width.toFloat()
                val h = canvas.height.toFloat()
                time += 0.035f
                mode = getSharedPreferences("wallpaper", MODE_PRIVATE).getInt("mode", 0)

                val bg = when (mode) {
                    1 -> LinearGradient(0f, 0f, w, h, Color.rgb(2, 18, 28), Color.rgb(5, 55, 70), Shader.TileMode.CLAMP)
                    2 -> LinearGradient(0f, 0f, w, h, Color.rgb(18, 3, 28), Color.rgb(55, 4, 30), Shader.TileMode.CLAMP)
                    3 -> LinearGradient(0f, 0f, w, h, Color.rgb(3, 18, 12), Color.rgb(3, 45, 55), Shader.TileMode.CLAMP)
                    else -> LinearGradient(0f, 0f, w, h, Color.rgb(4, 6, 24), Color.rgb(28, 5, 52), Shader.TileMode.CLAMP)
                }
                paint.shader = bg
                canvas.drawRect(0f, 0f, w, h, paint)

                // Nebula bands
                val c1 = when(mode){1->Color.rgb(40,240,220);2->Color.rgb(255,55,170);3->Color.rgb(70,255,150);else->Color.rgb(70,210,255)}
                paint.shader = RadialGradient(w * 0.72f, h * 0.30f, h * 0.65f,
                    intArrayOf(Color.argb(100, Color.red(c1), Color.green(c1), Color.blue(c1)), Color.argb(35, 140, 60, 255), Color.TRANSPARENT),
                    floatArrayOf(0f, .45f, 1f), Shader.TileMode.CLAMP)
                canvas.drawCircle(w * 0.72f, h * 0.30f, h * 0.65f, paint)

                paint.shader = RadialGradient(w * 0.20f, h * 0.76f, h * 0.55f,
                    intArrayOf(Color.argb(65, 255, 55, 170), Color.TRANSPARENT),
                    null, Shader.TileMode.CLAMP)
                canvas.drawCircle(w * 0.20f, h * 0.76f, h * 0.55f, paint)
                paint.shader = null

                // Depth stars
                for (s in stars) {
                    val depth = s.speed
                    var sx = s.x * w + (xOffset - .5f) * w * .32f / depth
                    sx = ((sx % w) + w) % w
                    val sy = s.y * h
                    paint.color = Color.WHITE
                    paint.alpha = (70 + s.speed * 70).toInt().coerceAtMost(255)
                    canvas.drawCircle(sx, sy, s.size, paint)
                }

                // Central energy core
                val cx = w * (.5f + (xOffset - .5f) * .22f) + cos(time * .8f) * w * .035f
                val cy = h * .47f + sin(time * .65f) * h * .035f
                val r = h * .22f

                paint.shader = RadialGradient(cx, cy, r,
                    intArrayOf(Color.WHITE, c1, if(mode==2) Color.rgb(255,35,120) else Color.rgb(100,45,220), Color.TRANSPARENT),
                    floatArrayOf(0f, .16f, .52f, 1f), Shader.TileMode.CLAMP)
                canvas.drawCircle(cx, cy, r, paint)

                paint.shader = null
                paint.style = Paint.Style.STROKE
                paint.strokeWidth = h * .012f
                paint.alpha = 180
                paint.color = Color.rgb(110, 225, 255)
                canvas.drawCircle(cx, cy, r * (.72f + sin(time) * .06f), paint)
                paint.strokeWidth = h * .006f
                paint.alpha = 120
                canvas.drawCircle(cx, cy, r * (.92f + cos(time * .7f) * .05f), paint)
                paint.style = Paint.Style.FILL
                paint.alpha = 255

                // Orbit particles
                for (i in 0 until 18) {
                    val a = time * (.55f + i * .012f) + i * 0.35f
                    val rr = r * (1.05f + (i % 3) * .13f)
                    val px = cx + cos(a) * rr
                    val py = cy + sin(a) * rr * .58f
                    paint.color = if (i % 2 == 0) c1 else Color.rgb(220, 100, 255)
                    paint.alpha = 210
                    canvas.drawCircle(px.toFloat(), py.toFloat(), h * .0045f, paint)
                }
            } finally {
                surfaceHolder.unlockCanvasAndPost(canvas)
            }
        }
    }
}
