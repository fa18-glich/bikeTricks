'use strict';

/* ══ FIREBASE CONFIG ══ */
const FB_CFG={
  apiKey:"AIzaSyDPMX7QYJM2_WnTBDfXGw4W_fN3fFCVF6M",
  authDomain:"mtb-skills-pro-38297.firebaseapp.com",
  projectId:"mtb-skills-pro-38297",
  storageBucket:"mtb-skills-pro-38297.firebasestorage.app",
  messagingSenderId:"771638572867",
  appId:"1:771638572867:web:524987af3a428dd553e1f6"
};
let db=null,auth=null,storage=null,currentUser=null,authMode='login',redirectHandled=false;

/* ══ UTILS ══ */
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function setT(id,t){const e=document.getElementById(id);if(e)e.textContent=t;}
function setLoadText(t){setT('loadText',t);}
function showMsg(msg,type){const e=document.getElementById('authMsg');e.textContent=msg;e.className='auth-msg '+(type||'err');}
function clearMsg(){const e=document.getElementById('authMsg');e.className='auth-msg';}

/* ══ PARTICLES ══ */
(function(){
  const c=document.getElementById('particles'),ctx=c.getContext('2d');
  let w,h,dots=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight;}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<50;i++)dots.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.4,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,a:Math.random()*.45+.1,col:Math.random()>.5?'76,201,240':'124,92,255'});
  function draw(){ctx.clearRect(0,0,w,h);dots.forEach(d=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0)d.x=w;if(d.x>w)d.x=0;if(d.y<0)d.y=h;if(d.y>h)d.y=0;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fillStyle=`rgba(${d.col},${d.a})`;ctx.fill();});for(let i=0;i<dots.length;i++)for(let j=i+1;j<dots.length;j++){const dx=dots[i].x-dots[j].x,dy=dots[i].y-dots[j].y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<90){ctx.beginPath();ctx.moveTo(dots[i].x,dots[i].y);ctx.lineTo(dots[j].x,dots[j].y);ctx.strokeStyle=`rgba(76,201,240,${.06*(1-dist/90)})`;ctx.lineWidth=.5;ctx.stroke();}}requestAnimationFrame(draw);}
  draw();
})();

/* ══ AUDIO ══ */
let AC=null;
function gac(){if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C();}if(AC&&AC.state==='suspended')AC.resume();return AC;}
const sfx={
  tick(){const ac=gac();if(!ac)return;const n=ac.currentTime,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(520,n);o.frequency.exponentialRampToValueAtTime(780,n+.07);g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(.12,n+.01);g.gain.linearRampToValueAtTime(0,n+.1);o.start(n);o.stop(n+.1);},
  levelUp(){const ac=gac();if(!ac)return;[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const t=ac.currentTime+i*.1,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.start(t);o.stop(t+.4);});},
  max(){const ac=gac();if(!ac)return;[659.25,783.99,1046.5,987.77,1046.5].forEach((f,i)=>{const t=ac.currentTime+i*.12,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.start(t);o.stop(t+.35);});},
  tab(){const ac=gac();if(!ac)return;const n=ac.currentTime,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=300;g.gain.setValueAtTime(.06,n);g.gain.exponentialRampToValueAtTime(.001,n+.06);o.start(n);o.stop(n+.06);},
  save(){const ac=gac();if(!ac)return;[440,550].forEach((f,i)=>{const t=ac.currentTime+i*.1,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.start(t);o.stop(t+.25);});},
  ach(){const ac=gac();if(!ac)return;[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>{const t=ac.currentTime+i*.08,g=ac.createGain(),o=ac.createOscillator();o.connect(g);g.connect(ac.destination);o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.5)})}
};

function confetti(n=55){const cols=['#4cc9f0','#7c5cff','#32d74b','#fbbf24','#ff453a','#f0f4ff'];for(let i=0;i<n;i++){const el=document.createElement('div');el.className='cf';const sz=Math.random()*10+5;el.style.cssText=`left:${Math.random()*100}vw;width:${sz}px;height:${sz*.5}px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${Math.random()*2+2}s;animation-delay:${Math.random()*.5}s;transform:rotate(${Math.random()*360}deg);`;document.body.appendChild(el);el.addEventListener('animationend',()=>el.remove());}}
let lvlT=null;
function showLvlUp(title,sub,emoji,isMax){const ov=document.getElementById('lvlUp');setT('lvlEmoji',emoji||'🔥');setT('lvlTitle',title);setT('lvlSub',sub||'');ov.classList.add('show');confetti(isMax?90:50);clearTimeout(lvlT);lvlT=setTimeout(()=>ov.classList.remove('show'),2200);}
let confirmCb=null;
function confirmAction(title,text,cb){confirmCb=cb;document.getElementById('confirmCont').innerHTML=`<div class="conf-ov" onclick="if(event.target===this)closeConf()"><div class="conf-box"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="conf-acts"><button class="btn btn-ghost" style="flex:1;" onclick="closeConf()">Отмена</button><button class="btn btn-danger" style="flex:1;" onclick="execConf()">Да</button></div></div></div>`;}
function closeConf(){document.getElementById('confirmCont').innerHTML='';confirmCb=null;}
function execConf(){if(confirmCb)confirmCb();closeConf();}
let toastT=null;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2500);}
let _saveTimer=null;
function saveCloudDebounced(ms=1500){clearTimeout(_saveTimer);_saveTimer=setTimeout(()=>saveCloud(),ms);}
function popSt(id){const el=document.getElementById(id);if(!el)return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}

/* ══ STATIC DATA ══ */
const LVL_GOALS={wh:['Подними переднее колесо хотя бы на 5 см','Удержи вилли на 10 метров','Вилли на 30 метров — контролируй тормозом','Вилли на 100 метров — уровень Red Bull'],mn:['Выброси вес назад без педалирования','Мэнуал на 10 метров, руки прямые','Мэнуал на 20 метров — баланс коленями','Мэнуал на 50 метров — про-стрит'],ts:['Простой неподвижно 5 секунд','Трекстенд 15 секунд','Трекстенд 30 секунд с закрытыми глазами','100 секунд — уровень триал-про'],bh:['Отработай фазу фронт-лифта','Скуп — оба колеса отрываются','Полноценный прыжок','Высокий чистый хоп'],st:['Наклон вперёд — заднее отрывается','Стоппи 45°','Стоппи 90°','Full Control — удержание на переднем']};
const REC_SKILLS=[
  {id:'wh',name:'Вилли',unit:'метров',icon:'🚴',max:500,hint:'макс. 500м'},
  {id:'mn',name:'Мэнуал',unit:'метров',icon:'🏄',max:300,hint:'макс. 300м'},
  {id:'ts',name:'Трекстенд',unit:'секунд',icon:'⏱️',max:3600,hint:'макс. 3600с'},
  {id:'bh',name:'Банни-хоп',unit:'см высота',icon:'🦘',max:200,hint:'макс. 200см'},
  {id:'st',name:'Стоппи',unit:'метров',icon:'🎯',max:100,hint:'макс. 100м'},
];
const SNAMES={wh:'Вилли',mn:'Мэнуал',ts:'Трекстенд',bh:'Банни-хоп',st:'Стоппи'};
const SUNITS={wh:'метров',mn:'метров',ts:'секунд',bh:'см',st:'метров'};
const ACHIEVEMENTS=[
  {id:'first',name:'Первый подход',icon:'🌱',check:s=>s.skills.some(x=>x.tr>0)},
  {id:'str3',name:'3 дня подряд',icon:'🔥',check:s=>s.streak>=3},
  {id:'str7',name:'Неделя огня',icon:'🔥🔥',check:s=>s.streak>=7},
  {id:'lv5',name:'5 уровней',icon:'⭐',check:s=>s.skills.reduce((a,x)=>a+x.lv,0)>=5},
  {id:'lv10',name:'10 уровней',icon:'🌟',check:s=>s.skills.reduce((a,x)=>a+x.lv,0)>=10},
  {id:'allmax',name:'Мастер трюков',icon:'🏆',check:s=>s.skills.every(x=>x.lv>=3&&x.pr>=100)},
  {id:'xp500',name:'500 XP',icon:'💎',check:()=>calcXP()>=500},
  {id:'xp1500',name:'1500 XP',icon:'💎💎',check:()=>calcXP()>=1500},
  {id:'tr50',name:'50 тренировок',icon:'💪',check:s=>s.skills.reduce((a,x)=>a+x.tr,0)>=50},
  {id:'tr100',name:'100 подходов',icon:'🤖',check:s=>s.skills.reduce((a,x)=>a+x.tr,0)>=100},
  {id:'vid3',name:'Video Star',icon:'🎬',check:s=>(s.proofs||[]).length>=3},
  {id:'duel1',name:'Дуэлянт',icon:'⚡',check:s=>(s.duelsWon||0)>=1},
];

const CH_TMPL=[
  {text:'Сделай 5 подходов на Банни-хоп',xp:35,type:'daily',auto:true,trackType:'approaches',trackSkill:'bh',target:5},
  {text:'Сделай 5 подходов на Стоппи',xp:30,type:'daily',auto:true,trackType:'approaches',trackSkill:'st',target:5},
  {text:'Сделай 3 подхода на Трекстенд',xp:25,type:'daily',auto:true,trackType:'approaches',trackSkill:'ts',target:3},
  {text:'Сделай 5 подходов на Вилли',xp:30,type:'daily',auto:true,trackType:'approaches',trackSkill:'wh',target:5},
  {text:'Сделай 5 подходов на Мэнуал',xp:30,type:'daily',auto:true,trackType:'approaches',trackSkill:'mn',target:5},
  {text:'Набери 100 XP за неделю',xp:60,type:'weekly',auto:true,trackType:'xp',target:100},
  {text:'Загрузи видео-доказательство',xp:50,type:'weekly',auto:true,trackType:'video',target:1},
  {text:'3 дня тренировок подряд',xp:80,type:'weekly',auto:true,trackType:'streak',target:3},
  {text:'Вилли → сразу Стоппи (комбо!)',xp:55,type:'daily',auto:false,trackType:'trust'},
  {text:'Мэнуал → Банни-хоп в конце (комбо!)',xp:50,type:'daily',auto:false,trackType:'trust'},
  {text:'Трекстенд → сразу Вилли (комбо!)',xp:70,type:'weekly',auto:false,trackType:'trust'},
  {text:'Побей любой свой рекорд',xp:50,type:'weekly',auto:false,trackType:'trust'},
];

const DEF_SKILLS=[
  {id:'wh',name:'Вилли',image:'https://i.ibb.co/7xnbTSWB/1774284993874.png',levels:['Изи левл (подъем)','Уровень 2 (10 м)','Уровень 3 (30 м)','Босс Red Bull (100 м)'],video:'https://www.youtube.com/embed/xhYGbGGrNuU',steps:[{title:'Подъём',text:'Резко перенеси вес назад и нажми на педаль. Палец всегда на тормозе!',img:'https://i.ibb.co/Pz4P4gJT/Danny-Mac-Askil-Five-Ten-Do-A-Wheelie-Release-Group-Dave-Mackinson-scaled.jpg'},{title:'Баланс',text:'Если падаешь назад — жми задний тормоз. Если вперёд — подкручивай педали.',img:'https://i.ibb.co/PsLH4d0f/1774216418820.png'}]},
  {id:'mn',name:'Мэнуал',image:'https://i.ibb.co/5W3Q4YxC/Screenshot-20260324-133559-Google.jpg',levels:['Изи левл (рывок)','Уровень 2 (10 м)','Уровень 3 (20 м)','Босс Red Bull (50 м)'],video:'https://www.youtube.com/embed/DyQMbjCRS3w',steps:[{title:'Взрыв',text:'Уйди грудью к рулю, затем резко выброси тело назад за седло.',img:'https://i.ibb.co/j9brGgGf/M3-TSH-e-copy.jpg'},{title:'Ноги',text:'Руки прямые! Баланс только сгибанием и разгибанием коленей.',img:'https://i.ibb.co/gLF33JcR/mbr262-skills-ab-skills-carpark-044.jpg'}]},
  {id:'ts',name:'Трекстенд',image:'https://i.ibb.co/wHq5VYT/1774350649611.png',levels:['Изи левл (5 сек)','Уровень 2 (15 сек)','Уровень 3 (30 сек)','Босс Red Bull (100 сек)'],video:'https://www.youtube.com/embed/EXlVl-UW6R0',steps:[{title:'Стойка',text:'Шатуны параллельно земле. Руль 45° в сторону ведущей ноги.',img:'https://i.ibb.co/0yDfK5BC/jasontrack2.jpg'},{title:'Микро-движения',text:'Зажми тормоза. Играй весом вперёд-назад.',img:'https://i.ibb.co/G4c4YxZR/2022-bicycling-biketoplay-ep04-trackstand-ph-v01-thumb-copy-1656614860.jpg'}]},
  {id:'bh',name:'Банни-хоп',image:'https://i.ibb.co/k6m7zhxc/1774351530331.png',levels:['Изи левл (переднее)','Уровень 2 (заднее)','Уровень 3 (прыжок)','Босс Red Bull (Идеальный хоп)'],video:'https://www.youtube.com/embed/QsZ39HI2GFg',steps:[{title:'Фронт',text:'Выдерни переднее колесо — как начало мэнуала.',img:'https://i.ibb.co/6ndK703b/maxresdefault.jpg'},{title:'Скуп',text:'Когда переднее в воздухе — выпрыгни и подтяни педали ногами.',img:'https://i.ibb.co/6ndK703b/maxresdefault.jpg'}]},
  {id:'st',name:'Стоппи',image:'https://i.ibb.co/whXCZVMH/file-000000002a307246a16f2ea96db8a3b6.png',levels:['Изи левл (наклон)','Уровень 2 (45°)','Уровень 3 (90°)','Босс Red Bull (Full Control)'],video:'https://www.youtube.com/embed/Ea2K3TJGf6w',steps:[{title:'Загрузка',text:'Плавно нажми передний тормоз и подай плечи вперёд.',img:'https://i.ibb.co/kg6bTHBf/p5pb22546925.jpg'},{title:'Отрыв',text:'Модулируй тормоз — не зажимай намертво!',img:'https://i.ibb.co/kg6bTHBf/p5pb22546925.jpg'}]},
];

/* ══ STATE ══ */
const SK='mtb_v16';
function defState(){return{skills:DEF_SKILLS.map(s=>({id:s.id,lv:0,pr:0,tr:0,trToday:0,trSession:0})),nickname:'',nicknameChangedAt:0,streak:0,lastTrainDate:'',notif:{enabled:false,time:'17:00',days:[1,2,3,4,5,6,7]},records:{},challenges:[],completedChallenges:[],proofs:[],proofReactions:{},challengeXP:0,unlockedAchievements:[],duels:[],duelsWon:0,weeklyXpStart:0,weeklyXpStartTs:0,friendRequestsSent:[],friendRequestsReceived:[]};}
let state=loadLS();
let activeSkillId=null;
let bikePhotoFile=null;

function loadLS(){
  try{const s=JSON.parse(localStorage.getItem(SK));if(s&&s.skills){
    ['records','challenges','completedChallenges','proofs','proofReactions','unlockedAchievements','duels'].forEach(k=>{if(!s[k])s[k]=k==='records'?{}:[];});
    if(!s.challengeXP)s.challengeXP=0;if(!s.duelsWon)s.duelsWon=0;
    if(!s.weeklyXpStart)s.weeklyXpStart=0;if(!s.weeklyXpStartTs)s.weeklyXpStartTs=0;
    if(!s.nicknameChangedAt)s.nicknameChangedAt=0;
    DEF_SKILLS.forEach(ds=>{
      const sk=s.skills.find(x=>x.id===ds.id);
      if(!sk)s.skills.push({id:ds.id,lv:0,pr:0,tr:0,trToday:0,trSession:0});
      else{if(!sk.trToday)sk.trToday=0;if(!sk.trSession)sk.trSession=0;}
    });
    return s;
  }}catch(e){}return defState();
}
function saveLS(){localStorage.setItem(SK,JSON.stringify(state));}
async function saveCloud(){
  saveLS();
  if(!db||!currentUser)return;
  try{
    const toSave=JSON.parse(JSON.stringify(state));
    delete toSave.duels;
    if(Array.isArray(toSave.proofReactions))toSave.proofReactions={};
    if(Array.isArray(toSave.skills))toSave.skills=toSave.skills.map(s=>({...s,trSession:0}));
    await db.collection('users').doc(currentUser.uid).set({...toSave,code:currentUser.uid.substring(0,12),uid:currentUser.uid},{merge:true});
    await db.collection('leaderboard').doc(currentUser.uid).set({
      nickname:state.nickname,
      pts:calcXP(),
      uid:currentUser.uid,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    setSyncDot('synced');
  }catch(e){console.warn('saveCloud:',e);setSyncDot('error');saveLS();}
}
function calcXP(){return state.skills.reduce((s,u)=>s+(u.lv*100)+u.pr,0)+(state.challengeXP||0);}
function setSyncDot(s){const e=document.getElementById('syncDot');if(e)e.className='sync-dot '+s;}

/* ══ FIREBASE ══ */
async function initFB(){
  if(typeof firebase==='undefined'){
    console.error('Firebase SDK не загружен');
    hideLoad();showAuthScr();return;
  }
  let fbTimeout=null;
  try{
    firebase.initializeApp(FB_CFG);
    db=firebase.firestore();
    auth=firebase.auth();
    storage=firebase.storage();

    fbTimeout=setTimeout(()=>{
      console.error('Firebase timeout — показуємо екран авторизації');
      hideLoad();showAuthScr();
    },12000);

    db.enablePersistence({synchronizeTabs:true}).catch(e=>{
      if(e.code==='failed-precondition')console.warn('Persistence: несколько вкладок');
      else if(e.code==='unimplemented')console.warn('Persistence не поддерживается');
    });

    try{
      setLoadText('Проверяю Google вход...');
      await auth.getRedirectResult();
    }catch(re){console.warn('getRedirectResult:',re.code||re.message);}
    redirectHandled=true;

    auth.onAuthStateChanged(async user=>{
      if(fbTimeout){clearTimeout(fbTimeout);fbTimeout=null;}
      if(user){
        currentUser=user;setLoadText('Загружаю данные...');
        try{
          const doc=await db.collection('users').doc(user.uid).get();
          if(doc.exists){
            state={...defState(),...doc.data()};
            const ls=JSON.parse(localStorage.getItem(SK)||'{}');
            if(Array.isArray(ls.duels))state.duels=ls.duels;
            DEF_SKILLS.forEach(ds=>{
              const sk=state.skills.find(x=>x.id===ds.id);
              if(!sk)state.skills.push({id:ds.id,lv:0,pr:0,tr:0,trToday:0,trSession:0});
              else{if(!sk.trToday)sk.trToday=0;if(!sk.trSession)sk.trSession=0;}
            });
            saveLS();setSyncDot('synced');
          }else{await saveCloud();}
        }catch(e){console.warn('Cloud load:',e);setSyncDot('error');}
        resetDailyCountersIfNeeded();
        hideLoad();
        if(!state.nickname)showNickScr();else initApp();
      }else{
        currentUser=null;
        hideLoad();showAuthScr();
      }
    });
  }catch(e){
    console.error('FB init:',e);
    if(fbTimeout){clearTimeout(fbTimeout);fbTimeout=null;}
    const errMsg=e.message||'';
    if(errMsg.includes('app-check')||e.code==='firebase-app-check-token-is-invalid'||errMsg.includes('App Check')){
      toast('⚠️ App Check блокирует запросы. Отключи Enforce в Firebase Console → App Check');
    }
    hideLoad();showAuthScr();
  }
}

/* ══ AUTH ══ */
function switchAuthTab(mode){
  authMode=mode;clearMsg();
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(i===0)===(mode==='login')));
  document.getElementById('authNickWrap').style.display=mode==='register'?'block':'none';
  document.getElementById('authPass2Wrap').style.display=mode==='register'?'block':'none';
  document.getElementById('authSubmitBtn').textContent=mode==='login'?'Войти':'Создать аккаунт';
}

async function handleEmailAuth(){
  clearMsg();
  const email=document.getElementById('authEmail').value.trim();
  const pass=document.getElementById('authPass').value;
  if(!email||!pass){showMsg('Заполни все поля');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMsg('Неверный формат email');return;}
  if(pass.length<6){showMsg('Пароль минимум 6 символов');return;}
  if(authMode==='register'){
    const pass2=document.getElementById('authPass2').value;
    if(pass!==pass2){showMsg('Пароли не совпадают');return;}
    const nick=document.getElementById('authNick').value.trim();
    if(nick&&nick.length<2){showMsg('Никнейм минимум 2 символа');return;}
  }
  const btn=document.getElementById('authSubmitBtn');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Подожди...';
  try{
    if(authMode==='login'){
      await auth.signInWithEmailAndPassword(email,pass);
    }else{
      const cred=await auth.createUserWithEmailAndPassword(email,pass);
      if(nick){
        state.nickname=nick;
        await saveCloud();
      }
      await initApp();
    }
  }catch(e){
    console.warn('Auth:',e);
    if(e.code==='auth/too-many-requests')showMsg('Слишком много попыток. Попробуй позже');
    else if(e.code==='auth/invalid-email')showMsg('Неверный email');
    else if(e.code==='auth/user-not-found')showMsg('Пользователь не найден');
    else if(e.code==='auth/wrong-password')showMsg('Неверный пароль');
    else if(e.code==='auth/email-already-in-use')showMsg('Email уже используется');
    else if(e.code==='auth/weak-password')showMsg('Слишком слабый пароль');
    else showMsg(e.message);
  }
  btn.disabled=false;btn.textContent=authMode==='login'?'Войти':'Создать аккаунт';
}

async function signInWithGoogle(){
  const p=auth.GoogleAuthProvider;
  p.setCustomParameters({prompt:'select_account'});
  try{
    await auth.signInWithRedirect(p);
  }catch(e){console.warn('Google signin:',e);toast('Ошибка Google: '+e.message);}
}

async function handleForgotPassword(){
  const email=document.getElementById('authEmail').value.trim();
  if(!email){showMsg('Введи email');return;}
  try{
    await auth.sendPasswordResetEmail(email);
    showMsg('📧 Проверь почту!', 'ok');
  }catch(e){
    if(e.code==='auth/invalid-email')showMsg('Неверный email');
    else if(e.code==='auth/user-not-found')showMsg('Пользователь не найден');
    else showMsg('Ошибка: '+e.message);
  }
}

function hideLoad(){document.getElementById('loadingScreen').classList.add('hidden');}
function showAuthScr(){document.getElementById('authScreen').style.display='flex';document.getElementById('nickScreen').style.display='none';}
function showNickScr(){document.getElementById('authScreen').style.display='none';document.getElementById('nickScreen').style.display='flex';}
function initApp(){
  document.getElementById('authScreen').style.display='none';
  document.getElementById('nickScreen').style.display='none';
  if(currentUser.photoURL)document.getElementById('userAvatar').src=currentUser.photoURL;
  document.getElementById('userAvatar').style.display=currentUser.photoURL?'block':'none';
  setT('userDN',currentUser.displayName||currentUser.email?.split('@')[0]||'Райдер');
  setT('welcomeText','Привет, '+(state.nickname||'райдер')+' 👋');
  setT('myNickDisp',state.nickname||'');
  setT('userEmailDisp',currentUser.email||'');
  document.getElementById('userInfo').style.display='flex';
  document.getElementById('rankName').textContent='Старт';
  renderStreak();renderAch();renderSkills();renderRecords();renderChallenges();renderNotifStatus();
}

async function setNickname(){
  const v=document.getElementById('nickInput').value.trim();
  if(!v||v.length<2){toast('Мин. 2 символа!');return;}
  const normalized=v.toLowerCase();
  if(db){
    try{
      const snap=await db.collection('nicknames').doc(normalized).get();
      if(snap.exists&&snap.data().uid!==currentUser.uid){
        toast('Этот никнейм уже занят!');return;
      }
      await db.collection('nicknames').doc(normalized).set({uid:currentUser.uid,nickname:v});
    }catch(e){console.error('nickname check:',e);}
  }
  state.nickname=v;
  await saveCloud();
  sfx.save();document.getElementById('nickScreen').style.display='none';initApp();
}
async function changeNick(){
  const COOLDOWN=7*24*60*60*1000;
  if(state.nicknameChangedAt){
    const left=state.nicknameChangedAt+COOLDOWN-Date.now();
    if(left>0){
      const days=Math.ceil(left/86400000);
      toast('Можно менять через '+days+' дн.');return;
    }
  }
  const n=prompt('Новый никнейм:',state.nickname);
  if(!n)return;
  const v=n.trim().replace(/[<>&"']/g,'');
  if(v.length<2){toast('Никнейм минимум 2 символа');return;}
  if(v.length>24){toast('Никнейм максимум 24 символа');return;}
  const normalized=v.toLowerCase();
  if(db){
    try{
      const snap=await db.collection('nicknames').doc(normalized).get();
      if(snap.exists&&snap.data().uid!==currentUser.uid){
        toast('Этот никнейм уже занят!');return;
      }
      const oldNormalized=state.nickname?.toLowerCase();
      if(oldNormalized&&oldNormalized!==normalized){
        await db.collection('nicknames').doc(oldNormalized).delete();
      }
      await db.collection('nicknames').doc(normalized).set({uid:currentUser.uid,nickname:v});
    }catch(e){console.error('nickname update:',e);}
  }
  state.nickname=v;state.nicknameChangedAt=Date.now();saveCloud();setT('myNickDisp',state.nickname);setT('welcomeText','Привет, '+state.nickname+' 👋');toast('Ник обновлён! Зменить можно через неделю.');
}

function doSignOut(){auth.signOut().then(()=>{localStorage.removeItem(SK);localStorage.removeItem('mtb_dts');localStorage.removeItem('mtb_wts');location.reload();}).catch(e=>toast('Ошибка выхода'));}

async function deleteAccount(){
  if(!currentUser)return;
  try{
    const uid=currentUser.uid;
    const friendsSnap=await db.collection('friends').where('uids','array-contains',uid).get();
    for(const fd of friendsSnap.docs)await fd.ref.delete();
    const bsnap=await db.collection('bikes').where('ownerId','==',uid).get();
    for(const bd of bsnap.docs)await bd.ref.delete();
    await db.collection('users').doc(uid).delete();
    await db.collection('leaderboard').doc(uid).delete();
    if(state.nickname){
      await db.collection('nicknames').doc(state.nickname.toLowerCase()).delete().catch(()=>{});
    }
    await auth.currentUser.delete();
    localStorage.removeItem(SK);localStorage.removeItem('mtb_dts');localStorage.removeItem('mtb_wts');
    location.reload();
  }catch(e){console.warn('deleteAccount:',e);toast('Ошибка: '+e.message);}
}

function exportData(){const a=document.createElement('a');a.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state));a.download='mtb_backup.json';a.click();}
async function resetAll(){localStorage.removeItem(SK);localStorage.removeItem('mtb_dts');localStorage.removeItem('mtb_wts');if(db&&currentUser){try{await db.collection('users').doc(currentUser.uid).delete();await db.collection('leaderboard').doc(currentUser.uid).delete();}catch(e){}}location.reload();}

/* ══ INIT ══ */
initFB();