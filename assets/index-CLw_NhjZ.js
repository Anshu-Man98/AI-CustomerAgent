(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const t of s)if(t.type==="childList")for(const e of t.addedNodes)e.tagName==="LINK"&&e.rel==="modulepreload"&&o(e)}).observe(document,{childList:!0,subtree:!0});function a(s){const t={};return s.integrity&&(t.integrity=s.integrity),s.referrerPolicy&&(t.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?t.credentials="include":s.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(s){if(s.ep)return;s.ep=!0;const t=a(s);fetch(s.href,t)}})();function w(){return w=Object.assign?Object.assign.bind():function(l){for(var n=1;n<arguments.length;n++){var a=arguments[n];for(var o in a)({}).hasOwnProperty.call(a,o)&&(l[o]=a[o])}return l},w.apply(null,arguments)}function T(l){const n=new Uint8Array(l);return window.btoa(String.fromCharCode(...n))}function P(l){const n=window.atob(l),a=n.length,o=new Uint8Array(a);for(let s=0;s<a;s++)o[s]=n.charCodeAt(s);return o.buffer}const q=new Blob([`
      const BIAS = 0x84;
      const CLIP = 32635;
      const encodeTable = [
        0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
        4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7
      ];
      
      function encodeSample(sample) {
        let sign;
        let exponent;
        let mantissa;
        let muLawSample;
        sign = (sample >> 8) & 0x80;
        if (sign !== 0) sample = -sample;
        sample = sample + BIAS;
        if (sample > CLIP) sample = CLIP;
        exponent = encodeTable[(sample>>7) & 0xFF];
        mantissa = (sample >> (exponent+3)) & 0x0F;
        muLawSample = ~(sign | (exponent << 4) | mantissa);
        
        return muLawSample;
      }
    
      class RawAudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
                    
          this.port.onmessage = ({ data }) => {
            this.buffer = []; // Initialize an empty buffer
            this.bufferSize = data.sampleRate / 4;
            
            if (globalThis.LibSampleRate && sampleRate !== data.sampleRate) {
              globalThis.LibSampleRate.create(1, sampleRate, data.sampleRate).then(resampler => {
                this.resampler = resampler;
              });
            } 
          };
        }
        process(inputs) {
          if (!this.buffer) {
            return true;
          }
          
          const input = inputs[0]; // Get the first input node
          if (input.length > 0) {
            let channelData = input[0]; // Get the first channel's data

            // Resample the audio if necessary
            if (this.resampler) {
              channelData = this.resampler.full(channelData);
            }

            // Add channel data to the buffer
            this.buffer.push(...channelData);
            // Get max volume 
            let sum = 0.0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const maxVolume = Math.sqrt(sum / channelData.length);
            // Check if buffer size has reached or exceeded the threshold
            if (this.buffer.length >= this.bufferSize) {
              const float32Array = new Float32Array(this.buffer)
              let encodedArray = this.format === "ulaw"
                ? new Uint8Array(float32Array.length)
                : new Int16Array(float32Array.length);

              // Iterate through the Float32Array and convert each sample to PCM16
              for (let i = 0; i < float32Array.length; i++) {
                // Clamp the value to the range [-1, 1]
                let sample = Math.max(-1, Math.min(1, float32Array[i]));

                // Scale the sample to the range [-32768, 32767]
                let value = sample < 0 ? sample * 32768 : sample * 32767;
                if (this.format === "ulaw") {
                  value = encodeSample(Math.round(value));
                }

                encodedArray[i] = value;
              }

              // Send the buffered data to the main script
              this.port.postMessage([encodedArray, maxVolume]);

              // Clear the buffer after sending
              this.buffer = [];
            }
          }
          return true; // Continue processing
        }
      }
      registerProcessor("raw-audio-processor", RawAudioProcessor);
  `],{type:"application/javascript"}),O=URL.createObjectURL(q);function B(){return["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document}class k{static async create({sampleRate:n,format:a,preferHeadphonesForIosDevices:o}){let s=null,t=null;try{const r={sampleRate:{ideal:n},echoCancellation:{ideal:!0},noiseSuppression:{ideal:!0}};if(B()&&o){const g=(await window.navigator.mediaDevices.enumerateDevices()).find(v=>v.kind==="audioinput"&&["airpod","headphone","earphone"].find(d=>v.label.toLowerCase().includes(d)));g&&(r.deviceId={ideal:g.deviceId})}const h=navigator.mediaDevices.getSupportedConstraints().sampleRate;s=new window.AudioContext(h?{sampleRate:n}:{});const p=s.createAnalyser();h||await s.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js"),await s.audioWorklet.addModule(O),t=await navigator.mediaDevices.getUserMedia({audio:r});const f=s.createMediaStreamSource(t),m=new AudioWorkletNode(s,"raw-audio-processor");return m.port.postMessage({type:"setFormat",format:a,sampleRate:n}),f.connect(p),p.connect(m),await s.resume(),new k(s,p,m,t)}catch(r){var e,i;throw(e=t)==null||e.getTracks().forEach(h=>h.stop()),(i=s)==null||i.close(),r}}constructor(n,a,o,s){this.context=void 0,this.analyser=void 0,this.worklet=void 0,this.inputStream=void 0,this.context=n,this.analyser=a,this.worklet=o,this.inputStream=s}async close(){this.inputStream.getTracks().forEach(n=>n.stop()),await this.context.close()}}const R=new Blob([`
      const decodeTable = [0,132,396,924,1980,4092,8316,16764];
      
      export function decodeSample(muLawSample) {
        let sign;
        let exponent;
        let mantissa;
        let sample;
        muLawSample = ~muLawSample;
        sign = (muLawSample & 0x80);
        exponent = (muLawSample >> 4) & 0x07;
        mantissa = muLawSample & 0x0F;
        sample = decodeTable[exponent] + (mantissa << (exponent+3));
        if (sign !== 0) sample = -sample;

        return sample;
      }
      
      class AudioConcatProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffers = []; // Initialize an empty buffer
          this.cursor = 0;
          this.currentBuffer = null;
          this.wasInterrupted = false;
          this.finished = false;
          
          this.port.onmessage = ({ data }) => {
            switch (data.type) {
              case "setFormat":
                this.format = data.format;
                break;
              case "buffer":
                this.wasInterrupted = false;
                this.buffers.push(
                  this.format === "ulaw"
                    ? new Uint8Array(data.buffer)
                    : new Int16Array(data.buffer)
                );
                break;
              case "interrupt":
                this.wasInterrupted = true;
                break;
              case "clearInterrupted":
                if (this.wasInterrupted) {
                  this.wasInterrupted = false;
                  this.buffers = [];
                  this.currentBuffer = null;
                }
            }
          };
        }
        process(_, outputs) {
          let finished = false;
          const output = outputs[0][0];
          for (let i = 0; i < output.length; i++) {
            if (!this.currentBuffer) {
              if (this.buffers.length === 0) {
                finished = true;
                break;
              }
              this.currentBuffer = this.buffers.shift();
              this.cursor = 0;
            }

            let value = this.currentBuffer[this.cursor];
            if (this.format === "ulaw") {
              value = decodeSample(value);
            }
            output[i] = value / 32768;
            this.cursor++;

            if (this.cursor >= this.currentBuffer.length) {
              this.currentBuffer = null;
            }
          }

          if (this.finished !== finished) {
            this.finished = finished;
            this.port.postMessage({ type: "process", finished });
          }

          return true; // Continue processing
        }
      }

      registerProcessor("audio-concat-processor", AudioConcatProcessor);
    `],{type:"application/javascript"}),U=URL.createObjectURL(R);class S{static async create({sampleRate:n,format:a}){let o=null;try{o=new AudioContext({sampleRate:n});const t=o.createAnalyser(),e=o.createGain();e.connect(t),t.connect(o.destination),await o.audioWorklet.addModule(U);const i=new AudioWorkletNode(o,"audio-concat-processor");return i.port.postMessage({type:"setFormat",format:a}),i.connect(e),await o.resume(),new S(o,t,e,i)}catch(t){var s;throw(s=o)==null||s.close(),t}}constructor(n,a,o,s){this.context=void 0,this.analyser=void 0,this.gain=void 0,this.worklet=void 0,this.context=n,this.analyser=a,this.gain=o,this.worklet=s}async close(){await this.context.close()}}function A(l){return!!l.type}class C{static async create(n){let a=null;try{var o;const t=(o=n.origin)!=null?o:"wss://api.elevenlabs.io",e=n.signedUrl?n.signedUrl:t+"/v1/convai/conversation?agent_id="+n.agentId,i=["convai"];n.authorization&&i.push(`bearer.${n.authorization}`),a=new WebSocket(e,i);const r=await new Promise((v,d)=>{a.addEventListener("open",()=>{var c;const u={type:"conversation_initiation_client_data"};var D,F,M,x;n.overrides&&(u.conversation_config_override={agent:{prompt:(D=n.overrides.agent)==null?void 0:D.prompt,first_message:(F=n.overrides.agent)==null?void 0:F.firstMessage,language:(M=n.overrides.agent)==null?void 0:M.language},tts:{voice_id:(x=n.overrides.tts)==null?void 0:x.voiceId}}),n.customLlmExtraBody&&(u.custom_llm_extra_body=n.customLlmExtraBody),n.dynamicVariables&&(u.dynamic_variables=n.dynamicVariables),(c=a)==null||c.send(JSON.stringify(u))},{once:!0}),a.addEventListener("error",c=>{setTimeout(()=>d(c),0)}),a.addEventListener("close",d),a.addEventListener("message",c=>{const u=JSON.parse(c.data);A(u)&&(u.type==="conversation_initiation_metadata"?v(u.conversation_initiation_metadata_event):console.warn("First received message is not conversation metadata."))},{once:!0})}),{conversation_id:h,agent_output_audio_format:p,user_input_audio_format:f}=r,m=E(f??"pcm_16000"),g=E(p);return new C(a,h,m,g)}catch(t){var s;throw(s=a)==null||s.close(),t}}constructor(n,a,o,s){this.socket=void 0,this.conversationId=void 0,this.inputFormat=void 0,this.outputFormat=void 0,this.queue=[],this.disconnectionDetails=null,this.onDisconnectCallback=null,this.onMessageCallback=null,this.socket=n,this.conversationId=a,this.inputFormat=o,this.outputFormat=s,this.socket.addEventListener("error",t=>{setTimeout(()=>this.disconnect({reason:"error",message:"The connection was closed due to a socket error.",context:t}),0)}),this.socket.addEventListener("close",t=>{this.disconnect(t.code===1e3?{reason:"agent",context:t}:{reason:"error",message:t.reason||"The connection was closed by the server.",context:t})}),this.socket.addEventListener("message",t=>{try{const e=JSON.parse(t.data);if(!A(e))return;this.onMessageCallback?this.onMessageCallback(e):this.queue.push(e)}catch{}})}close(){this.socket.close()}sendMessage(n){this.socket.send(JSON.stringify(n))}onMessage(n){this.onMessageCallback=n,this.queue.forEach(n),this.queue=[]}onDisconnect(n){this.onDisconnectCallback=n,this.disconnectionDetails&&n(this.disconnectionDetails)}disconnect(n){var a;this.disconnectionDetails||(this.disconnectionDetails=n,(a=this.onDisconnectCallback)==null||a.call(this,n))}}function E(l){const[n,a]=l.split("_");if(!["pcm","ulaw"].includes(n))throw new Error(`Invalid format: ${l}`);const o=parseInt(a);if(isNaN(o))throw new Error(`Invalid sample rate: ${a}`);return{format:n,sampleRate:o}}const W={clientTools:{}},N={onConnect:()=>{},onDebug:()=>{},onDisconnect:()=>{},onError:()=>{},onMessage:()=>{},onModeChange:()=>{},onStatusChange:()=>{},onCanSendFeedbackChange:()=>{}};class I{static async startSession(n){const a=w({},W,N,n);a.onStatusChange({status:"connecting"}),a.onCanSendFeedbackChange({canSendFeedback:!1});let o=null,s=null,t=null,e=null;try{var i,r;e=await navigator.mediaDevices.getUserMedia({audio:!0});const d=(i=n.connectionDelay)!=null?i:{default:0,android:3e3};let c=d.default;var h;if(/android/i.test(navigator.userAgent))c=(h=d.android)!=null?h:c;else if(B()){var p;c=(p=d.ios)!=null?p:c}return c>0&&await new Promise(u=>setTimeout(u,c)),s=await C.create(n),[o,t]=await Promise.all([k.create(w({},s.inputFormat,{preferHeadphonesForIosDevices:n.preferHeadphonesForIosDevices})),S.create(s.outputFormat)]),(r=e)==null||r.getTracks().forEach(u=>u.stop()),e=null,new I(a,s,o,t)}catch(d){var f,m,g,v;throw a.onStatusChange({status:"disconnected"}),(f=e)==null||f.getTracks().forEach(c=>c.stop()),(m=s)==null||m.close(),await((g=o)==null?void 0:g.close()),await((v=t)==null?void 0:v.close()),d}}constructor(n,a,o,s){var t=this;this.options=void 0,this.connection=void 0,this.input=void 0,this.output=void 0,this.lastInterruptTimestamp=0,this.mode="listening",this.status="connecting",this.inputFrequencyData=void 0,this.outputFrequencyData=void 0,this.volume=1,this.currentEventId=1,this.lastFeedbackEventId=1,this.canSendFeedback=!1,this.endSession=()=>this.endSessionWithDetails({reason:"user"}),this.endSessionWithDetails=async function(e){t.status!=="connected"&&t.status!=="connecting"||(t.updateStatus("disconnecting"),t.connection.close(),await t.input.close(),await t.output.close(),t.updateStatus("disconnected"),t.options.onDisconnect(e))},this.updateMode=e=>{e!==this.mode&&(this.mode=e,this.options.onModeChange({mode:e}))},this.updateStatus=e=>{e!==this.status&&(this.status=e,this.options.onStatusChange({status:e}))},this.updateCanSendFeedback=()=>{const e=this.currentEventId!==this.lastFeedbackEventId;this.canSendFeedback!==e&&(this.canSendFeedback=e,this.options.onCanSendFeedbackChange({canSendFeedback:e}))},this.onMessage=async function(e){switch(e.type){case"interruption":e.interruption_event&&(t.lastInterruptTimestamp=e.interruption_event.event_id),t.fadeOutAudio();break;case"agent_response":t.options.onMessage({source:"ai",message:e.agent_response_event.agent_response});break;case"user_transcript":t.options.onMessage({source:"user",message:e.user_transcription_event.user_transcript});break;case"internal_tentative_agent_response":t.options.onDebug({type:"tentative_agent_response",response:e.tentative_agent_response_internal_event.tentative_agent_response});break;case"client_tool_call":if(t.options.clientTools.hasOwnProperty(e.client_tool_call.tool_name)){try{var i;const r=(i=await t.options.clientTools[e.client_tool_call.tool_name](e.client_tool_call.parameters))!=null?i:"Client tool execution successful.";t.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:r,is_error:!1})}catch(r){t.onError("Client tool execution failed with following error: "+(r==null?void 0:r.message),{clientToolName:e.client_tool_call.tool_name}),t.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:"Client tool execution failed: "+(r==null?void 0:r.message),is_error:!0})}break}if(t.options.onUnhandledClientToolCall){t.options.onUnhandledClientToolCall(e.client_tool_call);break}t.onError(`Client tool with name ${e.client_tool_call.tool_name} is not defined on client`,{clientToolName:e.client_tool_call.tool_name}),t.connection.sendMessage({type:"client_tool_result",tool_call_id:e.client_tool_call.tool_call_id,result:`Client tool with name ${e.client_tool_call.tool_name} is not defined on client`,is_error:!0});break;case"audio":t.lastInterruptTimestamp<=e.audio_event.event_id&&(t.addAudioBase64Chunk(e.audio_event.audio_base_64),t.currentEventId=e.audio_event.event_id,t.updateCanSendFeedback(),t.updateMode("speaking"));break;case"ping":t.connection.sendMessage({type:"pong",event_id:e.ping_event.event_id});break;default:t.options.onDebug(e)}},this.onInputWorkletMessage=e=>{this.status==="connected"&&this.connection.sendMessage({user_audio_chunk:T(e.data[0].buffer)})},this.onOutputWorkletMessage=({data:e})=>{e.type==="process"&&this.updateMode(e.finished?"listening":"speaking")},this.addAudioBase64Chunk=e=>{this.output.gain.gain.value=this.volume,this.output.worklet.port.postMessage({type:"clearInterrupted"}),this.output.worklet.port.postMessage({type:"buffer",buffer:P(e)})},this.fadeOutAudio=()=>{this.updateMode("listening"),this.output.worklet.port.postMessage({type:"interrupt"}),this.output.gain.gain.exponentialRampToValueAtTime(1e-4,this.output.context.currentTime+2),setTimeout(()=>{this.output.gain.gain.value=this.volume,this.output.worklet.port.postMessage({type:"clearInterrupted"})},2e3)},this.onError=(e,i)=>{console.error(e,i),this.options.onError(e,i)},this.calculateVolume=e=>{if(e.length===0)return 0;let i=0;for(let r=0;r<e.length;r++)i+=e[r]/255;return i/=e.length,i<0?0:i>1?1:i},this.getId=()=>this.connection.conversationId,this.isOpen=()=>this.status==="connected",this.setVolume=({volume:e})=>{this.volume=e},this.getInputByteFrequencyData=()=>(this.inputFrequencyData!=null||(this.inputFrequencyData=new Uint8Array(this.input.analyser.frequencyBinCount)),this.input.analyser.getByteFrequencyData(this.inputFrequencyData),this.inputFrequencyData),this.getOutputByteFrequencyData=()=>(this.outputFrequencyData!=null||(this.outputFrequencyData=new Uint8Array(this.output.analyser.frequencyBinCount)),this.output.analyser.getByteFrequencyData(this.outputFrequencyData),this.outputFrequencyData),this.getInputVolume=()=>this.calculateVolume(this.getInputByteFrequencyData()),this.getOutputVolume=()=>this.calculateVolume(this.getOutputByteFrequencyData()),this.sendFeedback=e=>{this.canSendFeedback?(this.connection.sendMessage({type:"feedback",score:e?"like":"dislike",event_id:this.currentEventId}),this.lastFeedbackEventId=this.currentEventId,this.updateCanSendFeedback()):console.warn(this.lastFeedbackEventId===0?"Cannot send feedback: the conversation has not started yet.":"Cannot send feedback: feedback has already been sent for the current response.")},this.options=n,this.connection=a,this.input=o,this.output=s,this.options.onConnect({conversationId:a.conversationId}),this.connection.onDisconnect(this.endSessionWithDetails),this.connection.onMessage(this.onMessage),this.input.worklet.port.onmessage=this.onInputWorkletMessage,this.output.worklet.port.onmessage=this.onOutputWorkletMessage,this.updateStatus("connected")}}const _=document.getElementById("startButton"),b=document.getElementById("stopButton"),L=document.getElementById("connectionStatus"),V=document.getElementById("agentStatus");let y;async function j(){try{await navigator.mediaDevices.getUserMedia({audio:!0}),y=await I.startSession({agentId:"4rPfaJDQVsNsDVCZaJjS",onConnect:()=>{L.textContent="Connected",_.disabled=!0,b.disabled=!1},onDisconnect:()=>{L.textContent="Disconnected",_.disabled=!1,b.disabled=!0},onError:l=>{console.error("Error:",l)},onModeChange:l=>{V.textContent=l.mode==="speaking"?"speaking":"listening"}})}catch(l){console.error("Failed to start conversation:",l)}}async function z(){y&&(await y.endSession(),y=null)}_.addEventListener("click",j);b.addEventListener("click",z);
