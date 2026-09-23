package com.kaung.threedwallpaper

import android.graphics.*
import android.os.Handler
import android.os.Looper
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
        private var xOffset = .5f
        private var yOffset = .5f
        private var time = 0f
        private var mode = 0
        private val handler = Handler(Looper.getMainLooper())
        private val stars = Array(150) {
            Star(Random.nextFloat(), Random.nextFloat(), .5f + Random.nextFloat() * 2.4f, .4f + Random.nextFloat() * 1.8f)
        }
        private val p = Paint(Paint.ANTI_ALIAS_FLAG)
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

        override fun onOffsetsChanged(x: Float, y: Float, xs: Float, ys: Float, xp: Int, yp: Int) {
            xOffset = x
            yOffset = y
        }

        override fun onSurfaceDestroyed(holder: SurfaceHolder) {
            visible = false
            handler.removeCallbacks(frame)
            super.onSurfaceDestroyed(holder)
        }

        private fun drawFrame() {
            if (!visible) return
            val c = try { surfaceHolder.lockCanvas() } catch (_: Exception) { null } ?: return
            try {
                time += .033f
                mode = getSharedPreferences("wallpaper", MODE_PRIVATE).getInt("mode", 0)
                val w = c.width.toFloat()
                val h = c.height.toFloat()
                when (mode) {
                    0 -> pirate(c, w, h)
                    1 -> warrior(c, w, h)
                    2 -> island(c, w, h)
                    3 -> forest(c, w, h)
                    4 -> sunset(c, w, h)
                    else -> cosmic(c, w, h)
                }
            } finally {
                surfaceHolder.unlockCanvasAndPost(c)
            }
        }

        private fun bg(c: Canvas, w: Float, h: Float, top: Int, bottom: Int) {
            p.shader = LinearGradient(0f, 0f, 0f, h, top, bottom, Shader.TileMode.CLAMP)
            c.drawRect(0f, 0f, w, h, p)
            p.shader = null
        }

        private fun poly(c: Canvas, color: Int, vararg pts: Float) {
            val path = Path()
            path.moveTo(pts[0], pts[1])
            var i = 2
            while (i < pts.size) { path.lineTo(pts[i], pts[i + 1]); i += 2 }
            path.close()
            p.style = Paint.Style.FILL
            p.color = color
            p.alpha = 255
            c.drawPath(path, p)
        }

        private fun dot(c: Canvas, color: Int, x: Float, y: Float, r: Float, alpha: Int = 255) {
            p.shader = null; p.style = Paint.Style.FILL; p.color = color; p.alpha = alpha
            c.drawCircle(x, y, r, p)
        }

        private fun wave(c: Canvas, w: Float, y: Float, amp: Float, speed: Float, alpha: Int) {
            p.style = Paint.Style.STROKE
            p.strokeWidth = maxOf(1.5f, amp * .22f)
            p.color = Color.WHITE
            p.alpha = alpha
            val path = Path()
            path.moveTo(-w*.1f, y)
            for (i in 0..12) {
                val x = w * i / 12f
                path.lineTo(x, y + sin(time * speed + i*.9f) * amp)
            }
            c.drawPath(path, p)
            p.style = Paint.Style.FILL
        }

        private fun clouds(c: Canvas, w: Float, h: Float, count: Int, speed: Float) {
            for (i in 0 until count) {
                val x = ((i * w / count + time * speed * (1 + i % 3) + w) % (w * 1.25f)) - w*.12f
                val y = h * (.13f + (i % 4) * .065f)
                dot(c, Color.WHITE, x, y, h*.027f, 145)
                dot(c, Color.WHITE, x+h*.035f, y-h*.018f, h*.042f, 165)
                dot(c, Color.WHITE, x+h*.073f, y, h*.025f, 135)
            }
        }

        private fun pirate(c: Canvas, w: Float, h: Float) {
            bg(c,w,h,Color.rgb(30,126,190),Color.rgb(3,18,45))
            val px = (xOffset-.5f)*w*.14f
            dot(c,Color.rgb(255,236,170),w*.73f+sin(time*.18f)*w*.025f,h*.20f,h*.105f,235)
            clouds(c,w,h,5,5f)

            poly(c,Color.rgb(13,54,66),0f,h*.57f,w*.12f,h*.49f,w*.27f,h*.56f,w*.42f,h*.47f,w*.58f,h*.57f,w*.76f,h*.48f,w,h*.56f,w,h,0f,h)
            poly(c,Color.rgb(4,73,106),0f,h*.61f,w*.28f,h*.57f,w*.53f,h*.62f,w*.77f,h*.56f,w,h*.61f,w,h,0f,h)

            for (i in 0..12) wave(c,w,h*(.65f+i*.027f),h*.007f,1.4f,80+i*4)

            val bob = sin(time*.9f)*h*.012f
            val shipX = w*.50f + px
            val sy = h*.57f + bob
            // ship hull
            poly(c,Color.rgb(48,25,22),shipX-w*.17f,sy,shipX+w*.17f,sy,shipX+w*.11f,sy+h*.055f,shipX-w*.12f,sy+h*.055f)
            p.color=Color.rgb(211,157,80); p.strokeWidth=h*.006f
            c.drawLine(shipX,sy,shipX,sy-h*.25f,p)
            // sail
            poly(c,Color.rgb(245,237,210),shipX+h*.006f,sy-h*.225f,shipX+h*.006f,sy-h*.055f,shipX+w*.12f,sy-h*.13f)
            // original captain
            dot(c,Color.rgb(28,20,25),shipX,sy-h*.285f,h*.033f)
            poly(c,Color.rgb(30,22,27),shipX-h*.045f,sy-h*.255f,shipX+h*.045f,sy-h*.255f,shipX+h*.055f,sy-h*.145f,shipX-h*.055f,sy-h*.145f)
            // coat
            p.color=Color.rgb(178,42,55);p.strokeWidth=h*.018f
            c.drawLine(shipX-h*.04f,sy-h*.22f,shipX-h*.075f,sy-h*.10f,p)
            c.drawLine(shipX+h*.04f,sy-h*.22f,shipX+h*.075f,sy-h*.10f,p)
            // second crew member with sword
            val cx=shipX+w*.08f
            dot(c,Color.rgb(25,22,28),cx,sy-h*.205f,h*.024f)
            p.color=Color.rgb(225,225,230);p.strokeWidth=h*.006f
            c.drawLine(cx+h*.01f,sy-h*.18f,cx+h*.09f,sy-h*.29f,p)
            // mast flag
            poly(c,Color.rgb(25,20,28),shipX,sy-h*.255f,shipX+w*.055f,sy-h*.235f,shipX,sy-h*.205f)
            // foreground spray
            for(i in 0..24) {
                val x=((i*.083f*w+time*(15+i%4))%w)
                val y=h*(.72f+(i%5)*.045f)+sin(time*2+i)*h*.012f
                dot(c,Color.rgb(190,235,250),x,y,h*.0035f,150)
            }
        }

        private fun warrior(c: Canvas, w: Float, h: Float) {
            bg(c,w,h,Color.rgb(88,180,245),Color.rgb(14,26,68))
            val cx=w*.5f+(xOffset-.5f)*w*.16f+sin(time*.35f)*w*.025f
            val cy=h*.42f+sin(time*.7f)*h*.018f
            dot(c,Color.rgb(255,242,190),w*.78f,h*.18f,h*.095f,220)
            clouds(c,w,h,6,4f)
            poly(c,Color.rgb(31,61,91),0f,h*.61f,w*.2f,h*.45f,w*.35f,h*.59f,w*.52f,h*.42f,w*.69f,h*.57f,w*.86f,h*.44f,w,h*.58f,w,h,0f,h)
            poly(c,Color.rgb(19,36,60),0f,h*.73f,w*.25f,h*.59f,w*.47f,h*.70f,w*.66f,h*.56f,w*.83f,h*.68f,w,h*.58f,w,h,0f,h)
            // original floating warrior
            dot(c,Color.rgb(22,19,29),cx,cy-h*.075f,h*.034f)
            poly(c,Color.rgb(22,19,29),cx-h*.035f,cy-h*.04f,cx+h*.035f,cy-h*.04f,cx+h*.055f,cy+h*.085f,cx-h*.055f,cy+h*.085f)
            p.color=Color.rgb(224,230,240);p.strokeWidth=h*.008f
            c.drawLine(cx+h*.01f,cy-h*.015f,cx+h*.14f,cy-h*.15f,p)
            p.color=Color.rgb(190,40,65);p.strokeWidth=h*.017f
            c.drawLine(cx-h*.04f,cy-h*.01f,cx-h*.13f,cy-h*.07f,p)
            for(i in 0..34){
                val a=time*(.8f+i*.012f)+i
                val r=h*(.15f+(i%7)*.022f)
                dot(c,if(i%2==0)Color.rgb(90,230,255)else Color.rgb(255,205,90),cx+cos(a)*r,cy+sin(a)*r*.58f,h*.0035f,190)
            }
        }

        private fun island(c: Canvas,w:Float,h:Float){
            bg(c,w,h,Color.rgb(103,206,250),Color.rgb(10,89,120))
            dot(c,Color.rgb(255,236,170),w*.72f,h*.18f,h*.10f,225)
            clouds(c,w,h,5,4f)
            poly(c,Color.rgb(18,126,147),0f,h*.56f,w*.25f,h*.50f,w*.50f,h*.57f,w*.75f,h*.49f,w,h*.55f,w,h,0f,h)
            poly(c,Color.rgb(242,199,113),0f,h*.68f,w*.20f,h*.61f,w*.50f,h*.69f,w*.77f,h*.60f,w,h*.67f,w,h,0f,h)
            for(i in 0..5){
                val x=w*(.08f+i*.18f)+sin(time*.4f+i)*w*.012f
                val base=h*(.65f+(i%2)*.035f)
                p.color=Color.rgb(86,54,28);p.strokeWidth=h*.011f
                c.drawLine(x,base,x-h*.012f,base-h*.17f,p)
                for(j in 0..5){
                    p.color=Color.rgb(32,126,65);p.strokeWidth=h*.009f
                    val a=-2.8f+j*.58f
                    c.drawLine(x-h*.012f,base-h*.17f,x-h*.012f+cos(a)*h*.12f,base-h*.17f+sin(a)*h*.07f,p)
                }
            }
            for(i in 0..16) wave(c,w,h*(.70f+i*.021f),h*.005f,1.2f,75)
        }

        private fun forest(c:Canvas,w:Float,h:Float){
            bg(c,w,h,Color.rgb(139,196,177),Color.rgb(8,40,32))
            dot(c,Color.rgb(252,238,175),w*.76f,h*.20f,h*.09f,150)
            for(i in 0..7) dot(c,Color.WHITE,w*(.08f+i*.14f)+sin(time*.12f+i)*w*.025f,h*(.34f+(i%2)*.07f),h*.055f,28)
            poly(c,Color.rgb(54,104,87),0f,h*.59f,w*.18f,h*.35f,w*.34f,h*.58f,w*.52f,h*.31f,w*.68f,h*.56f,w*.84f,h*.37f,w,h*.58f,w,h,0f,h)
            poly(c,Color.rgb(44,132,150),w*.43f,h*.56f,w*.55f,h*.56f,w*.72f,h,w*.25f,h,w*.43f,h*.56f)
            for(i in 0..18){
                val x=w*(i/18f)+sin(i*4f)*w*.012f
                val base=h*(.62f+(i%5)*.025f)
                val s=h*(.075f+(i%4)*.022f)
                p.color=Color.rgb(39,55,38);p.strokeWidth=h*.012f
                c.drawLine(x,base,x,base-s*2f,p)
                dot(c,Color.rgb(27,91,56),x,base-s*1.55f,s*.78f,225)
                dot(c,Color.rgb(43,128,72),x-s*.35f,base-s*1.3f,s*.58f,205)
                dot(c,Color.rgb(49,139,78),x+s*.35f,base-s*1.32f,s*.55f,205)
            }
            for(i in 0..22){
                val x=(i*.073f*w+time*(4f+i%3))%w
                val y=h*(.30f+(i%8)*.065f)+sin(time+i)*h*.012f
                dot(c,Color.rgb(220,255,145),x,y,h*.004f,180)
            }
        }

        private fun sunset(c:Canvas,w:Float,h:Float){
            bg(c,w,h,Color.rgb(66,49,120),Color.rgb(244,106,61))
            val sx=w*.5f+sin(time*.12f)*w*.04f
            dot(c,Color.rgb(255,225,145),sx,h*.48f,h*.12f,245)
            clouds(c,w,h,4,3f)
            poly(c,Color.rgb(36,53,82),0f,h*.59f,w*.20f,h*.52f,w*.40f,h*.59f,w*.62f,h*.50f,w*.82f,h*.57f,w,h*.51f,w,h,0f,h)
            for(i in 0..15) wave(c,w,h*(.64f+i*.024f),h*.006f,1.4f,80)
            p.style=Paint.Style.STROKE;p.strokeWidth=h*.004f;p.color=Color.argb(170,35,28,55)
            for(i in 0..5){
                val x=w*(.10f+i*.15f)+sin(time*.4f+i)*w*.03f
                val y=h*(.28f+(i%3)*.04f)
                c.drawArc(x,y,x+h*.03f,y+h*.015f,200f,140f,false,p)
                c.drawArc(x+h*.03f,y,x+h*.06f,y+h*.015f,210f,140f,false,p)
            }
            p.style=Paint.Style.FILL
        }

        private fun cosmic(c:Canvas,w:Float,h:Float){
            p.shader=LinearGradient(0f,0f,w,h,Color.rgb(3,5,22),Color.rgb(49,5,70),Shader.TileMode.CLAMP)
            c.drawRect(0f,0f,w,h,p);p.shader=null
            for(s in stars){
                val x=((s.x*w+(xOffset-.5f)*w*.35f/s.speed+time*s.speed*2f)%w+w)%w
                val y=((s.y*h+(yOffset-.5f)*h*.12f)%h+h)%h
                dot(c,Color.WHITE,x,y,s.size,100+(s.speed*80).toInt().coerceAtMost(155))
            }
            val cx=w*.5f+sin(time*.7f)*w*.035f
            val cy=h*.46f+cos(time*.55f)*h*.025f
            p.shader=RadialGradient(cx,cy,h*.29f,intArrayOf(Color.WHITE,Color.rgb(70,215,255),Color.rgb(125,45,230),Color.TRANSPARENT),floatArrayOf(0f,.16f,.55f,1f),Shader.TileMode.CLAMP)
            c.drawCircle(cx,cy,h*.29f,p);p.shader=null
            p.style=Paint.Style.STROKE;p.strokeWidth=h*.008f;p.color=Color.rgb(110,225,255)
            for(i in 0..4)c.drawCircle(cx,cy,h*(.14f+i*.047f)+sin(time+i)*h*.012f,p)
            p.style=Paint.Style.FILL
        }
    }
}
