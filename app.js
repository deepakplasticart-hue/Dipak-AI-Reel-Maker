const $=id=>document.getElementById(id);let sceneData=[];let currentUrl=null;
const FREE_EXPORT_KEY="dipak_ai_free_download_used_v2";
let premiumActive=false;
const API_BASE=window.DIPAK_API_BASE||"";
function hasUsedFreeExport(){return localStorage.getItem(FREE_EXPORT_KEY)==="yes"}
function updatePlanStatus(){
 const used=hasUsedFreeExport();
 $("planStatus").textContent=premiumActive?"✅ आपका Premium access सक्रिय है। अब Reel डाउनलोड कर सकते हैं।":(used?"पहली मुफ्त Reel डाउनलोड हो चुकी है। अगली Reel डाउनलोड करने के लिए ₹99 Premium चाहिए।":"पहली Reel का डाउनलोड मुफ्त है। उसके बाद ₹99 Premium लगेगा।");
 $("export").textContent="🎬 Reel तैयार करें";
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
// The first completed Reel can be downloaded once for free. Later downloads
// require a successful Razorpay webhook verification for the entered email.
$("download").addEventListener("click",async(e)=>{
 if(!hasUsedFreeExport()){
  localStorage.setItem(FREE_EXPORT_KEY,"yes");updatePlanStatus();
  $("status").textContent="पहली Reel मुफ्त डाउनलोड हो रही है। अगली Reel डाउनलोड करने के लिए ₹99 Premium चाहिए।";
  return;
 }
 e.preventDefault();
 const ok=premiumActive||await checkPremium();
 if(!ok){
  $("status").textContent="यह अगली Reel है। डाउनलोड खोलने के लिए ₹99 Premium payment करें और भुगतान जाँचें।";
  $("payNow").scrollIntoView({behavior:"smooth",block:"center"});
  return;
 }
 const temp=document.createElement("a");temp.href=currentUrl;temp.download=$("download").download||"dipak-ai-reel.webm";
 document.body.appendChild(temp);temp.click();temp.remove();
});
function splitStory(s){return s.split(/(?<=[।.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean)}
$("makeScenes").onclick=()=>{const story=$("story").value.trim();if(!story){$("status").textContent="पहले कहानी लिखें।";return}const parts=splitStory(story);sceneData=parts.map((text,i)=>({text,image:null}));sceneAudioBuffers=[];renderScenes();$("status").textContent=`${sceneData.length} scenes तैयार हैं। आप हर scene का text बदल सकते हैं और image जोड़ सकते हैं।`};
function renderScenes(){const root=$("scenes");root.innerHTML="";$("sceneCount").textContent=sceneData.length+" scenes";sceneData.forEach((s,i)=>{const box=document.createElement("div");box.className="scene";const left=document.createElement("div");const label=document.createElement("small");label.textContent=`SCENE ${i+1}`;const ta=document.createElement("textarea");ta.value=s.text;ta.oninput=()=>{sceneData[i].text=ta.value;sceneAudioBuffers=[];};left.append(label,ta);const right=document.createElement("div");const img=document.createElement("img");img.alt="Scene image";img.src=s.image||placeholder(i);const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=e=>{const f=e.target.files[0];if(!f)return;s.image=URL.createObjectURL(f);img.src=s.image};right.append(img,input);box.append(left,right);root.append(box)})}
function placeholder(i){return `https://placehold.co/600x900/30285c/ffffff?text=Scene+${i+1}`}
function getVoices(){const voices=speechSynthesis.getVoices();const sel=$("voice");sel.innerHTML='<option value="">डिवाइस की Default आवाज़</option>';voices.forEach((v,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${v.name} (${v.lang})`;sel.append(o)})}if("speechSynthesis"in window){getVoices();speechSynthesis.onvoiceschanged=getVoices}
function speak(text){if(!("speechSynthesis"in window)){alert("इस browser में voice सुविधा उपलब्ध नहीं है।");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=$("lang").value;const v=speechSynthesis.getVoices()[$("voice").value];if(v)u.voice=v;speechSynthesis.speak(u)}
$("listen").onclick=async()=>{
 if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";
 if(sceneAudioBuffers.length!==sceneData.length){const t=sceneData.map(s=>s.text).join(" ");if(t)speak(t);return $("status").textContent="अभी scene-wise Gemini voice नहीं बनी है। पहले Voice तैयार करें।";}
 try{const ac=new (window.AudioContext||window.webkitAudioContext)();await ac.resume();let at=ac.currentTime+0.1;sceneAudioBuffers.forEach((buf,i)=>{const src=ac.createBufferSource();src.buffer=buf;src.connect(ac.destination);src.start(at);setTimeout(()=>drawScene(i,0),Math.max(0,(at-ac.currentTime)*1000));at+=buf.duration+0.18;});setTimeout(()=>ac.close(),(at-ac.currentTime+0.2)*1000);}catch(e){$("status").textContent="Voice preview नहीं चला: "+e.message;}
};
const canvas=$("canvas"),ctx=canvas.getContext("2d");let previewTimer=null;
function drawScene(i,progress=0){const s=sceneData[i];ctx.fillStyle="#211b45";ctx.fillRect(0,0,canvas.width,canvas.height);if(s.image){const im=new Image();im.onload=()=>{const z=1+0.12*progress;const w=canvas.width*z,h=canvas.height*z;ctx.save();ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.clip();ctx.drawImage(im,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.restore();drawCaption(s,i)};im.src=s.image}else{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#5542a6");g.addColorStop(1,"#17152d");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);drawCaption(s,i)}}
function drawCaption(s,i){ctx.fillStyle="#0009";ctx.fillRect(35,canvas.height-360,canvas.width-70,270);ctx.fillStyle="white";ctx.textAlign="center";ctx.font="bold 42px sans-serif";wrapText(s.text,canvas.width/2,canvas.height-270,canvas.width-110,58);ctx.font="bold 25px sans-serif";ctx.fillText(`DIPAK AI REEL MAKER • ${i+1}/${sceneData.length}`,canvas.width/2,canvas.height-55)}
function wrapText(text,x,y,maxWidth,lineHeight){let words=text.split(/\s+/),line="",yy=y;for(let n=0;n<words.length;n++){let test=line+words[n]+" ";if(ctx.measureText(test).width>maxWidth&&n>0){ctx.fillText(line,x,yy);line=words[n]+" ";yy+=lineHeight}else line=test}ctx.fillText(line,x,yy)}
$("preview").onclick=()=>{if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";if(sceneAudioBuffers.length===sceneData.length){$("listen").click();return;}let i=0;clearInterval(previewTimer);drawScene(0);previewTimer=setInterval(()=>{i=(i+1)%sceneData.length;drawScene(i)},Math.max(1000,Number($("duration").value)*1000/sceneData.length))};
// All scene changes use one consistent Smooth Fade transition.
// Render each scene to an off-screen frame first. This avoids image-loading delays
// during recording and keeps the visual timeline locked to the narration timeline.
async function makeExportFrames(){
 const frames=[];
 for(let i=0;i<sceneData.length;i++){
  const frame=document.createElement('canvas');frame.width=canvas.width;frame.height=canvas.height;
  const fctx=frame.getContext('2d'), s=sceneData[i];
  fctx.fillStyle='#211b45';fctx.fillRect(0,0,frame.width,frame.height);
  let img=null;
  if(s.image){
   try{img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=s.image;});}
   catch(e){img=null;}
  }
  if(img){
   const scale=Math.max(frame.width/img.width,frame.height/img.height);
   const w=img.width*scale,h=img.height*scale;
   fctx.drawImage(img,(frame.width-w)/2,(frame.height-h)/2,w,h);
  }else{
   const g=fctx.createLinearGradient(0,0,frame.width,frame.height);
   g.addColorStop(0,'#5542a6');g.addColorStop(1,'#17152d');
   fctx.fillStyle=g;fctx.fillRect(0,0,frame.width,frame.height);
  }
  fctx.fillStyle='#0009';fctx.fillRect(35,frame.height-360,frame.width-70,270);
  fctx.fillStyle='#fff';fctx.textAlign='center';fctx.font='bold 42px sans-serif';
  const words=String(s.text||'').split(/\s+/);let line='',yy=frame.height-270;
  for(let n=0;n<words.length;n++){
   const test=line+words[n]+' ';
   if(fctx.measureText(test).width>frame.width-110&&n>0){fctx.fillText(line,frame.width/2,yy);line=words[n]+' ';yy+=58;}
   else line=test;
  }
  if(line)fctx.fillText(line,frame.width/2,yy);
  fctx.font='bold 25px sans-serif';
  fctx.fillText(`DIPAK AI REEL MAKER • ${i+1}/${sceneData.length}`,frame.width/2,frame.height-55);
  frames.push(frame);
 }
 return frames;
}

$("export").onclick=async()=>{
 if(!sceneData.length)return $("status").textContent="पहले Scenes बनाएं।";
 if(!canvas.captureStream||!window.MediaRecorder)return $("status").textContent="आपका browser video export support नहीं करता। Chrome में खोलकर देखें।";
 if(!sceneAudioBuffers.length){$("status").textContent="पहले ‘Gemini हिंदी Voice तैयार करें’ दबाकर हर Scene की आवाज़ बनाएं।";return;}
 if(sceneAudioBuffers.length!==sceneData.length){$("status").textContent="हर Scene की आवाज़ और Scene की संख्या बराबर नहीं है। Voice दोबारा तैयार करें।";return;}
 clearInterval(previewTimer);$("download").hidden=true;$("export").disabled=true;
 $("status").textContent="तस्वीरें तैयार हो रही हैं और आवाज़ के साथ Smooth Fade Transition लगाया जा रहा है…";
 let audioCtx;
 try{
  const frames=await makeExportFrames();
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();await audioCtx.resume();
  const videoStream=canvas.captureStream(30),audioDestination=audioCtx.createMediaStreamDestination();
  const combined=new MediaStream([...videoStream.getVideoTracks(),...audioDestination.stream.getAudioTracks()]);
  const mimeCandidates=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  const mimeType=mimeCandidates.find(t=>MediaRecorder.isTypeSupported(t))||'';
  const recorder=mimeType?new MediaRecorder(combined,{mimeType}):new MediaRecorder(combined);
  const chunks=[];recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  recorder.onstop=()=>{
   const type=recorder.mimeType||mimeType||'video/webm',ext=type.includes('mp4')?'mp4':'webm';
   const blob=new Blob(chunks,{type});if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(blob);
   const a=$("download");a.href=currentUrl;a.download=`dipak-ai-reel.${ext}`;a.textContent=`⬇ वीडियो डाउनलोड करें (${ext.toUpperCase()})`;a.hidden=false;
   updatePlanStatus();$("status").textContent=`वीडियो तैयार है। सभी images के बीच Smooth Fade Transition और scene-wise voice sync शामिल है। पहली Reel का download मुफ्त है; आगे के download के लिए Premium चाहिए। ${ext.toUpperCase()} फाइल डाउनलोड बटन दबाएँ।`;
   $("export").disabled=false;audioCtx.close().catch(()=>{});
  };
  const gap=0.12,durations=sceneAudioBuffers.map(b=>b.duration);
  const starts=[];let total=0;
  durations.forEach((d,i)=>{starts.push(total);total+=d+(i<durations.length-1?gap:0);});
  const fadeDuration=0.65;
  const drawTimeline=(elapsed)=>{
   ctx.clearRect(0,0,canvas.width,canvas.height);
   // Check transition windows first, so the fade continues smoothly on both
   // sides of the exact scene boundary.
   for(let j=1;j<starts.length;j++){
    const fadeStart=starts[j]-fadeDuration/2;
    if(elapsed>=fadeStart&&elapsed<=fadeStart+fadeDuration){
     const t=Math.max(0,Math.min(1,(elapsed-fadeStart)/fadeDuration));
     ctx.globalAlpha=1;ctx.drawImage(frames[j-1],0,0,canvas.width,canvas.height);
     ctx.globalAlpha=t;ctx.drawImage(frames[j],0,0,canvas.width,canvas.height);
     ctx.globalAlpha=1;return;
    }
   }
   let active=0;
   for(let j=1;j<starts.length;j++){if(elapsed>=starts[j])active=j;else break;}
   active=Math.min(active,frames.length-1);
   ctx.globalAlpha=1;ctx.drawImage(frames[active],0,0,canvas.width,canvas.height);
  };
  recorder.start(250);
  const audioStart=audioCtx.currentTime+0.35,wallStart=performance.now()+350;
  sceneAudioBuffers.forEach((buffer,i)=>{
   const source=audioCtx.createBufferSource();source.buffer=buffer;source.connect(audioDestination);
   source.start(audioStart+starts[i]);
  });
  let rafId=0;
  const animate=()=>{
   const elapsed=(performance.now()-wallStart)/1000;
   drawTimeline(Math.max(0,elapsed));
   if(elapsed<total+0.1)rafId=requestAnimationFrame(animate);
  };
  drawTimeline(0);rafId=requestAnimationFrame(animate);
  setTimeout(()=>{cancelAnimationFrame(rafId);if(recorder.state==='recording')recorder.stop();},(total+0.55)*1000);
 }catch(e){
  console.error(e);$("status").textContent="वीडियो नहीं बन पाया: "+e.message;
  $("export").disabled=false;if(audioCtx)audioCtx.close().catch(()=>{});
 }
};
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
  sceneData=texts.map(text=>({text:String(text),image:null}));sceneAudioBuffers=[];renderScenes();
  geminiStatus.textContent=`✅ Gemini ने कहानी और ${sceneData.length} scenes बना दिए। अब scene images upload करें।`;$ ("status").textContent="Gemini कहानी तैयार। तस्वीरें जोड़कर Preview/Export करें।";
 }catch(e){geminiStatus.textContent="Gemini नहीं चला: "+e.message+" (API key, quota या internet जाँचें)।"}
 finally{btn.disabled=false;btn.textContent="✨ Gemini से कहानी + Scenes"}
});

// Optional Gemini image generation + Hindi narration audio (BYOK; Google's quotas/pricing apply).
let narrationBlob=null, narrationObjectUrl=null;
let sceneAudioBuffers=[];
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
 const key=localStorage.getItem(GEMINI_KEY_STORAGE);
 if(!key){geminiStatus.textContent='पहले Gemini API Key सेव करें।';geminiKeyInput.focus();return}
 if(!sceneData.length){$('status').textContent='पहले कहानी के Scenes बनाएं।';return}
 const b=$('makeAudio');b.disabled=true;sceneAudioBuffers=[];b.textContent='🎙 हर Scene की आवाज़ बन रही है…';
 try{
  const ac=new (window.AudioContext||window.webkitAudioContext)();
  for(let i=0;i<sceneData.length;i++){
   const sceneText=sceneData[i].text.trim();if(!sceneText)throw new Error(`Scene ${i+1} का text खाली है।`);
   b.textContent=`🎙 आवाज़ ${i+1}/${sceneData.length}…`;geminiStatus.textContent=`Scene ${i+1}/${sceneData.length} की अलग Hindi voice बनाई जा रही है…`;
   const d=await geminiRequest('gemini-3.1-flash-tts-preview',{contents:[{role:'user',parts:[{text:`Speak this exact Hindi narration clearly and naturally, in a warm storytelling voice. Do not add or omit words: ${sceneText}`}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}},key);
   const part=d.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);if(!part)throw new Error(`Scene ${i+1}: audio response नहीं मिला।`);
   const wav=pcmToWav(part.inlineData.data,24000);const ab=await wav.arrayBuffer();const decoded=await ac.decodeAudioData(ab.slice(0));sceneAudioBuffers.push(decoded);
  }
  await ac.close();
  // Build a single downloadable narration preview in the browser by scheduling the clips.
  geminiStatus.textContent=`✅ ${sceneAudioBuffers.length} अलग-अलग Scene voices तैयार। हर Scene की आवाज़ उसी Scene के साथ चलेगी।`;
  $('status').textContent='अब Preview सुनें या Reel Export करें।';
 }catch(e){sceneAudioBuffers=[];geminiStatus.textContent='TTS नहीं चला: '+e.message+' (API key, मॉडल access या quota जाँचें)।'}
 finally{b.disabled=false;b.textContent='🎙 Gemini हिंदी Voice तैयार करें'}
});
$('generateImages')?.addEventListener('click',async()=>{
 const key=localStorage.getItem(GEMINI_KEY_STORAGE);if(!key){geminiStatus.textContent='पहले Gemini API Key सेव करें।';geminiKeyInput.focus();return}if(!sceneData.length){$('status').textContent='पहले Gemini से Scenes बनाएं।';return}
 const b=$('generateImages');b.disabled=true;let made=0;
 try{for(let i=0;i<sceneData.length;i++){b.textContent=`🎨 तस्वीर ${i+1}/${sceneData.length}…`;geminiStatus.textContent=`Scene ${i+1} की image बन रही है…`;
 const prompt=`Create one beautiful vertical 9:16 story illustration, family friendly, cinematic colorful 2D cartoon, no text, no letters. Scene: ${sceneData[i].text}`;
 const d=await geminiRequest('gemini-3.1-flash-image',{contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['IMAGE','TEXT'] }},key);
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
