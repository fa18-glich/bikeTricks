// Challenges module
(function() {
  window.todayMidnight=function(){const d=new Date();d.setHours(0,0,0,0);return d.getTime();};
  window.weekMonday=function(){const d=new Date();d.setHours(0,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return d.getTime();};

  window.genChallengesIfNeeded=function(){
    const todayTs=todayMidnight();const weekTs=weekMonday();
    const dTs=parseInt(localStorage.getItem('mtb_dts')||'0');
    const wTs=parseInt(localStorage.getItem('mtb_wts')||'0');
    const needD=dTs<todayTs;const needW=wTs<weekTs;
    if(!needD&&!needW&&state.challenges&&state.challenges.length>0)return;
    const keep=(state.challenges||[]).filter(c=>c.completed).slice(-10);
    const sh=a=>[...a].sort(()=>Math.random()-.5);
    if(needD||!state.challenges.some(c=>!c.completed&&c.type==='daily')){
      state.skills.forEach(s=>s.trSession=0);
      sh(CH_TMPL.filter(t=>t.type==='daily')).slice(0,3).forEach(t=>{
        keep.push({id:Date.now().toString()+Math.random(),text:t.text,xp:t.xp,type:t.type,auto:t.auto,trackType:t.trackType,trackSkill:t.trackSkill||null,target:t.target||0,completed:false,created:new Date().toISOString()});
      });
      localStorage.setItem('mtb_dts',todayTs.toString());
    }else{(state.challenges||[]).filter(c=>!c.completed&&c.type==='daily').forEach(c=>keep.push(c));}
    if(needW||!state.challenges.some(c=>!c.completed&&c.type==='weekly')){
      state.weeklyXpStart=calcXP();state.weeklyXpStartTs=weekTs;
      sh(CH_TMPL.filter(t=>t.type==='weekly')).slice(0,2).forEach(t=>{
        keep.push({id:Date.now().toString()+Math.random(),text:t.text,xp:t.xp,type:t.type,auto:t.auto,trackType:t.trackType,trackSkill:t.trackSkill||null,target:t.target||0,completed:false,created:new Date().toISOString()});
      });
      localStorage.setItem('mtb_wts',weekTs.toString());
    }else{(state.challenges||[]).filter(c=>!c.completed&&c.type==='weekly').forEach(c=>keep.push(c));}
    state.challenges=keep;saveCloud();
  };

  window.getChallengeProgress=function(ch){
    if(ch.completed)return{cur:ch.target||1,max:ch.target||1};
    if(!ch.auto)return null;
    const max=ch.target||1;
    let cur=0;
    if(ch.trackType==='approaches'){
      const sk=state.skills.find(s=>s.id===ch.trackSkill);
      cur=sk?(sk.trSession||0):0;
    }else if(ch.trackType==='xp'){
      cur=Math.max(0,calcXP()-(state.weeklyXpStart||0));
    }else if(ch.trackType==='video'){
      const chCreated=ch.created?new Date(ch.created).getTime():0;
      cur=(state.proofs||[]).filter(p=>new Date(p.date).getTime()>=chCreated).length;
    }else if(ch.trackType==='streak'){
      cur=state.streak||0;
    }
    return{cur:Math.min(cur,max),max};
  };

  window.checkAutoCompleteChallenge=function(){
    let changed=false;
    (state.challenges||[]).forEach(ch=>{
      if(ch.completed||!ch.auto)return;
      const prog=getChallengeProgress(ch);
      if(prog&&prog.cur>=prog.max){
        window.completeChallengeInternal(ch.id,true);
        changed=true;
      }
    });
    if(changed)window.renderChallenges();
  };

  window.completeChallengeInternal=function(id,auto=false){
    const ch=state.challenges.find(c=>c.id===id);
    if(!ch||ch.completed)return;
    ch.completed=true;
    state.challengeXP=(state.challengeXP||0)+ch.xp;
    if(!state.completedChallenges)state.completedChallenges=[];
    state.completedChallenges.push(id);
    sfx.levelUp();saveCloud();
    toast((auto?'🤖 Авто: ':'')+'+'+ch.xp+' XP за «'+ch.text+'»!');
    confetti(40);window.renderSkills();window.checkAch();
  };

  window.completeChallenge=function(id){window.completeChallengeInternal(id,false);};

  window.updateChTimer=function(){const el=document.getElementById('chTimer');if(!el)return;const now=Date.now();const fmt=ms=>{const h=Math.floor(ms/3600000);const m=Math.floor((ms%3600000)/60000);return`${h}ч ${m}м`;};el.textContent='🕐 Дневные: '+fmt(todayMidnight()+86400000-now)+' | Нед.: '+fmt(Math.max(0,weekMonday()+7*86400000-now));};

  window.renderChallenges=function(){
    const el=document.getElementById('challengesList');if(!el)return;el.innerHTML='';
    const active=(state.challenges||[]).filter(c=>!c.completed);
    const done=(state.challenges||[]).filter(c=>c.completed).slice(-5);
    if(!active.length&&!done.length){const p=document.createElement('div');p.className='form-card';p.style.cssText='text-align:center;color:var(--muted);padding:24px;';p.textContent='Задания загружаются...';el.appendChild(p);return;}
    if(active.length){const hdr=document.createElement('h4');hdr.className='sec-label';hdr.textContent='Активные';el.appendChild(hdr);}
    active.forEach(ch=>{
      const card=document.createElement('div');card.className='ch-card'+(ch.auto===false?' trust':'');
      const bgProg=document.createElement('div');bgProg.className='ch-progress-bg';card.appendChild(bgProg);
      const head=document.createElement('div');head.className='ch-head';
      const badge=document.createElement('span');badge.className='ch-badge '+(ch.type==='weekly'?'bd-w':ch.auto===false?'bd-t':'bd-d');badge.textContent=ch.type==='weekly'?'Недельный':ch.auto===false?'На доверии':'Дневной';
      const xp=document.createElement('span');xp.className='ch-xp';xp.textContent='+'+ch.xp+' XP';head.append(badge,xp);
      const desc=document.createElement('p');desc.className='ch-desc';desc.textContent=ch.text;card.append(head,desc);
      const prog=ch.auto?getChallengeProgress(ch):null;const pct=prog?Math.round((prog.cur/prog.max)*100):0;
      if(prog){const pbar=document.createElement('div');pbar.className='ch-progress-bar';const pfill=document.createElement('div');pfill.style.width=pct+'%';pbar.appendChild(pfill);card.appendChild(pbar);const plabel=document.createElement('div');plabel.className='ch-progress-label';plabel.textContent=prog.cur+' / '+prog.max+(ch.trackType==='xp'?' XP':ch.trackType==='approaches'?' подходов':ch.trackType==='streak'?' дней':ch.trackType==='video'?' видео':'');card.appendChild(plabel);bgProg.style.width=pct+'%';}
      const btn=document.createElement('button');btn.className='ch-complete-btn';
      if(ch.auto){const ready=prog&&prog.cur>=prog.max;btn.className+=' '+(ready?'ready':'not-ready');btn.textContent=ready?'✅ Засчитать!':'⏳ Выполни задание...';btn.disabled=!ready;if(ready)btn.onclick=()=>window.completeChallenge(ch.id);}else{btn.className+=' trust-btn';btn.textContent='🤝 Выполнил (на доверии)';btn.onclick=()=>window.completeChallenge(ch.id);}
      card.appendChild(btn);el.appendChild(card);
    });
    if(done.length){const hdr=document.createElement('h4');hdr.className='sec-label';hdr.style.marginTop='16px';hdr.textContent='Выполненные';el.appendChild(hdr);done.forEach(ch=>{const card=document.createElement('div');card.className='ch-card done';card.style.opacity='.6';const bgProg=document.createElement('div');bgProg.className='ch-progress-bg';bgProg.style.width='100%';card.appendChild(bgProg);const head=document.createElement('div');head.className='ch-head';const dl=document.createElement('span');dl.style.cssText='color:var(--good);font-weight:700;';dl.textContent='✅ Выполнено';const xp=document.createElement('span');xp.className='ch-xp';xp.textContent='+'+ch.xp+' XP';head.append(dl,xp);const p=document.createElement('p');p.className='ch-desc';p.style.textDecoration='line-through';p.textContent=ch.text;card.append(head,p);el.appendChild(card);});}
  };
})();