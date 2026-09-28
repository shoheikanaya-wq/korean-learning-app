package jp.sk.koreanlearning;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://shoheikanaya-wq.github.io/korean-learning-app/?source=apk";
    private static final String APP_HOST = "shoheikanaya-wq.github.io";
    private static final int REQ_AUDIO = 10;

    private WebView webView;
    private SpeechRecognizer recognizer;
    private String activeSpeechId;
    private String pendingSpeechId;
    private String pendingSpeechLang;
    private int pendingSpeechMax = 5;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        webView.addJavascriptInterface(new NativeSpeechBridge(), "AndroidSpeech");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && APP_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                injectNativeSpeechShim();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    ArrayList<String> allowed = new ArrayList<>();
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            allowed.add(resource);
                        }
                    }
                    if (allowed.isEmpty()) request.deny();
                    else request.grant(allowed.toArray(new String[0]));
                });
            }
        });

        webView.loadUrl(APP_URL);
    }

    private void injectNativeSpeechShim() {
        String js =
            "(function(){" +
            "if(!window.AndroidSpeech)return;" +
            "var seq=0,items={};" +
            "function SR(){this._id='kor'+(++seq);items[this._id]=this;this.lang='ko-KR';this.interimResults=false;this.maxAlternatives=5;}" +
            "SR.prototype.start=function(){AndroidSpeech.start(this._id,this.lang||'ko-KR',this.maxAlternatives||5);};" +
            "SR.prototype.stop=function(){AndroidSpeech.stop(this._id);};" +
            "SR.prototype.abort=function(){AndroidSpeech.abort(this._id);};" +
            "window.__korNativeSpeechStart=function(id){var r=items[id];if(r&&r.onstart)r.onstart({});};" +
            "window.__korNativeSpeechResult=function(id,json){var r=items[id];if(!r)return;var raw=[];try{raw=JSON.parse(json||'[]')}catch(e){};var alts=raw.map(function(x){return {transcript:x,confidence:1};});if(r.onresult)r.onresult({results:[alts]});};" +
            "window.__korNativeSpeechError=function(id,err){var r=items[id];if(r&&r.onerror)r.onerror({error:err||'unknown'});};" +
            "window.__korNativeSpeechEnd=function(id){var r=items[id];if(r&&r.onend)r.onend({});delete items[id];};" +
            "window.SpeechRecognition=SR;window.webkitSpeechRecognition=SR;" +
            "})();";
        webView.evaluateJavascript(js, null);
    }

    private final class NativeSpeechBridge {
        @JavascriptInterface
        public void start(String id, String lang, int maxAlternatives) {
            runOnUiThread(() -> startNativeSpeech(id, lang, maxAlternatives));
        }

        @JavascriptInterface
        public void stop(String id) {
            runOnUiThread(() -> {
                if (recognizer != null && id.equals(activeSpeechId)) recognizer.stopListening();
            });
        }

        @JavascriptInterface
        public void abort(String id) {
            runOnUiThread(() -> {
                if (recognizer != null && id.equals(activeSpeechId)) {
                    recognizer.cancel();
                    finishSpeech(id, false);
                }
            });
        }
    }

    private void startNativeSpeech(String id, String lang, int maxAlternatives) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingSpeechId = id;
            pendingSpeechLang = lang;
            pendingSpeechMax = maxAlternatives;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            return;
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            jsError(id, "service-not-allowed");
            jsEnd(id);
            return;
        }

        destroyRecognizer();
        activeSpeechId = id;
        recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { jsStart(id); }
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onPartialResults(Bundle partialResults) {}
            @Override public void onEvent(int eventType, Bundle params) {}

            @Override
            public void onError(int error) {
                jsError(id, mapSpeechError(error));
                finishSpeech(id, true);
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> texts = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                JSONArray arr = new JSONArray();
                if (texts != null) {
                    int limit = Math.min(Math.max(1, maxAlternatives), texts.size());
                    for (int i = 0; i < limit; i++) arr.put(texts.get(i));
                }
                jsResult(id, arr.toString());
                finishSpeech(id, true);
            }
        });

        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, (lang == null || lang.isEmpty()) ? "ko-KR" : lang);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, maxAlternatives));
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        recognizer.startListening(i);
    }

    private String mapSpeechError(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "not-allowed";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network";
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "no-speech";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "aborted";
            default: return "unknown";
        }
    }

    private void finishSpeech(String id, boolean notifyEnd) {
        destroyRecognizer();
        if (notifyEnd) jsEnd(id);
        activeSpeechId = null;
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
    }

    private void jsStart(String id) {
        eval("window.__korNativeSpeechStart&&window.__korNativeSpeechStart(" + JSONObject.quote(id) + ")");
    }

    private void jsResult(String id, String json) {
        eval("window.__korNativeSpeechResult&&window.__korNativeSpeechResult(" + JSONObject.quote(id) + "," + JSONObject.quote(json) + ")");
    }

    private void jsError(String id, String error) {
        eval("window.__korNativeSpeechError&&window.__korNativeSpeechError(" + JSONObject.quote(id) + "," + JSONObject.quote(error) + ")");
    }

    private void jsEnd(String id) {
        eval("window.__korNativeSpeechEnd&&window.__korNativeSpeechEnd(" + JSONObject.quote(id) + ")");
    }

    private void eval(String js) {
        if (webView != null) webView.evaluateJavascript(js, null);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_AUDIO || pendingSpeechId == null) return;

        String id = pendingSpeechId;
        String lang = pendingSpeechLang;
        int max = pendingSpeechMax;
        pendingSpeechId = null;
        pendingSpeechLang = null;

        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startNativeSpeech(id, lang, max);
        } else {
            jsError(id, "not-allowed");
            jsEnd(id);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        destroyRecognizer();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
