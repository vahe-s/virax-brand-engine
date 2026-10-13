import { customGeometry } from './geometry.js';
import { validateWordmark } from './layouts.js';

export const designInputs = ['offer', 'audience', 'difference', 'personality', 'references', 'visualSubjects', 'logoType', 'symmetry', 'uses'];
const text = value => typeof value === 'string' && value.trim().length > 0;

export function validatePlan(profile, input, styles) {
  const missing = designInputs.filter(key => !text(profile.answers[key]));
  if (missing.length) throw Error(`Answer the design questions first: ${missing.join(', ')}`);
  if (!text(input.businessSummary)) throw Error('Record the business summary before artwork.');
  if (!input.referenceReview || !['none', 'provided'].includes(input.referenceReview.mode)) throw Error('Record the reference choice.');
  if (!text(input.referenceReview.summary)) throw Error('Record what the references show, or why no reference exists.');
  if (!Array.isArray(input.referenceReview.sources)) throw Error('Use a list of reference sources.');
  if (input.referenceReview.mode === 'provided' && !input.referenceReview.sources.length) throw Error('Record the inspected reference sources.');
  for (const source of input.referenceReview.sources) {
    if (!text(source.location) || !text(source.observation)) throw Error('Record each source location and visual observation.');
  }
  if (!Array.isArray(input.concepts) || input.concepts.length !== styles.length) throw Error('Supply seven business-linked concepts.');
  const seen = new Set();
  for (const concept of input.concepts) {
    if (!styles.some(style => style.id === concept.styleId) || seen.has(concept.styleId)) throw Error('Use each style ID once.');
    seen.add(concept.styleId);
    for (const key of ['title', 'subject', 'businessConnection', 'customerReason', 'fontReason', 'colorReason', 'symmetryReason']) {
      if (!text(concept[key])) throw Error(`Record the design reason: ${key}`);
    }
    if (!['literal', 'stylized', 'abstract'].includes(concept.representation)) throw Error('Choose literal, stylized, or abstract representation.');
    if (concept.representation === 'abstract' && !text(input.abstractPermission)) throw Error('Record the owner permission for an abstract symbol.');
    if (!Array.isArray(concept.answerLinks) || !concept.answerLinks.includes('offer') || !concept.answerLinks.includes('visualSubjects') || concept.answerLinks.some(key => !designInputs.includes(key))) throw Error('Link each concept to the offer, visual subjects, and relevant design answers.');
    if (!concept.customSymbol) throw Error('Supply business-linked geometry. Do not reuse an unrelated catalog icon.');
    if (!concept.palette || Object.keys(concept.palette).sort().join(',') !== 'accent,ink,paper' || Object.values(concept.palette).some(color => typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color))) throw Error('Supply business-linked ink, paper, and accent HEX colors.');
    customGeometry(concept.customSymbol);
    for (const key of ['wordmarkGeometry', 'integratedWordmark']) {
      if (concept[key]) {
        validateWordmark(concept[key]);
        if (!text(concept.wordmarkReason)) throw Error('Record why the wordmark and any letter change fit the business.');
      }
    }
  }
  return structuredClone({ businessSummary: input.businessSummary, referenceReview: input.referenceReview, abstractPermission: input.abstractPermission || null, concepts: input.concepts });
}

export function requirePlan(profile) {
  if (!profile.designPlan) throw Error('Save a business-linked design plan before artwork.');
  return profile.designPlan;
}

export function conceptFor(profile, styleId) {
  const concept = requirePlan(profile).concepts.find(item => item.styleId === styleId);
  if (!concept) throw Error('The selected style has no business-linked concept.');
  return concept;
}
