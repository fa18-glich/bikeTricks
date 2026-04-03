// Records module
(function() {
  window.addRecord=function(id){
    const inp=document.getElementById('ri-'+id);
    const val=parseFloat(inp.value);
    if(isNaN(val)||val<=0)return toast('Введи число!');
    const rs=REC_SKILLS.find(r=>r.id===id);
    if(rs&&val>rs.max){toast('Слишком большое значение. Максимум: '+rs.max+' '+rs.unit);return;}
    if(!state.records[id])state.records[id]=[];
    if(state.records[id].length>=100)state.records[id].shift();
    const prevBest=state.records[id].length>0?Math.max(...state.records[id].map(r=>r.val)):-Infinity;
    state.records[id].push({val,date:new Date().toISOString()});
    inp.value='';
    sfx.save();saveCloud();renderRecords();
    if(val>prevBest){toast('🏆 Новый рекорд: '+val+'!');confetti(30);window.checkAutoCompleteChallenge();}
    else toast('📊 Записано: '+val);
    window.checkAch();
  };
  window.renderRecords=function(){const el=document.getElementById('recordsList');if(!el)return;el.innerHTML='';REC_SKILLS.forEach(rs=>{const data=state.records[rs.id]||[];const best=data.length?Math.max(...data.map(r=>r.val)):0;const last10=data.slice(-10);const mx=last10.length?Math.max(...last10.map(r=>r.val)):1;const entry=document.createElement('div');entry.className='rec-entry';const hdr=document.createElement('div');hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';const h4=document.createElement('h4');h4.style.cssText='margin:0;font-size:16px;';h4.textContent=rs.icon+' '+rs.name;const cnt=document.createElement('span');cnt.style.cssText='font-size:11px;color:var(--muted);';cnt.textContent='Замеров: '+data.length;hdr.append(h4,cnt);const bestEl=document.createElement('div');bestEl.className='rec-best';bestEl.textContent=best||'—';if(best){const u=document.createElement('span');u.style.cssText='font-size:14px;color:var(--muted);';u.textContent=' '+rs.unit;bestEl.appendChild(u);}entry.append(hdr,bestEl);if(data.length>=2){const chart=document.createElement('div');chart.className='rec-chart';last10.forEach(r=>{const bh=Math.max(6,(r.val/mx)*64);const bar=document.createElement('div');bar.className='rec-bar';bar.style.height=bh+'px';bar.dataset.val=r.val+' '+rs.unit;chart.appendChild(bar);});const dir=document.createElement('div');dir.style.cssText='display:flex;justify-content:space-between;font-size:10px;color:var(--muted);';dir.innerHTML='<span>← старые</span><span>новые →</span>';entry.append(chart,dir);}const row=document.createElement('div');row.className='rec-inp-row';const inp=document.createElement('input');inp.id='ri-'+rs.id;inp.className='field';inp.type='number';inp.min='0';inp.step='0.1';inp.placeholder='Новый ('+rs.unit+(rs.hint?', '+rs.hint:'')+')';inp.max=rs.max||'';inp.min='0';inp.style.margin='0';inp.addEventListener('keydown',e=>{if(e.key==='Enter')window.addRecord(rs.id);});const ab=document.createElement('button');ab.className='btn btn-primary';ab.style.padding='10px 14px';ab.textContent='✓';ab.onclick=()=>window.addRecord(rs.id);row.append(inp,ab);entry.append(row);el.appendChild(entry);});};
})();