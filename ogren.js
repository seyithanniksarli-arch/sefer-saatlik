// ogren.js – trafik öğrenen sistem (satılık sürüm)
// Durağın bütün şoförlerinin gerçek durak-arası süreleri duraklar/{durak}/ogren/{hat} belgelerinde ortak havuzda toplanır.
// Durak listesi ve hat/gün bilgisi ayardan (A.hatlar) gelir, durak konumları KONUMLAR'dan (harita.js ile işaretlenir; yoksa durağın gps alanındaki "enlem,boylam").
// Bu dosya ayar.js'ten sonra, app.js'ten önce yüklenir. Hiçbir hata uygulamayı bozmaz (hepsi try/catch).
var OGR={tab:{},gon:{},dk:'',din:null,key:'',S:null,P:null,e:{},son:-1,gt:{},dep:0,m0:0,hat:'',H:null,don:'',pl:''},OGR_YAK=120,OGR_UZK=150,OGR_PEN=1800000,OGR_MAX=30;
function ogrenSimdi(){return Date.now()}
function ogrenGrup(ms){const d=new Date(ms).getDay();return d===0||d===6?'hs':'hi'}
function ogrenId(a,b){return (a+'__'+b).replace(/[\/.]/g,'-')}
function ogrenOrt(a){a=a.slice().sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2}
function ogrenGunBasi(ms){const d=new Date(ms);return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()}
function ogrenSn(ms){const d=new Date(ms);return d.getHours()*3600+d.getMinutes()*60+d.getSeconds()}
function ogrenMesafe(a,b){const R=6371e3,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
// hattın durak dizisi: [kalkış, ...durak adları] ve plan dakikaları (D = seferDuraklari(...).D); don = sondaki "kalkış (dönüş)" yapay durağı
function ogrenDizi(h,D){const ad=h.kalkis||'Kalkış';return {S:[ad].concat(D.map(x=>x[0])),P:[0].concat(D.map(x=>+x[1]||0)),don:h.kalkis?h.kalkis+' (dönüş)':'Tur sonu'}}
// durak konumu: önce haritada işaretlenen KONUMLAR, yoksa ayarda gps alanına "enlem,boylam" yazıldıysa o
function ogrenKonumBul(h,ad){try{const k=(typeof KONUMLAR!=='undefined'&&KONUMLAR)?KONUMLAR[ad]:null;if(k&&!isNaN(k[0])&&!isNaN(k[1]))return k;
 const d=((h&&h.duraklar)||[]).find(x=>x.ad===ad),m=String(d&&d.gps||'').match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/);return m?[+m[1],+m[2]]:null}catch(e){return null}}
// şoförün takip ettiği plakanın şu anki seferi (kalkıştan 3 dk önce başlar, tur süresi + 30 dk sonra biter; trafikte geç kalan sefer de öğrenir)
function ogrenBaglam(ms){try{
 if(typeof TAKIP==='undefined'||!TAKIP||!TAKIP.h||!TAKIP.plan||typeof seferDuraklari!=='function')return null;
 const s=ogrenSn(ms),L=TAKIP.plan;
 for(let i=0;i<L.length;i++){const x=L[i],r=seferDuraklari(TAKIP.h,TAKIP.K,x),nx=L[i+1],son=Math.min(x+r.tur*60+1800,nx!==undefined?nx-180:1e9);if(s>=x-180&&s<son)return {h:TAKIP.h,x:x,D:r.D,p:TAKIP.p||''}}
}catch(e){}return null}
// --- ortak havuz: dinle / yaz
function ogrenDinle(){try{if(typeof FS==='undefined'||!FS||typeof DURAK==='undefined'||!DURAK||typeof cref!=='function')return;if(OGR.din&&OGR.dk===DURAK)return;
 if(OGR.din){try{OGR.din()}catch(e){}}OGR.dk=DURAK;OGR.tab={};
 OGR.din=cref(dp('ogren')).onSnapshot(sn=>{const t={};sn.forEach(d=>{const x=d.data();t[d.id]=(x&&x.s&&typeof x.s==='object')?x.s:{}});OGR.tab=t},e=>{})}catch(e){}}
function ogrenYaz(hat,id,s){try{if(typeof FS==='undefined'||!FS||typeof DURAK==='undefined'||!DURAK||typeof dref!=='function')return;
 const kk=DURAK+'|'+hat+'|'+id+'|'+s.p+'|'+s.z;if(OGR.gon[kk])return;OGR.gon[kk]=1;
 const o=(OGR.tab[hat]||{})[id];if(o&&o.some(x=>x.p===s.p&&x.z===s.z))return;
 const r=dref(dp('ogren',hat));
 FS.runTransaction(tx=>tx.get(r).then(d=>{const m=(d.exists&&d.data().s)||{};const a=Array.isArray(m[id])?m[id]:[];if(a.some(x=>x.p===s.p&&x.z===s.z))return;
  const b=a.concat([s]);m[id]=b.filter(x=>x.g!==s.g).concat(b.filter(x=>x.g===s.g).sort((x,y)=>x.z-y.z).slice(-OGR_MAX)).sort((x,y)=>x.z-y.z);tx.set(r,{s:m})})).catch(()=>{})}catch(e){}}
// --- durak geçişi algılama (şoför telefonunun konumundan)
function ogrenKes(j){try{const e=OGR.e[j];if(!e||e.f)return;e.f=1;if(j<=OGR.son)return;
 if(Math.abs(e.t-(OGR.m0+OGR.dep*1000+OGR.P[j]*60000))>=OGR_PEN)return;
 OGR.son=j;OGR.gt[j]=e.t;const a=OGR.gt[j-1];if(j<1||a===undefined)return;const s=(e.t-a)/1000;if(s<20||s>1200)return;
 ogrenYaz(OGR.hat,ogrenId(OGR.S[j-1],OGR.S[j]),{s:Math.round(s),z:e.t,g:ogrenGrup(e.t),p:OGR.pl})}catch(x){}}
function ogrenKonum(la,ln,ms){try{
 if(ms===undefined)ms=ogrenSimdi();
 const B=ogrenBaglam(ms);if(!B)return;ogrenDinle();
 const m0=ogrenGunBasi(ms),key=B.h.id+'|'+B.x+'|'+m0;
 if(OGR.key!==key){const q=ogrenDizi(B.h,B.D);OGR.key=key;OGR.S=q.S;OGR.P=q.P;OGR.don=q.don;OGR.e={};OGR.son=-1;OGR.gt={};OGR.dep=B.x;OGR.m0=m0;OGR.hat=B.h.id;OGR.H=B.h}
 OGR.pl=B.p;const S=OGR.S;
 for(let j=0;j<S.length;j++){if(j>0&&S[j]===OGR.don)continue;const p=ogrenKonumBul(OGR.H,S[j]);if(!p)continue;
  const d=ogrenMesafe([la,ln],p),e=OGR.e[j]||(OGR.e[j]={m:1e12,t:0,f:0,i:0});if(e.f)continue;
  if(d<=OGR_YAK){for(let q=0;q<j;q++){const f=OGR.e[q];if(f&&f.i&&!f.f)ogrenKes(q)}e.i=1;if(j===0||d<e.m){e.m=d;e.t=ms}}
  else if(e.i&&d>OGR_UZK)ogrenKes(j)}
}catch(e){}}
// --- tahmin: ortanca (uç değerler atılır), hafta içi 'hi' / hafta sonu 'hs' ayrı
function ogrenMed(hat,id,g,pl){const o=(((OGR.tab[hat]||{})[id])||[]).filter(x=>x&&x.g===g&&x.s>0).map(x=>x.s);if(o.length<5)return null;const m0=ogrenOrt(o),L=o.filter(x=>x>=m0*0.5&&x<=m0*2);if(L.length<4)return null;const m=ogrenOrt(L);if(pl>0&&(m<pl*0.6||m>pl*1.8))return null;return m}
function ogrenKum(hat,S,P,g){const cum=[0],ogr=[false],seg=[false];for(let i=1;i<S.length;i++){const pl=(P[i]-P[i-1])*60,m=ogrenMed(hat,ogrenId(S[i-1],S[i]),g,pl);seg[i]=m!==null;cum[i]=cum[i-1]+(m!==null?m:pl);ogr[i]=ogr[i-1]||seg[i]}return {cum:cum,ogr:ogr,seg:seg}}
function ogrenOrnek(h,ad,D,ms){try{if(ms===undefined)ms=ogrenSimdi();const q=ogrenDizi(h,D),i=q.S.indexOf(ad);if(i<0)return 0;const K=ogrenKum(h.id,q.S,q.P,ogrenGrup(ms));let c=0;for(let x=1;x<=i;x++)if(K.seg[x])c++;return c}catch(e){return 0}}
// planlı kalkıştan (sefer başlangıcı) öğrenilmiş kümülatif süreyle varış: günün saniyesi (öğrenilmiş segment yoksa plan)
function ogrenTaban(h,ad,dep,D,ms){try{if(ms===undefined)ms=ogrenSimdi();const q=ogrenDizi(h,D),i=q.S.indexOf(ad);if(i<1)return null;return dep+ogrenKum(h.id,q.S,q.P,ogrenGrup(ms)).cum[i]}catch(e){return null}}
// canlı: son geçilen duraktan (GPS ile görüldü) ya da kalkıştan itibaren öğrenilmiş süreyle varış (günün saniyesi); öğrenilmiş segment yoksa null
function ogrenVarisSn(h,ad,dep,D,ms){try{if(ms===undefined)ms=ogrenSimdi();const q=ogrenDizi(h,D),i=q.S.indexOf(ad);if(i<1)return null;const K=ogrenKum(h.id,q.S,q.P,ogrenGrup(ms));
 let j=-1;if(OGR.hat===h.id&&OGR.dep===dep&&OGR.m0===ogrenGunBasi(ms)&&OGR.S&&OGR.S.join('|')===q.S.join('|')&&OGR.son>=0&&OGR.gt[OGR.son]!==undefined)j=OGR.son;
 const lo=j>=0&&j<i?j:0;let ok=false;for(let x=lo+1;x<=i;x++)if(K.seg[x])ok=true;if(!ok)return null;
 return j>=0?(OGR.gt[j]-OGR.m0)/1000+(K.cum[i]-K.cum[j]):dep+K.cum[i]}catch(e){return null}}
function ogrenKalan(h,ad,dep,D,ms){try{if(ms===undefined)ms=ogrenSimdi();ogrenDinle();const v=ogrenVarisSn(h,ad,dep,D,ms);if(v===null)return null;return Math.max(0,Math.round(v-ogrenSn(ms)))}catch(e){return null}}
