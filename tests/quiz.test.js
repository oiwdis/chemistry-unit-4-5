import test from 'node:test';
import assert from 'node:assert/strict';
import {questions,topics,practiceA,practiceB,ions,mistakes,vocabulary} from '../dist/content.js';
import {isCorrect,selectQuestions,scoreQuiz,shuffle} from '../dist/quiz.js';

test('worksheet coverage and valid question records',()=>{
  assert.equal(practiceA.length,18);assert.equal(practiceB.length,18);assert.equal(mistakes.length,8);assert.equal(vocabulary.length,26);assert.equal(ions.length,24);
  assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
  for(const q of questions){assert.ok(topics.some(t=>t.id===q.topic));assert.ok(q.prompt&&q.answer&&q.explanation);assert.ok(isCorrect(q,q.answer));if(q.options){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}}
  for(const topic of topics)assert.ok(questions.some(q=>q.topic===topic.id));
});
test('formula grading accepts subscripts but preserves element case and atom counts',()=>{
  const magnesium=questions.find(q=>q.id==='formula-0');assert.ok(isCorrect(magnesium,'Mg3N2'));assert.ok(isCorrect(magnesium,'Mg₃N₂'));assert.ok(!isCorrect(magnesium,'MgN'));assert.ok(!isCorrect(magnesium,'mg3n2'));
  const cobalt=questions.find(q=>q.id==='b-10');assert.ok(isCorrect(cobalt,'Co2(CO3)3'));assert.ok(!isCorrect(cobalt,'CoCO3'));assert.ok(!isCorrect(cobalt,'Co2CO33'));
  const acetate=questions.find(q=>q.id==='b-2');assert.ok(isCorrect(acetate,'LiCH3COO'));
});
test('name grading tolerates case and Stock-system spacing but not wrong charges',()=>{
  const iron=questions.find(q=>q.id==='a-3');assert.ok(isCorrect(iron,'IRON ( III ) hydroxide'));assert.ok(!isCorrect(iron,'iron(II) hydroxide'));assert.ok(!isCorrect(iron,'iron hydroxide'));
  const carbon=questions.find(q=>q.id==='a-2');assert.ok(!isCorrect(carbon,'carbon disulfide'));
});
test('question selection respects focus and has no duplicates',()=>{
  const unit4=selectQuestions(questions,'unit-4','all');assert.ok(unit4.length>20);assert.ok(unit4.every(q=>q.unit===4));
  assert.equal(selectQuestions(questions,'honors',20).length,8);
  const picked=selectQuestions(questions,'all',20);assert.equal(picked.length,20);assert.equal(new Set(picked.map(q=>q.id)).size,20);
  assert.deepEqual(shuffle([1,2,3],()=>0).sort(),[1,2,3]);
});
test('skipped questions count as missed and scores are exact',()=>{
  assert.deepEqual(scoreQuiz([{id:'a',correct:true},{id:'b',correct:false},{id:'c',correct:false,skipped:true}]),{correct:1,total:3,missed:['b','c']});
});
