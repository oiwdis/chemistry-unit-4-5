import {topics, questions} from './content.js';
import {isCorrect, shuffle, selectQuestions, scoreQuiz} from './quiz.js';

const $ = selector => document.querySelector(selector);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='chem-study-v1';
let state={reviewed:[],best:null,quiz:null}, filter='all';
let storageAvailable=true;
try {
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(saved && Array.isArray(saved.reviewed)) state={...state,...saved,reviewed:saved.reviewed.filter(id=>topics.some(t=>t.id===id))};
  if(state.quiz && (!Array.isArray(state.quiz.ids) || !state.quiz.ids.length || state.quiz.ids.some(id=>!questions.some(q=>q.id===id)) || !Array.isArray(state.quiz.answers) || !Number.isInteger(state.quiz.index) || state.quiz.index<0 || state.quiz.index>=state.quiz.ids.length)) state.quiz=null;
} catch { storageAvailable=false; }
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageAvailable=false;}if(!storageAvailable) $('.save-label').textContent='Progress is kept for this session';}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
function setTab(name,focus=false){
  for(const mode of ['summary','quiz']) {const active=name===mode; const tab=$(`#${mode}-tab`);tab.setAttribute('aria-selected',active);tab.tabIndex=active?0:-1;$(`#${mode}-panel`).hidden=!active;}
  if(name==='quiz') renderQuiz();
  if(focus) $(`#${name}-tab`).focus();
}
for(const name of ['summary','quiz']){
  $(`#${name}-tab`).addEventListener('click',()=>setTab(name));
  $(`#${name}-tab`).addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();setTab(e.key==='Home'?'summary':e.key==='End'?'quiz':name==='summary'?'quiz':'summary',true);}});
}
$('#question-count').textContent=questions.length;
$('#summary-to-quiz').onclick=()=>{setTab('quiz');$('.workspace-bar').scrollIntoView({behavior:'smooth'});};

function renderSummary(){
  $('#topics').innerHTML=topics.map((t,i)=>`<details class="topic" id="topic-${t.id}" ${i===0?'open':''}><summary><span class="topic-number">${t.tag}</span><div><span class="unit-label">${t.unit==='both'?'UNITS 4 & 5':`UNIT ${t.unit}`}</span><h3>${t.title}</h3><p>${t.sub}</p></div><span class="topic-check" aria-label="${state.reviewed.includes(t.id)?'Reviewed':'Not yet reviewed'}">${state.reviewed.includes(t.id)?'✓':'+'}</span></summary><div class="topic-body">${t.html}<div class="topic-actions"><label class="review-check"><input type="checkbox" data-reviewed="${t.id}" ${state.reviewed.includes(t.id)?'checked':''}> I’ve reviewed this topic</label><button class="text-button" data-practice="${t.id}">Practice this topic ↗</button></div></div></details>`).join('');
  $('#topic-nav').innerHTML=topics.map(t=>`<a href="#topic-${t.id}" data-topic="${t.id}"><span>${t.tag}</span>${t.title.split(' · ')[0]}<b>${state.reviewed.includes(t.id)?'✓':''}</b></a>`).join('');
  updateProgress();
}
function updateProgress(){
  $('#review-count').textContent=`${state.reviewed.length} / ${topics.length}`;$('#review-progress').style.width=`${state.reviewed.length/topics.length*100}%`;
  for(const t of topics){const done=state.reviewed.includes(t.id);const check=$(`#topic-${t.id} .topic-check`);check.textContent=done?'✓':'+';check.setAttribute('aria-label',done?'Reviewed':'Not yet reviewed');$(`[data-topic="${t.id}"] b`).textContent=done?'✓':'';}
}
function applyFilters(){
  const term=$('#search').value.toLocaleLowerCase().trim();let count=0;
  for(const t of topics){const el=$(`#topic-${t.id}`);el.hidden=!((filter==='all'||String(t.unit)===filter||t.unit==='both')&&el.textContent.toLowerCase().includes(term));if(!el.hidden){count++;if(term)el.open=true;}}
  $('#empty-search').hidden=count>0;
  document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
}
$('#search').addEventListener('input',applyFilters);
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;applyFilters();});
$('#topics').addEventListener('change',e=>{if(e.target.dataset.reviewed){const id=e.target.dataset.reviewed;state.reviewed=state.reviewed.filter(x=>x!==id);if(e.target.checked)state.reviewed.push(id);save();updateProgress();}});
$('#topic-nav').addEventListener('click',e=>{const a=e.target.closest('[data-topic]');if(!a)return;e.preventDefault();filter='all';$('#search').value='';applyFilters();const el=$(`#topic-${a.dataset.topic}`);el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});el.querySelector('summary').focus({preventScroll:true});});
$('#topics').addEventListener('click',e=>{const b=e.target.closest('[data-practice]');if(b){setTab('quiz');renderSetup(b.dataset.practice);$('.workspace-bar').scrollIntoView({behavior:'smooth'});}});
let prePrint=null;
function preparePrint(){prePrint=topics.map(t=>({id:t.id,open:$(`#topic-${t.id}`).open,hidden:$(`#topic-${t.id}`).hidden}));for(const t of topics){const el=$(`#topic-${t.id}`);el.open=true;el.hidden=false;}}
window.addEventListener('beforeprint',()=>{if(!prePrint)preparePrint();});
window.addEventListener('afterprint',()=>{if(prePrint)for(const item of prePrint){const el=$(`#topic-${item.id}`);el.open=item.open;el.hidden=item.hidden;}prePrint=null;});
$('#print').onclick=()=>{preparePrint();window.print();};

function renderSetup(scope='all'){
  const ongoing=state.quiz&&!state.quiz.finished;
  $('#quiz-root').innerHTML=`<div class="quiz-setup"><div class="quiz-intro"><div class="eyebrow">TURN KNOWLEDGE INTO CONFIDENCE</div><h2>Let’s see what<br><em>you remember.</em></h2><p>A little retrieval goes a long way. Choose your focus, answer without your notes, and learn from every explanation.</p><div class="quiz-features"><div><span>01</span><p><strong>Mix it up</strong>Multiple-choice concepts and typed names & formulas.</p></div><div><span>02</span><p><strong>Understand the why</strong>Get an explanation after every answer.</p></div><div><span>03</span><p><strong>Close the gaps</strong>Review your results and retry what you missed.</p></div></div>${state.best?`<div class="best-score">✦ Personal best <strong>${state.best.percent}%</strong><span>${state.best.correct}/${state.best.total} in one session</span></div>`:''}</div><form id="setup-form" class="setup-card"><span class="card-kicker">YOUR PRACTICE SESSION</span><h3>Make it your quiz.</h3><label for="quiz-scope">What would you like to practice?</label><select id="quiz-scope"><option value="all">Everything · Units 4 & 5</option><option value="unit-4">Unit 4 · Atomic structure</option><option value="unit-5">Unit 5 · Ions & naming</option>${topics.map(t=>`<option value="${t.id}">${t.title}</option>`).join('')}</select><fieldset><legend>How many questions?</legend><div class="count-options">${['10','20','all'].map((n,i)=>`<label><input type="radio" name="count" value="${n}" ${i===0?'checked':''}><span>${n==='all'?'All':n}</span></label>`).join('')}</div></fieldset><p id="pool-count" class="field-hint"></p><div class="session-note">✧ Untimed, shuffled, and made for learning.<br>Use normal numbers in formulas, like Ca(OH)2.</div><button class="primary" type="submit">Start practicing <span>→</span></button>${ongoing?'<button class="secondary" id="resume-quiz" type="button">Resume your current quiz</button><p class="field-hint">Starting a new quiz replaces the current session.</p>':''}<span class="setup-footer">You’ve got this. One question at a time.</span></form></div>`;
  $('#quiz-scope').value=scope;
  function poolCount(){const n=selectQuestions(questions,$('#quiz-scope').value,'all').length;const selected=$('input[name="count"]:checked').value;$('#pool-count').textContent=`${n} questions available · This session: ${selected==='all'?n:Math.min(n,Number(selected))}`;}
  $('#quiz-scope').onchange=poolCount;document.querySelectorAll('[name="count"]').forEach(el=>el.onchange=poolCount);poolCount();
  $('#setup-form').onsubmit=e=>{e.preventDefault();startQuiz(selectQuestions(questions,$('#quiz-scope').value,$('input[name="count"]:checked').value));};
  if(ongoing)$('#resume-quiz').onclick=renderQuiz;
}
function startQuiz(list){
  state.quiz={ids:list.map(q=>q.id),index:0,answers:[],options:Object.fromEntries(list.filter(q=>q.options).map(q=>[q.id,shuffle(q.options)])),finished:false};save();renderQuiz();$('#question-title').focus();
}
function renderQuiz(){
  if(!state.quiz)return renderSetup();if(state.quiz.finished)return renderResults();
  const session=state.quiz,q=questions.find(x=>x.id===session.ids[session.index]),answer=session.answers.find(a=>a.id===q.id);const topic=topics.find(t=>t.id===q.topic);
  $('#quiz-root').innerHTML=`<div class="active-quiz"><div class="quiz-topline"><button class="text-button" id="quiz-settings">← Quiz setup</button><span>UNIT ${q.unit} <i> / </i> ${esc(topic.title)}</span><strong>${session.index+1} <span>/ ${session.ids.length}</span></strong></div><div class="progress-track quiz-track"><div style="width:${session.answers.length/session.ids.length*100}%"></div></div><div class="question-card"><div class="eyebrow">${q.options?'CHOOSE ONE ANSWER':q.kind==='formula'?'FORMULA RECALL':'NAME RECALL'}</div><h2 id="question-title" tabindex="-1">${esc(q.prompt)}</h2><form id="answer-form">${q.options?`<fieldset class="answers"><legend class="sr-only">Answer choices</legend>${(session.options[q.id]||q.options).map((choice,i)=>`<label class="answer-option ${answer?(choice===q.answer?'is-correct':choice===answer.value?'is-incorrect':''):''}"><input type="radio" name="answer" value="${esc(choice)}" ${answer?'disabled':''} ${answer?.value===choice?'checked':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${esc(choice)}</span>${answer&&choice===q.answer?'<b aria-label="Correct answer">✓</b>':''}</label>`).join('')}</fieldset>`:`<label class="input-label" for="written-answer">Your answer</label><input id="written-answer" class="written-answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.kind==='formula'?'e.g. Ca(OH)2':'Type the chemical name…'}" value="${answer?esc(answer.value):''}" ${answer?'disabled':''}><p class="field-hint">${q.kind==='formula'?'Use correct element capitals. Regular or subscript numbers both work.':'Spelling counts. Roman numerals can have spaces: iron (III) oxide.'}</p>`}${!answer?'<p class="answer-error" id="answer-error" role="alert"></p><div class="question-actions"><button class="text-button" id="skip-answer" type="button">I don’t know yet</button><button class="primary" type="submit">Check answer <span>→</span></button></div>':''}</form>${answer?`<div class="feedback ${answer.correct?'correct':'incorrect'}" role="status"><strong>${answer.correct?'✓ You’ve got it.':answer.skipped?'A good one to revisit.':'Keep this one in mind.'}</strong>${answer.correct?'':`<p class="correct-answer">Correct answer: <b>${esc(q.answer)}</b></p>`}<p>${esc(q.explanation)}</p></div><div class="question-actions"><button class="text-button" id="review-concept">Review this concept ↗</button><button class="primary" id="next-question">${session.index===session.ids.length-1?'See my results':'Next question'} <span>→</span></button></div>`:''}</div><p class="quiz-bottom">No timer. No pressure. Just progress.</p></div>`;
  $('#quiz-settings').onclick=()=>renderSetup();
  if(!answer){$('#answer-form').onsubmit=e=>{e.preventDefault();const value=q.options?$('input[name="answer"]:checked')?.value:$('#written-answer').value;if(!value?.trim()){$('#answer-error').textContent='Choose or type an answer first.';return;}submitAnswer(q,value,false);};$('#skip-answer').onclick=()=>submitAnswer(q,'',true);}
  else {$('#next-question').onclick=()=>{if(session.index===session.ids.length-1){session.finished=true;const score=scoreQuiz(session.answers);const percent=Math.round(score.correct/score.total*100);if(!state.best||percent>state.best.percent)state.best={...score,percent};}else session.index++;save();renderQuiz();($('#question-title')||$('#results-title')).focus();};$('#review-concept').onclick=()=>{setTab('summary');$(`[data-topic="${q.topic}"]`).click();};}
}
function submitAnswer(q,value,skipped){
  if(state.quiz.answers.some(a=>a.id===q.id))return;
  state.quiz.answers.push({id:q.id,value,correct:!skipped&&isCorrect(q,value),skipped});save();renderQuiz();$('#next-question').focus();
}
function renderResults(){
  const score=scoreQuiz(state.quiz.answers),percent=Math.round(score.correct/score.total*100);
  $('#quiz-root').innerHTML=`<div class="results"><div class="results-hero"><div class="score-circle" style="--score:${percent}%"><strong>${percent}<small>%</small></strong></div><div><div class="eyebrow">SESSION COMPLETE</div><h2 id="results-title" tabindex="-1">${percent===100?'Look at that. You know it.':percent>=70?'You’re making connections.':'Every attempt is a step forward.'}</h2><p>${score.correct} of ${score.total} correct. ${score.missed.length?`Revisit ${score.missed.length} question${score.missed.length===1?'':'s'} and give them another try.`:'You answered every question correctly. Try a new set to keep it fresh.'}</p></div></div><div class="results-actions">${score.missed.length?`<button class="primary" id="retry-missed">Retry ${score.missed.length} missed <span>↻</span></button>`:''}<button class="${score.missed.length?'secondary':'primary'}" id="new-quiz">Build a new quiz →</button><button class="text-button" id="back-summary">Back to summary</button></div><div class="section-heading"><h3>Your answer review</h3><span>${score.total} questions</span></div><div class="result-list">${state.quiz.answers.map((a,i)=>{const q=questions.find(q=>q.id===a.id);return `<details class="result-item"><summary><span class="result-icon ${a.correct?'correct':'incorrect'}">${a.correct?'✓':'↻'}</span><span><small>QUESTION ${i+1} · ${a.correct?'CORRECT':a.skipped?'SKIPPED':'REVISIT'}</small>${esc(q.prompt)}</span><b>+</b></summary><div><p>Your answer: <strong>${a.skipped?'Skipped':esc(a.value)}</strong></p><p>Correct answer: <strong>${esc(q.answer)}</strong></p><p>${esc(q.explanation)}</p><button class="text-button" data-review="${q.topic}">Review the topic ↗</button></div></details>`;}).join('')}</div></div>`;
  if(score.missed.length)$('#retry-missed').onclick=()=>startQuiz(shuffle(score.missed.map(id=>questions.find(q=>q.id===id))));
  $('#new-quiz').onclick=()=>renderSetup();$('#back-summary').onclick=()=>setTab('summary');
  $('.result-list').onclick=e=>{const b=e.target.closest('[data-review]');if(b){setTab('summary');$(`[data-topic="${b.dataset.review}"]`).click();}};
}
renderSummary();save();
