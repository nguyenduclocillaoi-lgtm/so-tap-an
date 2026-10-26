/* Xử lý chính: tính toán, giao diện, sự kiện, lưu trữ. Dùng dữ liệu từ du-lieu.js và kien-thuc.js */
(function(){
'use strict';
/* kết quả tính toán dùng lại trong một lần vẽ màn hình; xoá khi vẽ lại hoặc khi dữ liệu đổi */
const memo={};
/* ---------- tiện ích ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:d}):'–';
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return Number.isFinite(n)?n:0};
const today=()=>{const t=new Date();return new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const dshow=iso=>{if(!iso)return'';const[y,m,d]=iso.split('-');return d+'/'+m+'/'+y};
const dshort=iso=>{const[,m,d]=iso.split('-');return d+'/'+m};
const daysBetween=(a,b)=>(Date.parse(b)-Date.parse(a))/864e5;
const clone=o=>JSON.parse(JSON.stringify(o));
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();

/* ---------- dữ liệu tham chiếu ---------- */
const GOALS={
  giam_mo:{name:'Giảm mỡ',delta:-450,p:2.2,f:0.7,rate:'Giảm 0,5–1% cân nặng mỗi tuần'},
  recomp:{name:'Recomp',delta:-200,p:2.1,f:0.8,rate:'Cân gần đứng yên (±0,5 kg), vòng eo giảm, tạ tăng'},
  duy_tri:{name:'Duy trì',delta:0,p:2.0,f:0.8,rate:'Cân dao động trong khoảng ±0,5 kg'},
  tang_co:{name:'Tăng cơ',delta:250,p:1.8,f:0.8,rate:'Tăng 0,5–1 kg mỗi tháng'},
  tang_can:{name:'Tăng cân',delta:450,p:1.7,f:0.9,rate:'Tăng 0,25–0,5 kg mỗi tuần'}
};
const ACTS=[[1.375,'Tập 3 buổi/tuần, ít đi lại'],[1.465,'Tập 4–5 buổi/tuần'],[1.55,'Tập 6 buổi/tuần'],[1.725,'Tập 6 buổi + 8.000–10.000 bước/ngày']];
const DAY_LABELS=['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];
const MUSCLES=['Ngực','Lưng','Lưng dưới','Vai trước','Vai giữa','Vai sau','Thang dưới','Chóp xoay','Tay trước','Tay sau','Đùi trước','Đùi sau','Mông','Đùi trong','Bắp chân','Bụng','Thang trên','Cẳng tay'];
const TARGET={'Ngực':[10,20],'Lưng':[10,20],'Vai giữa':[8,20],'Vai sau':[6,16],'Tay trước':[8,20],'Tay sau':[8,20],'Đùi trước':[10,20],'Đùi sau':[8,16],'Mông':[6,16],'Bắp chân':[6,16],'Bụng':[4,12]};
const FLAGS={
  'v!':['Vai: nên tránh','bad','Đưa vai vào tư thế duỗi ra sau hoặc xoay trong ở cuối biên độ, dễ kích ứng gân trước vai.'],
  'v?':['Vai: thận trọng','warn','Giới hạn biên độ: dừng khi khuỷu tay ngang thân, trước điểm đau.'],
  't!':['Trĩ: nên tránh','bad','Tải nặng, phải nín thở gồng bụng (Valsalva) mạnh và lâu.'],
  't?':['Trĩ: thận trọng','warn','Giữ RIR 2–3, thở ra khi đẩy, không nín thở quá 1 rep.']
};
const LIB={};LIB_RAW.forEach(([id,n,m,t,fl])=>{LIB[id]={id,n,m,t,fl:fl.match(/[vt][!?]/g)||[]}});

const FOODS={};FOOD_RAW.forEach(([id,n,cat,u,k,p,c,f,fb,note])=>{FOODS[id]={id,n,cat,u,k,p,c,f,fb,note:note||''}});
const FOOD_CATS=['Tinh bột','Đạm','Rau','Trái cây','Chất béo','Sữa & bổ sung','Món ăn sẵn','Đồ uống & gia vị','Tự nhập'];
const per100=f=>f.u==='g'||f.u==='ml';
const unitLabel=f=>per100(f)?f.u:f.u;

const tplMeals=id=>TPL[id].meals.map(([name,items])=>({name,items:items.map(([f,q])=>({f,q}))}));

function defaultPlan(){
  const D=(name,cardio,items)=>({name,cardio,cardioType:'walk_steep',items:items.map(([ex,sets,reps,note])=>({ex,sets,reps,note:note||''}))});
  return [
    D('Push A',35,[['face_pull',2,'15','Khởi động vai, tạ nhẹ'],['machine_press',3,'8–12','Tay cầm ngang giữa ngực'],['incline_db',3,'8–12','Ghế 30°, dừng khi khuỷu ngang thân'],['cable_fly',3,'12–15','Cắt bớt biên độ cuối'],['cable_lat',4,'12–15','Nâng tới ngang vai'],['pushdown',3,'10–15']]),
    D('Pull A',35,[['lat_pd',3,'8–12','Kéo về ngực trên'],['machine_row',3,'10–12','Có tựa ngực'],['cs_db_row',3,'10–12','Bắt đầu từ tuần 3'],['one_arm_pd',2,'10–12'],['rear_deck',3,'12–15'],['db_curl',3,'10–12'],['hammer',2,'10–12']]),
    D('Legs A',0,[['hack',3,'8–12','RIR 2, thở ra khi đứng lên'],['rdl',3,'8–10','Tạ vừa, RIR 2–3'],['leg_ext',3,'12–15'],['seated_curl',3,'10–12'],['calf_stand',3,'10–15','Dừng 1 giây ở điểm thấp'],['cable_crunch',3,'12–15','Gập cột sống, không gập hông']]),
    D('Push B',35,[['ext_rot',2,'15','Khởi động vai, tạ nhẹ'],['incline_machine',3,'8–12','Giới hạn biên độ'],['pec_deck',3,'12–15','Không mở tay quá sau thân'],['hi_lo_fly',2,'12–15'],['db_lat',4,'12–15','Tay chếch ra trước'],['oh_ext',3,'10–15'],['hang_knee',3,'10–15','Thở ra khi co gối']]),
    D('Pull B',0,[['assist_pu',3,'6–10','Giảm trợ lực dần'],['cable_row',3,'10–12'],['straight_pd',2,'12–15'],['face_pull',3,'15'],['y_raise',2,'12–15','Tạ nhẹ, kéo vai xuống'],['incline_curl',3,'10–12'],['pushdown_rope',3,'10–15']]),
    D('Legs B',0,[['bss',3,'8–12','Mỗi chân'],['hip_thrust',3,'8–12','Dừng 1 giây ở đỉnh'],['leg_press',3,'12–15','Không khóa gối, không nín thở'],['lying_curl',3,'10–12'],['back_ext',2,'12–15','Tạ nhẹ hoặc không tạ'],['hip_abd',2,'15'],['calf_seat',3,'12–15'],['leg_tucks',3,'15']]),
    D('Nghỉ',0,[])
  ];
}
function defaults(){
  return {v:1,planRev:2,
    /* số đo chung, không phải của ai; người dùng nhập lại ở màn Mục tiêu */
    profile:{sex:'m',age:25,h:170,w:65,bf:20,act:1.465,goal:'duy_tri',vai:false,tri:false},
    plan:defaultPlan(),
    meals:tplMeals('hien_tai'),
    customFoods:[],
    body:[],
    logs:[]};
}

/* ---------- lưu trữ ---------- */
const STORE='so-tap-an-v1';
let S;
try{const raw=localStorage.getItem(STORE);S=raw?JSON.parse(raw):null}catch(e){S=null}
let firstRun=false;
if(!S||!S.profile||!Array.isArray(S.plan)){S=defaults();firstRun=true}
let ui_regenMeals=false,ui_rebal=false;
function migrate(){
  if(!(S.planRev>=2)){
    const add=(di,after,item)=>{const d=S.plan[di];if(!d||d.items.some(x=>x.ex===item.ex))return;let k=d.items.findIndex(x=>x.ex===after);k=k<0?d.items.length:k+1;d.items.splice(k,0,item)};
    add(1,'machine_row',{ex:'cs_db_row',sets:3,reps:'10–12',note:'Bắt đầu từ tuần 3'});
    add(3,'oh_ext',{ex:'hang_knee',sets:3,reps:'10–15',note:'Thở ra khi co gối'});
    add(4,'face_pull',{ex:'y_raise',sets:2,reps:'12–15',note:'Tạ nhẹ, kéo vai xuống'});
    add(4,'incline_curl',{ex:'pushdown_rope',sets:3,reps:'10–15',note:''});
    add(5,'lying_curl',{ex:'back_ext',sets:2,reps:'12–15',note:'Tạ nhẹ hoặc không tạ'});
    add(5,'hip_abd',{ex:'calf_seat',sets:3,reps:'12–15',note:''});
    S.planRev=2;
  }
  if(S.planRev<3){
    /* rev 3: chọn Duy trì, cardio T2–T4–T5 + CN tùy chọn */
    S.profile.goal='duy_tri';
    const cm=[35,0,35,35,0,0,35];S.plan.forEach((d,i)=>{if(i<7)d.cardio=cm[i]});
    if(S.plan[6]&&!S.plan[6].items.length&&/^Nghỉ$/.test(S.plan[6].name))S.plan[6].name='Nghỉ – cardio tùy chọn';
    ui_regenMeals=JSON.stringify(S.meals)===JSON.stringify(tplMeals('hien_tai'));
    S.planRev=3;
  }
S.plan.forEach(d=>{if(!d.cardioType||!CARDIO[d.cardioType])d.cardioType='walk_steep'});if(!S.checks||typeof S.checks!=='object')S.checks={};
  if(!Array.isArray(S.menus)||!S.menus.length){S.menus=[{id:'m1',name:'Thực đơn A',meals:Array.isArray(S.meals)?S.meals:tplMeals('hien_tai')}];S.weekMenu=Array(7).fill('m1')}
  delete S.meals;
  if(!Array.isArray(S.weekMenu)||S.weekMenu.length!==7)S.weekMenu=Array(7).fill(S.menus[0].id);
  S.weekMenu=S.weekMenu.map(id=>S.menus.some(m=>m.id===id)?id:S.menus[0].id);
  if(!S.dayMeals||typeof S.dayMeals!=='object')S.dayMeals={};
  /* chốt thực đơn của các ngày đã qua có đánh dấu: sửa thực đơn sau này không làm đổi số liệu ngày cũ */
  const td=today();Object.keys(S.checks||{}).forEach(d=>{if(d<td&&!S.dayMeals[d]){const m=S.menus.find(x=>x.id===S.weekMenu[(new Date(d+'T00:00:00').getDay()+6)%7])||S.menus[0];S.dayMeals[d]=clone(m.meals)}});
  if(S.profile.strictPro===undefined){S.profile.strictPro=true;ui_rebal=true}
  if(!S.drafts||typeof S.drafts!=='object')S.drafts={};Object.keys(S.drafts).forEach(d=>{if(daysBetween(d,today())>3)delete S.drafts[d]});
  if(!S.progStart)S.progStart=(()=>{const t=new Date();t.setDate(t.getDate()-((t.getDay()+6)%7));return new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10)})();
}
migrate();
let saveT;
let saveErrShown=false;
function writeLocal(){clearTimeout(saveT);saveT=null;try{localStorage.setItem(STORE,JSON.stringify(S));saveErrShown=false}catch(e){if(!saveErrShown){saveErrShown=true;toast('Không lưu được vào máy (bộ nhớ đầy hoặc bị chặn). Hãy tải file sao lưu ngay.')}}}
function saveLocal(){clearTimeout(saveT);saveT=setTimeout(writeLocal,150)}
/* app bị ẩn, chuyển app khác hoặc tắt: ghi ngay phần chưa kịp lưu */
const flushSave=()=>{if(saveT)writeLocal()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave()});
window.addEventListener('pagehide',flushSave);
function save(){memo.calc=memo.rec=null;saveLocal();if(typeof scheduleAuto==='function')scheduleAuto();syncSchedule()}
const ui={tab:'today',todayInit:null,sub:'body',mealView:'check',checkDate:today(),modal:null,armed:null,logDay:null,logDate:today(),draft:{},histEx:null,week:null,editMenu:null,qa:{q:'',sel:null,qty:'',meal:'',ate:true,manual:false,mn:{n:'',k:'',p:'',c:'',f:''}},tplId:'hien_tai',confirmTpl:false,bodyForm:{d:today(),w:'',waist:'',note:''},backup:false,cf:{n:'',u:'g',k:'',p:'',c:'',f:'',fb:''}};
try{const h=(location.hash||'').slice(1);if(['today','goal','plan','meal','track','notes'].includes(h))ui.tab=h}catch(e){}
if(firstRun)ui.tab=ui.moreTab='goal';

const food=id=>FOODS[id]||S.customFoods.find(f=>f.id===id);
let DL=null;
(async()=>{try{if(window.claude&&window.claude.use){DL=await window.claude.use('downloads');if(DL&&ui.tab==='goal')render()}}catch(e){DL=null}})();
function validBackup(o){return o&&o.profile&&Array.isArray(o.plan)&&(Array.isArray(o.meals)||Array.isArray(o.menus))}
function applyBackup(o){firstRun=false;S=Object.assign(defaults(),o);migrate();save()}
/* ---------- bản chạy trên máy (file://): tải file trực tiếp + tự lưu vào file ---------- */
const LOCAL=location.protocol==='file:';
/* mở bằng trình duyệt thường (file hoặc app đã cài), không phải trong khung Claude: tải file trực tiếp được */
const WEB=!window.claude;
/* điện thoại Android chia sẻ được file .txt (không nhận .json) sang Drive, Zalo... */
const CAN_SHARE=(()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['x'],'x.txt',{type:'text/plain'})]}))}catch(_){return false}})();
function mergeData(o){
  const ids=new Set(S.logs.map(x=>String(x.id)));(o.logs||[]).forEach(l=>{if(!ids.has(String(l.id)))S.logs.push(l)});
  S.logs.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:x.id-y.id);
  (o.body||[]).forEach(b=>{const cur=S.body.find(x=>x.d===b.d);if(!cur)S.body.push(b);else{if(!cur.w&&b.w)cur.w=b.w;if(!cur.waist&&b.waist)cur.waist=b.waist;if(!cur.note&&b.note)cur.note=b.note}});
  Object.entries(o.checks||{}).forEach(([d,c])=>{const cur=S.checks[d];if(!cur){S.checks[d]=c;return}
    cur.items=Object.assign(cur.items||{},c.items||{});cur.creatine=!!(cur.creatine||c.creatine);cur.water=Math.max(cur.water||0,c.water||0);if(!cur.note&&c.note)cur.note=c.note});
  const fids=new Set(S.customFoods.map(f=>f.id));(o.customFoods||[]).forEach(f=>{if(!fids.has(f.id))S.customFoods.push(f)});
  Object.entries(o.dayMeals||{}).forEach(([d,m])=>{if(!S.dayMeals[d])S.dayMeals[d]=m});
  /* ghi chú bài tập, ghi chú ngày, bài yêu thích: giữ cái đang có, thêm cái còn thiếu */
  S.exNotes=S.exNotes||{};Object.entries(o.exNotes||{}).forEach(([k,v])=>{if(!S.exNotes[k]&&v)S.exNotes[k]=v});
  S.dayNotes=S.dayNotes||{};Object.entries(o.dayNotes||{}).forEach(([k,v])=>{if(!S.dayNotes[k]&&v)S.dayNotes[k]=v});
  S.favs=S.favs||[];(o.favs||[]).forEach(id=>{if(!S.favs.includes(id))S.favs.push(id)});
  save();
}
function localDownload(name,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
let fileHandle=null,lastAuto=null,autoT=null;
const FS_OK=LOCAL&&typeof window.showSaveFilePicker==='function';
function idb(){return new Promise((res,rej)=>{try{const q=indexedDB.open('so-tap-an',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}catch(e){rej(e)}})}
async function idbSet(k,v){try{const db=await idb();await new Promise(r=>{const t=db.transaction('kv','readwrite');if(v==null)t.objectStore('kv').delete(k);else t.objectStore('kv').put(v,k);t.oncomplete=r;t.onerror=r})}catch(_){}}
async function idbGet(k){try{const db=await idb();return await new Promise(r=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(_){return null}}
async function writeAuto(){if(!fileHandle)return;try{const w=await fileHandle.createWritable();await w.write(JSON.stringify(S,null,1));await w.close();lastAuto=new Date();if(ui.tab==='goal'&&!document.activeElement.matches('input,textarea,select'))render()}catch(e){ui.fhPending=fileHandle;fileHandle=null;toast('Tự lưu đã dừng vì không ghi được file. Bấm "Bật lại tự lưu".');render()}}
function scheduleAuto(){if(!fileHandle)return;clearTimeout(autoT);autoT=setTimeout(writeAuto,800)}
async function fhNew(){try{const h=await window.showSaveFilePicker({suggestedName:'so-tap-an.json',types:[{description:'Sao lưu Sổ tập & ăn',accept:{'application/json':['.json']}}]});fileHandle=h;ui.fhPending=null;await idbSet('fh',h);await writeAuto();toast('Đã bật tự lưu vào '+h.name);render()}catch(e){if(!e||e.name!=='AbortError')toast('Không tạo được file')}}
async function fhOpen(){try{const [h]=await window.showOpenFilePicker({types:[{description:'Sao lưu Sổ tập & ăn',accept:{'application/json':['.json']}}]});const f=await h.getFile();const o=JSON.parse(await f.text());if(!validBackup(o)){toast('File không phải file sao lưu của trang này');return}ui.pendingImport={name:f.name,data:o,handle:h};render()}catch(e){if(!e||e.name!=='AbortError')toast('Không mở được file')}}
async function fhResume(h){if(!h)return;try{const p=await h.requestPermission({mode:'readwrite'});if(p==='granted'){fileHandle=h;ui.fhPending=null;await idbSet('fh',h);await writeAuto();toast('Đang tự lưu vào '+h.name);render()}else toast('Chưa được cấp quyền ghi file')}catch(_){toast('Không bật được, hãy chọn file khác')}}
if(FS_OK)idbGet('fh').then(h=>{if(h&&!fileHandle){ui.fhPending=h;if(ui.tab==='goal')render()}});
function autoSaveBox(){
  if(!FS_OK)return `<p class="small muted">Tự lưu vào file cần Chrome hoặc Edge bản máy tính. Trình duyệt này chỉ dùng được nút tải file.</p>`;
  let body;
  if(fileHandle)body=`<span class="small"><span class="chip ok">Đang tự lưu</span> vào <b>${esc(fileHandle.name)}</b>${lastAuto?` · ghi lúc ${lastAuto.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`:''}</span><div class="row"><button class="btn small" data-act="fhstop">Ngừng tự lưu</button></div>`;
  else if(ui.fhPending)body=`<div class="row"><button class="btn small primary" data-act="fhresume">Bật lại tự lưu vào ${esc(ui.fhPending.name)}</button><button class="btn small" data-act="fhforget">Dùng file khác</button></div><span class="small muted">Trình duyệt hỏi lại quyền ghi file mỗi lần mở trang.</span>`;
  else body=`<div class="row"><button class="btn small primary" data-act="fhnew">Tạo file mới để tự lưu</button><button class="btn small" data-act="fhopen">Mở file có sẵn và tự lưu tiếp</button></div>`;
  return `<div class="note-box" style="display:flex;flex-direction:column;gap:8px"><b>Tự lưu vào file trên máy</b><span class="small muted">Mọi thay đổi tự ghi vào file .json bạn chọn. Đặt file trong thư mục Google Drive trên máy để có bản trên mạng; trên điện thoại mở file đó bằng nút "Mở file sao lưu" rồi chọn "Gộp nhật ký".</span>${body}</div>`;
}

/* ---------- tính toán ---------- */
/* cân dùng để tính = trung bình các lần cân trong 7 ngày tính đến lần cân mới nhất */
function wInfo(){const b=S.body.filter(x=>x.w>0).sort((a,c)=>a.d<c.d?-1:1);if(!b.length)return{w:S.profile.w,n:0};
  const L=b[b.length-1].d;const r=b.filter(x=>daysBetween(x.d,L)<7);return{w:r.reduce((a,x)=>a+x.w,0)/r.length,n:r.length,from:r[0].d,to:L}}
const effW=()=>wInfo().w;
function calc(){return memo.calc||(memo.calc=calcNow())}
function calcNow(){
  const p=Object.assign({},S.profile,{w:effW()});
  const lbm=p.bf>0?p.w*(1-p.bf/100):null;
  const bmr=lbm?370+21.6*lbm:10*p.w+6.25*p.h-5*p.age+(p.sex==='m'?5:-161);
  const tdee=bmr*p.act;const g=GOALS[p.goal]||GOALS.recomp;
  const k=Math.round((tdee+g.delta)/10)*10;
  const pro=Math.round(p.w*g.p),fat=Math.round(p.w*g.f);
  const carb=Math.max(0,Math.round((k-pro*4-fat*9)/4));
  const fib=Math.round(k/1000*14);
  const ffmi=lbm?lbm/Math.pow(p.h/100,2):null;
  return {lbm,bmr,tdee,k,pro,fat,carb,fib,water:p.w*0.035,ffmi,g,method:lbm?'Katch-McArdle':'Mifflin-St Jeor'};
}
/* cách nấu: gam dầu ước tính thấm vào mỗi 100 g món (ước tính, chưa kiểm chứng theo nghiên cứu) */
const COOK={'':['Luộc / hấp / để sống',0],pan:['Áp chảo ít dầu',3],kho:['Kho / rim',4],stir:['Xào',5],fry:['Chiên ngập dầu',10]};
const NO_COOK=['dua_leo','ca_chua','rau_song','dau_hu_chien','ca_ngu_hop','cha_lua'];
const cookable=f=>!!f&&f.u==='g'&&['Đạm','Rau'].includes(f.cat)&&!NO_COOK.includes(f.id);
function itemNut(it){const f=food(it.f);if(!f)return{k:0,p:0,c:0,f:0,fb:0,pq:0};const m=per100(f)?it.q/100:it.q;const r={k:f.k*m,p:f.p*m,c:f.c*m,f:f.f*m,fb:f.fb*m};r.pq=qualityPro(f)?r.p:0;
  if(it.ck&&COOK[it.ck]&&cookable(f)){const oil=COOK[it.ck][1]*it.q/100;r.k+=9*oil;r.f+=oil}return r}
const cookSel=(it,scope,mi,i)=>{const f=food(it.f);if(!cookable(f))return '';return `<select class="cook" data-act="cook" data-scope="${scope}" data-m="${mi}" data-i="${i}" aria-label="Cách nấu">${Object.entries(COOK).map(([k,[n,g]])=>`<option value="${k}" ${(it.ck||'')===k?'selected':''}>${n}${g?' (+'+g+' g dầu/100 g)':''}</option>`).join('')}</select>`};
const curMenu=()=>S.menus.find(m=>m.id===ui.editMenu)||S.menus[0];
const weekdayIdx=iso=>(new Date(iso+'T00:00:00').getDay()+6)%7;
const menuFor=d=>S.menus.find(m=>m.id===S.weekMenu[weekdayIdx(d)])||S.menus[0];
const dayMeals=d=>S.dayMeals[d]||menuFor(d).meals;
const ensureOverride=d=>S.dayMeals[d]||(S.dayMeals[d]=clone(menuFor(d).meals));
const scopeMeals=sc=>sc==='day'?ensureOverride(ui.checkDate):curMenu().meals;
function sumNut(items){return items.reduce((t,it)=>{const x=itemNut(it);for(const k in t)t[k]+=x[k]||0;return t},{k:0,p:0,c:0,f:0,fb:0,pq:0})}
/* protein "chặt": chỉ tính đạm động vật, sữa, đậu và món ăn sẵn (phần lớn đạm từ thịt cá) */
const PRO_EXTRA=['dau_den','dau_xanh'];
function qualityPro(f){return ['Đạm','Sữa & bổ sung','Món ăn sẵn','Tự nhập'].includes(f.cat)||PRO_EXTRA.includes(f.id)}
const strict=()=>!!S.profile.strictPro;
const PRO=t=>strict()?t.pq:t.p;
const proLabel=()=>strict()?'Protein*':'Protein';
/* khi tính protein chặt, phần protein từ cơm, khoai… vẫn có calo nên mục tiêu carb giảm tương ứng */
const carbT=t=>{const c=calc();return strict()?Math.max(0,Math.round(c.carb-(t.p-t.pq))):c.carb};
function dayNut(meals){return sumNut(meals.flatMap(m=>m.items))}
function roundQ(f,q){if(per100(f)){const st=(f.id==='yen_mach'||f.cat==='Chất béo')?5:10;return Math.max(st,Math.round(q/st)*st)}return Math.max(0.5,Math.round(q*2)/2)}
function scaleGroup(meals,pred,key,target,locked){
  let inG=0,out=0;const ok=(f,it)=>pred(f)&&!(locked&&locked.has(it));
  meals.forEach(m=>m.items.forEach(it=>{const f=food(it.f);if(!f)return;const x=itemNut(it)[key];if(ok(f,it))inG+=x;else out+=x}));
  if(inG<=0)return;
  const fac=Math.min(3,Math.max(0.3,(target-out)/inG));
  meals.forEach(m=>m.items.forEach(it=>{const f=food(it.f);if(f&&ok(f,it))it.q=roundQ(f,it.q*fac)}));
}
function balanceDay(d){const MM=ensureOverride(d);const D=getDay(d);const locked=new Set();MM.forEach((m,mi)=>m.items.forEach((it,i)=>{if(D.items[ckKey(mi,i,it)])locked.add(it)}));return solveMacros(MM,locked)}
function withChecks(d,meals,fn){const D=getDay(d);const st=new Set();meals.forEach((m,mi)=>m.items.forEach((it,i)=>{if(D.items[ckKey(mi,i,it)])st.add(it)}));fn();const N=ensureDay(d);N.items={};meals.forEach((m,mi)=>m.items.forEach((it,i)=>{if(st.has(it))N.items[ckKey(mi,i,it)]=true}))}
/* Cân macro: tìm hệ số cho 3 nhóm (đạm, tinh bột, chất béo) để protein, carb, fat cùng khớp mục tiêu.
   Bình phương sai số tính theo kcal (P×4, C×4, F×9); hệ số giới hạn 0,25–3 lần lượng hiện tại. */
const GRP={p:f=>f.cat==='Đạm'&&per100(f),c:f=>f.cat==='Tinh bột'&&per100(f),f:f=>f.cat==='Chất béo'};
function solveMacros(meals,locked){
  /* mục tiêu: protein (theo cách tính đang chọn), fat và tổng kcal; carb là phần còn lại */
  const c=calc(),T=[c.pro,c.k,c.fat],W=[16,1,81],G=['p','c','f'];
  const A=G.map(()=>[0,0,0]),fixed=[0,0,0],items={p:[],c:[],f:[]};
  meals.forEach(m=>m.items.forEach(it=>{const f=food(it.f);if(!f)return;const x=itemNut(it),v=[strict()?x.pq:x.p,x.k,x.f];
    const g=(locked&&locked.has(it))?null:G.find(k=>GRP[k](f));
    if(g){items[g].push(it);v.forEach((n,j)=>A[G.indexOf(g)][j]+=n)}else v.forEach((n,j)=>fixed[j]+=n)}));
  const x=[1,1,1],has=G.map((g,i)=>A[i].some(n=>n>0));
  for(let it=0;it<300;it++)for(let i=0;i<3;i++){if(!has[i])continue;
    let num_=0,den=0;for(let j=0;j<3;j++){let r=fixed[j]-T[j];for(let k=0;k<3;k++)if(k!==i)r+=x[k]*A[k][j];num_+=-W[j]*r*A[i][j];den+=W[j]*A[i][j]*A[i][j]}
    if(den>0)x[i]=Math.min(3,Math.max(0.25,num_/den))}
  G.forEach((g,i)=>items[g].forEach(it=>{const f=food(it.f);it.q=roundQ(f,it.q*x[i])}));
  const t=dayNut(meals);return {p:PRO(t),c:t.c,ct:carbT(t),f:t.f,k:t.k,missing:G.filter((g,i)=>!has[i])};
}
function suggestMeals(id){const meals=tplMeals(id);solveMacros(meals);return meals}
function exEst(it){const e=LIB[it.ex];const comp=e&&e.t==='C';const min=num(it.sets)*(40+(comp?150:75))/60;return{min,kcal:(comp?MET_C:MET_I)*effW()*min/60}}
const cardioKcal=(type,min)=>(CARDIO[type]||CARDIO.walk_steep)[1]*effW()*num(min)/60;
function sessionEst(day){
  let min=0,kcal=0;day.items.forEach(it=>{const x=exEst(it);min+=x.min;kcal+=x.kcal});
  if(day.items.length){min+=10;kcal+=MET_WARM*effW()*10/60}
  return{min,kcal,cardioKcal:cardioKcal(day.cardioType,day.cardio)};
}
const musLine=id=>{const m=MUS[id];if(!m)return'';return `<span class="small"><b>Chính:</b> ${esc(m[0])}${m[1]?` · <span class="muted"><b>Phụ:</b> ${esc(m[1])}</span>`:''}</span>`};
/* cơ phụ được tính 0,5 set (cách đếm của Pelland 2024) */
const SEC={};
['machine_press','incline_db','incline_machine','flat_db','bb_bench','smith_press','smith_incline','push_up','dips','landmine'].forEach(k=>SEC[k]=['Tay sau','Vai trước']);
['close_grip','bench_dip'].forEach(k=>SEC[k]=['Ngực','Vai trước']);
['lat_pd','one_arm_pd','assist_pu','pull_up'].forEach(k=>SEC[k]=['Tay trước']);
['machine_row','cable_row','cs_db_row','db_row','tbar_row','bent_row'].forEach(k=>SEC[k]=['Tay trước','Vai sau']);
['hack','leg_press','bss','goblet','back_squat','smith_squat','lunge'].forEach(k=>SEC[k]=['Mông']);
SEC.rdl=['Mông','Lưng dưới'];SEC.hip_thrust=['Đùi sau'];SEC.bb_thrust=['Đùi sau'];SEC.back_ext=['Mông'];SEC.deadlift=['Đùi trước'];
SEC.face_pull=['Thang dưới'];SEC.y_raise=['Vai giữa'];SEC.straight_pd=['Tay sau'];SEC.db_ohp=['Tay sau','Vai giữa'];SEC.machine_ohp=['Tay sau','Vai giữa'];
function muscleSets(){const m={},dir={};MUSCLES.forEach(x=>{m[x]=0;dir[x]=0});S.plan.forEach(d=>d.items.forEach(it=>{const e=LIB[it.ex];if(!e)return;const n=num(it.sets);m[e.m]+=n;dir[e.m]+=n;(SEC[it.ex]||[]).forEach(g=>{if(g in m)m[g]+=n/2})}));m._dir=dir;return m}
function flagsFor(e){const p=S.profile;return e.fl.filter(f=>(f[0]==='v'&&p.vai)||(f[0]==='t'&&p.tri))}
function flagChips(e){return flagsFor(e).map(f=>`<span class="chip ${FLAGS[f][1]}" title="${esc(FLAGS[f][2])}">${FLAGS[f][0]}</span>`).join('')}
function repRange(r){const m=String(r).match(/(\d+)\s*[–-]\s*(\d+)/);if(m)return[+m[1],+m[2]];const n=parseInt(r,10);return n?[n,n]:null}
function lastFor(ex,beforeId){for(let i=S.logs.length-1;i>=0;i--){const L=S.logs[i];if(beforeId&&L.id===beforeId)continue;const e=L.entries.find(x=>x.ex===ex);if(e)return{d:L.d,sets:e.sets}}return null}
function advise(ex,reps){const l=lastFor(ex);const rg=repRange(reps);if(!l||!rg||!l.sets.length)return null;
  if(l.sets.every(s=>s.r>=rg[1]))return['ok','Lên tạ 2,5–5%'];
  if(l.sets.some(s=>s.r<rg[0]))return['warn','Giữ tạ, chưa đủ rep tối thiểu'];
  return['','Giữ tạ, cố thêm 1 rep'];}
const setsText=sets=>sets.map(s=>`${fmt(s.kg,1)}×${s.r}`).join(', ');

/* ---------- biểu đồ ---------- */
function chart(pts,unit,label){
  if(!pts.length)return'';
  const W=600,H=200,L=48,R=56,T=18,B=30;
  const xs=pts.map(p=>Date.parse(p.x)),ys=pts.map(p=>p.y);
  let x0=Math.min(...xs),x1=Math.max(...xs);if(x0===x1){x0-=3*864e5;x1+=3*864e5}
  let y0=Math.min(...ys),y1=Math.max(...ys);const pad=Math.max((y1-y0)*0.2,0.5);y0-=pad;y1+=pad;
  const sx=x=>L+(x-x0)/(x1-x0)*(W-L-R),sy=y=>T+(1-(y-y0)/(y1-y0))*(H-T-B);
  let g='';
  [y0,(y0+y1)/2,y1].forEach(v=>{const y=sy(v);g+=`<line class="g-grid" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="g-txt" x="${L-8}" y="${y+4}" text-anchor="end">${fmt(v,1)}</text>`});
  const P=pts.map((p,i)=>[sx(xs[i]),sy(p.y)]);
  const line=P.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  if(P.length>1)g+=`<path class="g-area" d="${line} L${P[P.length-1][0].toFixed(1)} ${H-B} L${P[0][0].toFixed(1)} ${H-B} Z"/>`;
  g+=`<path class="g-line" d="${line}"/>`;
  P.forEach((q,i)=>{g+=i===P.length-1?`<circle class="g-end" cx="${q[0]}" cy="${q[1]}" r="5"/>`:`<circle class="g-dot" cx="${q[0]}" cy="${q[1]}" r="3.5"/>`});
  const lp=P[P.length-1];g+=`<text class="g-val" x="${Math.min(lp[0]+8,W-4)}" y="${lp[1]+5}" text-anchor="${lp[0]+8>W-R?'end':'start'}">${fmt(pts[pts.length-1].y,1)} ${unit}</text>`;
  g+=`<text class="g-txt" x="${L}" y="${H-8}">${dshort(pts[0].x)}</text>`;
  if(pts.length>1)g+=`<text class="g-txt" x="${W-R}" y="${H-8}" text-anchor="end">${dshort(pts[pts.length-1].x)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
}

/* ---------- giao diện: đầu trang ---------- */
function renderTop(){
  const c=calc();
  $('#topSum').innerHTML=`${esc(c.g.name)} · <b>${fmt(c.k)}</b> kcal · P <b>${c.pro}</b> · C <b>${c.carb}</b> · F <b>${c.fat}</b> g`;
  const grp=['goal','notes'].includes(ui.tab)?'more':ui.tab;document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===grp)));
}
function armBtn(key,label,cls){const a=ui.armed===key;return `<button class="btn small ${a?'armed':'danger'} ${cls||''}" data-act="arm" data-key="${esc(key)}">${a?'Bấm lần nữa để xóa':label}</button>`}

/* ---------- tab Mục tiêu ---------- */
function vGoal(){
  const p=S.profile,c=calc();
  const warns=[];
  if(p.bf>=20&&(p.goal==='tang_co'||p.goal==='tang_can'))warns.push(['warn',`Ở khoảng ${fmt(p.bf)}% mỡ, ăn dư calo sẽ tích thêm nhiều mỡ. Nên chạy Recomp hoặc Giảm mỡ tới khoảng 15–17% rồi mới chuyển sang Tăng cơ.`]);
  if(p.bf>0&&p.bf<=12&&p.goal==='giam_mo')warns.push(['warn','Mỡ đã thấp, giảm thêm dễ mất cơ. Giữ thâm hụt nhỏ, khoảng 300 kcal/ngày.']);
  if(c.k<c.bmr)warns.push(['bad','Calo mục tiêu thấp hơn mức chuyển hóa cơ bản (BMR). Tăng calo hoặc đổi mục tiêu.']);
  const mac=[['Protein',c.pro,4,'--pro',`${fmt(c.pro/effW(),1)} g/kg`],['Carb',c.carb,4,'--carb',`${fmt(c.carb/effW(),1)} g/kg`],['Fat',c.fat,9,'--fat',`${fmt(c.fat/effW(),1)} g/kg`]];
  return `
  <h2 class="sec">Mục tiêu</h2>
  ${firstRun?`<div class="note-box warn"><b>Chào bạn!</b> Đây là lần đầu mở app trên máy này. Nhập chiều cao, cân nặng, tuổi bên dưới, hoặc nếu đã có file sao lưu từ máy khác thì kéo xuống mục Sao lưu và mở file đó.</div>`:''}
  <p class="lead">Nhập chỉ số cơ thể và chọn mục tiêu. Calo, macro và gợi ý thực đơn ở tab Lịch ăn tự cập nhật theo đây.</p>
  <section class="card">
    <div class="seg" role="group" aria-label="Mục tiêu">${Object.entries(GOALS).map(([k,g])=>`<button data-act="goal" data-g="${k}" aria-pressed="${p.goal===k}">${g.name}</button>`).join('')}</div>
    <p class="small muted">${esc(c.g.name)}: ${c.g.delta>0?'+':''}${c.g.delta} kcal so với mức tiêu hao. Tốc độ kỳ vọng: ${esc(c.g.rate)}.</p>
    <div class="grid-form">
      <label class="field"><span>Chiều cao (cm)</span><input id="pf-h" type="number" inputmode="decimal" data-act="pf" data-k="h" value="${p.h}"></label>
      <label class="field"><span>Cân nặng ban đầu (kg)</span><input id="pf-w" type="number" inputmode="decimal" step="0.1" data-act="pf" data-k="w" value="${p.w}"></label>
      <label class="field"><span>Tỉ lệ mỡ (%) – để 0 nếu không biết</span><input id="pf-bf" type="number" inputmode="decimal" data-act="pf" data-k="bf" value="${p.bf}"></label>
      <label class="field"><span>Tuổi</span><input id="pf-age" type="number" inputmode="numeric" data-act="pf" data-k="age" value="${p.age}"></label>
      <label class="field"><span>Giới tính</span><select id="pf-sex" data-act="pfs" data-k="sex"><option value="m" ${p.sex==='m'?'selected':''}>Nam</option><option value="f" ${p.sex==='f'?'selected':''}>Nữ</option></select></label>
      <label class="field" style="grid-column:span 2"><span>Mức vận động</span><select id="pf-act" data-act="pfs" data-k="act">${ACTS.map(([v,t])=>`<option value="${v}" ${p.act===v?'selected':''}>${t} (×${v})</option>`).join('')}</select></label>
    </div>
    <div class="row small">
      <label class="row" style="gap:6px"><input id="pf-vai" type="checkbox" data-act="pfc" data-k="vai" ${p.vai?'checked':''}> Có vấn đề gân trước vai</label>
      <label class="row" style="gap:6px"><input id="pf-tri" type="checkbox" data-act="pfc" data-k="tri" ${p.tri?'checked':''}> Có tiền sử trĩ</label>
      <label class="row" style="gap:6px"><input id="pf-strict" type="checkbox" data-act="pfc" data-k="strictPro" ${p.strictPro?'checked':''}> Protein chặt: chỉ tính đạm động vật, sữa, đậu</label>
    </div>
    ${(()=>{const W=wInfo();return W.n?`<div class="note-box small">Cân dùng để tính: <b>${fmt(W.w,1)} kg</b>, trung bình ${W.n} lần cân từ ${dshort(W.from)} đến ${dshort(W.to)} (tab Theo dõi). Ô "Cân nặng ban đầu" chỉ dùng khi chưa có số đo.</div>`:''})()}
    <p class="small muted">Hai ô đầu bật cảnh báo cho bài tập không phù hợp. Khi bật "Protein chặt", thanh Protein* trong lịch ăn bỏ phần protein từ cơm, khoai, bún, rau, trái cây và hạt; nút cân lại sẽ tăng thịt cá cho đủ mục tiêu.</p>
  </section>
  ${warns.map(w=>`<div class="note-box ${w[0]}">${esc(w[1])}</div>`).join('')}
  <section class="card">
    <div class="stats">
      <div class="stat hl"><span class="eyebrow">Calo mục tiêu</span><span class="v">${fmt(c.k)}<small>kcal</small></span></div>
      <div class="stat"><span class="eyebrow">Tiêu hao (TDEE)</span><span class="v">${fmt(Math.round(c.tdee/10)*10)}<small>kcal</small></span></div>
      <div class="stat"><span class="eyebrow">Chuyển hóa cơ bản (BMR)</span><span class="v">${fmt(Math.round(c.bmr))}<small>kcal</small></span></div>
      ${c.lbm?`<div class="stat"><span class="eyebrow">Khối nạc</span><span class="v">${fmt(c.lbm,1)}<small>kg</small></span></div>
      <div class="stat"><span class="eyebrow">FFMI</span><span class="v">${fmt(c.ffmi,1)}</span></div>`:''}
      <div class="stat"><span class="eyebrow">Nước tối thiểu</span><span class="v">${fmt(c.water,1)}<small>L/ngày</small></span></div>
    </div>
    <div class="macro">
      ${mac.map(([n,g,kc,col,perkg])=>{const pct=g*kc/c.k*100;return `<span><b>${n}</b><br><span class="small muted">${perkg}</span></span><div class="bar"><i style="width:${Math.min(100,pct)}%;background:var(${col})"></i></div><span class="num" style="font-size:18px">${g} g <span class="small muted">${fmt(pct)}%</span></span>`}).join('')}
      <span><b>Chất xơ</b><br><span class="small muted">14 g/1.000 kcal</span></span><div class="bar"><i style="width:100%;background:var(--fib)"></i></div><span class="num" style="font-size:18px">≥ ${c.fib} g</span>
    </div>
    <p class="small muted">BMR tính theo ${c.method}${c.lbm?' (dùng khối nạc)':''}, TDEE = BMR × hệ số vận động. Đây là ước tính: con số thật phải chỉnh theo xu hướng cân và vòng eo sau 2–3 tuần (tab Theo dõi). Nước: 35 ml/kg, cộng thêm 0,5–1 L cho mỗi giờ tập ra nhiều mồ hôi.</p>
  </section>
  <section class="card">
    <h3>Sao lưu dữ liệu</h3>
    <p class="small muted">${WEB?'Bản trên máy này':'Bản trên Claude'}: dữ liệu lưu trong trình duyệt của thiết bị này, xóa dữ liệu duyệt web là mất. Tải file sao lưu mỗi tuần. Muốn chuyển dữ liệu giữa điện thoại và máy tính: tải file ở thiết bị này, rồi bấm "Mở file sao lưu" ở thiết bị kia.</p>
    <p class="small"><b>Lần tải file gần nhất:</b> ${S.lastBackup?dshow(S.lastBackup)+(daysBetween(S.lastBackup,today())>=7?' <span class="chip warn">quá 7 ngày, nên tải lại</span>':''):'<span class="chip warn">chưa có</span>'}</p>
    <div class="row">
      ${CAN_SHARE?'<button class="btn primary" data-act="sharebackup">Gửi file sao lưu (Drive, Zalo…)</button>':''}
      ${DL||WEB?`<button class="btn ${CAN_SHARE?'':'primary'}" data-act="dlbackup">Tải file sao lưu</button>`:''}
      <label class="btn" for="bk-file">Mở file sao lưu</label>
      <input id="bk-file" type="file" accept=".json,.txt,application/json,text/plain" data-act="bkfile" hidden>
    </div>
    ${ui.pendingImport?(()=>{const o=ui.pendingImport.data;return `<div class="note-box warn" style="display:flex;flex-direction:column;gap:8px"><span>File <b>${esc(ui.pendingImport.name)}</b>: ${(o.logs||[]).length} buổi tập · ${(o.body||[]).length} lần đo · ${Object.keys(o.checks||{}).length} ngày checklist${o.lastBackup?' · tải ngày '+dshow(o.lastBackup):''}.</span>
      <span class="small"><b>Gộp nhật ký:</b> thêm buổi tập, số đo, checklist trong file vào dữ liệu hiện tại; giữ nguyên mục tiêu, lịch tập, thực đơn đang có. <b>Thay toàn bộ:</b> dùng nguyên dữ liệu trong file.</span>
      <span class="row" style="gap:6px"><button class="btn small primary" data-act="impmerge">Gộp nhật ký</button><button class="btn small" data-act="importok">Thay toàn bộ</button><button class="btn small" data-act="importno">Hủy</button></span></div>`})():''}
    ${LOCAL?autoSaveBox():''}
    ${DL||WEB?'':'<p class="small muted">Chế độ xem này không tải file được. Dùng mã sao lưu dạng chữ bên dưới.</p>'}
    <div class="row">
      <button class="btn small" data-act="backup">${ui.backup?'Ẩn mã sao lưu':'Hiện mã sao lưu (dạng chữ)'}</button>
      ${armBtn('reset','Đặt lại về mặc định')}
    </div>
    ${ui.backup?`<textarea id="bk-out" readonly>${esc(JSON.stringify(S))}</textarea>
    <div class="row"><button class="btn small" data-act="copy">Sao chép</button></div>
    <label class="field"><span>Dán mã sao lưu để khôi phục</span><textarea id="bk-in" placeholder="Dán mã ở đây"></textarea></label>
    <div class="row"><button class="btn small primary" data-act="restore">Khôi phục</button></div>`:''}
  </section>`;
}

/* ---------- tab Lịch tập ---------- */
/* ---------- chu kỳ 8 tuần: cường độ, set, lên tạ ---------- */
const PHASE={1:['Làm quen',3,3,7],2:['Làm quen',3,3,7],3:['Tích lũy',2,'1–2',8],4:['Tích lũy',2,'1–2',8],5:['Tích lũy',2,'1–2',8],6:['Tích lũy',2,'1–2',8],7:['Đỉnh',1,'0–1',9],8:['Giảm tải (deload)',3,3,7]};
function curWeek(){const n=Math.floor(daysBetween(S.progStart,today())/7);return ((n%8)+8)%8+1}
const viewWeek=()=>ui.week||curWeek();
const fromWeek=it=>{const m=String(it.note||'').match(/từ tuần (\d)/i);return m?+m[1]:1};
const pctFor=n=>Math.round(100/(1+n/30)/5)*5; /* Epley đảo: %1RM ≈ 1/(1+số rep tới thất bại/30) */
function dose(it,w){const e=LIB[it.ex]||{t:'I'},C=e.t==='C',P=PHASE[w];const rg=repRange(it.reps);
  const rir=C?P[1]:P[2];const rirN=typeof rir==='number'?rir:+String(rir).split('–')[1];
  const sets=w===8?Math.max(1,Math.ceil(num(it.sets)/2)):num(it.sets);
  const rpe=w===8?'6–7':C?String(10-P[1]):(typeof rir==='number'?String(10-rir):`${10-rirN}–${10-(+String(rir).split('–')[0])}`);
  const pct=rg?(()=>{const a=pctFor(rg[1]+rirN),b=pctFor(rg[0]+rirN);return a===b?`~${a}%`:`~${a}–${b}%`})():'';
  return {sets,rir:w===8?'3–4':String(rir),rpe,pct,rest:num(it.rest)?it.rest+' giây':C?'2–3 phút':'60–90 giây',skip:w<fromWeek(it)}}
function progRule(it){const e=LIB[it.ex]||{t:'I'};const rg=repRange(it.reps);if(!rg)return 'Tăng rep trước, đủ rep rồi mới tăng tạ.';
  const top=rg[1],back=rg[0]<rg[1]?`quay về ${rg[0]} rep`:`làm lại từ khoảng ${Math.max(1,rg[0]-3)} rep rồi tăng dần`;
  return e.t==='C'?`Mọi set đạt ${top} rep ở RIR mục tiêu → buổi sau tăng 2,5–5% tạ (tạ đơn +2–2,5 kg mỗi tay, máy +5 kg), ${back}.`
    :`Mọi set đạt ${top} rep → tăng nấc tạ nhỏ nhất (tạ đơn +1–2 kg, máy/cáp +1 nấc), ${back}. Chưa tăng được tạ thì thêm 1 rep mỗi buổi.`}
function vWeekCard(){const w=viewWeek(),cw=curWeek(),P=PHASE[w];
  return `<section class="card">
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div><span class="eyebrow">Chu kỳ 8 tuần · đang xem</span><div class="num" style="font-size:28px;line-height:1.1">Tuần ${w} <span class="small muted" style="font-family:var(--body);font-weight:500">· ${P[0]}${w===cw?' · tuần hiện tại':''}</span></div></div>
      <div class="row" style="gap:6px"><button class="icon-btn" data-act="wk" data-delta="-1" aria-label="Tuần trước">‹</button><button class="icon-btn" data-act="wk" data-delta="1" aria-label="Tuần sau">›</button>${w!==cw?'<button class="btn small" data-act="wknow">Về tuần hiện tại</button>':''}</div>
    </div>
    <div class="scroll"><table class="tbl wk-tbl"><thead><tr><th>Tuần</th><th>Giai đoạn</th><th>Bài compound</th><th>Bài cô lập</th><th>Số set</th></tr></thead><tbody>
      ${[[1,2],[3,6],[7,7],[8,8]].map(([a,b])=>{const Q=PHASE[a];const on=w>=a&&w<=b;return `<tr class="${on?'cur':''}"><td>${a===b?a:a+'–'+b}</td><td>${Q[0]}</td><td>${a===8?'RIR 3–4':'RIR '+Q[1]+' (RPE '+(10-Q[1])+')'}</td><td>${a===8?'RIR 3–4':'RIR '+Q[2]}</td><td>${a===8?'Giảm ½, giữ tạ':'Như lịch'}</td></tr>`}).join('')}
    </tbody></table></div>
    <div class="row small"><label class="row" style="gap:6px">Tôi đang ở tuần <select id="wk-set" data-act="wkset" style="width:auto">${[1,2,3,4,5,6,7,8].map(n=>`<option ${n===cw?'selected':''}>${n}</option>`).join('')}</select></label><span class="muted">Hết tuần 8 thì quay lại tuần 1 với mức tạ mới.</span></div>
  </section>
  <section class="card">
    <details><summary>Thuật ngữ: % sức, RIR, RPE, lên tạ</summary>
      <div class="prose" style="margin-top:10px">
        <ul>
          <li><b>Set × rep:</b> 3 × 8–12 nghĩa là 3 hiệp, mỗi hiệp 8–12 lần.</li>
          <li><b>RIR (Reps In Reserve, số rep còn dư):</b> dừng set khi còn làm được thêm bao nhiêu rep đúng kỹ thuật. RIR 2 = cố thêm được 2 rep nữa. Đây là cách đo "% sức" chính trong trang này.</li>
          <li><b>RPE (Rate of Perceived Exertion, mức gắng sức 1–10):</b> RPE = 10 − RIR. RPE 8 ≈ còn 2 rep, RPE 10 = hết sức (failure).</li>
          <li><b>1RM (one-rep max):</b> mức tạ nặng nhất làm được đúng 1 rep. <b>%1RM</b> là tạ tính theo phần trăm 1RM. Trang ước tính %1RM từ số rep + RIR bằng công thức Epley; chỉ để tham khảo, sai số lớn ở trên 10 rep. Không cần thử 1RM thật (không hợp với vai và trĩ).</li>
          <li><b>Failure (thất bại cơ):</b> không làm thêm được rep nào đúng kỹ thuật. Bài compound không tập tới failure; bài cô lập chỉ tới RIR 0 ở tuần 7.</li>
          <li><b>Double progression (tăng tạ kép):</b> giữ tạ, tăng rep tới mức trên của khoảng ở mọi set, rồi mới tăng tạ và quay về mức rep dưới.</li>
          <li><b>Deload (tuần giảm tải):</b> giữ mức tạ, giảm một nửa số set để cơ, khớp, thần kinh hồi phục.</li>
          <li><b>Set khởi động (warm-up):</b> trước bài compound đầu buổi, làm 2 set nhẹ: ~50% tạ làm việc × 10 rep, ~70% × 5 rep. Không tính vào số set.</li>
          <li><b>Tempo (nhịp động tác):</b> hạ tạ 2–3 giây có kiểm soát, đẩy/kéo dứt khoát, thở ra khi đẩy.</li>
          <li><b>Volume (khối lượng):</b> số set khó mỗi tuần cho từng nhóm cơ (bảng bên dưới).</li>
        </ul>
        <p class="small muted">Nguồn: thang RPE theo RIR của Zourdos 2016; công thức Epley (1985) cho ước tính 1RM. Mức RIR từng tuần là cách chia của kế hoạch này, không phải chuẩn bắt buộc.</p>
      </div>
    </details>
  </section>`}

function activation(id){const a=exAct(id);const P=Object.keys(a).filter(k=>a[k]>=2),Q=Object.keys(a).filter(k=>a[k]===1);const out=[];
  const pt=Q.length?65:100;P.forEach(k=>out.push([k,Math.round(pt/P.length),1]));Q.forEach(k=>out.push([k,Math.round(35/Q.length),0]));return out}
const howOf=id=>HOW_EX[id]||HOW[EX_MP[id]||'press'];
const viName=id=>(EXI[id]||[])[0]||((LIB[id]||{}).n||id);
/* ảnh minh hoạ hai tư thế (free-exercise-db, phạm vi công cộng); tư thế 2 hiện chồng lên, bật tắt theo nhịp như hình động */
const anhSrc=(id,k)=>ANH[id]?`anh/${ANH[id]}-${k}.webp`:'';
function anhDong(id,cls,paused){if(!ANH[id])return '';return `<div class="anh-dong ${cls||''} ${paused?'paused':''}" role="img" aria-label="Ảnh minh hoạ ${esc(viName(id))}"><img src="${anhSrc(id,0)}" alt="" decoding="async"><img class="b" src="${anhSrc(id,1)}" alt="" decoding="async"></div>`}
function exHistory(id){return S.logs.filter(L=>L.entries.some(e=>e.ex===id)).map(L=>{const e=L.entries.find(x=>x.ex===id);return{d:L.d,name:L.name,sets:e.sets,
  max:Math.max(...e.sets.map(x=>x.kg)),vol:e.sets.reduce((a,x)=>a+x.kg*x.r,0),e1:Math.max(...e.sets.map(x=>x.kg*(1+x.r/30)))}})}
function setsSummary(sets){const r=sets.map(x=>x.r),k=sets.map(x=>x.kg);if(r.every(x=>x===r[0])&&k.every(x=>x===k[0]))return `${sets.length} hiệp × ${r[0]} rep · ${fmt(k[0],1)} kg`;return setsText(sets)}
function howHTML(id){const e=LIB[id];if(!e)return '';const H=howOf(id),X=EXI[id]||[e.n,2,0,''],fav=(S.favs||[]).includes(id);
  const q=encodeURIComponent(e.n.replace(/\(.*?\)/g,'').trim()+' proper form');const hist=exHistory(id);const tab=ui.howTab||'max';
  const lv=X[1],bars=[1,2,3,4,5].map(n=>`<i class="${n<=lv?'on':''}"></i>`).join('');
  const fl=flagsFor(e).map(f=>`<div class="note-box ${FLAGS[f][1]} small"><b>${FLAGS[f][0]}:</b> ${esc(FLAGS[f][2])}</div>`).join('');
  const act=activation(id);
  const alts=Object.values(LIB).filter(x=>x.m===e.m&&x.id!==id).map(x=>({x,d:((EXI[x.id]||[])[1]||2)-lv})).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d)).slice(0,8);
  const series=hist.map(h=>({x:h.d,y:tab==='max'?h.max:tab==='vol'?h.vol:h.e1}));
  return `<div class="hd-top"><button class="icon-btn" data-act="howback" aria-label="Quay lại">←</button><h2>${esc(viName(id))}</h2><button class="icon-btn ${fav?'fav':''}" data-act="howfav" data-ex="${id}" aria-label="${fav?'Bỏ yêu thích':'Yêu thích'}" aria-pressed="${fav}">${fav?'★':'☆'}</button></div>
  <div class="hd-body">
    <section class="hd-hero">${ANH[id]?anhDong(id,'',ui.howPaused)+'<span class="small muted">Ảnh: free-exercise-db (phạm vi công cộng)</span>':''}${bodyMap(exAct(id),{pulse:!ui.howPaused,label:'Nhóm cơ của '+e.n,cls:ANH[id]?'sm':''})}
      <div class="row" style="justify-content:space-between"><span class="small muted">${bmLegend()}</span><button class="btn small" data-act="howpause">${ui.howPaused?'▶ Chạy':'❚❚ Dừng'}</button></div></section>
    <div class="hd-chips"><button class="chip-b" data-act="howwhy">Cấp ${lv} <span class="lv" aria-hidden="true">${bars}</span> · <u>vì sao?</u></button><span class="chip-b">${X[2]?'⇥ Một bên':'⇄ Hai bên'}</span><span class="chip-b">${id==='plank'?'Thời gian':'Reps và cân nặng'}</span></div>
    ${ui.howWhy?`<div class="note-box small">Cấp ${lv}/5: ${esc(LV_WHY[lv])}</div>`:''}
    <p class="small muted">Còn gọi là: ${esc(e.n)}</p>
    ${fl}
    <section class="hd-sec"><h3>✎ Ghi chú bài tập</h3><textarea id="exnote-${id}" class="hd-note" data-act="exnote" data-ex="${id}" placeholder="Viết ghi chú và mẹo của bạn, ví dụ: ghế số 4, chốt máy lỗ 6">${esc((S.exNotes||{})[id]||'')}</textarea></section>
    <section class="hd-sec"><div class="seg">${[['max','Mức tạ tối đa'],['vol','Khối lượng tập'],['e1','Sức mạnh (1RM)']].map(([k,n])=>`<button data-act="howtab" data-t="${k}" aria-pressed="${tab===k}">${n}</button>`).join('')}</div>
      <p class="small muted">${tab==='max'?'Mức tạ nặng nhất trong mọi hiệp':tab==='vol'?'Tổng kg × rep mỗi buổi':'1RM ước tính theo Epley từ hiệp tốt nhất'}</p>
      ${hist.length>=2?chart(series,'kg',tab):`<div class="hd-lock">🔒 Báo cáo sức mạnh mở sau 2 buổi (đã có ${hist.length})</div>`}</section>
    ${H.tip?`<section class="hd-tip"><span class="eyebrow" style="color:var(--accent)">✦ Mẹo HLV</span><p>${esc(H.tip)}</p><div class="hd-cues">${H.cues.map(c=>`<span>✦ ${esc(c)}</span>`).join('')}</div><span class="small muted">Lời nhắc ngắn hiện trên màn hình khi bạn tập.</span></section>`:''}
    ${H.m.length?`<section class="hd-sec"><h3>! Lỗi thường gặp</h3><div class="hd-err">${H.m.map(([a,b])=>`<div><span class="x">✕</span><div><b>${esc(a)}</b><br><span class="fix">Sửa:</span> ${esc(b)}</div></div>`).join('')}</div></section>`:''}
    <section class="hd-sec"><h3>Cách thực hiện</h3>${H.s?`<p><span class="eyebrow">Chuẩn bị</span><br>${esc(H.s)}</p>`:''}<ol>${H.st.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>${H.b?`<p><span class="eyebrow">Thở</span><br>${esc(H.b)}</p>`:''}
      ${H.src==='og'?'<p class="small muted">Các bước dịch từ dữ liệu ExerciseDB (giấy phép MIT). Bài này chưa có mẹo và lỗi thường gặp riêng.</p>':''}
      <a class="btn" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">Xem video trên YouTube ↗</a></section>
    <section class="hd-sec"><h3>Buổi tập có bài này</h3>${hist.length?hist.slice().reverse().slice(0,6).map(h=>`<div class="hd-hist"><div><b>${dshow(h.d)}</b><br><span class="small muted">${esc(setsSummary(h.sets))}</span></div><span class="small">${esc(h.name)}</span></div>`).join(''):'<p class="small muted">Chưa có buổi nào. Ghi buổi tập ở tab Hôm nay để xem lịch sử ở đây.</p>'}</section>
    <section class="hd-sec"><h3>Chi tiết</h3><div class="hd-detail"><div class="hd-mini">${bodyMap(exAct(id),{cls:'sm'})}</div><div class="hd-act"><span class="muted">Nhóm cơ hoạt động</span>
      ${act.map(([k,pc,pri])=>`<div><div class="row" style="justify-content:space-between"><span>${esc(MNAME[k])}</span>${pri?'<span class="chip ok">Mục tiêu</span>':''}</div><div class="row" style="flex-wrap:nowrap;gap:8px"><div class="bar" style="flex:1"><i style="width:${pc}%;background:${pri?'var(--accent)':'var(--muted)'}"></i></div><b class="num">${pc}%</b></div></div>`).join('')}
      <span class="small muted">Tỉ lệ ước lượng theo cơ chính/phụ, chưa kiểm chứng bằng đo điện cơ (EMG).</span></div></div>
      <span class="eyebrow">Dụng cụ</span><div class="hd-eq">${(X[3]||'').split(' ').filter(Boolean).map(k=>`<span>${esc(EQN[k]||k)}</span>`).join('')}</div>
      <span class="eyebrow">Loại bài tập</span><p>${e.t==='C'?'Sức mạnh, nhiều khớp (compound)':'Cô lập (isolation)'}</p></section>
    <section class="hd-sec"><h3>Bài thay thế và biến thể</h3><div class="hd-alts">${alts.map(({x,d})=>`<button class="hd-alt" data-act="howgo" data-ex="${x.id}"><b>${esc(viName(x.id))}</b><span class="small muted">${esc(x.m)}</span>${bodyMap(exAct(x.id),{cls:'sm'})}<span class="chip ${d<0?'ok':d>0?'warn':''}">${d<0?'Dễ hơn':d>0?'Khó hơn':'Tương đương'}</span>${flagsFor(x).some(f=>f[1]==='!')?'<span class="chip bad">Nên tránh</span>':''}</button>`).join('')}</div></section>
  </div>`}
function openHow(id,push){ovOpened();const el=$('#how');if(push&&ui.how)(ui.howStack=ui.howStack||[]).push(ui.how);else if(!push)ui.howStack=[];ui.how=id;el.hidden=false;el.innerHTML=`<div class="hd" role="dialog" aria-modal="true" aria-label="Chi tiết bài ${esc(viName(id))}">${howHTML(id)}</div>`;if(push)el.scrollTop=0}
function closeHow(){const el=$('#how');ui.how=null;ui.howStack=[];el.hidden=true;el.innerHTML=''}
function howBack(){const st=ui.howStack||[];if(st.length){const id=st.pop();ui.how=id;$('#how').innerHTML=`<div class="hd" role="dialog" aria-modal="true">${howHTML(id)}</div>`}else closeHow()}
function howRerender(){if(ui.how){const sc=$('#how').scrollTop;$('#how').innerHTML=`<div class="hd" role="dialog" aria-modal="true">${howHTML(ui.how)}</div>`;$('#how').scrollTop=sc}}
/* ---------- bản đồ cơ: hình cơ thể MuscleMap (Melih Colpan, MIT) trong du-lieu-co-the.js ---------- */
/* mỗi vùng cơ của app (MNAME) ứng với một hay nhiều nhóm của MuscleMap, theo từng mặt (f trước, b sau) */
const MM_MAP={f:{chest_upper:['upperChest'],chest:['lowerChest'],delt_front:['frontDeltoid'],delt_side:['deltoids'],biceps:['biceps'],forearm:['forearm'],abs:['abs'],
  obliques:['obliques'],hipflex:['hipFlexors'],quads:['quadriceps'],adductors:['adductors'],calves:['calves'],shin:['tibialis'],traps:['trapezius','upperTrapezius'],triceps:['triceps']},
 b:{delt_side:['deltoids'],delt_rear:['rearDeltoid'],forearm:['forearm'],traps:['upperTrapezius'],midback:['trapezius','lowerTrapezius','rhomboids'],rotator:['rotatorCuff'],
  lats:['upperBack'],triceps:['triceps'],erectors:['lowerBack'],glute_med:['gluteal'],glutes:['gluteal'],hams:['hamstring'],calves:['calves'],adductors:['adductors']}};
const MM_SKIN=['head','hair','neck','hands','feet','knees','ankles']; /* không phải cơ: tô màu thân */
const MM_TOP=['upperChest','lowerChest','frontDeltoid','hipFlexors','adductors','upperTrapezius','lowerTrapezius','rhomboids','rearDeltoid','rotatorCuff']; /* nhóm con, vẽ chồng lên nhóm lớn */
const MM_SKIP=['upperAbs','lowerAbs','innerQuad','outerQuad']; /* nhóm con app không dùng */
const MNAME={delt_front:'Vai trước',delt_side:'Vai giữa',delt_rear:'Vai sau',chest_upper:'Ngực trên',chest:'Ngực giữa/dưới',biceps:'Tay trước',forearm:'Cẳng tay',
 abs:'Cơ thẳng bụng',obliques:'Cơ chéo bụng',hipflex:'Cơ gập hông',quads:'Đùi trước',adductors:'Đùi trong',calves:'Bắp chân',shin:'Cẳng chân trước',traps:'Cơ thang trên',
 rotator:'Chóp xoay',midback:'Lưng giữa',lats:'Xô',triceps:'Tay sau',erectors:'Lưng dưới',glute_med:'Mông nhỡ',glutes:'Mông',hams:'Đùi sau'};
/* từ khóa trong mô tả cơ (MUS) → vùng trên hình; thứ tự từ cụ thể tới chung */
const MKEY=[['ngực trên','chest_upper'],['ngực dưới','chest'],['ngực giữa','chest'],['ngực','chest'],['vai trước','delt_front'],['vai giữa','delt_side'],['vai sau','delt_rear'],
 ['cánh tay quay','forearm'],['cẳng tay','forearm'],['cơ cánh tay','biceps'],['tay trước','biceps'],['tay sau','triceps'],['đầu dài tay sau','triceps'],
 ['cơ tròn lớn','lats'],['xô','lats'],['lưng giữa','midback'],['thang giữa','midback'],['thang dưới','midback'],['thang trên','traps'],['cơ thang','traps'],
 ['chóp xoay','rotator'],['dưới gai','rotator'],['tròn bé','rotator'],['dựng sống','erectors'],['đùi trước','quads'],['thẳng đùi','quads'],['đùi sau','hams'],
 ['mông nhỡ','glute_med'],['mông bé','glute_med'],['mông','glutes'],['khép đùi','adductors'],['bụng chân','calves'],['bắp chân','calves'],['cơ dép','calves'],
 ['thẳng bụng','abs'],['ngang bụng','abs'],['chéo bụng','obliques'],['bụng','abs'],['gập hông','hipflex'],['vai','delt_side']];
function partsOf(txt){const out=[];String(txt||'').toLowerCase().split(/[,·(]/).forEach(seg=>{const t=seg.trim();if(!t)return;const hit=MKEY.find(([k])=>t.includes(k));if(hit&&!out.includes(hit[1]))out.push(hit[1])});return out}
function exAct(id){const m=MUS[id]||['',''];const a={};partsOf(m[1]).forEach(p=>a[p]=1);partsOf(m[0]).forEach(p=>a[p]=2);return a}
/* act: {vùng: mức}; mức 2 = chính, 1 = phụ; với bản đồ tuần: mức 1–4 theo số set */
/* tên hiện khi giữ ngón tay lên một nhóm cơ trên hình */
const MM_TITLE={};['f','b'].forEach(v=>Object.entries(MM_MAP[v]).forEach(([k,ss])=>ss.forEach(s=>{if(!MM_TITLE[s])MM_TITLE[s]=MNAME[k]})));
const mmG=()=>S.profile.sex==='f'?'f':'m'; /* dáng nữ khi hồ sơ chọn Nữ */
/* hình gốc: vẽ một lần vào <defs>, mỗi bản đồ chỉ trỏ tới (<use>) thay vì chép lại các đường vẽ dài */
const MM_SVG=(function(){let d='';Object.entries(CO_THE).forEach(([g,G])=>['f','b'].forEach(v=>Object.entries(G[v+'p']).forEach(([s,ps])=>{
    d+=`<g id="mm-${g}${v}-${s}">${ps.map(x=>`<path d="${x}"/>`).join('')}</g>`})));
  const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('aria-hidden','true');el.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  el.innerHTML='<defs>'+d+'</defs><g id="mm-do"></g>';document.body.prepend(el);return el})();
/* khung bao (bbox) của một nhóm: đo bằng một <use> tạm (phần trong <defs> không được vẽ nên không đo trực tiếp được) */
const mmBoxC={};
function mmBox(g,v,s){const k=g+v+s;if(k in mmBoxC)return mmBoxC[k];const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href',`#mm-${g}${v}-${s}`);
  const host=MM_SVG.querySelector('#mm-do');host.appendChild(u);let b=null;try{const r=u.getBBox();if(r.width)b={x:r.x,y:r.y,w:r.width,h:r.height}}catch(_){}u.remove();return mmBoxC[k]=b}
function bodyMap(act,opt){opt=opt||{};const heat=opt.heat,pulse=opt.pulse&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fill=l=>heat?['','var(--h1)','var(--h2)','var(--h3)','var(--h4)'][l]:l>=2?'var(--m2)':'var(--m1)';
  const g=mmG(),G=CO_THE[g];
  const fig=v=>{const lv={};Object.entries(MM_MAP[v]).forEach(([k,ss])=>{const l=act[k]||0;if(l)ss.forEach(s=>{lv[s]=Math.max(lv[s]||0,l)})});
    if(v==='b'&&!lv.rotatorCuff&&lv.upperBack)lv.rotatorCuff=lv.upperBack; /* như MuscleMap: chóp xoay theo màu xô khi không tô riêng */
    const ss=Object.keys(G[v+'p']).filter(s=>!MM_SKIP.includes(s)&&(s!=='rhomboids'||lv[s])); /* cơ trám chỉ vẽ khi được tô */
    const order=ss.filter(s=>!MM_TOP.includes(s)).concat(ss.filter(s=>MM_TOP.includes(s)));
    const V=G[v];
    return order.map(s=>{if(MM_SKIN.includes(s))return `<use href="#mm-${g}${v}-${s}" class="bm-s"/>`;const l=lv[s]||0;
      const an=pulse&&l>=2&&!heat?'<animate attributeName="opacity" values="1;0.5;1" dur="3.2s" repeatCount="indefinite"/>':'';
      return `<use href="#mm-${g}${v}-${s}" class="bm-m ${l?'on':''}"${l?` style="fill:${fill(l)}"`:''}>${MM_TITLE[s]?`<title>${esc(MM_TITLE[s])}</title>`:''}${an}</use>`}).join('')
      +`<text x="${V.x+V.w/2}" y="${G.y+G.h+70}" text-anchor="middle" class="bm-t">${v==='f'?'MẶT TRƯỚC':'MẶT SAU'}</text>`};
  const vb=opt.vb||`0 ${G.y} ${G.b.x+G.b.w} ${G.h+100}`;
  return `<svg class="bm mm ${opt.cls||''}" viewBox="${vb}" role="img" aria-label="${esc(opt.label||'Bản đồ nhóm cơ')}">${opt.only!=='b'?fig('f'):''}${opt.only!=='f'?fig('b'):''}</svg>`}
function weekAct(){const v={};S.plan.forEach(d=>d.items.forEach(it=>{const m=MUS[it.ex]||['',''],n=num(it.sets);partsOf(m[0]).forEach(p=>v[p]=(v[p]||0)+n);partsOf(m[1]).forEach(p=>{if(!partsOf(m[0]).includes(p))v[p]=(v[p]||0)+n/2})}));
  const a={};Object.entries(v).forEach(([k,x])=>{a[k]=x<=0?0:x<6?1:x<10?2:x<=16?3:4});return{a,v}}
function bmLegend(heat){return heat?`<div class="bm-leg small"><span><i style="background:var(--h1)"></i>1–5</span><span><i style="background:var(--h2)"></i>6–9</span><span><i style="background:var(--h3)"></i>10–16</span><span><i style="background:var(--h4)"></i>&gt;16 set/tuần</span></div>`
  :`<div class="bm-leg small"><span><i style="background:var(--m2)"></i>Cơ chính</span><span><i style="background:var(--m1)"></i>Cơ phụ</span></div>`}
/* ---------- giao diện buổi tập: ô nhóm cơ (phục hồi + tỉ trọng), ghi chú buổi, danh sách bài ---------- */
/* ô cắt nhỏ của từng vùng: mặt nào của hình; khung vuông lấy tâm theo khung bao thật của vùng trên hình MuscleMap */
const REG_C={chest_upper:'f',chest:'f',delt_front:'f',delt_side:'f',biceps:'f',forearm:'f',abs:'f',obliques:'f',hipflex:'f',quads:'f',adductors:'f',shin:'f',
 calves:'b',traps:'b',delt_rear:'b',midback:'b',rotator:'b',lats:'b',triceps:'b',erectors:'b',glute_med:'b',glutes:'b',hams:'b'};
const cropC={};
function cropVB(r){const g=mmG(),v=REG_C[r]||'f',k=g+r;if(cropC[k])return cropC[k];const G=CO_THE[g],V=G[v];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  (MM_MAP[v][r]||[]).forEach(s=>{const b=mmBox(g,v,s);if(b){x0=Math.min(x0,b.x);x1=Math.max(x1,b.x+b.w);y0=Math.min(y0,b.y);y1=Math.max(y1,b.y+b.h)}});
  const ok=y1>y0,cx=ok?(x0+x1)/2:V.x+V.w/2,cy=ok?(y0+y1)/2:G.y+G.h/2;
  const z=Math.min(V.w,Math.max(V.w*0.6,ok?Math.max(x1-x0,y1-y0)*1.2:V.w)); /* vùng nhỏ phóng to, vùng rộng (hai tay) lùi ra cho vừa */
  return cropC[k]=`${cx-z/2} ${cy-z/2} ${z} ${z}`}
const REG_GROUP={chest_upper:'chest',delt_side:'delt_front'}; /* gộp vùng nhỏ khi hiển thị ô */
const REG_LABEL={chest:'Ngực',delt_front:'Vai',delt_rear:'Vai sau',biceps:'Tay trước',triceps:'Tay sau',forearm:'Cẳng tay',abs:'Bụng',obliques:'Cơ chéo',hipflex:'Gập hông',quads:'Đùi trước',
 adductors:'Đùi trong',calves:'Bắp chân',traps:'Cầu vai',midback:'Lưng giữa',rotator:'Chóp xoay',lats:'Xô',erectors:'Lưng dưới',glute_med:'Mông nhỡ',glutes:'Mông',hams:'Đùi sau'};
const regKey=r=>REG_GROUP[r]||r;
function exLoad(ex,sets){const m=MUS[ex]||['',''],o={};const P=partsOf(m[0]);P.forEach(p=>{const k=regKey(p);o[k]=Math.max(o[k]||0,sets)});partsOf(m[1]).forEach(p=>{const k=regKey(p);if(!P.map(regKey).includes(k))o[k]=Math.max(o[k]||0,sets/2)});return o}
/* phục hồi: mỗi vùng cần 24 h + 6 h cho mỗi set quy đổi (tối đa 72 h) kể từ buổi tập; mô hình ước lượng */
function recovery(){return memo.rec||(memo.rec=recoveryNow())}
function recoveryNow(){const now=Date.now(),R={};S.logs.forEach(L=>{const t=L.id>1e12?L.id:Date.parse(L.d+'T18:00:00');const h=(now-t)/36e5;if(h<0||h>96)return;
  const load={};L.entries.forEach(e=>{Object.entries(exLoad(e.ex,e.sets.length)).forEach(([k,v])=>load[k]=(load[k]||0)+v)});
  Object.entries(load).forEach(([k,v])=>{const need=Math.min(72,24+6*v);const pc=Math.min(100,Math.round(h/need*100));R[k]=Math.min(R[k]??100,pc)})});return R}
function sessShare(day){const tot={};let sum=0;day.items.forEach(it=>Object.entries(exLoad(it.ex,num(it.sets))).forEach(([k,v])=>{tot[k]=(tot[k]||0)+v;sum+=v}));
  return Object.entries(tot).map(([k,v])=>[k,Math.round(v/sum*100)]).sort((a,b)=>b[1]-a[1])}
function regThumb(r,cls){const a={};a[r]=2;if(r==='chest')a.chest_upper=2;if(r==='delt_front')a.delt_side=2;return bodyMap(a,{cls:'tile '+(cls||''),vb:cropVB(r),only:REG_C[r]||'f'})}
function sessTiles(day){const sh=sessShare(day),R=recovery();if(!sh.length)return '';
  return `<div class="tiles">${sh.map(([k,pc])=>{const rc=R[k]??100;return `<div class="tile-c"><span class="tl">${esc(REG_LABEL[k]||MNAME[k]||k)}</span>${regThumb(k)}<span class="small muted">Phục hồi</span><b class="num rc ${rc<60?'lo':rc<100?'mid':''}">${rc}%</b><span class="tsh" title="Tỉ trọng trong buổi">${pc}%</span></div>`}).join('')}</div>`}
function vSession(di){const d=S.plan[di],e=sessionEst(d),w=viewWeek(),isToday=di===weekdayIdx(today());const R=recovery();
  const low=sessShare(d).filter(([k])=>(R[k]??100)<60).map(([k])=>REG_LABEL[k]||k);
  return `<div class="pday">${DAY_LABELS.map((l,i)=>`<button data-act="pday" data-d="${i}" aria-pressed="${i===di}"><span>${l.replace('Thứ ','T').replace('Chủ nhật','CN')}</span><small>${esc(S.plan[i].items.length?S.plan[i].name:'Nghỉ')}</small></button>`).join('')}</div>
  <section class="card">
    <div class="day-title"><span class="eyebrow">${DAY_LABELS[di]}${isToday?' · hôm nay':''} · tuần ${w}</span><input id="dn-${di}" data-act="dayname" data-d="${di}" value="${esc(d.name)}" aria-label="Tên buổi ${DAY_LABELS[di]}"></div>
    ${d.items.length?`<p class="small muted">${d.items.length} bài · ${d.items.reduce((a,it)=>a+dose(it,w).sets*(dose(it,w).skip?0:1),0)} hiệp · ~${fmt(Math.round(e.min/5)*5)} phút · ~${fmt(Math.round(e.kcal/10)*10)} kcal</p>
    <div class="row" style="justify-content:space-between"><h3>Nhóm cơ hoạt động</h3><span class="small muted">Phục hồi · tỉ trọng buổi</span></div>
    ${sessTiles(d)}
    <p class="small muted">Số đỏ/cam: % phục hồi ước tính từ nhật ký (mỗi nhóm cần ~24 giờ + 6 giờ cho mỗi hiệp đã tập, tối đa 72 giờ; mô hình tự đặt, chưa kiểm chứng được). Số hồng: tỉ trọng nhóm cơ trong buổi (cơ phụ tính nửa hiệp).</p>
    ${low.length?`<div class="note-box warn small">${esc(low.join(', '))} chưa hồi phục đủ (dưới 60%). Cân nhắc giảm 1 set mỗi bài cho nhóm này hoặc đổi buổi.</div>`:''}`:'<p class="muted">Ngày nghỉ tạ.</p>'}
  </section>
  <section class="card"><h3>✎ Ghi chú buổi tập</h3><textarea id="dnote-${di}" class="hd-note" data-act="daynote" data-d="${di}" placeholder="Viết ghi chú và mẹo của bạn">${esc((S.dayNotes||{})[di]||'')}</textarea></section>
  <section class="card">
    <div class="row" style="justify-content:space-between"><h3>Bài tập</h3><button class="btn primary small" data-act="addex" data-d="${di}">⊕ Thêm bài tập</button></div>
    <div class="sx-list">${d.items.map((it,i)=>{const ex=LIB[it.ex]||{n:it.ex,m:'',t:'I',fl:[]};const X=EXI[it.ex]||[ex.n,2];const D=dose(it,w);const main=Object.entries(exAct(it.ex)).filter(([,l])=>l>=2).map(([k])=>regKey(k))[0]||'chest';
      const key=di+'-'+i,rest=num(it.rest)||(ex.t==='C'?150:75);
      return `<div class="sx ${D.skip?'skip':''}">
        <span class="sx-h" aria-hidden="true">⋮⋮</span>
        <button class="sx-img" data-act="how" data-ex="${it.ex}" aria-label="Chi tiết ${esc(viName(it.ex))}">${regThumb(main)}</button>
        <div class="sx-mid">
          <span class="sx-lv" aria-label="Cấp ${X[1]}">${[1,2,3,4,5].map(n=>`<i class="${n<=X[1]?'on':''}"></i>`).join('')}</span>
          <div class="sx-name"><button class="sx-nm" data-act="how" data-ex="${it.ex}">${esc(viName(it.ex))}</button><button class="sx-sw" data-act="swap" data-d="${di}" data-i="${i}" aria-label="Đổi bài">⇄</button></div>
          <button class="sx-dose" data-act="sxedit" data-key="${key}">${D.skip?`Bỏ qua tới tuần ${fromWeek(it)}`:`${D.sets} hiệp × ${esc(it.reps)} rep; ${rest} giây nghỉ · RIR ${D.rir}`} <span aria-hidden="true">✎</span></button>
          ${flagsFor(ex).length?`<span class="ex-tags">${flagChips(ex)}</span>`:''}
        </div>
        <div class="sx-r"><span class="small">${esc(REG_LABEL[main]||'')}</span><button class="icon-btn" data-act="sxmenu" data-key="${key}" aria-label="Tùy chọn">⋮</button></div>
        ${ui.sxEdit===key?`<div class="sx-edit">
          <label class="field"><span>Hiệp</span><input id="s-${di}-${i}" type="number" inputmode="numeric" min="1" data-act="sets" data-d="${di}" data-i="${i}" value="${it.sets}"></label>
          <label class="field"><span>Rep</span><input id="r-${di}-${i}" data-act="reps" data-d="${di}" data-i="${i}" value="${esc(it.reps)}" placeholder="8–12"></label>
          <label class="field"><span>Nghỉ (giây)</span><input id="rs-${di}-${i}" type="number" inputmode="numeric" min="0" step="15" data-act="rest" data-d="${di}" data-i="${i}" value="${rest}"></label>
          <label class="field" style="grid-column:1/-1"><span>Ghi chú trong lịch</span><input id="n-${di}-${i}" data-act="note" data-d="${di}" data-i="${i}" value="${esc(it.note)}"></label>
          <p class="small muted" style="grid-column:1/-1">Lên tạ: ${w===8?'tuần deload, giữ nguyên tạ.':progRule(it)}</p></div>`:''}
        ${ui.sxMenu===key?`<div class="sx-menu"><button class="btn small" data-act="how" data-ex="${it.ex}">Chi tiết</button><button class="btn small" data-act="up" data-d="${di}" data-i="${i}">↑ Lên</button><button class="btn small" data-act="down" data-d="${di}" data-i="${i}">↓ Xuống</button><button class="btn small" data-act="swap" data-d="${di}" data-i="${i}">⇄ Đổi bài</button><button class="btn small danger" data-act="delex" data-d="${di}" data-i="${i}">Xóa</button></div>`:''}
      </div>`}).join('')||'<p class="muted">Chưa có bài. Bấm "Thêm bài tập".</p>'}</div>
  </section>
  <section class="card"><div class="cardio-row">
      <span class="eyebrow">Cardio</span>
      <select id="ct-${di}" data-act="cardiotype" data-d="${di}" aria-label="Loại cardio">${Object.entries(CARDIO).map(([k,[n]])=>`<option value="${k}" ${d.cardioType===k?'selected':''}>${esc(n)}</option>`).join('')}</select>
      <label class="inline-num"><input id="c-${di}" type="number" inputmode="numeric" min="0" data-act="cardio" data-d="${di}" value="${num(d.cardio)}" aria-label="Số phút cardio"> phút</label>
      <span class="num" style="font-size:17px">~${fmt(Math.round(e.cardioKcal/5)*5)} kcal</span></div></section>
  ${d.items.length?`<div class="sess-start"><button class="btn primary wo-big" data-act="sessstart" data-d="${di}">⚡ Bắt đầu tập ${isToday?'':esc(d.name)+' hôm nay'}</button></div>`:''}`}
function vPlan(){
  const ms=muscleSets();const total=S.plan.reduce((a,d)=>a+d.items.reduce((x,it)=>x+num(it.sets),0),0);
  const nDays=S.plan.filter(d=>d.items.length).length;
  let wkT=0,wkC=0,cMin=0;S.plan.forEach(d=>{const e=sessionEst(d);wkT+=e.kcal;wkC+=e.cardioKcal;cMin+=num(d.cardio)});const wk=wkT+wkC;
  const rows=MUSCLES.filter(m=>ms[m]>0||TARGET[m]).map(m=>{const t=TARGET[m],v=ms[m];let chip='<span class="chip">—</span>';
    if(t)chip=v<t[0]?'<span class="chip warn">Thấp</span>':v>t[1]?'<span class="chip warn">Cao</span>':'<span class="chip ok">Ổn</span>';
    return `<tr><td>${m}</td><td class="r muted">${ms._dir[m]}</td><td class="r num" style="font-size:17px">${fmt(v,1)}</td><td class="r muted">${t?t[0]+'–'+t[1]:'—'}</td><td>${chip}</td></tr>`}).join('');
  return `
  <h2 class="sec">Lịch tập</h2>
  ${vSession(ui.planDay??weekdayIdx(today()))}
  <details class="card wk-more" ${ui.wkOpen?'open':''}><summary data-act="wkopen"><b>Tổng quan tuần, chu kỳ 8 tuần, thuật ngữ</b></summary>
  ${vWeekCard()}
  <section class="card">
    <div class="stats">
      <div class="stat"><span class="eyebrow">Buổi tạ/tuần</span><span class="v">${nDays}</span></div>
      <div class="stat"><span class="eyebrow">Tổng set/tuần</span><span class="v">${total}</span></div>
      <div class="stat"><span class="eyebrow">Đốt ước tính/tuần</span><span class="v">~${fmt(Math.round(wk/50)*50)}<small>kcal</small></span></div>
      <div class="stat"><span class="eyebrow">Trong đó tạ / cardio</span><span class="v" style="font-size:22px">${fmt(Math.round(wkT/10)*10)} / ${fmt(Math.round(wkC/10)*10)}<small>kcal</small></span></div>
      <div class="stat"><span class="eyebrow">Cardio/tuần</span><span class="v">${fmt(cMin)}<small>phút</small></span></div>
    </div>
    ${(()=>{const W=weekAct();return `<div class="two" style="align-items:center"><div>${bodyMap(W.a,{heat:true,label:'Khối lượng tập mỗi nhóm cơ trong tuần'})}${bmLegend(true)}</div>
      <p class="small muted">Màu càng đậm, nhóm cơ đó càng nhiều set trong tuần (đã tính cơ phụ bằng nửa set). Vùng xám là chưa được tập trực tiếp. Chạm giữ một vùng để xem tên.</p></div>`})()}
    <div class="scroll"><table class="tbl"><thead><tr><th>Nhóm cơ</th><th class="r">Trực tiếp</th><th class="r">Quy đổi</th><th class="r">Khoảng tham khảo</th><th>Đánh giá</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">"Trực tiếp" là set của bài có nhóm cơ đó là cơ chính. "Quy đổi" cộng thêm 0,5 set cho mỗi set mà nhóm cơ đó làm cơ phụ (cách đếm của Pelland 2024), và là cột dùng để đánh giá. Khoảng 10–20 set/tuần cho nhóm lớn dựa trên Schoenfeld 2017; các nhóm nhỏ là khoảng tham khảo, chưa kiểm chứng riêng.</p>
  </section>
  </details>
  <section class="card">
    <h3>Bảng calo cardio</h3>
    <p class="small muted">Calo đốt mỗi 30 phút ở cân nặng ${fmt(effW(),1)} kg. Công thức: MET × cân nặng (kg) × số giờ.</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>Hoạt động</th><th class="r">MET</th><th class="r">kcal / 30 phút</th></tr></thead><tbody>
      ${Object.values(CARDIO).map(([n,met])=>`<tr><td>${esc(n)}</td><td class="r">${fmt(met,1)}</td><td class="r num" style="font-size:16px">${fmt(Math.round(met*effW()*0.5/5)*5)}</td></tr>`).join('')}
    </tbody></table></div>
  </section>
  <p class="small muted">Cách ước tính: mỗi set gồm ~40 giây làm việc, nghỉ 2,5 phút (compound) hoặc 75 giây (cô lập); bài compound ~5 MET, bài cô lập và khởi động 10 phút ~3,5 MET; cardio theo bảng trên. Giá trị MET lấy từ Compendium of Physical Activities (Ainsworth 2011), là mức trung bình cho người trưởng thành nên sai số thực tế có thể ±20–30%. Calo tập đã nằm trong hệ số vận động của TDEE, đừng cộng thêm vào lịch ăn.</p>`;
}

/* ---------- tab Lịch ăn ---------- */
function bar(label,v,t,col,unit){
  const pct=t>0?v/t*100:0;const diff=Math.abs(pct-100);
  const chip=diff<=7?'<span class="chip ok">Đạt</span>':pct<100?'<span class="chip warn">Thiếu</span>':'<span class="chip warn">Dư</span>';
  return `<span><b>${label}</b></span><div class="bar"><i style="width:${Math.min(100,pct)}%;background:var(${col})"></i></div><span class="num" style="font-size:16px">${fmt(v)} / ${fmt(t)} ${unit} ${chip}</span>`;
}
/* ---------- checklist ăn uống ---------- */
const addDays=(iso,n)=>{const t=new Date(iso+'T00:00:00');t.setDate(t.getDate()+n);return new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const ckKey=(mi,i,it)=>`${mi}-${i}-${it.f}`;
const getDay=d=>S.checks[d]||{items:{},creatine:false,water:0,note:''};
const ensureDay=d=>S.checks[d]||(S.checks[d]={items:{},creatine:false,water:0,note:''});
function dayProgress(d){const D=getDay(d);let n=0,done=0;const eaten=[];
  dayMeals(d).forEach((m,mi)=>m.items.forEach((it,i)=>{n++;if(D.items[ckKey(mi,i,it)]){done++;eaten.push(it)}}));
  return{n,done,pct:n?done/n*100:0,nut:sumNut(eaten)}}
/* ---------- thêm món nhanh ---------- */
const SIZES=[['Nhỏ',0.75],['Vừa',1],['Lớn',1.3]];
const isDish=f=>f&&f.cat==='Món ăn sẵn';
function defMeal(d,meals){if(d!==today()||!meals.length)return 0;const h=new Date().getHours();const k=h<10?0:h<14?1:h<17?2:3;return Math.min(k,meals.length-1)}
function qaResults(){const nq=norm(ui.qa.q);if(!nq)return '';const all=Object.values(FOODS).concat(S.customFoods);
  const hit=all.filter(f=>norm(f.n).includes(nq)).sort((a,b)=>(isDish(b)-isDish(a))||norm(a.n).indexOf(nq)-norm(b.n).indexOf(nq)).slice(0,8);
  if(!hit.length)return '<p class="small muted">Không tìm thấy. Dùng "Nhập tay" bên dưới.</p>';
  return hit.map(f=>`<button class="pick" data-act="qasel" data-id="${f.id}"><span class="l"><span class="nm">${esc(f.n)}</span><span class="small muted">${per100(f)?'100 '+f.u:'1 '+esc(f.u)}: ${fmt(f.k)} kcal · P ${fmt(f.p)} · C ${fmt(f.c)} · F ${fmt(f.f)}</span></span></button>`).join('')}
function mealSel(id,meals,cur){return `<select id="${id}" data-act="qameal">${meals.map((m,i)=>`<option value="${i}" ${String(cur)===String(i)?'selected':''}>${esc(m.name)}</option>`).join('')}<option value="new" ${cur==='new'?'selected':''}>+ Bữa mới: Ăn ngoài</option></select>`}
function vQuick(d){const Q=ui.qa,meals=dayMeals(d);if(Q.meal==='')Q.meal=String(defMeal(d,meals));
  const f=Q.sel?food(Q.sel):null;let prev='';
  if(f){const x=itemNut({f:f.id,q:num(Q.qty)});prev=`<div class="note-box" style="display:flex;flex-direction:column;gap:8px">
    <div class="row" style="justify-content:space-between"><b>${esc(f.n)}</b><button class="btn small" data-act="qaclear">Đổi món</button></div>
    ${f.note?`<span class="small muted">${esc(f.note)}</span>`:''}
    ${isDish(f)?`<div class="seg" role="group" aria-label="Cỡ phần">${SIZES.map(([n,m])=>`<button data-act="qasize" data-m="${m}" aria-pressed="${num(Q.qty)===m}">${n}</button>`).join('')}</div>`:''}
    <div class="row"><span class="row" style="gap:6px;align-items:center;flex:none"><input id="qa-qty" type="number" inputmode="decimal" step="${per100(f)?10:0.25}" min="0" data-act="qaqty" value="${esc(Q.qty)}" aria-label="Số lượng" style="width:88px;font-size:16px;font-weight:600;text-align:right"><span class="small muted">${esc(unitLabel(f))}</span></span>
      <label class="field" style="flex:1 1 160px"><span>Vào bữa</span>${mealSel('qa-meal',meals,Q.meal)}</label></div>
    <span class="num" style="font-size:18px">${fmt(x.k)} kcal <span class="small muted" style="font-family:var(--body);font-weight:500">· P ${fmt(x.p)} · C ${fmt(x.c)} · F ${fmt(x.f)} g</span></span>
    <label class="row small" style="gap:6px"><input type="checkbox" id="qa-ate" data-act="qaate" ${Q.ate?'checked':''}> Đánh dấu đã ăn</label>
    <div class="row"><button class="btn primary" data-act="qaadd">Thêm vào ngày ${dshort(d)}</button></div></div>`}
  const M=Q.mn;
  return `<section class="card" id="quick">
    <h3>Thêm món nhanh</h3>
    ${f?prev:`<input id="qa-q" data-act="qaq" placeholder="Gõ tên món: pho, com tam, tra sua…" value="${esc(Q.q)}" autocomplete="off">
    <div id="qa-results" class="qa-results">${qaResults()}</div>`}
    <details ${Q.manual?'open':''}><summary class="small" data-act="qaman">Không có trong danh sách? Nhập tay</summary>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
        <div class="grid-form">
          <label class="field" style="grid-column:1/-1"><span>Tên món</span><input id="qm-n" data-act="qm" data-k="n" value="${esc(M.n)}" placeholder="Ví dụ: Cơm sườn quán gần nhà"></label>
          <label class="field"><span>kcal (bắt buộc)</span><input id="qm-k" type="number" inputmode="decimal" data-act="qm" data-k="k" value="${esc(M.k)}"></label>
          <label class="field"><span>Protein (g)</span><input id="qm-p" type="number" inputmode="decimal" data-act="qm" data-k="p" value="${esc(M.p)}"></label>
          <label class="field"><span>Carb (g)</span><input id="qm-c" type="number" inputmode="decimal" data-act="qm" data-k="c" value="${esc(M.c)}"></label>
          <label class="field"><span>Fat (g)</span><input id="qm-f" type="number" inputmode="decimal" data-act="qm" data-k="f" value="${esc(M.f)}"></label>
          <label class="field"><span>Vào bữa</span>${mealSel('qm-meal',meals,Q.meal)}</label>
        </div>
        <div class="row"><button class="btn primary small" data-act="qmadd">Thêm vào ngày ${dshort(d)}</button><span class="small muted">Món được lưu vào nhóm "Tự nhập" để lần sau chọn lại.</span></div>
      </div></details>
    <details><summary class="small">Ước lượng khẩu phần khi ăn ngoài</summary>
      <div class="scroll" style="margin-top:8px"><table class="tbl"><thead><tr><th>Nhìn bằng mắt</th><th>Xấp xỉ</th></tr></thead><tbody>
        <tr><td>1 chén cơm vun</td><td>150–180 g cơm, ~200–230 kcal</td></tr>
        <tr><td>1 lòng bàn tay thịt, cá (dày như bàn tay)</td><td>~100 g chín</td></tr>
        <tr><td>1 nắm tay rau, trái cây</td><td>~100 g</td></tr>
        <tr><td>1 đầu ngón cái dầu, mỡ, bơ</td><td>~1 muỗng cà phê (5 g), ~40 kcal</td></tr>
        <tr><td>1 vắt bún, phở trong tô</td><td>~150–200 g</td></tr>
        <tr><td>Món chiên, xào ở quán</td><td>thường thêm 1–2 muỗng canh dầu (120–240 kcal) so với luộc</td></tr>
      </tbody></table></div>
      <p class="small muted">Đây là ước lượng thô, chưa kiểm chứng theo nghiên cứu; sai số có thể 20–30%. Món nhiều thành phần thì thêm từng phần (cơm, thịt, rau, dầu) sẽ sát hơn chọn món có sẵn.</p>
    </details>
  </section>`}
function addToDay(d,fid,q,meal,ate){const MM=ensureOverride(d);let mi=meal==='new'?-1:+meal;
  withChecks(d,MM,()=>{if(mi<0||!MM[mi]){MM.push({name:'Ăn ngoài',items:[]});mi=MM.length-1}MM[mi].items.push({f:fid,q})});
  if(ate){const it=MM[mi].items[MM[mi].items.length-1];ensureDay(d).items[ckKey(mi,MM[mi].items.length-1,it)]=true}
  return itemNut({f:fid,q})}
function vCheck(compact){
  const c=calc(),d=ui.checkDate,D=getDay(d),pr=dayProgress(d);
  const cups=Math.ceil(c.water/0.25);
  const week=Array.from({length:7},(_,k)=>addDays(d,k-6));
  const isToday=d===today();
  return `
  <section class="card">
    ${compact?`<div class="row" style="justify-content:space-between"><h3>Ăn uống hôm nay</h3><span class="num" style="font-size:22px">${pr.done}/${pr.n} <span class="small muted" style="font-family:var(--body);font-weight:500">món đã ăn</span></span></div>`:`<div class="row" style="justify-content:space-between">
      <div class="row" style="gap:6px">
        <button class="icon-btn" data-act="ckday" data-delta="-1" aria-label="Ngày trước">‹</button>
        <input id="ck-date" type="date" data-act="ckdate" value="${esc(d)}" style="width:auto">
        <button class="icon-btn" data-act="ckday" data-delta="1" aria-label="Ngày sau">›</button>
        ${isToday?'<span class="chip ok">Hôm nay</span>':`<button class="btn small" data-act="cktoday">Về hôm nay</button>`}
      </div>
      <span class="num" style="font-size:22px">${pr.done}/${pr.n} <span class="small muted" style="font-family:var(--body);font-weight:500">món đã ăn</span></span>
    </div>`}
    <div class="macro">
      ${[['Calo',pr.nut.k,c.k,'--accent','kcal'],[proLabel(),PRO(pr.nut),c.pro,'--pro','g']].map(([l,v,tg,col,u])=>`<span><b>${l}</b></span><div class="bar"><i style="width:${Math.min(100,v/tg*100)}%;background:var(${col})"></i></div><span class="num" style="font-size:16px">${fmt(v)} / ${fmt(tg)} ${u} <span class="small muted" style="font-family:var(--body);font-weight:500">${v<tg?'còn '+fmt(tg-v):'đủ'}</span></span>`).join('')}
      <span><b>Chất xơ</b></span><div class="bar"><i style="width:${Math.min(100,pr.nut.fb/c.fib*100)}%;background:var(--fib)"></i></div><span class="num" style="font-size:16px">${fmt(pr.nut.fb)} / ≥${c.fib} g</span>
    </div>
    ${compact?'':`<div class="week-strip" aria-label="7 ngày gần nhất">${week.map(x=>{const p=dayProgress(x).pct;const cls=p>=90?'ok':p>=50?'warn':p>0?'bad':'';return `<button class="wk ${x===d?'cur':''}" data-act="ckgo" data-date="${x}"><span class="small">${dshort(x)}</span><span class="wk-dot ${cls}">${p?fmt(p)+'%':'–'}</span></button>`}).join('')}</div>`}
  </section>
  ${(()=>{const over=!!S.dayMeals[d];const base=menuFor(d);const plan=dayNut(dayMeals(d));if(compact){const off=Math.abs(plan.k-c.k)/c.k>0.07||Math.abs(PRO(plan)-c.pro)>c.pro*0.07;return `<div class="note-box ${off?'warn':''} row" style="justify-content:space-between"><span class="small">Kế hoạch cả ngày: <b>${fmt(plan.k)}</b> kcal · P ${fmt(PRO(plan))} g${off?' (lệch mục tiêu)':''}</span><button class="btn small ${off?'primary':''}" data-act="balanceday">Cân lại ngày</button></div>`}return `<section class="card">
    <div class="row" style="justify-content:space-between">
      <label class="field" style="flex:1 1 220px"><span>Thực đơn ngày ${dshort(d)} (${DAY_LABELS[weekdayIdx(d)]})</span>
        <select id="ck-menu" data-act="daymenu">${S.menus.map(m=>`<option value="${m.id}" ${!over&&m.id===base.id?'selected':''}>${esc(m.name)}${m.id===base.id?' (mặc định)':''}</option>`).join('')}${over?'<option value="" selected>Đã chỉnh riêng cho ngày này</option>':''}</select></label>
      ${over?`<button class="btn small" data-act="resetday">Bỏ chỉnh sửa, dùng ${esc(base.name)}</button>`:''}
    </div>
    <span class="eyebrow">Cả ngày theo kế hoạch</span>
    <div class="macro">${bar('Calo',plan.k,c.k,'--accent','kcal')}${bar(proLabel(),PRO(plan),c.pro,'--pro','g')}${bar('Carb',plan.c,carbT(plan),'--carb','g')}${bar('Fat',plan.f,c.fat,'--fat','g')}</div>
    <div class="row"><button class="btn small primary" data-act="balanceday">Cân lại ngày này</button><span class="small muted">Chỉnh lượng thịt cá, cơm khoai, hạt dầu chưa ăn để protein, carb, fat cùng khớp mục tiêu. Món đã tích giữ nguyên.</span></div>
  </section>`})()}
  ${vQuick(d)}
  ${dayMeals(d).map((m,mi)=>{const all=m.items.length&&m.items.every((it,i)=>D.items[ckKey(mi,i,it)]);const mt=sumNut(m.items);return `<section class="card">
    <div class="meal-head"><h3>${esc(m.name)} <span class="mt">· ${fmt(mt.k)} kcal · P ${fmt(mt.p)} g</span></h3>
      ${m.items.length?`<button class="btn small ${all?'':'primary'}" data-act="ckmeal" data-m="${mi}">${all?'Bỏ đánh dấu':'Ăn xong cả bữa'}</button>`:''}</div>
    <div class="ck-list">${m.items.map((it,i)=>{const f=food(it.f);const k=ckKey(mi,i,it);const on=!!D.items[k];const x=itemNut(it);return `
      <div class="ck ${on?'on':''} ${ui.ckEdit===k?'open':''}"><label class="ck-box"><input type="checkbox" id="ck-${k}" data-act="ckitem" data-key="${esc(k)}" ${on?'checked':''} aria-label="Đã ăn ${esc(f?f.n:'')}"></label>
        <button class="ck-main" data-act="ckedit" data-key="${esc(k)}" aria-expanded="${ui.ckEdit===k}"><span class="ck-n">${esc(f?f.n:'(món đã xóa)')}</span><span class="ck-q">${fmt(it.q,1)} ${esc(f?unitLabel(f):'')}${it.ck&&cookable(f)&&COOK[it.ck]?' · '+esc(COOK[it.ck][0].toLowerCase()):''}</span></button>
        <span class="ck-k"><b class="num">${fmt(x.k)}</b> kcal</span>
        ${ui.ckEdit===k?`<div class="ck-edit"><span class="qty"><input id="dq-${mi}-${i}" type="number" inputmode="decimal" step="${f&&per100(f)?10:0.5}" min="0" data-act="qty" data-scope="day" data-m="${mi}" data-i="${i}" value="${it.q}" aria-label="Số lượng"><span>${esc(f?unitLabel(f):'')}</span></span>${cookSel(it,'day',mi,i)}
          <span class="small muted">P ${fmt(x.p)} · C ${fmt(x.c)} · F ${fmt(x.f)} g</span>
          <span class="row" style="gap:6px"><button class="btn small" data-act="swapfood" data-scope="day" data-m="${mi}" data-i="${i}">Đổi món</button><button class="btn small danger" data-act="delfood" data-scope="day" data-m="${mi}" data-i="${i}">Bỏ món hôm nay</button></span></div>`:''}</div>`}).join('')||'<p class="small muted">Bữa này chưa có món.</p>'}</div>
    <div class="row"><button class="btn small" data-act="addfood" data-scope="day" data-m="${mi}">+ Thêm món hôm nay</button></div>
  </section>`}).join('')}
  <div class="row"><button class="btn" data-act="addmeal" data-scope="day">+ Thêm bữa (ăn ngoài, bữa phụ)</button></div>
  <section class="card">
    <h3>Việc hằng ngày</h3>
    <label class="ck ${D.creatine?'on':''}"><input type="checkbox" id="ck-crea" data-act="ckcrea" ${D.creatine?'checked':''}><span class="ck-t"><span class="ck-n">Creatine 3–5 g</span><span class="small muted">Giờ nào cũng được</span></span><span></span></label>
    <div class="row" style="justify-content:space-between">
      <span><b>Nước</b> <span class="small muted">mục tiêu ${cups} ly × 250 ml (~${fmt(c.water,1)} L)</span></span>
      <span class="row" style="gap:6px"><button class="icon-btn" data-act="water" data-delta="-1" aria-label="Bớt 1 ly">−</button><span class="num" style="font-size:22px;min-width:64px;text-align:center">${D.water}/${cups}</span><button class="icon-btn" data-act="water" data-delta="1" aria-label="Thêm 1 ly">+</button></span>
    </div>
    <div class="bar"><i style="width:${Math.min(100,D.water/cups*100)}%;background:var(--accent)"></i></div>
    <label class="field"><span>Ghi chú ngày (ăn ngoài thực đơn, đi vệ sinh, cảm giác…)</span><input id="ck-note" data-act="cknote" value="${esc(D.note)}"></label>
  </section>
  <p class="small muted">Đổi món, sửa số lượng hay thêm bữa ở đây chỉ áp dụng cho ngày đang xem; thực đơn gốc ở mục "Sửa thực đơn" giữ nguyên.</p>`;
}
function vMeal(){
  const head=`<h2 class="sec">Lịch ăn</h2>
  <div class="seg" role="group" aria-label="Chế độ xem"><button data-act="mview" data-v="check" aria-pressed="${ui.mealView==='check'}">Checklist hằng ngày</button><button data-act="mview" data-v="edit" aria-pressed="${ui.mealView==='edit'}">Sửa thực đơn</button></div>`;
  if(ui.mealView==='check')return head+vCheck();
  const c=calc(),CM=curMenu(),t=dayNut(CM.meals);
  return head+`
  <p class="lead">Mọi khối lượng là cân chín (riêng yến mạch cân khô). Bấm tên món để đổi món, sửa số lượng để tính lại.</p>
  <section class="card">
    <div class="row" style="align-items:flex-end">
      <label class="field" style="flex:1 1 180px"><span>Đang sửa</span><select id="ed-menu" data-act="editmenu">${S.menus.map(m=>`<option value="${m.id}" ${m.id===CM.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>
      <label class="field" style="flex:1 1 180px"><span>Tên thực đơn</span><input id="ed-name" data-act="menuname" value="${esc(CM.name)}"></label>
    </div>
    <div class="row"><button class="btn small" data-act="newmenu">+ Thực đơn mới (chép từ thực đơn này)</button>${S.menus.length>1?armBtn('menux:'+CM.id,'Xóa thực đơn này'):''}</div>
    <span class="eyebrow">Thực đơn mặc định theo thứ</span>
    <div class="week-menu">${DAY_LABELS.map((l,w)=>`<label class="field"><span>${l}</span><select id="wm-${w}" data-act="weekmenu" data-w="${w}">${S.menus.map(m=>`<option value="${m.id}" ${S.weekMenu[w]===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>`).join('')}</div>
  </section>
  <section class="card">
    <div class="macro">
      ${bar('Calo',t.k,c.k,'--accent','kcal')}
      ${bar(proLabel(),PRO(t),c.pro,'--pro','g')}
      ${bar('Carb',t.c,carbT(t),'--carb','g')}
      ${bar('Fat',t.f,c.fat,'--fat','g')}
      <span><b>Chất xơ</b></span><div class="bar"><i style="width:${Math.min(100,t.fb/c.fib*100)}%;background:var(--fib)"></i></div><span class="num" style="font-size:16px">${fmt(t.fb)} / ≥${c.fib} g ${t.fb>=c.fib?'<span class="chip ok">Đạt</span>':'<span class="chip warn">Thiếu</span>'}</span>
    </div>
    <p class="small muted">"Đạt" khi lệch không quá 7% so với mục tiêu. Mục tiêu theo tab Mục tiêu: ${esc(c.g.name)}.</p>
  </section>
  <section class="card">
    <h3>Đề xuất thực đơn</h3>
    <p class="small muted">Chọn mẫu, trang sẽ tự chỉnh lượng đạm, tinh bột và chất béo để protein, carb, fat cùng khớp mục tiêu. Rau và trái cây giữ nguyên để đủ chất xơ.</p>
    <div class="row">
      <select id="tpl" data-act="tpl" style="max-width:320px">${Object.entries(TPL).map(([k,v])=>`<option value="${k}" ${ui.tplId===k?'selected':''}>${v.name}</option>`).join('')}</select>
      ${ui.confirmTpl?`<span class="small">Thay toàn bộ các bữa của ${esc(CM.name)}?</span><button class="btn small primary" data-act="applytpl">Thay</button><button class="btn small" data-act="canceltpl">Hủy</button>`:`<button class="btn primary" data-act="asktpl">Tạo thực đơn theo mục tiêu</button>`}
    </div>
  </section>
  ${CM.meals.map((m,mi)=>{const mt=sumNut(m.items);return `<section class="card">
    <div class="meal-head">
      <input id="mn-${mi}" data-act="mealname" data-scope="menu" data-m="${mi}" value="${esc(m.name)}" aria-label="Tên bữa">
      <span class="mt"><b class="num" style="font-size:17px">${fmt(mt.k)}</b> kcal · <span class="dot" style="background:var(--pro)"></span>${fmt(mt.p)} · <span class="dot" style="background:var(--carb)"></span>${fmt(mt.c)} · <span class="dot" style="background:var(--fat)"></span>${fmt(mt.f)} g</span>
    </div>
    <div>${m.items.map((it,i)=>{const f=food(it.f);const x=itemNut(it);return `<div class="meal-item">
      <div class="nm"><button class="ex-name" data-act="swapfood" data-scope="menu" data-m="${mi}" data-i="${i}">${esc(f?f.n:'(món đã xóa)')}</button>
      <div class="sub">${fmt(x.k)} kcal · P ${fmt(x.p,1)} · C ${fmt(x.c,1)} · F ${fmt(x.f,1)} · xơ ${fmt(x.fb,1)}</div>${cookSel(it,'menu',mi,i)}</div>
      <label class="qty"><input id="q-${mi}-${i}" type="number" inputmode="decimal" step="${f&&per100(f)?10:0.5}" min="0" data-act="qty" data-scope="menu" data-m="${mi}" data-i="${i}" value="${it.q}" aria-label="Số lượng"><span title="${esc(f?unitLabel(f):'')}">${esc(f?unitLabel(f):'')}</span></label>
      <button class="icon-btn" data-act="delfood" data-scope="menu" data-m="${mi}" data-i="${i}" aria-label="Xóa món">✕</button>
    </div>`}).join('')}</div>
    <div class="row" style="justify-content:space-between">
      <button class="btn small" data-act="addfood" data-scope="menu" data-m="${mi}">+ Thêm món</button>
      ${armBtn('mealx:menu:'+mi,'Xóa bữa')}
    </div>
  </section>`}).join('')}
  <div class="row"><button class="btn" data-act="addmeal" data-scope="menu">+ Thêm bữa</button></div>
  <section class="card">
    <details ${S.customFoods.length?'':''}>
      <summary>Thực phẩm tự nhập (${S.customFoods.length})</summary>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        <p class="small muted">Dùng cho món ăn ngoài hoặc đồ đóng gói: lấy số trên nhãn. Món tự nhập xuất hiện trong thư viện ở nhóm "Tự nhập".</p>
        <div class="grid-form">
          <label class="field" style="grid-column:span 2"><span>Tên món</span><input id="cf-n" data-act="cf" data-k="n" value="${esc(ui.cf.n)}"></label>
          <label class="field"><span>Tính theo</span><select id="cf-u" data-act="cf" data-k="u"><option value="g" ${ui.cf.u==='g'?'selected':''}>100 g</option><option value="ml" ${ui.cf.u==='ml'?'selected':''}>100 ml</option><option value="phần" ${ui.cf.u==='phần'?'selected':''}>1 phần</option></select></label>
          <label class="field"><span>kcal</span><input id="cf-k" type="number" inputmode="decimal" data-act="cf" data-k="k" value="${esc(ui.cf.k)}"></label>
          <label class="field"><span>Protein (g)</span><input id="cf-p" type="number" inputmode="decimal" data-act="cf" data-k="p" value="${esc(ui.cf.p)}"></label>
          <label class="field"><span>Carb (g)</span><input id="cf-c" type="number" inputmode="decimal" data-act="cf" data-k="c" value="${esc(ui.cf.c)}"></label>
          <label class="field"><span>Fat (g)</span><input id="cf-f" type="number" inputmode="decimal" data-act="cf" data-k="f" value="${esc(ui.cf.f)}"></label>
          <label class="field"><span>Chất xơ (g)</span><input id="cf-fb" type="number" inputmode="decimal" data-act="cf" data-k="fb" value="${esc(ui.cf.fb)}"></label>
        </div>
        <div class="row"><button class="btn primary small" data-act="addcf">Thêm vào thư viện</button></div>
        ${S.customFoods.length?`<div class="scroll"><table class="tbl"><thead><tr><th>Món</th><th>Theo</th><th class="r">kcal</th><th class="r">P</th><th class="r">C</th><th class="r">F</th><th></th></tr></thead><tbody>${S.customFoods.map(f=>`<tr><td>${esc(f.n)}</td><td>${per100(f)?'100 '+f.u:'1 phần'}</td><td class="r">${fmt(f.k)}</td><td class="r">${fmt(f.p,1)}</td><td class="r">${fmt(f.c,1)}</td><td class="r">${fmt(f.f,1)}</td><td class="r">${armBtn('cf-'+f.id,'Xóa')}</td></tr>`).join('')}</tbody></table></div>`:''}
      </div>
    </details>
  </section>
  <p class="small muted">Thực phẩm đơn lẻ ước tính theo USDA FoodData Central cho loại tương đương. Món ghi "ước tính" và nhóm Món ăn sẵn là giá trị tham khảo, chưa đối chiếu với Bảng thành phần thực phẩm Việt Nam (Viện Dinh dưỡng), sai số có thể ±30%. Đồ đóng gói hãy dùng số trên nhãn.</p>`;
}

/* ---------- tab Theo dõi ---------- */
function bodyAdvice(){
  const b=S.body.filter(x=>x.w>0).slice().sort((a,c)=>a.d<c.d?-1:a.d>c.d?1:0);
  if(b.length<2)return['','Cần ít nhất 2 lần đo cân cách nhau từ 14 ngày để đánh giá xu hướng.'];
  const L=b[b.length-1];let E=null;
  for(let i=b.length-2;i>=0;i--){if(daysBetween(b[i].d,L.d)>=14){E=b[i];break}}
  if(!E)return['','Lần đo đầu và lần mới nhất cách nhau chưa tới 14 ngày. Đo tiếp rồi xem lại.'];
  const wk=daysBetween(E.d,L.d)/7,rate=(L.w-E.w)/wk,pct=rate/E.w*100;
  const dw=(L.waist&&E.waist)?L.waist-E.waist:null;
  const base=`Từ ${dshow(E.d)} đến ${dshow(L.d)}: cân ${rate>=0?'+':''}${fmt(rate,2)} kg/tuần (${pct>=0?'+':''}${fmt(pct,2)}%)${dw!=null?`, vòng eo ${dw>=0?'+':''}${fmt(dw,1)} cm`:''}. `;
  const g=S.profile.goal;
  if(g==='giam_mo'){if(pct>-0.25)return['warn',base+'Giảm chậm hơn mục tiêu: bớt 150 kcal/ngày.'];if(pct<-1)return['warn',base+'Giảm quá nhanh, dễ mất cơ: thêm 150 kcal/ngày.'];return['ok',base+'Đúng tốc độ, giữ nguyên.']}
  if(g==='recomp'){if(dw!=null&&dw>0.5)return['warn',base+'Vòng eo tăng: bớt 150 kcal/ngày.'];if(rate<-0.4)return['warn',base+'Cân giảm nhanh so với recomp: thêm 150 kcal/ngày nếu tạ cũng tụt.'];return['ok',base+(dw==null?'Nhập thêm vòng eo để đánh giá chính xác hơn. ':'')+'Đúng hướng nếu tạ vẫn tăng ở mục Buổi tập.']}
  if(g==='duy_tri'){if(Math.abs(rate)<=0.25)return['ok',base+'Ổn định, giữ nguyên.'];return['warn',base+(rate>0?'Đang tăng: bớt 150 kcal/ngày.':'Đang giảm: thêm 150 kcal/ngày.')]}
  if(g==='tang_co'){if(rate<0.05)return['warn',base+'Chưa tăng: thêm 150 kcal/ngày.'];if(rate>0.35||(dw!=null&&dw>1))return['warn',base+'Tăng nhanh, dễ tích mỡ: bớt 150 kcal/ngày.'];return['ok',base+'Đúng tốc độ, giữ nguyên.']}
  if(rate<0.2)return['warn',base+'Tăng chậm: thêm 150–200 kcal/ngày.'];if(rate>0.6)return['warn',base+'Tăng quá nhanh: bớt 150 kcal/ngày.'];return['ok',base+'Đúng tốc độ, giữ nguyên.'];
}
function vTrack(){
  const subs=[['body','Cơ thể'],['log','Ghi buổi tập'],['hist','Lịch sử bài']];
  return `
  <h2 class="sec">Theo dõi</h2>
  <div class="seg" role="group" aria-label="Mục theo dõi">${subs.map(([k,n])=>`<button data-act="sub" data-s="${k}" aria-pressed="${ui.sub===k}">${n}</button>`).join('')}</div>
  ${ui.sub==='body'?vBody():ui.sub==='log'?vLog():vHist()}`;
}
function vBody(){
  const b=S.body.slice().sort((a,c)=>a.d<c.d?-1:a.d>c.d?1:0);
  const adv=bodyAdvice();const f=ui.bodyForm;
  const wPts=b.filter(x=>x.w>0).map(x=>({x:x.d,y:x.w})),ePts=b.filter(x=>x.waist>0).map(x=>({x:x.d,y:x.waist}));
  return `
  <section class="card">
    <h3>Ghi số đo</h3>
    <p class="small muted">Cân mỗi sáng sau khi đi vệ sinh, nhập trung bình tuần. Vòng eo đo ngang rốn, sáng thứ 2. Chụp ảnh mỗi 4 tuần, cùng góc và ánh sáng.</p>
    <div class="grid-form">
      <label class="field"><span>Ngày</span><input id="bf-d" type="date" data-act="bform" data-k="d" value="${esc(f.d)}"></label>
      <label class="field"><span>Cân nặng (kg)</span><input id="bf-w" type="number" inputmode="decimal" step="0.1" data-act="bform" data-k="w" value="${esc(f.w)}"></label>
      <label class="field"><span>Vòng eo (cm)</span><input id="bf-e" type="number" inputmode="decimal" step="0.1" data-act="bform" data-k="waist" value="${esc(f.waist)}"></label>
      <label class="field"><span>Ghi chú</span><input id="bf-n" data-act="bform" data-k="note" value="${esc(f.note)}" placeholder="Ví dụ: đã chụp ảnh"></label>
    </div>
    <div class="row"><button class="btn primary" data-act="addbody">Lưu số đo</button><span class="small muted">Cùng ngày thì ghi đè.</span></div>
  </section>
  <div class="note-box ${adv[0]}">${esc(adv[1])}</div>
  <div class="two">
    <section class="card"><span class="eyebrow">Cân nặng (kg)</span>${wPts.length?chart(wPts,'kg','Biểu đồ cân nặng theo ngày'):'<p class="small muted">Chưa có số liệu.</p>'}</section>
    <section class="card"><span class="eyebrow">Vòng eo (cm)</span>${ePts.length?chart(ePts,'cm','Biểu đồ vòng eo theo ngày'):'<p class="small muted">Chưa có số đo vòng eo. Nhập ở form trên.</p>'}</section>
  </div>
  <section class="card">
    <div class="scroll"><table class="tbl"><thead><tr><th>Ngày</th><th class="r">Cân (kg)</th><th class="r">Eo (cm)</th><th>Ghi chú</th><th></th></tr></thead><tbody>
    ${b.slice().reverse().map(x=>`<tr><td>${dshow(x.d)}</td><td class="r">${x.w?fmt(x.w,1):'–'}</td><td class="r">${x.waist?fmt(x.waist,1):'–'}</td><td>${esc(x.note)}</td><td class="r">${armBtn('body-'+x.id,'Xóa')}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Chưa có số đo.</td></tr>'}
    </tbody></table></div>
  </section>`;
}
function DR(){const o=S.drafts[ui.logDate];return o&&o.vals?o.vals:{}}
const draftEmpty=o=>!Object.keys(o.vals||{}).length&&!Object.keys(o.swap||{}).length;
function DRset(k,v){const d=ui.logDate;const o=S.drafts[d]||(S.drafts[d]={d,vals:{}});if(v===''||v==null)delete o.vals[k];else o.vals[k]=String(v);if(draftEmpty(o))delete S.drafts[d]}
function effEx(day,i){const o=S.drafts[ui.logDate];return (o&&o.swap&&o.swap[day+'-'+i])||S.plan[day].items[i].ex}
function setSwap(day,i,ex){const d=ui.logDate;const o=S.drafts[d]||(S.drafts[d]={d,vals:{}});o.swap=o.swap||{};if(!ex||ex===S.plan[day].items[i].ex)delete o.swap[day+'-'+i];else o.swap[day+'-'+i]=ex;if(draftEmpty(o))delete S.drafts[d]}
function logInfo(){const d=S.plan[ui.logDay],dr=DR(),w=curWeek();
  return d.items.map((it0,i)=>{const it=Object.assign({},it0,{ex:effEx(ui.logDay,i)});const D=dose(it,w);const n=D.skip?0:Math.max(1,D.sets);let done=0;for(let s=0;s<n;s++)if(num(dr[`${ui.logDay}-${i}-${s}-r`])>0)done++;return{it,i,D,n,done}})}
function nextOpen(info,from){const L=info.filter(x=>x.n>0&&x.done<x.n);const a=L.find(x=>x.i>from)||L[0];return a?a.i:-1}
function lastSet(ex,s){const l=lastFor(ex);return l&&l.sets.length?(l.sets[s]||l.sets[l.sets.length-1]):null}
function logEntries(){const day=S.plan[ui.logDay];const entries=[];const dr=DR();
  day.items.forEach((it,ii)=>{const sets=[];for(let s=0;s<Math.max(1,num(it.sets));s++){const kk=`${ui.logDay}-${ii}-${s}`;const r=num(dr[kk+'-r']);if(r>0)sets.push({kg:num(dr[kk+'-kg']),r})}if(sets.length)entries.push({ex:effEx(ui.logDay,ii),sets})});return entries}
function saveLog(){const day=S.plan[ui.logDay];const entries=logEntries();if(!entries.length){toast('Chưa nhập rep cho set nào');return false}
  S.logs.push({id:Date.now(),d:ui.logDate||today(),day:ui.logDay,name:day.name,entries});S.logs.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:x.id-y.id);
  const o=S.drafts[ui.logDate];if(o){Object.keys(o.vals).forEach(k=>{if(k.startsWith(ui.logDay+'-'))delete o.vals[k]});if(o.swap)Object.keys(o.swap).forEach(k=>{if(k.startsWith(ui.logDay+'-'))delete o.swap[k]});if(draftEmpty(o))delete S.drafts[ui.logDate]}
  ui.openKey=null;return true}
/* ---------- chế độ đang tập ---------- */
const WO={on:false,i:0,s:0,rest:null,timer:null,audio:null,lock:null,swap:false,sum:false};
const restSec=it=>{const e=LIB[it.ex]||{t:'I'};return e.t==='C'?150:75};
function woFirst(){const info=logInfo();for(const x of info)if(x.n>0&&x.done<x.n)return [x.i,x.done];return null}
async function woLock(){try{if(navigator.wakeLock&&document.visibilityState==='visible')WO.lock=await navigator.wakeLock.request('screen')}catch(_){WO.lock=null}}
function woUnlock(){try{WO.lock&&WO.lock.release()}catch(_){}WO.lock=null}
document.addEventListener('visibilitychange',()=>{if(WO.on&&document.visibilityState==='visible')woLock()});
function beep(){try{if(navigator.vibrate)navigator.vibrate([300,150,300,150,300])}catch(_){}
  try{const A=WO.audio;if(!A)return;if(A.state==='suspended'&&A.resume)A.resume();[0,0.35,0.7].forEach(t=>{const o=A.createOscillator(),g=A.createGain();o.frequency.value=880;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(0.0001,A.currentTime+t);g.gain.exponentialRampToValueAtTime(0.4,A.currentTime+t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,A.currentTime+t+0.25);o.start(A.currentTime+t);o.stop(A.currentTime+t+0.3)})}catch(_){}}
function woStart(){ovOpened();ui.prSeen={};try{const C=window.AudioContext||window.webkitAudioContext;if(C){WO.audio=WO.audio||new C();WO.audio.resume&&WO.audio.resume()}}catch(_){}
  const f=woFirst();WO.on=true;WO.sum=!f;WO.swap=false;if(f){WO.i=f[0];WO.s=f[1]}woLock();document.body.classList.add('wo-on');woRender()}
function woExit(){WO.on=false;clearInterval(WO.timer);WO.rest=null;woUnlock();document.body.classList.remove('wo-on');$('#wo').hidden=true;woPersist();render()}
/* lưu vị trí đang tập (bài, set, giờ nghỉ) để Android có tắt app thì mở lại vẫn tập tiếp được */
const WO_KEY='so-tap-an-wo';
function woPersist(){try{if(WO.on)localStorage.setItem(WO_KEY,JSON.stringify({d:ui.logDate,day:ui.logDay,i:WO.i,s:WO.s,rest:WO.rest,sum:WO.sum,t:Date.now()}));else localStorage.removeItem(WO_KEY)}catch(_){}}
function woRestore(){try{const o=JSON.parse(localStorage.getItem(WO_KEY)||'null');if(!o||o.d!==today()||Date.now()-o.t>3*36e5||!S.plan[o.day]){localStorage.removeItem(WO_KEY);return}
  ui.logDate=o.d;ui.logDay=o.day;WO.i=o.i;WO.s=o.s;WO.sum=!!o.sum;WO.swap=false;WO.rest=o.rest&&o.rest.end>Date.now()?o.rest:null;WO.on=true;
  woLock();document.body.classList.add('wo-on');ovOpened();woRender();toast('Đang tiếp tục buổi tập dở')}catch(_){}}
function woVals(){const it={ex:effEx(ui.logDay,WO.i)},kk=`${ui.logDay}-${WO.i}-${WO.s}`,dr=DR(),p=lastSet(it.ex,WO.s);
  const prevSet=WO.s>0?{kg:dr[`${ui.logDay}-${WO.i}-${WO.s-1}-kg`],r:dr[`${ui.logDay}-${WO.i}-${WO.s-1}-r`]}:null;
  const kg=dr[kk+'-kg']!=null?num(dr[kk+'-kg']):(prevSet&&prevSet.kg!=null?num(prevSet.kg):p?p.kg:0);
  const r=dr[kk+'-r']!=null?num(dr[kk+'-r']):(ui.woTmp&&ui.woTmp[kk]!=null)?ui.woTmp[kk]:(p?p.r:(repRange(S.plan[ui.logDay].items[WO.i].reps)||[10])[0]);return{kk,kg,r,p}}
/* kỷ lục cá nhân: so set vừa xong với mọi buổi đã lưu (và các set trước của buổi này) */
const e1rm=(kg,r)=>kg*(1+r/30); /* Epley, giống chỗ khác trong app */
function checkPR(ex,kg,r){if(!(kg>0&&r>0))return;const H=exHistory(ex);if(!H.length)return;
  let maxKg=0,max1=0;H.forEach(h=>h.sets.forEach(x=>{maxKg=Math.max(maxKg,x.kg);max1=Math.max(max1,e1rm(x.kg,x.r))}));
  const seen=(ui.prSeen=ui.prSeen||{})[ex]||{kg:0,e1:0};maxKg=Math.max(maxKg,seen.kg);max1=Math.max(max1,seen.e1);const now1=e1rm(kg,r);
  let msg='';if(kg>maxKg)msg=`🏆 Kỷ lục mới: nặng nhất ${fmt(kg,1)} kg (cũ ${fmt(maxKg,1)} kg)`;else if(now1>max1+0.05)msg=`🏆 Kỷ lục 1RM ước tính: ${fmt(now1,1)} kg (cũ ${fmt(max1,1)} kg)`;
  ui.prSeen[ex]={kg:Math.max(seen.kg,kg),e1:Math.max(seen.e1,now1)};
  if(msg){toast(msg);try{navigator.vibrate&&navigator.vibrate(120)}catch(_){}}}
function woAdvance(){const info=logInfo();const x=info[WO.i];if(WO.s+1<x.n){WO.s++;return true}
  for(let j=WO.i+1;j<info.length;j++)if(info[j].n>0&&info[j].done<info[j].n){WO.i=j;WO.s=info[j].done;return true}
  const f=woFirst();if(f){WO.i=f[0];WO.s=f[1];return true}WO.sum=true;return false}
function woTick(){const el=$('#wo-left');if(!WO.rest){clearInterval(WO.timer);return}const left=Math.max(0,Math.round((WO.rest.end-Date.now())/1000));
  if(el)el.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;const bar=$('#wo-rbar');if(bar)bar.style.width=(100-left/WO.rest.total*100)+'%';
  if(left<=0){clearInterval(WO.timer);WO.rest=null;beep();woRender()}}
function woRender(){const el=$('#wo');el.hidden=!WO.on;if(!WO.on)return;woPersist();const day=S.plan[ui.logDay],info=logInfo();
  const tot=info.reduce((a,x)=>a+x.n,0),dn=info.reduce((a,x)=>a+x.done,0);
  const head=`<div class="wo-top"><button class="icon-btn" data-act="woexit" aria-label="Thoát chế độ tập">✕</button><span class="small"><b>${esc(day.name)}</b> · ${dn}/${tot} set</span><span></span></div><div class="bar"><i style="width:${tot?dn/tot*100:0}%;background:var(--ok)"></i></div>`;
  if(WO.sum){const entries=logEntries();let vol=0;const rows=entries.map(e=>{const best=Math.max(...e.sets.map(x=>x.kg*(1+x.r/30)));vol+=e.sets.reduce((a,x)=>a+x.kg*x.r,0);const l=lastFor(e.ex);const lb=l?Math.max(...l.sets.map(x=>x.kg*(1+x.r/30))):null;
      const ch=lb==null?'<span class="chip">Lần đầu</span>':best>lb+0.05?`<span class="chip ok">↑ ${fmt(best-lb,1)} kg 1RM</span>`:best<lb-0.05?`<span class="chip warn">↓ ${fmt(lb-best,1)} kg</span>`:'<span class="chip">Giữ nguyên</span>';
      return `<tr><td>${esc((LIB[e.ex]||{n:e.ex}).n)}</td><td class="r">${e.sets.length}</td><td>${ch}</td></tr>`}).join('');
    el.innerHTML=`<div class="wo-in">${head}<h2 class="sec">Tổng kết buổi</h2>
      <div class="stats"><div class="stat"><span class="eyebrow">Set đã làm</span><span class="v">${dn}/${tot}</span></div><div class="stat"><span class="eyebrow">Tổng khối lượng</span><span class="v">${fmt(vol)}<small>kg</small></span></div></div>
      ${rows?`<div class="scroll"><table class="tbl"><thead><tr><th>Bài</th><th class="r">Set</th><th>So với lần trước</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="muted">Chưa có set nào.</p>'}
      <p class="small muted">"1RM" là 1RM ước tính theo Epley từ set tốt nhất; chỉ để so sánh xu hướng.</p>
      <div class="wo-actions"><button class="btn primary wo-big" data-act="wosave">Lưu buổi tập</button><button class="btn" data-act="woback">Quay lại tập tiếp</button></div></div>`;return}
  const x=info[WO.i],it={ex:effEx(ui.logDay,WO.i),reps:S.plan[ui.logDay].items[WO.i].reps,sets:S.plan[ui.logDay].items[WO.i].sets},ex=LIB[it.ex]||{n:it.ex,m:''},V=woVals();
  if(WO.swap){const cur=LIB[it.ex];const alts=Object.values(LIB).filter(e=>cur&&e.m===cur.m&&e.id!==it.ex&&!flagsFor(e).some(f=>f[1]==='!'));const orig=S.plan[ui.logDay].items[WO.i].ex;
    el.innerHTML=`<div class="wo-in">${head}<h2 class="sec">Đổi bài: ${esc(viName(it.ex))}</h2><p class="small muted">Bài cùng nhóm cơ ${esc(cur?cur.m:'')}, đã bỏ các bài nên tránh với vai hoặc trĩ. Chỉ đổi cho buổi hôm nay.</p>
      <div class="sheet-list" style="padding:0">${orig!==it.ex?`<button class="pick" data-act="woswapto" data-id="${orig}"><span class="l"><span class="nm">↺ Quay về ${esc(LIB[orig].n)}</span></span></button>`:''}${alts.map(e=>`<button class="pick" data-act="woswapto" data-id="${e.id}"><span class="l"><span class="nm">${esc(e.n)}</span>${musLine(e.id)}<span class="ex-tags">${flagChips(e)}</span></span></button>`).join('')||'<p class="muted">Không có bài thay thế phù hợp.</p>'}</div>
      <div class="wo-actions"><button class="btn" data-act="woswapcancel">Hủy</button></div></div>`;return}
  const last=lastFor(it.ex);
  if(WO.rest){const nxt=info[WO.i];el.innerHTML=`<div class="wo-in">${head}<div class="wo-rest"><span class="eyebrow">Nghỉ</span><div class="wo-clock" id="wo-left">0:00</div><div class="bar wo-rb"><i id="wo-rbar" style="width:0%;background:var(--accent)"></i></div>
      <p class="muted">Tiếp theo: <b>${esc(viName(it.ex))}</b> · set ${WO.s+1}/${nxt.n} · ${fmt(V.kg,1)} kg × ${V.r}</p></div>
      <div class="wo-actions"><button class="btn wo-big" data-act="woplus">+30 giây</button><button class="btn primary wo-big" data-act="woskip">Bỏ qua, tập luôn</button></div></div>`;woTick();clearInterval(WO.timer);WO.timer=setInterval(woTick,250);return}
  el.innerHTML=`<div class="wo-in">${head}
    <div class="wo-ex"><span class="eyebrow">Bài ${info.filter(y=>y.n>0&&y.i<=WO.i).length}/${info.filter(y=>y.n>0).length} · ${esc(ex.m||'')}</span><div class="row" style="flex-wrap:nowrap;justify-content:space-between;align-items:flex-start;gap:10px"><h2 class="wo-name">${esc(viName(it.ex))}</h2><button class="btn small" data-act="how" data-ex="${it.ex}">Cách tập</button></div>
      <div class="wo-set">Set ${WO.s+1}<span>/${x.n}</span></div>
      <div class="dose">${esc(it.reps)} rep · <b>RIR ${x.D.rir}</b> (RPE ${x.D.rpe}) · nghỉ ${x.D.rest}</div>
      <div class="hd-cues">${howOf(it.ex).cues.map(c=>`<span>✦ ${esc(c)}</span>`).join('')}</div>
      ${(S.exNotes||{})[it.ex]?`<div class="note-box small">✎ ${esc(S.exNotes[it.ex])}</div>`:''}
      <div class="small muted">${last?`Lần trước: ${setsText(last.sets)}`:'Chưa có lần trước: chọn mức tạ còn dư khoảng '+x.D.rir+' rep.'}${(()=>{const ad=advise(it.ex,it.reps);return ad?` <span class="chip ${ad[0]}">${esc(ad[1])}</span>`:''})()}</div>
      <div class="row" style="gap:10px;flex-wrap:nowrap;align-items:center"><div style="width:130px;flex:none">${ANH[it.ex]?anhDong(it.ex,'nho'):bodyMap(exAct(it.ex),{cls:'sm',pulse:true})}</div><div class="small">${musLine(it.ex)}</div></div></div>
    <div class="wo-steps">
      <div class="wo-step"><span class="eyebrow">Kg</span><div class="wo-row"><button class="wo-pm" data-act="wopm" data-f="kg" data-d="-2.5" aria-label="Bớt 2,5 kg">−</button><input id="wo-kg" type="number" inputmode="decimal" step="0.5" data-act="wonum" data-f="kg" value="${V.kg}" aria-label="Kg"><button class="wo-pm" data-act="wopm" data-f="kg" data-d="2.5" aria-label="Thêm 2,5 kg">+</button></div></div>
      <div class="wo-step"><span class="eyebrow">Rep</span><div class="wo-row"><button class="wo-pm" data-act="wopm" data-f="r" data-d="-1" aria-label="Bớt 1 rep">−</button><input id="wo-r" type="number" inputmode="numeric" data-act="wonum" data-f="r" value="${V.r}" aria-label="Rep"><button class="wo-pm" data-act="wopm" data-f="r" data-d="1" aria-label="Thêm 1 rep">+</button></div></div>
    </div>
    <p class="small muted" style="margin-top:-6px">Chạm vào ô số để gõ trực tiếp; nút − / + chỉnh 2,5 kg hoặc 1 rep.</p>
    <div class="wo-actions"><button class="btn primary wo-big" data-act="wodone">Xong set</button>
      <div class="row" style="justify-content:space-between"><button class="btn small" data-act="woprev">‹ Set trước</button><button class="btn small" data-act="woswap">Đổi bài</button><button class="btn small" data-act="wonext">Bỏ qua ›</button><button class="btn small" data-act="wofinish">Kết thúc</button></div></div>
  </div>`}
function woSetVal(f,v){const V=woVals();const kg=f==='kg'?Math.max(0,v):V.kg,r=f==='r'?Math.max(0,Math.round(v)):V.r;
  const dr=DR();const wasDone=num(dr[V.kk+'-r'])>0;DRset(V.kk+'-kg',kg);if(wasDone)DRset(V.kk+'-r',r);else{ui.woTmp=ui.woTmp||{};ui.woTmp[V.kk]=r}save()}
function vLog(inToday){
  const days=S.plan.map((d,i)=>({d,i})).filter(x=>x.d.items.length);
  if(!days.length)return `<div class="note-box">Lịch tập chưa có buổi nào. Thêm bài ở tab Tập.</div>`;
  if(ui.logDay==null||!S.plan[ui.logDay]||!S.plan[ui.logDay].items.length){const wd=(new Date().getDay()+6)%7;ui.logDay=S.plan[wd]&&S.plan[wd].items.length?wd:days[0].i}
  const info=logInfo(),dr=DR();const key=ui.logDay+'|'+ui.logDate;
  if(ui.openKey!==key){ui.openKey=key;ui.openEx=nextOpen(info,-1)}
  const tot=info.reduce((a,x)=>a+x.n,0),dn=info.reduce((a,x)=>a+x.done,0),nEx=info.filter(x=>x.n>0).length,exDone=info.filter(x=>x.n>0&&x.done>=x.n).length;
  return `<section class="card">
    ${inToday?'':`<div class="grid-form">
      <label class="field"><span>Ngày tập</span><input id="lg-date" type="date" data-act="logdate" value="${esc(ui.logDate)}"></label>
      <label class="field"><span>Buổi</span><select id="lg-day" data-act="logday">${days.map(x=>`<option value="${x.i}" ${x.i===ui.logDay?'selected':''}>${DAY_LABELS[x.i]} – ${esc(x.d.name)}</option>`).join('')}</select></label>
    </div>`}
    ${inToday?`<button class="btn primary wo-big" data-act="wostart">${dn?'Tiếp tục tập':'Bắt đầu tập'}</button>`:''}
    <div class="row" style="justify-content:space-between"><b>Bài ${Math.min(exDone+1,nEx)}/${nEx} · ${dn}/${tot} set</b><span class="small muted">Tự lưu khi nhập</span></div>
    <div class="bar"><i style="width:${tot?dn/tot*100:0}%;background:var(--ok)"></i></div>
    <div class="exl">${info.map(x=>{const ex=LIB[x.it.ex]||{n:x.it.ex};const open=x.i===ui.openEx;
      const st=x.n===0?'<span class="chip">Bỏ qua tuần này</span>':x.done>=x.n?`<span class="chip ok">✓ ${x.done}/${x.n}</span>`:x.done?`<span class="chip warn">${x.done}/${x.n} set</span>`:`<span class="chip">${x.n} set</span>`;
      if(!open)return `<button class="exl-row ${x.n&&x.done>=x.n?'done':''}" data-act="exopen" data-i="${x.i}"><span class="exl-n">${esc(ex.n)}</span>${st}</button>`;
      const last=lastFor(x.it.ex),ad=advise(x.it.ex,x.it.reps);
      return `<div class="exl-open">
        <button class="exl-row" data-act="exopen" data-i="-1"><span class="exl-n"><b>${esc(ex.n)}</b></span>${st}</button>
        <div class="row" style="gap:10px;align-items:center;flex-wrap:nowrap"><div style="width:150px;flex:none">${bodyMap(exAct(x.it.ex),{cls:'sm',label:'Nhóm cơ của '+((LIB[x.it.ex]||{}).n||'')})}</div><div style="display:flex;flex-direction:column;gap:6px;min-width:0">${musLine(x.it.ex)}<button class="btn small" data-act="how" data-ex="${x.it.ex}">Cách tập</button></div></div>
        ${x.D.skip?`<div class="dose skip">Tuần ${curWeek()}: bỏ qua, bắt đầu từ tuần ${fromWeek(x.it)}</div>`:`<div class="dose">${x.n} set × ${esc(x.it.reps)} · <b>RIR ${x.D.rir}</b> (RPE ${x.D.rpe}) · nghỉ ${x.D.rest}</div>
        <div class="small muted">${last?`Lần trước (${dshort(last.d)}): ${setsText(last.sets)}`:'Chưa có lần trước: chọn mức tạ còn dư khoảng '+x.D.rir+' rep.'}${ad?` <span class="chip ${ad[0]}">${ad[1]}</span>`:''}</div>
        <div class="sets2">${Array.from({length:x.n},(_,s)=>{const kk=`${ui.logDay}-${x.i}-${s}`,pk=lastSet(x.it.ex,s),kg=dr[kk+'-kg']||'',r=dr[kk+'-r']||'',ok=num(r)>0;
          return `<div class="set2 ${ok?'ok':''}"><span class="set2-n">${s+1}</span>
            <input id="lk-${kk}" type="number" inputmode="decimal" step="0.5" data-act="draft" data-key="${kk}-kg" value="${esc(kg)}" placeholder="${pk?fmt(pk.kg,1):'kg'}" aria-label="Kg set ${s+1}"><span class="muted">kg ×</span>
            <input id="lr-${kk}" type="number" inputmode="numeric" data-act="draft" data-key="${kk}-r" value="${esc(r)}" placeholder="${pk?pk.r:'rep'}" aria-label="Rep set ${s+1}">
            <button class="set2-ok" data-act="setok" data-i="${x.i}" data-s="${s}" aria-label="Xong set ${s+1}${pk?', giống lần trước':''}">✓</button></div>`}).join('')}</div>
        <p class="small muted">Bấm ✓ để xác nhận set; ô trống sẽ được điền số lần trước.</p>`}
        <div class="row" style="justify-content:flex-end"><button class="btn small" data-act="exnext" data-i="${x.i}">Bài tiếp ›</button></div>
      </div>`}).join('')}</div>
    <div class="row"><button class="btn primary" data-act="savelog">Lưu buổi tập</button><button class="btn" data-act="fillprev">Điền tất cả theo lần trước</button></div>
  </section>`;
}
function vHist(){
  const exs=[];S.logs.forEach(L=>L.entries.forEach(e=>{if(!exs.includes(e.ex))exs.push(e.ex)}));
  if(!S.logs.length)return `<div class="note-box">Chưa có buổi tập nào được ghi. Vào mục "Ghi buổi tập", nhập kg và rep sau mỗi buổi; lịch sử và biểu đồ tạ sẽ hiện ở đây.</div>`;
  if(!ui.histEx||!exs.includes(ui.histEx))ui.histEx=exs[0];
  const rows=S.logs.map(L=>({d:L.d,e:L.entries.find(x=>x.ex===ui.histEx)})).filter(x=>x.e);
  const pts=rows.map(r=>({x:r.d,y:Math.max(...r.e.sets.map(s=>s.kg))}));
  return `
  <section class="card">
    <label class="field"><span>Bài tập</span><select id="hist-ex" data-act="histex">${exs.map(id=>`<option value="${id}" ${id===ui.histEx?'selected':''}>${esc((LIB[id]||{n:id}).n)}</option>`).join('')}</select></label>
    <span class="eyebrow">Tạ nặng nhất mỗi buổi (kg)</span>
    ${chart(pts,'kg','Tạ nặng nhất theo buổi')}
    <div class="scroll"><table class="tbl"><thead><tr><th>Ngày</th><th>Các set (kg × rep)</th><th class="r">1RM ước tính</th><th class="r">Tổng khối lượng</th></tr></thead><tbody>
    ${rows.slice().reverse().map(r=>`<tr><td>${dshow(r.d)}</td><td>${setsText(r.e.sets)}</td><td class="r">${fmt(Math.max(...r.e.sets.map(s=>s.kg*(1+s.r/30))),1)} kg</td><td class="r">${fmt(r.e.sets.reduce((a,s)=>a+s.kg*s.r,0))} kg</td></tr>`).join('')}
    </tbody></table></div>
  </section>
  <section class="card">
    <h3>Các buổi đã ghi</h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Ngày</th><th>Buổi</th><th class="r">Số bài</th><th></th></tr></thead><tbody>
    ${S.logs.slice().reverse().map(L=>`<tr><td>${dshow(L.d)}</td><td>${esc(L.name)}</td><td class="r">${L.entries.length}</td><td class="r">${armBtn('log-'+L.id,'Xóa')}</td></tr>`).join('')}
    </tbody></table></div>
  </section>`;
}


/* ---------- picker (thư viện) ---------- */
function openPicker(mode,target){ovOpened();ui.modal={mode,target,q:'',grp:'all'};renderModal();setTimeout(()=>{const i=$('#pk-q');if(i)i.focus()},30)}
function closePicker(){ui.modal=null;const m=$('#modal');m.hidden=true;m.innerHTML=''}
/* nút Back của Android: đóng cửa sổ đang mở (chọn bài/món, chi tiết bài, chế độ tập) thay vì thoát app.
   Khi mở cửa sổ: thêm một mục vào lịch sử trình duyệt (nếu chưa có); bấm Back thì trình duyệt bỏ mục đó và báo popstate.
   Đóng bằng nút ✕ thì giữ lại mục đó cho lần mở sau, không gọi history.back() (gọi dồn dập dễ lùi quá tay, thoát khỏi app). */
let ovEntry=false; /* đang có một mục lịch sử do app thêm, chưa dùng tới */
const anyOv=()=>!!(ui.modal||ui.how||WO.on);
function ovOpened(){if(!ovEntry){history.pushState({ov:1},'');ovEntry=true}}
window.addEventListener('popstate',()=>{ovEntry=false;
  if(!anyOv()){history.back();return} /* không có cửa sổ nào mở: Back thêm một bước để thoát như bình thường */
  if(ui.how)howBack();else if(ui.modal)closePicker();else if(WO.on){if(WO.swap){WO.swap=false;woRender()}else woExit()}
  if(anyOv())ovOpened()});
function renderModal(){
  const M=ui.modal,el=$('#modal');if(!M){el.hidden=true;return}
  el.hidden=false;
  const isEx=M.mode==='ex';
  const groups=isEx?MUSCLES:FOOD_CATS;
  const q=M.q.trim().toLowerCase();
  let list=isEx?Object.values(LIB):Object.values(FOODS).concat(S.customFoods);
  const nq=norm(q);list=list.filter(x=>(M.grp==='all'||(isEx?x.m:x.cat)===M.grp)&&(!nq||norm(isEx?x.n+' '+viName(x.id):x.n).includes(nq)));
  let html='';
  if(isEx&&M.grp==='all'&&(S.favs||[]).length){const fv=list.filter(x=>S.favs.includes(x.id));if(fv.length)html+=`<div class="grp">★ Yêu thích</div>`+fv.map(x=>`<button class="pick" data-act="pick" data-id="${x.id}">${ANH[x.id]?`<img class="thumb" src="${anhSrc(x.id,0)}" alt="" loading="lazy" decoding="async">`:'<span class="thumb"></span>'}<span class="l"><span class="nm">${esc(viName(x.id))}</span>${viName(x.id)!==x.n?`<span class="small muted">${esc(x.n)}</span>`:''}${musLine(x.id)}</span></button>`).join('')}
  groups.forEach(g=>{const items=list.filter(x=>(isEx?x.m:x.cat)===g);if(!items.length)return;
    html+=`<div class="grp">${g}</div>`+items.map(x=>isEx?
      `<button class="pick" data-act="pick" data-id="${x.id}">${ANH[x.id]?`<img class="thumb" src="${anhSrc(x.id,0)}" alt="" loading="lazy" decoding="async">`:'<span class="thumb"></span>'}<span class="l"><span class="nm">${esc(viName(x.id))}</span>${viName(x.id)!==x.n?`<span class="small muted">${esc(x.n)}</span>`:''}${musLine(x.id)}<span class="ex-tags"><span class="chip">${x.t==='C'?'Compound':'Cô lập'}</span>${flagChips(x)}</span>${flagsFor(x).length?`<span class="small muted">${esc(FLAGS[flagsFor(x)[0]][2])}</span>`:''}</span></button>`:
      `<button class="pick" data-act="pick" data-id="${x.id}"><span class="l"><span class="nm">${esc(x.n)}</span><span class="small muted">${per100(x)?'100 '+x.u:'1 '+esc(x.u)}: ${fmt(x.k)} kcal · P ${fmt(x.p,1)} · C ${fmt(x.c,1)} · F ${fmt(x.f,1)} · xơ ${fmt(x.fb,1)}${x.note?' · '+esc(x.note):''}</span></span></button>`).join('')});
  el.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${isEx?'Thư viện bài tập':'Thư viện thực phẩm'}">
    <div class="sheet-head">
      <div class="row" style="justify-content:space-between"><h3>${isEx?'Thư viện bài tập':'Thư viện thực phẩm'}</h3><button class="icon-btn" data-act="closepk" aria-label="Đóng">✕</button></div>
      <input id="pk-q" data-act="pkq" placeholder="Tìm theo tên" value="${esc(M.q)}" autocomplete="off">
      <div class="filters"><button data-act="pkg" data-g="all" aria-pressed="${M.grp==='all'}">Tất cả</button>${groups.map(g=>`<button data-act="pkg" data-g="${esc(g)}" aria-pressed="${M.grp===g}">${esc(g)}</button>`).join('')}</div>
    </div>
    <div class="sheet-list">${html||'<p class="small muted" style="padding:12px 8px">Không có kết quả.</p>'}</div>
  </div>`;
}
function renderModalList(){const pos=$('#pk-q')?$('#pk-q').selectionStart:null;renderModal();const i=$('#pk-q');if(i){i.focus();if(pos!=null)i.setSelectionRange(pos,pos)}}

/* ---------- render chính ---------- */
function vToday(){
  const d=today(),wd=weekdayIdx(d),day=S.plan[wd],w=curWeek(),P=PHASE[w],D=getDay(d);
  if(ui.todayInit!==d){ui.todayInit=d;ui.logDate=d;ui.checkDate=d;if(day.items.length)ui.logDay=wd}
  ui.checkDate=d;
  const done=S.logs.some(L=>L.d===d);const e=sessionEst(day);
  const hasData=S.logs.length||S.body.length||Object.keys(S.checks).length;
  const bkOld=hasData&&(!S.lastBackup||daysBetween(S.lastBackup,d)>=7);
  return `${bkOld?`<div class="note-box warn" style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:12px"><span class="small">${S.lastBackup?`Đã ${Math.floor(daysBetween(S.lastBackup,d))} ngày chưa sao lưu.`:'Chưa sao lưu lần nào.'} Mất máy hoặc xoá dữ liệu Chrome là mất hết số liệu.</span><button class="btn small primary" data-act="more" data-t="goal">Sao lưu</button></div>`:''}
  <h2 class="sec">${DAY_LABELS[wd]}, ${dshow(d)}</h2>
  <section class="card">
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div><span class="eyebrow">Buổi hôm nay · Tuần ${w} (${P[0]})</span><div class="num" style="font-size:26px;line-height:1.1">${esc(day.name)}</div></div>
      ${done?'<span class="chip ok">Đã lưu buổi tập</span>':''}
    </div>
    ${day.items.length?sessTiles(day):''}
    ${(S.dayNotes||{})[wd]?`<div class="note-box small">✎ ${esc(S.dayNotes[wd])}</div>`:''}
    ${day.items.length?`<p class="small muted">${day.items.length} bài · ~${fmt(Math.round(e.min/5)*5)} phút · ~${fmt(Math.round(e.kcal/10)*10)} kcal. Bài compound: RIR ${P[1]}; bài cô lập: RIR ${P[2]}${w===8?'; tuần deload: giảm một nửa số set, giữ tạ':''}.</p>`:'<p class="small muted">Hôm nay nghỉ tập tạ.</p>'}
    ${num(day.cardio)?`<label class="ck ${D.cardio?'on':''}" style="grid-template-columns:30px minmax(0,1fr) auto"><span class="ck-box"><input type="checkbox" id="td-cardio" data-act="tdcardio" ${D.cardio?'checked':''}></span><span class="ck-t"><span class="ck-n">Cardio: ${esc((CARDIO[day.cardioType]||CARDIO.walk_steep)[0])}, ${num(day.cardio)} phút</span><span class="small muted">Tách ca, cách buổi tạ hoặc buổi chân ít nhất vài tiếng</span></span><span class="small muted ck-k">~${fmt(Math.round(e.cardioKcal/10)*10)} kcal</span></label>`:''}
  </section>
  ${day.items.length?vLog(true):''}
  ${vCheck(true)}`;
}
/* ô đang nhập: nhận ra lại sau khi vẽ lại màn hình (theo id hoặc các thuộc tính data-*) */
function focusKey(el){if(!el||!el.matches||!el.matches('#view input,#view textarea,#view select'))return null;if(el.id)return '#'+CSS.escape(el.id);
  const ds=Object.entries(el.dataset).map(([k,v])=>`[data-${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${CSS.escape(v)}"]`).join('');return ds?el.tagName.toLowerCase()+ds:null}
/* đang nhấn giữ màn hình thì chờ nhấc tay rồi mới vẽ lại, để không thay mất nút người dùng đang bấm */
let ptrDown=false,renderPending=false;
document.addEventListener('pointerdown',()=>{ptrDown=true},true);
const ptrEnd=()=>{ptrDown=false;if(renderPending){renderPending=false;setTimeout(render,0)}};
document.addEventListener('pointerup',ptrEnd,true);document.addEventListener('pointercancel',ptrEnd,true);
function renderSoon(){if(ptrDown)renderPending=true;else render()}
function render(){
  memo.calc=memo.rec=null;renderPending=false;
  renderTop();
  const v=$('#view');
  const y=window.scrollY;
  const fa=document.activeElement,fk=focusKey(fa);let sel=null;try{sel=fa&&fa.selectionStart}catch(_){}
  const more=`<div class="seg" role="group" aria-label="Mục" style="margin-top:4px"><button data-act="more" data-t="goal" aria-pressed="${ui.tab==='goal'}">Mục tiêu & sao lưu</button><button data-act="more" data-t="notes" aria-pressed="${ui.tab==='notes'}">Ghi chú & công thức</button></div>`;
  v.innerHTML=ui.tab==='today'?vToday():ui.tab==='goal'?more+vGoal():ui.tab==='plan'?vPlan():ui.tab==='meal'?vMeal():ui.tab==='track'?vTrack():more+vNotes();
  window.scrollTo(0,y);
  if(fk){const n=v.querySelector(fk);if(n&&n!==document.activeElement){n.focus({preventScroll:true});try{if(sel!=null&&n.setSelectionRange)n.setSelectionRange(sel,sel)}catch(_){}}}
}
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},2200)}

/* ---------- sự kiện ---------- */
document.addEventListener('click',e=>{
  const tab=e.target.closest('#tabs button');
  if(tab){const t=tab.dataset.tab;ui.tab=t==='more'?(ui.moreTab||'goal'):t;ui.armed=null;render();window.scrollTo(0,0);return}
  if(e.target.id==='modal'){closePicker();return}
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,d=+b.dataset.d,i=+b.dataset.i,m=+b.dataset.m;
  if(a!=='arm'&&ui.armed){ui.armed=null}
  switch(a){
    case 'goal':S.profile.goal=b.dataset.g;break;
    case 'backup':ui.backup=!ui.backup;break;
    case 'copy':{const ta=$('#bk-out');const txt=ta.value;
      const fallback=()=>{ta.focus();ta.select();toast('Đã chọn mã, nhấn giữ để sao chép')};
      try{navigator.clipboard.writeText(txt).then(()=>toast('Đã sao chép mã sao lưu'),fallback)}catch(_){fallback()}return}
    case 'restore':{const raw=$('#bk-in').value.trim();try{const o=JSON.parse(raw);if(!validBackup(o))throw 0;applyBackup(o);ui.backup=false;toast('Đã khôi phục dữ liệu')}catch(_){toast('Mã sao lưu không hợp lệ. Kiểm tra lại đoạn đã dán.');return}break}
    case 'dlbackup':{const day=today();
      if(WEB){localDownload(`so-tap-an-${day}.json`,JSON.stringify(S,null,1));S.lastBackup=day;save();render();toast('Đã tải file vào thư mục Downloads');return}
      if(!DL)return;
      DL.save({filename:`so-tap-an-${day}.json`,data:JSON.stringify(S,null,1)}).then(()=>{S.lastBackup=day;save();render();toast('Đã lưu file sao lưu')}).catch(err=>{const c=err&&err.code;
        toast(c==='declined'?'Đã hủy lưu file':c==='rate_limited'?'Đang có hộp thoại lưu file, thử lại sau ít giây':'Không lưu được file ở đây. Dùng mã sao lưu dạng chữ.')});return}
    case 'sharebackup':{const day=today();
      const file=new File([JSON.stringify(S,null,1)],`so-tap-an-${day}.txt`,{type:'text/plain'});
      navigator.share({files:[file],title:'Sao lưu Sổ Tập & Ăn '+dshow(day)}).then(()=>{S.lastBackup=day;save();render();toast('Đã gửi file sao lưu')})
        .catch(err=>{if(!err||err.name!=='AbortError')toast('Không gửi được. Thử nút "Tải file sao lưu".')});return}
    case 'importok':
    case 'impmerge':{const P=ui.pendingImport;if(!P)return;if(a==='importok'){applyBackup(P.data);toast('Đã thay toàn bộ bằng dữ liệu trong file')}else{mergeData(P.data);toast('Đã gộp nhật ký từ file')}
      ui.pendingImport=null;if(P.handle){fhResume(P.handle)}break}
    case 'importno':ui.pendingImport=null;break;
    case 'fhnew':fhNew();return;
    case 'fhopen':fhOpen();return;
    case 'fhresume':fhResume(ui.fhPending);return;
    case 'fhforget':ui.fhPending=null;idbSet('fh',null);break;
    case 'fhstop':fileHandle=null;ui.fhPending=null;idbSet('fh',null);toast('Đã ngừng tự lưu');break;
    case 'arm':{const k=b.dataset.key;if(ui.armed!==k){ui.armed=k;render();return}ui.armed=null;doDelete(k);break}
    case 'swap':openPicker('ex',{d,i});return;
    case 'addex':openPicker('ex',{d,i:-1});return;
    case 'up':if(i>0){const L=S.plan[d].items;[L[i-1],L[i]]=[L[i],L[i-1]]}break;
    case 'down':{const L=S.plan[d].items;if(i<L.length-1)[L[i+1],L[i]]=[L[i],L[i+1]];break}
    case 'delex':S.plan[d].items.splice(i,1);break;
    case 'swapfood':openPicker('food',{m,i,scope:b.dataset.scope});return;
    case 'addfood':openPicker('food',{m,i:-1,scope:b.dataset.scope});return;
    case 'delfood':{const sc=b.dataset.scope,MM=scopeMeals(sc);if(sc==='day')withChecks(ui.checkDate,MM,()=>MM[m].items.splice(i,1));else MM[m].items.splice(i,1);break}
    case 'addmeal':scopeMeals(b.dataset.scope).push({name:b.dataset.scope==='day'?'Bữa thêm':'Bữa mới',items:[]});break;
    case 'qasel':{const f=food(b.dataset.id);ui.qa.sel=f.id;ui.qa.qty=String(per100(f)?100:1);break}
    case 'qaclear':ui.qa.sel=null;break;
    case 'qasize':ui.qa.qty=b.dataset.m;break;
    case 'qaman':ui.qa.manual=!ui.qa.manual;break;
    case 'qaadd':{const Q=ui.qa,f=food(Q.sel);if(!f||!(num(Q.qty)>0)){toast('Nhập số lượng lớn hơn 0');return}
      const x=addToDay(ui.checkDate,f.id,num(Q.qty),Q.meal,Q.ate);ui.qa={q:'',sel:null,qty:'',meal:'',ate:true,manual:false,mn:Q.mn};
      toast(`Đã thêm ${f.n}: ${fmt(x.k)} kcal. Bấm "Cân lại ngày này" để chỉnh các bữa còn lại.`);break}
    case 'qmadd':{const Q=ui.qa,M=Q.mn;if(!M.n.trim()||!(num(M.k)>0)){toast('Cần nhập tên món và kcal');return}
      const cf={id:'cf'+Date.now(),n:M.n.trim(),cat:'Tự nhập',u:'phần',k:num(M.k),p:num(M.p),c:num(M.c),f:num(M.f),fb:0,note:'Nhập tay'};S.customFoods.push(cf);
      addToDay(ui.checkDate,cf.id,1,Q.meal,Q.ate);ui.qa={q:'',sel:null,qty:'',meal:'',ate:true,manual:false,mn:{n:'',k:'',p:'',c:'',f:''}};
      toast(`Đã thêm ${cf.n}: ${fmt(cf.k)} kcal`);break}
    case 'wk':{let w=viewWeek()+(+b.dataset.delta);if(w<1)w=8;if(w>8)w=1;ui.week=w===curWeek()?null:w;break}
    case 'wknow':ui.week=null;break;
    case 'resetday':delete S.dayMeals[ui.checkDate];toast('Đã dùng lại thực đơn mặc định cho ngày này');break;
    case 'balanceday':{const r=balanceDay(ui.checkDate),c=calc();const nm={p:'đạm (thịt, cá)',c:'tinh bột (cơm, khoai)',f:'chất béo (hạt, dầu)'};
      toast(`Đã cân lại: P ${fmt(r.p)}/${c.pro} · C ${fmt(r.c)}/${r.ct} · F ${fmt(r.f)}/${c.fat} g`+(r.missing.length?`. Chưa có món ${r.missing.map(g=>nm[g]).join(', ')} để chỉnh`:''));break}
    case 'newmenu':{const CM=curMenu();const used=S.menus.map(x=>x.name);let ch=65;while(used.includes('Thực đơn '+String.fromCharCode(ch))&&ch<90)ch++;
      const nm={id:'m'+Date.now(),name:'Thực đơn '+String.fromCharCode(ch),meals:clone(CM.meals)};S.menus.push(nm);ui.editMenu=nm.id;toast('Đã tạo '+nm.name);break}
    case 'mview':ui.mealView=b.dataset.v;break;
    case 'ckedit':ui.ckEdit=ui.ckEdit===b.dataset.key?null:b.dataset.key;break;
    case 'more':ui.tab=ui.moreTab=b.dataset.t;window.scrollTo(0,0);break;
    case 'ckday':ui.checkDate=addDays(ui.checkDate,+b.dataset.delta);ui.qa.meal='';break;
    case 'cktoday':ui.checkDate=today();break;
    case 'ckgo':ui.checkDate=b.dataset.date;break;
    case 'ckmeal':{const D=ensureDay(ui.checkDate);const M=dayMeals(ui.checkDate)[m];const all=M.items.every((it,ii)=>D.items[ckKey(m,ii,it)]);M.items.forEach((it,ii)=>{const k=ckKey(m,ii,it);if(all)delete D.items[k];else D.items[k]=true});break}
    case 'water':{const D=ensureDay(ui.checkDate);D.water=Math.max(0,(D.water||0)+(+b.dataset.delta));break}
    case 'asktpl':ui.confirmTpl=true;break;
    case 'canceltpl':ui.confirmTpl=false;break;
    case 'applytpl':curMenu().meals=suggestMeals(ui.tplId);ui.confirmTpl=false;save();render();toast('Đã tạo thực đơn theo mục tiêu');return;
    case 'addcf':{const c=ui.cf;if(!c.n.trim()||!(num(c.k)>0)){toast('Cần nhập tên món và kcal');return}
      S.customFoods.push({id:'cf'+Date.now(),n:c.n.trim(),cat:'Tự nhập',u:c.u,k:num(c.k),p:num(c.p),c:num(c.c),f:num(c.f),fb:num(c.fb),note:''});
      ui.cf={n:'',u:'g',k:'',p:'',c:'',f:'',fb:''};toast('Đã thêm vào thư viện');break}
    case 'sub':ui.sub=b.dataset.s;break;
    case 'addbody':{const f=ui.bodyForm;if(!f.d||!(num(f.w)>0||num(f.waist)>0)){toast('Nhập ngày và ít nhất cân nặng hoặc vòng eo');return}
      const ex=S.body.find(x=>x.d===f.d);const rec={id:ex?ex.id:Date.now(),d:f.d,w:num(f.w)||null,waist:num(f.waist)||null,note:f.note};
      if(ex)Object.assign(ex,rec);else S.body.push(rec);
      ui.bodyForm={d:today(),w:'',waist:'',note:''};toast('Đã lưu số đo');break}
    case 'fillprev':{logInfo().forEach(x=>{for(let s=0;s<x.n;s++){const p=lastSet(x.it.ex,s);if(!p)continue;const kk=`${ui.logDay}-${x.i}-${s}`;const dr=DR();if(!dr[kk+'-r']){DRset(kk+'-kg',p.kg);DRset(kk+'-r',p.r)}}});ui.openEx=nextOpen(logInfo(),-1);break}
    case 'exopen':ui.openEx=+b.dataset.i;break;
    case 'how':openHow(b.dataset.ex);return;
    case 'howback':howBack();return;
    case 'howgo':openHow(b.dataset.ex,true);return;
    case 'howpause':ui.howPaused=!ui.howPaused;howRerender();return;
    case 'howwhy':ui.howWhy=!ui.howWhy;howRerender();return;
    case 'howtab':ui.howTab=b.dataset.t;howRerender();return;
    case 'howfav':{const id=b.dataset.ex;S.favs=S.favs||[];const k=S.favs.indexOf(id);if(k<0)S.favs.push(id);else S.favs.splice(k,1);save();howRerender();return}
    case 'wostart':woStart();return;
    case 'pday':ui.planDay=+b.dataset.d;ui.sxEdit=ui.sxMenu=null;break;
    case 'sxedit':ui.sxEdit=ui.sxEdit===b.dataset.key?null:b.dataset.key;ui.sxMenu=null;break;
    case 'sxmenu':ui.sxMenu=ui.sxMenu===b.dataset.key?null:b.dataset.key;ui.sxEdit=null;break;
    case 'wkopen':ui.wkOpen=!ui.wkOpen;return;
    case 'sessstart':ui.logDay=+b.dataset.d;ui.logDate=today();ui.openKey=null;woStart();return;
    case 'woexit':woExit();return;
    case 'wopm':{const V=woVals();woSetVal(b.dataset.f,(b.dataset.f==='kg'?V.kg:V.r)+num(b.dataset.d));woRender();return}
    case 'wodone':{const V=woVals();if(!(V.r>0)){toast('Nhập số rep');return}DRset(V.kk+'-kg',V.kg);DRset(V.kk+'-r',V.r);if(ui.woTmp)delete ui.woTmp[V.kk];save();checkPR(effEx(ui.logDay,WO.i),V.kg,V.r);
      const sec=num(S.plan[ui.logDay].items[WO.i].rest)||restSec({ex:effEx(ui.logDay,WO.i)});const more=woAdvance();if(more){WO.rest={end:Date.now()+sec*1000,total:sec}}woRender();return}
    case 'woplus':if(WO.rest){WO.rest.end+=30000;WO.rest.total+=30}woTick();return;
    case 'woskip':WO.rest=null;clearInterval(WO.timer);woRender();return;
    case 'wonext':{if(!woAdvance()){}woRender();return}
    case 'woprev':{if(WO.s>0)WO.s--;else{const info=logInfo();for(let j=WO.i-1;j>=0;j--)if(info[j].n>0){WO.i=j;WO.s=info[j].n-1;break}}woRender();return}
    case 'wofinish':WO.sum=true;WO.rest=null;woRender();return;
    case 'woback':{const f=woFirst();WO.sum=false;if(f){WO.i=f[0];WO.s=f[1]}else WO.sum=true;woRender();return}
    case 'wosave':if(saveLog()){save();toast('Đã lưu buổi tập');woExit()}return;
    case 'woswap':WO.swap=true;woRender();return;
    case 'woswapcancel':WO.swap=false;woRender();return;
    case 'woswapto':setSwap(ui.logDay,WO.i,b.dataset.id);WO.swap=false;save();woRender();return;
    case 'exnext':ui.openEx=nextOpen(logInfo(),+b.dataset.i);break;
    case 'setok':{const i=+b.dataset.i,s_=+b.dataset.s,it={ex:effEx(ui.logDay,i)},kk=`${ui.logDay}-${i}-${s_}`,dr=DR(),p=lastSet(it.ex,s_);
      if(!dr[kk+'-r']){if(!p){toast('Chưa có lần trước, hãy nhập kg và rep');return}DRset(kk+'-r',p.r);if(!dr[kk+'-kg'])DRset(kk+'-kg',p.kg)}
      const x=logInfo()[i];if(x.done>=x.n)ui.openEx=nextOpen(logInfo(),i);break}
    case 'savelog':if(saveLog()){save();render();toast('Đã lưu buổi tập')}return;
    case 'closepk':closePicker();return;
    case 'pkg':ui.modal.grp=b.dataset.g;renderModalList();return;
    case 'pick':{const M=ui.modal,id=b.dataset.id;
      if(M.mode==='ex'){const L=S.plan[M.target.d].items;if(M.target.i<0)L.push({ex:id,sets:3,reps:LIB[id].t==='C'?'8–12':'12–15',note:''});else L[M.target.i].ex=id}
      else{const MM=scopeMeals(M.target.scope);const L=MM[M.target.m].items;const f=food(id);if(M.target.i<0)L.push({f:id,q:per100(f)?100:1});else{const old=food(L[M.target.i].f);L[M.target.i].f=id;if(old&&per100(old)!==per100(f))L[M.target.i].q=per100(f)?100:1}}
      closePicker();break}
    default:return;
  }
  save();render();
});
function doDelete(k){
  if(k==='reset'){S=defaults();migrate();ui.editMenu=null;toast('Đã đặt lại về mặc định');return}
  if(k.startsWith('mealx:')){const[,sc,mi]=k.split(':');const MM=scopeMeals(sc);if(sc==='day')withChecks(ui.checkDate,MM,()=>MM.splice(+mi,1));else MM.splice(+mi,1);return}
  if(k.startsWith('menux:')){const id=k.slice(6);if(S.menus.length<2)return;S.menus=S.menus.filter(x=>x.id!==id);S.weekMenu=S.weekMenu.map(w=>w===id?S.menus[0].id:w);ui.editMenu=null;toast('Đã xóa thực đơn');return}
  const[t,...rest]=k.split('-');const id=rest.join('-');
  if(t==='body')S.body=S.body.filter(x=>String(x.id)!==id);
  else if(t==='log')S.logs=S.logs.filter(x=>String(x.id)!==id);
  else if(t==='cf')S.customFoods=S.customFoods.filter(x=>x.id!==id);
}
document.addEventListener('input',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,d=+b.dataset.d,i=+b.dataset.i,m=+b.dataset.m;
  switch(a){
    case 'dayname':S.plan[d].name=b.value;save();return;
    case 'reps':S.plan[d].items[i].reps=b.value;save();return;
    case 'note':S.plan[d].items[i].note=b.value;save();return;
    case 'mealname':scopeMeals(b.dataset.scope)[m].name=b.value;save();return;
    case 'menuname':curMenu().name=b.value;save();return;
    case 'cf':ui.cf[b.dataset.k]=b.value;return;
    case 'cknote':ensureDay(ui.checkDate).note=b.value;save();return;
    case 'qaq':{ui.qa.q=b.value;const r=$('#qa-results');if(r)r.innerHTML=qaResults();return}
    case 'qm':ui.qa.mn[b.dataset.k]=b.value;return;
    case 'bform':ui.bodyForm[b.dataset.k]=b.value;return;
    case 'draft':DRset(b.dataset.key,b.value);save();return;
    case 'wonum':woSetVal(b.dataset.f,num(b.value));return;
    case 'daynote':{S.dayNotes=S.dayNotes||{};if(b.value.trim())S.dayNotes[b.dataset.d]=b.value;else delete S.dayNotes[b.dataset.d];save();return}
    case 'exnote':{S.exNotes=S.exNotes||{};if(b.value.trim())S.exNotes[b.dataset.ex]=b.value;else delete S.exNotes[b.dataset.ex];save();return}
    case 'pkq':ui.modal.q=b.value;renderModalList();return;
  }
});
document.addEventListener('change',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,d=+b.dataset.d,i=+b.dataset.i,m=+b.dataset.m;
  switch(a){
    case 'pf':{const v=num(b.value);const k=b.dataset.k;if(k==='bf'?v<0||v>60:!(v>0))return;S.profile[k]=v;break}
    case 'pfs':S.profile[b.dataset.k]=b.dataset.k==='act'?num(b.value):b.value;break;
    case 'pfc':S.profile[b.dataset.k]=b.checked;break;
    case 'sets':S.plan[d].items[i].sets=Math.max(1,Math.round(num(b.value))||1);break;
    case 'cardio':S.plan[d].cardio=Math.max(0,num(b.value));break;
    case 'cardiotype':S.plan[d].cardioType=b.value;break;
    case 'rest':S.plan[d].items[i].rest=Math.max(0,Math.round(num(b.value)));break;
    case 'ckitem':{const D=ensureDay(ui.checkDate);if(b.checked)D.items[b.dataset.key]=true;else delete D.items[b.dataset.key];break}
    case 'ckcrea':ensureDay(ui.checkDate).creatine=b.checked;break;
    case 'tdcardio':ensureDay(today()).cardio=b.checked;break;
    case 'ckdate':if(b.value)ui.checkDate=b.value;break;
    case 'bkfile':{const file=b.files&&b.files[0];if(!file)return;const rd=new FileReader();
      rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!validBackup(o))throw 0;ui.pendingImport={name:file.name,data:o};render()}catch(_){toast('File không phải file sao lưu của trang này')}};
      rd.onerror=()=>toast('Không đọc được file');rd.readAsText(file);return}
    case 'qty':scopeMeals(b.dataset.scope)[m].items[i].q=Math.max(0,num(b.value));break;
    case 'cook':{const it=scopeMeals(b.dataset.scope)[m].items[i];if(b.value)it.ck=b.value;else delete it.ck;break}
    case 'daymenu':{const d=ui.checkDate;if(!b.value)return;if(b.value===menuFor(d).id)delete S.dayMeals[d];else S.dayMeals[d]=clone(S.menus.find(x=>x.id===b.value).meals);break}
    case 'weekmenu':S.weekMenu[+b.dataset.w]=b.value;break;
    case 'draft':{if(!/-r$/.test(b.dataset.key))return;const i=+b.dataset.key.split('-')[1];const x=logInfo()[i];if(x&&x.done>=x.n&&ui.openEx===i){ui.openEx=nextOpen(logInfo(),i);render()}return}
    case 'wkset':{const n=+b.value;const t=new Date(today()+'T00:00:00');t.setDate(t.getDate()-((t.getDay()+6)%7)-7*(n-1));S.progStart=new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10);ui.week=null;break}
    case 'qaqty':ui.qa.qty=b.value;render();return;
    case 'qameal':ui.qa.meal=b.value;return;
    case 'qaate':ui.qa.ate=b.checked;return;
    case 'editmenu':ui.editMenu=b.value;ui.confirmTpl=false;break;
    case 'tpl':ui.tplId=b.value;ui.confirmTpl=false;break;
    case 'logday':ui.logDay=+b.value;break;
    case 'logdate':ui.logDate=b.value;return;
    case 'histex':ui.histEx=b.value;break;
    case 'cf':ui.cf[b.dataset.k]=b.value;return;
    default:return;
  }
  save();renderSoon();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(ui.how)closeHow();else if(ui.modal)closePicker();else if(WO.on)woExit()}});
/* ---------- đồng bộ qua tài khoản (db: data/users/<id>/…, riêng tư theo người dùng) ----------
   Mỗi mục là một tài liệu riêng: core (mục tiêu, lịch tập, thực đơn…), log:<id>, body:<ngày>, day:<ngày>.
   Hai thiết bị sửa hai mục khác nhau không ghi đè nhau. */
const SY={db:null,col:null,shadow:{},ready:false,st:'',busy:false,again:false,t:null,retry:null};
const SPLIT=['logs','body','checks','dayMeals','drafts'];
function toDocs(){const D={},core={};Object.keys(S).forEach(k=>{if(!SPLIT.includes(k))core[k]=S[k]});D.core=core;
  S.logs.forEach(l=>{D['log:'+l.id]=l});S.body.forEach(b=>{D['body:'+b.d]=b});
  const days=new Set(Object.keys(S.checks).concat(Object.keys(S.dayMeals)));
  days.forEach(d=>{D['day:'+d]={d,checks:S.checks[d]||null,meals:S.dayMeals[d]||null}});
  Object.keys(S.drafts||{}).forEach(d=>{const v=S.drafts[d];if(v&&!draftEmpty(v))D['draft:'+d]=v});return D}
function fromDocs(D){const N=Object.assign({},D.core||{});N.logs=[];N.body=[];N.checks={};N.dayMeals={};N.drafts={};
  Object.keys(D).forEach(k=>{const v=D[k];if(k.startsWith('log:'))N.logs.push(v);else if(k.startsWith('body:'))N.body.push(v);
    else if(k.startsWith('day:')){if(v.checks)N.checks[v.d]=v.checks;if(v.meals)N.dayMeals[v.d]=v.meals}else if(k.startsWith('draft:'))N.drafts[v.d]=v});
  N.logs.sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:x.id-y.id);return N}
const J=o=>JSON.stringify(o);
function setSt(st,msg){SY.st=st;const el=$('#syncSt');if(!el)return;el.className='sync-st '+st;el.innerHTML=msg?`<i></i>${esc(msg)}`:''}
function syncSchedule(){if(!SY.ready)return;clearTimeout(SY.t);SY.t=setTimeout(syncPush,700)}
async function syncPush(){if(!SY.ready)return;if(SY.busy){SY.again=true;return}SY.busy=true;
  const D=toDocs();const keys=Object.keys(D).filter(k=>J(D[k])!==SY.shadow[k]);const gone=Object.keys(SY.shadow).filter(k=>!(k in D));
  if(keys.length||gone.length)setSt('busy','Đang lưu lên tài khoản…');
  try{for(const k of keys){const body=JSON.parse(J(D[k]));await SY.col.doc(k).set(body);SY.shadow[k]=J(D[k])}
    for(const k of gone){await SY.col.doc(k).delete();delete SY.shadow[k]}
    setSt('ok','Đã đồng bộ với tài khoản');clearTimeout(SY.retry)}
  catch(e){const c=e&&e.code;
    if(c==='quota_exceeded')setSt('err','Bộ nhớ đồng bộ đã đầy, dữ liệu mới chỉ lưu trên máy này');
    else if(c==='revoked'||c==='not_granted'||c==='invalid_argument'){SY.ready=false;setSt('err','Không lưu lên tài khoản được, dữ liệu chỉ lưu trên máy này')}
    else{setSt('err','Chưa đồng bộ được, sẽ thử lại');clearTimeout(SY.retry);SY.retry=setTimeout(syncPush,8000)}}
  SY.busy=false;if(SY.again){SY.again=false;syncPush()}}
function typing(){const a=document.activeElement;return a&&a.matches&&a.matches('input:not([type=checkbox]),textarea')}
let pendingRender=false;
function applyRemote(changes){const L=toDocs();let changed=false;
  changes.forEach(ch=>{const k=ch.doc.id;
    if(ch.type==='removed'){if(k in L&&J(L[k])===SY.shadow[k]){delete L[k];changed=true}delete SY.shadow[k];return}
    const v=ch.doc.data(),jv=J(v);
    if(!SY.ready){/* lần đầu: dữ liệu tài khoản thắng; mục chỉ có trên máy này sẽ được tải lên */ if(J(L[k])!==jv){L[k]=JSON.parse(jv);changed=true}SY.shadow[k]=jv;return}
    if(SY.shadow[k]===jv)return;
    if(k in L&&J(L[k])!==SY.shadow[k]&&SY.shadow[k]!==undefined){SY.shadow[k]=jv;return}/* máy này đang có thay đổi chưa gửi: giữ bản của máy này */
    L[k]=JSON.parse(jv);SY.shadow[k]=jv;changed=true});
  if(changed){const keepTab=ui.tab;S=fromDocs(L);migrate();saveLocal();ui.tab=keepTab;if(typing())pendingRender=true;else{render();if(WO.on&&!WO.rest)woRender()}}}
document.addEventListener('focusout',()=>{if(pendingRender){setTimeout(()=>{if(!typing()){pendingRender=false;render()}},50)}});
async function syncStart(){
  if(!window.claude||typeof window.claude.use!=='function'){setSt('','');return}
  setSt('busy','Đang kết nối tài khoản…');
  let db=null,user=null;try{[db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')])}catch(_){}
  const uid=user?await user.id().catch(()=>null):null;
  if(!db||!uid){setSt('','Dữ liệu chỉ lưu trên máy này (chưa đăng nhập hoặc không đồng bộ được)');return}
  SY.db=db;SY.col=db.collection('data/users/'+uid);
  let first=true;
  SY.col.onSnapshot(snap=>{
    if(first){if(snap.metadata.fromCache)return;first=false;applyRemote(snap.docs.map(doc=>({type:'added',doc})));SY.ready=true;syncPush();return}
    applyRemote(snap.docChanges())},
    err=>{SY.ready=false;setSt('err','Mất kết nối đồng bộ. Tải lại trang để kết nối lại; dữ liệu vẫn lưu trên máy này.')});
}
if(ui_regenMeals){S.menus[0].meals=suggestMeals('hien_tai');ui_regenMeals=false}
if(ui_rebal){S.menus.forEach(m=>solveMacros(m.meals));ui_rebal=false}
save();
render();
woRestore();
syncStart();
})();
