package com.kaunggyi.hyperostaskbar;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class TaskbarService extends Service {
    private WindowManager wm;
    private View bar;
    private static final String CHANNEL="taskbar";
    private int dp(float v){return (int)(v*getResources().getDisplayMetrics().density+0.5f);}
    @Override public void onCreate(){
        super.onCreate(); createChannel();
        Notification n=new Notification.Builder(this,CHANNEL).setContentTitle("HyperOS Taskbar")
          .setContentText("Floating launcher is active").setSmallIcon(android.R.drawable.ic_menu_view).setOngoing(true).build();
        startForeground(1001,n);
        if(!Settings.canDrawOverlays(this)){stopSelf();return;}
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        LinearLayout shell=new LinearLayout(this); shell.setOrientation(LinearLayout.HORIZONTAL);
        shell.setGravity(Gravity.CENTER); shell.setPadding(dp(10),dp(8),dp(10),dp(8));
        GradientDrawable bg=new GradientDrawable(); bg.setColor(0xF21A1A24); bg.setCornerRadius(dp(28));
        bg.setStroke(dp(1),0xFF6C63FF); shell.setBackground(bg);
        shell.setElevation(dp(12));
        List<ApplicationInfo> apps=new ArrayList<>();
        PackageManager pm=getPackageManager();
        for(ApplicationInfo ai:pm.getInstalledApplications(PackageManager.GET_META_DATA)){
          if(pm.getLaunchIntentForPackage(ai.packageName)!=null&&!ai.packageName.equals(getPackageName()))apps.add(ai);
        }
        apps.sort((a,b)->pm.getApplicationLabel(a).toString().compareToIgnoreCase(pm.getApplicationLabel(b).toString()));
        int count=Math.min(4,apps.size());
        for(int i=0;i<count;i++){
          ApplicationInfo ai=apps.get(i);
          LinearLayout cell=new LinearLayout(this); cell.setGravity(Gravity.CENTER); cell.setOrientation(LinearLayout.VERTICAL);
          cell.setPadding(dp(7),dp(2),dp(7),dp(2));
          ImageView icon=new ImageView(this); icon.setImageDrawable(pm.getApplicationIcon(ai)); icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
          cell.addView(icon,new LinearLayout.LayoutParams(dp(30),dp(30)));
          TextView label=new TextView(this); label.setText(pm.getApplicationLabel(ai)); label.setTextColor(Color.WHITE); label.setTextSize(9); label.setMaxLines(1);
          cell.addView(label);
          cell.setContentDescription(pm.getApplicationLabel(ai));
          cell.setOnClickListener(v->{Intent in=pm.getLaunchIntentForPackage(ai.packageName);if(in!=null){in.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(in);}});
          shell.addView(cell);
        }
        View sep=new View(this);sep.setBackgroundColor(0xFF555562);shell.addView(sep,new LinearLayout.LayoutParams(dp(1),dp(34)));
        TextView home=makeButton("⌂"); home.setTextSize(23); home.setOnClickListener(v->{Intent in=new Intent(Intent.ACTION_MAIN);in.addCategory(Intent.CATEGORY_HOME);in.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(in);});shell.addView(home);
        TextView hide=makeButton("⌄"); hide.setTextSize(22); hide.setOnClickListener(v->stopSelf());shell.addView(hide);
        bar=shell;
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.WRAP_CONTENT,
          WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL;lp.y=dp(22);wm.addView(bar,lp);
    }
    private TextView makeButton(String s){TextView t=new TextView(this);t.setText(s);t.setTextColor(Color.WHITE);t.setGravity(Gravity.CENTER);t.setTextSize(17);t.setPadding(dp(12),dp(4),dp(12),dp(4));return t;}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CHANNEL,"Taskbar",NotificationManager.IMPORTANCE_LOW);((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);}}
    @Override public void onDestroy(){if(wm!=null&&bar!=null)try{wm.removeView(bar);}catch(Exception ignored){}super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
}