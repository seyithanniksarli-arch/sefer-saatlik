// harita.js – durak haritası: durak konumlarını kahya işaretler, canlı araçlar görünür
let HRT=null,HRT_IM=[],HRT_CANLI={},HRT_DIN=null,HRT_HF='hepsi';
function durakAdlari(hid){const L=[];const ekle=n=>{if(n&&!L.includes(n))L.push(n)};
 for(const h of A.hatlar){if(hid!=='hepsi'&&h.id!==hid)continue;ekle(h.kalkis);(h.duraklar||[]).forEach(d=>ekle(d.ad));(h.yolcuDuraklari||[]).forEach(d=>ekle(d.ad))}return L}
function leafletYukle(){if(window.L)return Promise.resolve();return new Promise((ok,no)=>{const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(c);
 const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function haritaKur(){
 const al=$('haritaAlan');if(!al||al.dataset.kuruldu)return;al.dataset.kuruldu=1;const K=kahyaMi();
 al.innerHTML=(K?'<p class="kucuk">Durağı seç, haritada yerine dokun. Bütün telefonlara kaydedilir. Yolcu sayfası ve trafik bu konumları kullanır.</p>':'<p class="kucuk">Durakları ve şu an yoldaki araçları gösterir.</p>')+
  (A.hatlar.length>1?'<select id="hrtHat" onchange="HRT_HF=this.value;haritaSecenek();haritaImler()" style="width:100%;margin-bottom:6px"><option value="hepsi">Tüm hatlar</option>'+A.hatlar.map(h=>'<option value="'+h.id+'"'+(h.id==HRT_HF?' selected':'')+'>'+esc(h.ad)+'</option>').join('')+'</select>':'')+
  (K?'<select id="hrtDurak" style="width:100%"></select><button class="ana gri" style="padding:10px;font-size:16px" onclick="haritaDurakSil()">Seçili durağın işaretini sil</button>':'')+
  '<div id="hrt" style="height:380px;border-radius:12px;margin-top:6px"></div><p id="hrtBilgi" class="kucuk"></p>';
 haritaSecenek();
 try{await leafletYukle()}catch(e){$('hrt').textContent='Harita yüklenemedi, internet bağlantını kontrol et.';return}
 if(HRT){HRT.remove();HRT=null}
 HRT=L.map('hrt');const ilk=Object.values(KONUMLAR)[0];HRT.setView(ilk||[41.02,28.59],ilk?14:12);
 const kat={'Harita':L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:19,subdomains:'abc',attribution:'© OpenStreetMap'}),'Harita 2':L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'© OpenStreetMap © CARTO'}),'Uydu':L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri'})};
 kat['Harita'].addTo(HRT);L.control.layers(kat).addTo(HRT);
 HRT.on('click',ev=>{if(!kahyaMi())return;const n=($('hrtDurak')||{}).value;if(!n)return;if(!confirm(n+' buraya kaydedilsin mi?'))return;const Y=Object.assign({},KONUMLAR);Y[n]=[+ev.latlng.lat.toFixed(6),+ev.latlng.lng.toFixed(6)];haritaKaydet(Y)});
 if(HRT_DIN)HRT_DIN();HRT_DIN=cref(dp('canli')).onSnapshot(sn=>{HRT_CANLI={};sn.forEach(d=>HRT_CANLI[d.id]=d.data());haritaImler()},()=>{});DINLE.push(()=>{if(HRT_DIN){HRT_DIN();HRT_DIN=null}});
 haritaImler();setTimeout(()=>HRT&&HRT.invalidateSize(),100);
}
function haritaSecenek(){const s=$('hrtDurak');if(!s)return;const o=s.value;s.innerHTML=durakAdlari(HRT_HF).map(n=>'<option value="'+esc(n)+'"'+(n==o?' selected':'')+'>'+esc(n)+(KONUMLAR[n]?' ✓':'')+'</option>').join('')}
function haritaImler(){if(!HRT||!window.L)return;HRT_IM.forEach(m=>m.remove());HRT_IM=[];const ad=durakAdlari(HRT_HF);
 ad.forEach(n=>{if(KONUMLAR[n])HRT_IM.push(L.marker(KONUMLAR[n]).addTo(HRT).bindTooltip(n,{permanent:true,direction:'top'}))});
 for(const p in HRT_CANLI){const c=HRT_CANLI[p];if(!c||Date.now()-c.z>120000||c.lat==null)continue;if(HRT_HF!=='hepsi'&&c.hat!==HRT_HF)continue;
  HRT_IM.push(L.marker([c.lat,c.lng],{icon:L.divIcon({html:'<div style="background:#e74c3c;color:#fff;font-weight:bold;border-radius:10px;padding:3px 7px;font-size:14px;white-space:nowrap">🚐 '+esc(p)+'</div>',className:'',iconAnchor:[30,12]})}).addTo(HRT))}
 const b=$('hrtBilgi');if(b)b.textContent=ad.filter(n=>KONUMLAR[n]).length+' / '+ad.length+' durak işaretli';haritaSecenek()}
function haritaKaydet(Y){dref(dp()).update({konumlar:Y}).then(()=>{KONUMLAR=Y;haritaImler()}).catch(e=>alert('Kaydedilemedi: '+hata(e)))}
function haritaDurakSil(){const n=$('hrtDurak').value;if(!KONUMLAR[n])return;if(!confirm(n+' işareti silinsin mi?'))return;const Y=Object.assign({},KONUMLAR);delete Y[n];haritaKaydet(Y)}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.k=='harita'&&d.open)setTimeout(()=>{haritaKur();HRT&&HRT.invalidateSize()},60)},true);
