const $=id=>document.getElementById(id);let sceneData=[];let currentUrl=null;
const FREE_EXPORT_KEY="dipak_ai_free_export_used_v1";
let premiumActive=false;
const API_BASE=window.DIPAK_API_BASE||"";
function hasUsedFreeExport(){return localStorage.getItem(FREE_EXPORT_KEY)==="yes"}
function updatePlanStatus(){
 const used=hasUsedFreeExport();
 $("planStatus").textContent=premiumActive?"✅ आपका Premium access सक्रिय है।":(used?"आपकी मुफ्त Reel इस्तेमाल हो चुकी है। Premium खरीदें।":"पहली Reel मुफ्त डाउनलोड करें। इसके बाद Premium access की जरूरत होगी।");
 $("export").textContent=premiumActive?"⬇ Premium Reel डाउनलोड करें":(used?"🔒 Premium के लिए भुगतान करें":"⬇ पहली Reel मुफ्त बनाएं");
}
async function checkPremium(){
 const email=$("buyerEmail").value.trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(email)){ $("premiumStatus").textContent="कृपया सही Email address डालें।"; return false; }
 $("premiumStatus").textContent="Razorpay payment जाँचा जा रहा है…";
 try{
  const r=await fetch(`${API_BASE}/api/premium-status?email=${encodeURIComponent(email)}`,{headers:{"Accept":"application/json"}});
  if(!r.ok) throw new Error("server");
  const data=await r.json(); premiumActive=!!data.premium;
  $("premiumStatus").textContent=premiumActive?"✅ Payment verify हो गया। Premium चालू है।":"अभी इस Email पर सफल ₹99 payment नहीं मिला। भुगतान में वही Email इस्तेमाल करें।";
  updatePlanStatus(); return premiumActive;
 }catch(e){ $("premiumStatus").textContent="Payment verification server अभी जुड़ा/deploy नहीं है। README में दिए setup steps पूरे करें।"; return false; }
}
$("checkPremium").onclick=checkPremium;
updatePlanStatus();
function splitStory(s){return s.split(/(?<=[।.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean)}
$("makeScenes").onclick=()=>{const story=$("story").value.trim();if(!story){$("status").textContent="पहले कहानी लिखें।";return}const parts=splitStory(story);sceneData=parts.map((text,i)=>({text,image:null}));renderScenes();$("status").textContent=`${sceneData.length} scenes तैयार हैं। आप हर scene का text बदल सकते हैं और image जोड़ सकते हैं।`};
function renderScenes(){const root=$("scenes");root.innerHTML="";$("sceneCount").textContent=sceneData.length+" scenes";sceneData.forEach((s,i)=>{const box=document.createElement("div");box.className="scene";const left=document.createElement("div");const label=document.createElement("small");label.textContent=`SCENE ${i+1}`;const ta=document.createElement("textarea");ta.value=s.text;ta.oninput=()=>sceneData[i].text=ta.value;left.append(label,ta);const right=document.createElement("div");const img=document.createElement("img");img.alt="Scene image";img.src=s.image||placeholder(i);const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=e=>{const f=e.target.files[0];if(!f)return;s.image=URL.createObjectURL(f);img.src=s.image};right.append(img,input);box.append(left,right);root.append(box)})}
function placeholder(i){return `https://placehold.co/600x900/30285c/ffffff?text=Scene+${i+1}`}
function getVoices(){const voices=speechSynthesis.getVoices();const sel=$("voice");sel.innerHTML='<option value="">डिवाइस की Default आवाज़</option>';voices.forEach((v,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${v.name} (${v.lang})`;sel.append(o)})}if("speechSynthesis"in window){getVoices();speechSynthesis.onvoiceschanged=getVoices}
function speak(text){if(!("speechSynthesis"in window)){alert("इस browser में voice सुविधा उपलब्ध नहीं है।");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=$("lang").value;const v=speechSynthesis.getVoices()[$("voice").value];if(v)u.voice=v;speechSynthesis.speak(u)}
$("listen").onclick=()=>{const t=sceneData.map(s=>s.text).join(" ");if(t)speak(t);else $("status").textContent="पहले Scenes बनाएं।"};
const canvas=$("canvas"),ctx=canvas.getContext("2d");let previewTimer=null;
function drawScene(i,progress=0){const s=sceneData[i];ctx.fillStyle="#211b45";ctx.fillRect(0,0,canvas.width,canvas.height);if(s.image){const im=new Image();im.onload=()=>{const z=1+0.12*progress;const w=canvas.width*z,h=canvas.height*z;ctx.save();ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.clip();ctx.drawImage(im,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.restore();drawCaption(s,i)};im.src=s.image}else{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#5542a6");g.addColorStop(1,"#17152d");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);drawCaption(s,i)}}
function drawCaption(s,i){ctx.fillStyle="#0009";ctx.fillRect(35,canvas.height-360,canvas.width-70,270);ctx.fillStyle="white";ctx.textAlign="center";ctx.font="bold 42px sans-serif";wrapText(s.text,canvas.width/2,canvas.height-270,canvas.width-110,58);ctx.font="bold 25px sans-serif";ctx.fillText(`DIPAK AI REEL MAKER • ${i+1}/${sceneData.length}`,canvas.width/2,canvas.height-55)}
function wrapText(text,x,y,maxWidth,lineHeight){let words=text.split(/\s+/),line="",yy=y;for(let n=0;n<words.length;n++){let test=line+words[n]+" ";if(ctx.measureText(test).width>maxWidth&&n>0){ctx.fillText(line,x,yy);line=words[n]+" ";yy+=lineHeight}else line=test}ctx.fillText(line,x,yy)}
$("preview").onclick=()=>{if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";let i=0;clearInterval(previewTimer);drawScene(0);previewTimer=setInterval(()=>{i=(i+1)%sceneData.length;drawScene(i)},Math.max(1000,Number($("duration").value)*1000/sceneData.length))};
$("export").onclick=async()=>{if(hasUsedFreeExport() && !(await checkPremium())){ $("status").textContent="Premium access के लिए सफल payment जरूरी है। ऊपर Email डालकर भुगतान जाँचें।"; $("payNow").scrollIntoView({behavior:"smooth",block:"center"}); return; } if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";if(!canvas.captureStream||!window.MediaRecorder)return $("status").textContent="आपका browser video export support नहीं करता। Chrome में खोलकर देखें।";clearInterval(previewTimer);$("download").hidden=true;$("status").textContent="वीडियो तैयार हो रहा है… इस tab को खुला रखें।";const stream=canvas.captureStream(25);const narration=$("narrationAudio");if(narrationBlob&&narration.captureStream){try{narration.currentTime=0;narration.muted=false;narration.play().catch(()=>{});narration.captureStream().getAudioTracks().forEach(t=>stream.addTrack(t));}catch(e){console.warn("Audio track attach failed",e)}}let chunks=[];let recorder;try{recorder=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9"});}catch(e){recorder=new MediaRecorder(stream)}recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"});if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(blob);const a=$("download");a.href=currentUrl;a.download="dipak-ai-reel.webm";a.textContent="⬇ वीडियो डाउनलोड करें (WEBM)";a.hidden=false;if(!premiumActive)localStorage.setItem(FREE_EXPORT_KEY,"yes");updatePlanStatus();$("status").textContent="वीडियो तैयार है (WEBM)। यदि Gemini narration बनाई थी तो audio track जोड़ा गया है।"};recorder.start();let i=0;const totalMs=Number($("duration").value)*1000;const perScene=totalMs/sceneData.length;const started=performance.now();const step=()=>{const elapsed=performance.now()-started;const progress=Math.min(1,(elapsed%perScene)/perScene);drawScene(i,progress);i++;if(i<sceneData.length)setTimeout(step,perScene);else setTimeout(()=>{recorder.stop();if(narrationBlob){narration.pause();narration.currentTime=0}},perScene)};step()};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
// Razorpay hosted Payment Link button (no secret key in browser)
$("payNow").onclick=()=>{
 const link=window.RAZORPAY_PAYMENT_LINK||"";
 const validLink=(()=>{try{const u=new URL(link);return u.protocol==="https:" && ["rzp.io","pages.razorpay.com"].includes(u.hostname)}catch{return false}})();
 if(!validLink){
   alert("पहले payment-config.js में अपना Razorpay Payment Link डालें।");
   return;
 }
 window.open(link,"_blank","noopener,noreferrer");
};

// Gemini BYOK: the customer's key is stored only in this browser's localStorage.
const GEMINI_KEY_STORAGE="dipak_gemini_api_key_v1";
const geminiKeyInput=$("geminiKey"), geminiStatus=$("geminiStatus");
if(geminiKeyInput)geminiKeyInput.value=localStorage.getItem(GEMINI_KEY_STORAGE)||"";
$("saveGeminiKey")?.addEventListener("click",()=>{const k=geminiKeyInput.value.trim();if(!k){geminiStatus.textContent="पहले API Key डालें।";return}localStorage.setItem(GEMINI_KEY_STORAGE,k);geminiStatus.textContent="✅ Key इस browser में सेव हो गई। इसे किसी से साझा न करें।"});
$("clearGeminiKey")?.addEventListener("click",()=>{localStorage.removeItem(GEMINI_KEY_STORAGE);geminiKeyInput.value="";geminiStatus.textContent="Key इस browser से हटा दी गई।"});
$("geminiCreate")?.addEventListener("click",async()=>{
 const prompt=$("story").value.trim();const key=localStorage.getItem(GEMINI_KEY_STORAGE);
 if(!prompt){geminiStatus.textContent="पहले कहानी का एक विचार/लाइन लिखें।";return}
 if(!key){geminiStatus.textContent="पहले अपनी Gemini API Key सेव करें।";geminiKeyInput.focus();return}
 const btn=$("geminiCreate");btn.disabled=true;btn.textContent="Gemini कहानी बना रहा है…";geminiStatus.textContent="Gemini से संपर्क हो रहा है…";
 try{
  const endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+encodeURIComponent(key);
  const req={contents:[{parts:[{text:`आप हिंदी कहानी लेखक हैं। इस विचार पर 1 मिनट की सरल, रोचक और बच्चों के अनुकूल कहानी लिखें। कहानी को 6 छोटे दृश्यों में बाँटें। केवल valid JSON दें, format: {"story":"पूरी narration","scenes":["scene 1 text",...]}। विचार: ${prompt}`}]}],generationConfig:{responseMimeType:"application/json",temperature:0.7}};
  const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(req)});
  const data=await res.json();if(!res.ok)throw new Error(data?.error?.message||`Gemini error ${res.status}`);
  const raw=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
  const parsed=JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""));
  $("story").value=parsed.story||prompt;
  const texts=Array.isArray(parsed.scenes)&&parsed.scenes.length?parsed.scenes:splitStory(parsed.story||prompt);
  sceneData=texts.map(text=>({text:String(text),image:null}));renderScenes();
  geminiStatus.textContent=`✅ Gemini ने कहानी और ${sceneData.length} scenes बना दिए। अब scene images upload करें।`;$ ("status").textContent="Gemini कहानी तैयार। तस्वीरें जोड़कर Preview/Export करें।";
 }catch(e){geminiStatus.textContent="Gemini नहीं चला: "+e.message+" (API key, quota या internet जाँचें)।"}
 finally{btn.disabled=false;btn.textContent="✨ Gemini से कहानी + Scenes"}
});

// Optional Gemini image generation + Hindi narration audio (BYOK; Google's quotas/pricing apply).
let narrationBlob=null, narrationObjectUrl=null;
async function geminiRequest(model, payload, key){
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||`Gemini ${r.status}`);return d;
}
function pcmToWav(pcmB64, sampleRate=24000){
 const raw=atob(pcmB64), bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 const buffer=new ArrayBuffer(44+bytes.length),v=new DataView(buffer);const write=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
 write(0,'RIFF');v.setUint32(4,36+bytes.length,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,bytes.length,true);new Uint8Array(buffer,44).set(bytes);return new Blob([buffer],{type:'audio/wav'});
}
$('makeAudio')?.addEventListener('click',async()=>{
 const key=localStorage.getItem(GEMINI_KEY_STORAGE),text=sceneData.map(x=>x.text).join(' ').trim()||$('story').value.trim();
 if(!key){geminiStatus.textContent='पहले Gemini API Key सेव करें।';geminiKeyInput.focus();return}if(!text){$('status').textContent='पहले कहानी/Scenes बनाएं।';return}
 const b=$('makeAudio');b.disabled=true;b.textContent='🎙 आवाज़ बन रही है…';geminiStatus.textContent='Gemini TTS से हिंदी narration तैयार हो रही है…';
 try{const d=await geminiRequest('gemini-2.5-flash-preview-tts',{contents:[{parts:[{text:text}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}},key);
 const part=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);if(!part)throw new Error('TTS audio response नहीं मिला।');
 narrationBlob=pcmToWav(part.inlineData.data,24000);if(narrationObjectUrl)URL.revokeObjectURL(narrationObjectUrl);narrationObjectUrl=URL.createObjectURL(narrationBlob);const audio=$('narrationAudio');audio.src=narrationObjectUrl;audio.hidden=false;geminiStatus.textContent='✅ हिंदी narration audio तैयार है। Export के समय इसे वीडियो में जोड़ने का प्रयास होगा।';
 }catch(e){geminiStatus.textContent='TTS नहीं चला: '+e.message+' (मॉडल access/quota जाँचें)।'}finally{b.disabled=false;b.textContent='🎙 Gemini हिंदी Voice तैयार करें'}
});
$('generateImages')?.addEventListener('click',async()=>{
 const key=localStorage.getItem(GEMINI_KEY_STORAGE);if(!key){geminiStatus.textContent='पहले Gemini API Key सेव करें।';geminiKeyInput.focus();return}if(!sceneData.length){$('status').textContent='पहले Gemini से Scenes बनाएं।';return}
 const b=$('generateImages');b.disabled=true;let made=0;
 try{for(let i=0;i<sceneData.length;i++){b.textContent=`🎨 तस्वीर ${i+1}/${sceneData.length}…`;geminiStatus.textContent=`Scene ${i+1} की image बन रही है…`;
 const prompt=`Create one beautiful vertical 9:16 story illustration, family friendly, cinematic colorful 2D cartoon, no text, no letters. Scene: ${sceneData[i].text}`;
 const d=await geminiRequest('gemini-2.5-flash-image',{contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['IMAGE','TEXT'] }},key);
 const im=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);if(!im)throw new Error('Scene '+(i+1)+' image response नहीं मिला।');sceneData[i].image=`data:${im.inlineData.mimeType||'image/png'};base64,${im.inlineData.data}`;made++;renderScenes();}
 geminiStatus.textContent=`✅ ${made} scene images तैयार।`; 
 }catch(e){geminiStatus.textContent=`${made} images बनीं। आगे नहीं बना: ${e.message} (Image model access/quota देखें)।`}
 finally{b.disabled=false;b.textContent='🎨 Gemini से सभी Scene Images'}
});

// Install prompt: local-device PWA installation only (no public sharing workflow).
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installApp').hidden=false;$('installStatus').textContent='यह ऐप इस मोबाइल में इंस्टॉल किया जा सकता है।'});
$('installApp')?.addEventListener('click',async()=>{if(!deferredInstallPrompt){$('installStatus').textContent='Chrome मेन्यू ⋮ खोलें और “Add to Home screen” चुनें।';return}deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;$('installStatus').textContent=choice.outcome==='accepted'?'✅ ऐप इंस्टॉल हो रहा है।':'इंस्टॉल रद्द किया गया।';deferredInstallPrompt=null;$('installApp').hidden=true});
window.addEventListener('appinstalled',()=>{$('installStatus').textContent='✅ Dipak AI Reel Maker इस मोबाइल में इंस्टॉल हो गया।';$('installApp').hidden=true});

// Respect the selected aspect ratio for the generated reel.
function applyAspectRatio(){const ratio=$('ratio').value;const c=$('canvas');if(ratio==='16:9'){c.width=1280;c.height=720}else if(ratio==='1:1'){c.width=900;c.height=900}else{c.width=720;c.height=1280}if(sceneData.length)drawScene(0)}
$('ratio')?.addEventListener('change',applyAspectRatio);
