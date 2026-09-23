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
        private val stars = Array(110) {
            Star(Random.nextFloat(), Random.nextFloat(), 0.6f + Random.nextFloat() * 2.2f, 0.4f + Random.nextFloat() * 1.5f)
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

        private fun fill(canvas: Canvas, color: Int) {
            paint.shader = null
            paint.style = Paint.Style.FILL
            paint.color = color
            paint.alpha = 255
            canvas.drawRect(0f, 0f, canvas.width.toFloat(), canvas.height.toFloat(), paint)
        }

        private fun circle(canvas: Canvas, color: Int, cx: Float, cy: Float, r: Float, alpha: Int = 255) {
            paint.shader = null
            paint.style = Paint.Style.FILL
            paint.color = color
            paint.alpha = alpha
            canvas.drawCircle(cx, cy, r, paint)
        }

        private fun path(canvas: Canvas, color: Int, points: FloatArray, alpha: Int = 255) {
            val p = Path()
            p.moveTo(points[0], points[1])
            var i = 2
            while (i < points.size) {
                p.lineTo(points[i], points[i + 1])
                i += 2
            }
            p.close()
            paint.shader = null
            paint.style = Paint.Style.FILL
            paint.color = color
            paint.alpha = alpha
            canvas.drawPath(p, paint)
        }

        private fun drawFrame() {
            if (!visible) return
            val canvas = try { surfaceHolder.lockCanvas() } catch (_: Exception) { null } ?: return
            try {
                val w = canvas.width.toFloat()
                val h = canvas.height.toFloat()
                time += 0.035f
                mode = getSharedPreferences("wallpaper", MODE_PRIVATE).getInt("mode", 0)
                when (mode) {
                    0 -> drawPirateSea(canvas, w, h)
                    1 -> drawSkyWarrior(canvas, w, h)
                    2 -> drawTropicalIsland(canvas, w, h)
                    3 -> drawNaturalForest(canvas, w, h)
                    4 -> drawSunsetOcean(canvas, w, h)
                    else -> drawCosmic(canvas, w, h)
                }
            } finally {
                surfaceHolder.unlockCanvasAndPost(canvas)
            }
        }

        private fun drawPirateSea(c: Canvas, w: Float, h: Float) {
            paint.shader = LinearGradient(0f, 0f, 0f, h, Color.rgb(25, 100, 160), Color.rgb(3, 18, 48), Shader.TileMode.CLAMP)
            c.drawRect(0f, 0f, w, h, paint)
            paint.shader = null

            val sunX = w * .72f + sin(time * .15f) * w * .025f
            val sunY = h * .22f
            circle(c, Color.rgb(255, 236, 165), sunX, sunY, h * .10f, 230)

            // drifting clouds
            for (i in 0..3) {
                val cx = ((w * (.08f + i * .29f) + time * (10f + i * 4f)) % (w * 1.3f)) - w * .15f
                circle(c, Color.WHITE, cx, h * (.18f + (i % 2) * .09f), h * .035f, 170)
                circle(c, Color.WHITE, cx + h * .035f, h * (.17f + (i % 2) * .09f), h * .045f, 180)
                circle(c, Color.WHITE, cx + h * .075f, h * (.19f + (i % 2) * .09f), h * .028f, 160)
            }

            // distant islands
            path(c, Color.rgb(15, 55, 67), floatArrayOf(0f,h*.58f,w*.16f,h*.50f,w*.28f,h*.57f,w*.42f,h*.48f,w*.58f,h*.58f,w*.75f,h*.49f,w,h*.57f,w,h,0f,h))
            // animated sea
            path(c, Color.rgb(5, 72, 105), floatArrayOf(0f,h*.60f,w*.22f,h*.57f,w*.45f,h*.61f,w*.68f,h*.56f,w,h*.61f,w,h,0f,h))
            for (i in 0..10) {
                val yy = h * (.64f + i * .035f)
                val shift = sin(time * 1.4f + i) * w * .025f
                paint.color = Color.argb(100, 160, 225, 240)
                paint.strokeWidth = h * .006f
                paint.style = Paint.Style.STROKE
                val p = Path()
                p.moveTo(-w*.1f + shift, yy)
                for (x in 0..8) p.quadTo(w*(x/8f+.05f)+shift, yy + sin(time*2f+x+i)*h*.009f, w*(x/8f+.125f)+shift, yy)
                c.drawPath(p, paint)
            }
            paint.style = Paint.Style.FILL

            // original anime pirate silhouette on a small ship
            val shipY = h * .57f + sin(time * .9f) * h * .012f
            path(c, Color.rgb(55, 25, 18), floatArrayOf(w*.34f,shipY,w*.64f,shipY,w*.59f,shipY+h*.055f,w*.40f,shipY+h*.055f))
            paint.color = Color.rgb(205, 150, 75); paint.strokeWidth = h*.006f
            c.drawLine(w*.49f, shipY, w*.49f, shipY-h*.23f, paint)
            path(c, Color.rgb(238, 231, 205), floatArrayOf(w*.495f,shipY-h*.21f,w*.495f,shipY-h*.05f,w*.64f,shipY-h*.13f,w*.495f,shipY-h*.21f))
            circle(c, Color.rgb(38, 22, 18), w*.49f, shipY-h*.27f, h*.035f)
            path(c, Color.rgb(38,22,18), floatArrayOf(w*.46f,shipY-h*.24f,w*.52f,shipY-h*.24f,w*.54f,shipY-h*.15f,w*.44f,shipY-h*.15f))

            // floating birds
            paint.color = Color.argb(190, 20, 30, 45); paint.style = Paint.Style.STROKE; paint.strokeWidth = h*.004f
            for (i in 0..5) {
                val bx = (w*(.08f+i*.16f)+time*8f)%w
                val by = h*(.34f+(i%3)*.045f)
                c.drawArc(bx,by,bx+h*.035f,by+h*.018f,200f,130f,false,paint)
                c.drawArc(bx+h*.035f,by,bx+h*.07f,by+h*.018f,210f,130f,false,paint)
            }
            paint.style = Paint.Style.FILL
        }

        private fun drawSkyWarrior(c: Canvas, w: Float, h: Float) {
            paint.shader = LinearGradient(0f,0f,0f,h,Color.rgb(95,185,245),Color.rgb(16,32,72),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,paint); paint.shader=null
            val cx=w*(.5f+(xOffset-.5f)*.15f)+sin(time*.35f)*w*.03f
            val cy=h*.42f+sin(time*.7f)*h*.025f
            circle(c,Color.rgb(255,242,190),w*.78f,h*.18f,h*.09f,220)
            for(i in 0..5){
                val x=((i*.22f*w+time*(8+i*2))%(w*1.25f))-w*.1f
                circle(c,Color.WHITE,x,h*(.2f+(i%3)*.08f),h*.035f,150)
                circle(c,Color.WHITE,x+h*.04f,h*(.19f+(i%3)*.08f),h*.045f,160)
            }
            path(c,Color.rgb(34,60,88),floatArrayOf(0f,h*.62f,w*.18f,h*.48f,w*.34f,h*.59f,w*.52f,h*.43f,w*.70f,h*.57f,w*.84f,h*.46f,w,h*.58f,w,h,0f,h))
            path(c,Color.rgb(22,39,59),floatArrayOf(0f,h*.72f,w*.24f,h*.60f,w*.45f,h*.70f,w*.64f,h*.56f,w*.82f,h*.68f,w,h*.59f,w,h,0f,h))
            // original anime sky warrior silhouette
            circle(c,Color.rgb(22,20,30),cx,cy-h*.075f,h*.035f)
            path(c,Color.rgb(22,20,30),floatArrayOf(cx-h*.035f,cy-h*.04f,cx+h*.035f,cy-h*.04f,cx+h*.055f,cy+h*.08f,cx-h*.055f,cy+h*.08f))
            paint.color=Color.rgb(225,235,245); paint.strokeWidth=h*.008f
            c.drawLine(cx+h*.01f,cy-h*.02f,cx+h*.13f,cy-h*.13f,paint)
            paint.color=Color.rgb(190,40,65); paint.strokeWidth=h*.018f
            c.drawLine(cx-h*.045f,cy-h*.015f,cx-h*.12f,cy-h*.065f,paint)
            // energy particles
            for(i in 0..22){
                val a=time*(.35f+i*.006f)+i
                val rr=h*(.16f+(i%5)*.025f)
                circle(c,if(i%2==0)Color.rgb(110,230,255)else Color.rgb(255,210,100),cx+cos(a)*rr,cy+sin(a)*rr*.55f,h*.0045f,190)
            }
        }

        private fun drawTropicalIsland(c: Canvas, w: Float, h: Float) {
            paint.shader=LinearGradient(0f,0f,0f,h,Color.rgb(110,205,250),Color.rgb(15,92,125),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,paint); paint.shader=null
            circle(c,Color.rgb(255,235,165),w*.72f,h*.18f,h*.095f,230)
            path(c,Color.rgb(22,125,145),floatArrayOf(0f,h*.55f,w*.24f,h*.50f,w*.50f,h*.57f,w*.75f,h*.49f,w,h*.55f,w,h,0f,h))
            path(c,Color.rgb(245,200,112),floatArrayOf(0f,h*.68f,w*.22f,h*.61f,w*.50f,h*.69f,w*.76f,h*.60f,w,h*.67f,w,h,0f,h))
            // palms
            for(i in 0..4){
                val x=w*(.12f+i*.2f)+sin(time*.3f+i)*w*.015f
                val base=h*(.64f+(i%2)*.04f)
                paint.color=Color.rgb(85,55,28);paint.strokeWidth=h*.012f
                c.drawLine(x,base,x-h*.015f,base-h*.17f,paint)
                for(j in 0..5){
                    paint.color=Color.rgb(35,125,65);paint.strokeWidth=h*.009f
                    val a=-2.6f+j*.65f+sin(time*.5f)*.05f
                    c.drawLine(x-h*.015f,base-h*.17f,x-h*.015f+cos(a)*h*.12f,base-h*.17f+sin(a)*h*.07f,paint)
                }
            }
            for(i in 0..12){
                val yy=h*(.70f+i*.022f)
                val shift=sin(time*1.2f+i)*w*.018f
                paint.color=Color.argb(90,235,255,255);paint.strokeWidth=h*.004f;paint.style=Paint.Style.STROKE
                c.drawLine(w*.05f+shift,yy,w*.35f+shift,yy,paint)
                c.drawLine(w*.58f-shift,yy,w*.95f-shift,yy,paint)
            }
            paint.style=Paint.Style.FILL
        }

        private fun drawNaturalForest(c: Canvas, w: Float, h: Float) {
            paint.shader=LinearGradient(0f,0f,w,h,Color.rgb(135,190,170),Color.rgb(12,43,36),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,paint);paint.shader=null
            circle(c,Color.rgb(250,238,175),w*.75f,h*.22f,h*.09f,150)
            // mist
            for(i in 0..5) circle(c,Color.WHITE,w*(.1f+i*.18f)+sin(time*.15f+i)*w*.03f,h*(.35f+(i%2)*.08f),h*.055f,35)
            // distant mountains
            path(c,Color.rgb(57,105,88),floatArrayOf(0f,h*.58f,w*.18f,h*.35f,w*.34f,h*.57f,w*.52f,h*.31f,w*.68f,h*.56f,w*.84f,h*.37f,w,h*.58f,w,h,0f,h))
            // river
            path(c,Color.rgb(55,145,158),floatArrayOf(w*.44f,h*.57f,w*.55f,h*.57f,w*.70f,h,w*.28f,h,w*.44f,h*.57f))
            // trees
            for(i in 0..13){
                val x=w*(i/13f)+sin(i*3f)*w*.02f
                val base=h*(.63f+(i%4)*.025f)
                val size=h*(.09f+(i%3)*.025f)
                paint.color=Color.rgb(45,58,39);paint.strokeWidth=h*.012f
                c.drawLine(x,base,x,base-size*1.8f,paint)
                circle(c,Color.rgb(32,92,58),x,base-size*1.45f,size*.75f,220)
                circle(c,Color.rgb(42,120,70),x-size*.35f,base-size*1.2f,size*.58f,210)
                circle(c,Color.rgb(50,135,78),x+size*.35f,base-size*1.25f,size*.58f,210)
            }
            // firefly-like motion
            for(i in 0..18){
                val x=(w*(i*.073f)+time*(4f+(i%3)))%w
                val y=h*(.3f+(i%7)*.065f)+sin(time+i)*h*.015f
                circle(c,Color.rgb(220,255,150),x,y,h*.004f,180)
            }
        }

        private fun drawSunsetOcean(c: Canvas, w: Float, h: Float) {
            paint.shader=LinearGradient(0f,0f,0f,h,Color.rgb(70,55,125),Color.rgb(245,112,65),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,paint);paint.shader=null
            val sx=w*.5f+sin(time*.12f)*w*.04f
            circle(c,Color.rgb(255,228,145),sx,h*.48f,h*.12f,245)
            path(c,Color.rgb(34,55,91),floatArrayOf(0f,h*.58f,w*.20f,h*.52f,w*.40f,h*.59f,w*.62f,h*.50f,w*.82f,h*.57f,w,h*.51f,w,h,0f,h))
            for(i in 0..14){
                val yy=h*(.64f+i*.025f)
                val amp=h*.008f
                paint.color=Color.argb(95,255,210,165);paint.style=Paint.Style.STROKE;paint.strokeWidth=h*.004f
                val p=Path();p.moveTo(0f,yy)
                for(j in 1..8)p.lineTo(w*j/8f,yy+sin(time*1.4f+j+i)*amp)
                c.drawPath(p,paint)
            }
            paint.style=Paint.Style.FILL
            // birds
            paint.color=Color.argb(180,35,28,55);paint.style=Paint.Style.STROKE;paint.strokeWidth=h*.004f
            for(i in 0..5){
                val bx=w*(.1f+i*.15f)+sin(time*.4f+i)*w*.03f
                val by=h*(.27f+(i%3)*.04f)
                c.drawArc(bx,by,bx+h*.03f,by+h*.015f,200f,140f,false,paint)
                c.drawArc(bx+h*.03f,by,bx+h*.06f,by+h*.015f,210f,140f,false,paint)
            }
            paint.style=Paint.Style.FILL
        }

        private fun drawCosmic(c: Canvas, w: Float, h: Float) {
            paint.shader=LinearGradient(0f,0f,w,h,Color.rgb(5,7,28),Color.rgb(48,5,66),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,paint);paint.shader=null
            for(s in stars){
                var x=s.x*w+(xOffset-.5f)*w*.35f/s.speed
                x=((x%w)+w)%w
                circle(c,Color.WHITE,x,s.y*h,s.size,100+(s.speed*80).toInt().coerceAtMost(155))
            }
            val cx=w*.5f+sin(time*.7f)*w*.035f
            val cy=h*.46f+cos(time*.55f)*h*.025f
            val glow=RadialGradient(cx,cy,h*.26f,intArrayOf(Color.WHITE,Color.rgb(80,210,255),Color.rgb(120,45,230),Color.TRANSPARENT),floatArrayOf(0f,.16f,.55f,1f),Shader.TileMode.CLAMP)
            paint.shader=glow;c.drawCircle(cx,cy,h*.26f,paint);paint.shader=null
            paint.style=Paint.Style.STROKE
            paint.strokeWidth=h*.008f
            paint.color=Color.rgb(110,225,255)
            for(i in 0..3)c.drawCircle(cx,cy,h*(.15f+i*.045f)+sin(time+i)*h*.012f,paint)
            paint.style=Paint.Style.FILL
        }
    }
}
