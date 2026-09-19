package com.kaung.recoveryagent
import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
class RecoveryAccessibilityService:AccessibilityService(){
 private var lastState=""
 private val sensitive=Regex("password|passcode|verification code|otp|one[- ]time code|backup code|passkey|security code",RegexOption.IGNORE_CASE)
 override fun onAccessibilityEvent(event:AccessibilityEvent?){val root=rootInActiveWindow?:return;val state=summarize(root);if(state.isNotBlank()&&state!=lastState){lastState=state;if(state.contains("recovery",true)||state.contains("verify",true)||state.contains("account",true)||state.contains("sign in",true))Toast.makeText(this,"Recovery AI: recovery page detected",Toast.LENGTH_SHORT).show()}}
 override fun onInterrupt(){}
 private fun summarize(root:AccessibilityNodeInfo):String{val out=StringBuilder();walk(root,out,0);return out.toString().take(4000)}
 private fun walk(node:AccessibilityNodeInfo?,out:StringBuilder,depth:Int){if(node==null||depth>12||out.length>4000)return;val t=listOf(node.text?.toString(),node.contentDescription?.toString()).filterNotNull().joinToString(" ").trim();if(t.isNotBlank()&&!sensitive.containsMatchIn(t))out.append(t).append('\n');for(i in 0 until node.childCount)walk(node.getChild(i),out,depth+1)}
}