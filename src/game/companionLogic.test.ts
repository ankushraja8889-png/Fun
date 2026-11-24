import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCareAction,
  computeQuestionSimilarity,
  createInitialCompanionState,
  DEFAULT_PRESETS,
  evaluateInteractionTurn,
  randomizeFaceConfig,
} from './companionLogic';

test('computeQuestionSimilarity detects repeated and paraphrased questions', () => {
  assert.equal(computeQuestionSimilarity('What is your name?', 'what is your name'), 1);
  assert.ok(
    computeQuestionSimilarity('What is your favorite food?', 'Tell me your favorite food please') >= 0.68
  );
  assert.ok(
    computeQuestionSimilarity('Tumhara naam kya hai?', 'Naam kya hai tumhara') >= 0.8
  );
  assert.ok(
    computeQuestionSimilarity('What is your favorite food?', 'How is the weather in Zootopia?') < 0.3
  );
});

test('asking the same question repeatedly escalates mood to annoyed and angry', () => {
  let state = createInitialCompanionState();

  const turn1 = evaluateInteractionTurn(state, 'What is your favorite food?');
  assert.equal(turn1.isRepeat, false);
  state = turn1.nextState;
  assert.equal(state.mood, 'happy');

  const turn2 = evaluateInteractionTurn(state, 'What is your favorite food?');
  assert.equal(turn2.isRepeat, true);
  state = turn2.nextState;
  assert.equal(state.consecutiveRepeats, 1);
  assert.ok(state.patience < 90);

  const turn3 = evaluateInteractionTurn(state, 'What is your favorite food?');
  assert.equal(turn3.isRepeat, true);
  state = turn3.nextState;
  assert.equal(state.consecutiveRepeats, 2);
  assert.equal(state.mood, 'annoyed');

  const turn4 = evaluateInteractionTurn(state, 'What is your favorite food?');
  assert.equal(turn4.isRepeat, true);
  state = turn4.nextState;
  assert.equal(state.consecutiveRepeats, 3);
  assert.equal(state.mood, 'angry');
});

test('treats, petting, and apologies calm an angry companion', () => {
  let state = createInitialCompanionState();
  for (let i = 0; i < 4; i++) {
    state = evaluateInteractionTurn(state, 'Who is the mayor?').nextState;
  }
  assert.equal(state.mood, 'angry');

  state = applyCareAction(state, 'pawpsicle');
  assert.ok(state.patience > 40);
  assert.notEqual(state.mood, 'angry');

  state = applyCareAction(state, 'pet');
  assert.ok(state.affinity > 68);
});

test('randomizeFaceConfig always stays within valid anatomical bounds', () => {
  for (let i = 0; i < 20; i++) {
    const cfg = randomizeFaceConfig();
    assert.ok(cfg.eyeScale >= 0.78 && cfg.eyeScale <= 1.25);
    assert.ok(cfg.snoutLength >= 0.75 && cfg.snoutLength <= 1.3);
    assert.ok(cfg.earLength >= 0.75 && cfg.earLength <= 1.35);
    assert.ok(cfg.pupilSize >= 0.25 && cfg.pupilSize <= 0.62);
    assert.ok(DEFAULT_PRESETS[cfg.species]);
  }
});
