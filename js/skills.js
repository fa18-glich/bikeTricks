// Skills module
(function() {
  /* ══ TABS ══ */
  window.switchBikeTab = function(tab){
    document.querySelectorAll('.sub-tab').forEach(t=>t.classList.remove('active'));
    const b=document.querySelector(`[data-subtab="${tab}"]`);
    if(b)b.classList.add('active');
    document.getElementById('bikes-feed').style.display=tab==='feed'?'block':'none';
    document.getElementById('bikes-add').style.display=tab==='add'?'block':'none';
    if(tab==='feed')window.loadBikes();
  };

  /* ══ TIMER ══ */
  let tInt=null,tRun=false,tStart=0,tEl=0;
  window.timerStart=function(){if(tRun)return;tRun=true;tStart=Date.now()-tEl;tInt=setInterval(timerTick,50);const d=document.getElementById('timerDisp');if(d)d.className='timer-disp running';document.getElementById('timerStartBtn').disabled=true;sfx.tick();};
  window.timerStop=function(){if(!tRun)return;tRun=false;clearInterval(tInt);tEl=Date.now()-tStart;const d=document.getElementById('timerDisp');if(d)d.className='timer-disp stopped';document.getElementById('timerStartBtn').disabled=false;sfx.save();};
  window.timerReset=function(){timerStop();tEl=0;const d=document.getElementById('timerDisp');if(d){d.className='timer-disp';d.textContent='00:00.0';}};
  function timerTick(){const e=Date.now()-tStart,min=Math.floor(e/60000),sec=Math.floor((e%60000)/1000),dec=Math.floor((e%1000)/100);const d=document.getElementById('timerDisp');if(d)d.textContent=String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+dec;}

  /* ══ STREAK & DAILY RESET ══ */
  window.resetDailyCountersIfNeeded=function(){
    const today=new Date().toDateString();
    if(state.lastTrainDate&&state.lastTrainDate!==today){
      state.skills.forEach(s=>{s.trToday=0;s.trSession=0;});
      saveLS();
    }
  };
  window.updateStreak=function(){const today=new Date().toDateString();const yest=new Date(Date.now()-86400000).toDateString();if(state.lastTrainDate&&state.lastTrainDate!==today&&state.lastTrainDate!==yest){state.streak=0;saveCloud();}renderStreak();};
  window.recordTrainToday=function(){
    const today=new Date().toDateString();
    const yest=new Date(Date.now()-86400000).toDateString();
    if(state.lastTrainDate===today)return;
    state.streak=(state.lastTrainDate===yest?(state.streak||0)+1:1);
    state.lastTrainDate=today;
    saveCloud();renderStreak();
  };
  window.renderStreak=function(){const b=document.getElementById('streakBanner');if(!b)return;if(state.streak>0){b.style.display='flex';const d=state.streak;setT('streakText',d+' '+(d===1?'день':d<5?'дня':'дней')+' подряд 🔥');setT('streakSub',d>=7?'В огне! 🏆':d>=3?'Хорошая серия!':'Начало положено!');}else b.style.display='none';};

  /* ══ ACH ══ */
  window.checkAch=function(){if(!state.unlockedAchievements)state.unlockedAchievements=[];let n=false;ACHIEVEMENTS.forEach(a=>{if(!state.unlockedAchievements.includes(a.id)&&a.check(state)){state.unlockedAchievements.push(a.id);n=true;setTimeout(()=>{sfx.ach();showLvlUp('АЧИВКА!',a.name,a.icon);},400);}});if(n)saveCloud();renderAch();};
  window.renderAch=function(){const el=document.getElementById('achList');if(!el)return;el.innerHTML='';ACHIEVEMENTS.forEach(a=>{const u=state.unlockedAchievements&&state.unlockedAchievements.includes(a.id);const d=document.createElement('div');d.className='ach'+(u?' unlocked':'');d.textContent=a.icon+' '+a.name;el.appendChild(d);});};

  /* ══ SKILLS ══ */
  window.renderSkills=function(){let pts=0,trs=0,lvls=0,prg=0;const list=document.getElementById('skillsList');if(!list)return;list.innerHTML='';state.skills.forEach((u,idx)=>{const base=DEF_SKILLS.find(s=>s.id===u.id);if(!base)return;const isMax=u.lv>=base.levels.length-1&&u.pr>=100;pts+=(u.lv*100)+u.pr;trs+=u.tr;lvls+=u.lv;prg+=u.pr;const card=document.createElement('div');card.className='skill-card';card.style.animationDelay=idx*.06+'s';const vis=document.createElement('div');vis.className='skill-visual';const img=document.createElement('img');img.src=base.image;img.loading='lazy';vis.appendChild(img);const body=document.createElement('div');body.className='skill-body';const tit=document.createElement('h3');tit.className='skill-title';tit.textContent=base.name;const p1=document.createElement('span');p1.className='pill';p1.textContent=base.levels[Math.min(u.lv,base.levels.length-1)];const p2=document.createElement('span');p2.className='pill';p2.textContent='Попыток: '+u.tr;const pb=document.createElement('div');pb.className='prog';const pbi=document.createElement('div');pbi.style.width=u.pr+'%';pb.appendChild(pbi);const btn=document.createElement('button');btn.className='btn btn-ghost';btn.style.cssText='padding:8px;font-size:12px;width:100%;';btn.textContent=isMax?'✅ МАКСИМУМ':'🎯 ТРЕНИРОВАТЬ';btn.onclick=()=>openModal(base.id);body.append(tit,p1,p2,pb,btn);card.append(vis,body);list.appendChild(card);});pts+=state.challengeXP||0;setT('totalPoints',pts);setT('totalTrainings',trs);setT('openLevels',lvls);setT('avgProgress',Math.round(prg/Math.max(state.skills.length,1))+'%');let rank='Старт';if(pts>300)rank='Новичок';if(pts>800)rank='Райдер';if(pts>1500)rank='Про';if(pts>3000)rank='Street Beast 🐺';setT('rankName',rank);checkAch();};

  /* ══ MODAL ══ */
  window.openModal=function(id){sfx.tab();timerReset();activeSkillId=id;const base=DEF_SKILLS.find(s=>s.id===id);const user=state.skills.find(s=>s.id===id);if(!base||!user)return;const isMax=user.lv>=base.levels.length-1&&user.pr>=100;const lvIdx=Math.min(user.lv,base.levels.length-1);setT('modalTitle',base.name);document.getElementById('modalVideo').src=base.video;const goals=LVL_GOALS[base.id];setT('modalGoal',isMax?'Все этапы пройдены!':(goals?goals[lvIdx]:base.levels[lvIdx]));const st=document.getElementById('modalSteps');st.innerHTML='';base.steps.forEach((s,i)=>{const item=document.createElement('div');item.className='step-item';const img=document.createElement('img');img.src=s.img;const div=document.createElement('div');const h4=document.createElement('h4');h4.textContent='Шаг '+(i+1)+': '+s.title;const p=document.createElement('p');p.textContent=s.text;div.append(h4,p);item.append(img,div);st.appendChild(item);});const btn=document.getElementById('modalTrainBtn');btn.textContent=isMax?'✅ МАКСИМУМ ДОСТИГНУТ':'💪 ВЫПОЛНИТЬ ПОДХОД (+10%)';btn.disabled=isMax;document.getElementById('modal').classList.add('show');};
  window.closeModal=function(){timerReset();document.getElementById('modal').classList.remove('show');document.getElementById('modalVideo').src='';};

  let _lastTrainTs=0;
  window.trainCurrent=function(){
    const now=Date.now();
    if(now-_lastTrainTs<2000){toast('Подожди секунду...');return;}
    _lastTrainTs=now;
    const user=state.skills.find(s=>s.id===activeSkillId);
    const base=DEF_SKILLS.find(s=>s.id===activeSkillId);
    if(!user||!base)return;
    user.tr++;
    user.trToday=(user.trToday||0)+1;
    user.trSession=(user.trSession||0)+1;
    user.pr+=10;
    recordTrainToday();
    if(user.pr>=100){
      if(user.lv<base.levels.length-1){user.lv++;user.pr=0;sfx.levelUp();showLvlUp('НОВЫЙ УРОВЕНЬ!',base.levels[user.lv],'🔥');toast('🔥 Новый уровень!');}
      else{user.pr=100;sfx.max();showLvlUp('ТРЮК ОСВОЕН!',base.name+' — ты мастер!','🏆',true);toast('🏆 Трюк освоен!');}
    }else{sfx.tick();toast('+10% 💪');}
    const isMax=user.lv>=base.levels.length-1&&user.pr>=100;
    const goals=LVL_GOALS[base.id];const lvIdx=Math.min(user.lv,base.levels.length-1);
    setT('modalGoal',isMax?'Все этапы пройдены!':(goals?goals[lvIdx]:base.levels[lvIdx]));
    const btn=document.getElementById('modalTrainBtn');btn.textContent=isMax?'✅ МАКСИМУМ ДОСТИГНУТ':'💪 ВЫПОЛНИТЬ ПОДХОД (+10%)';btn.disabled=isMax;
    ['totalPoints','totalTrainings','openLevels','avgProgress'].forEach(popSt);
    saveCloudDebounced();renderSkills();
    window.checkAutoCompleteChallenge();
  };
})();