
import assert from 'assert';
import figma from '../figma.mjs';
import designTokens from '../generated/designTokens.js';

const semanticMode = 'Light Mode';
const semanticName = 'Brand/Primary';
const semanticValue = '#000000';
const primitiveName = 'Basic/White';
const primitiveValue = '#FFFFFF';

describe('Genenerated JS file', () => {

    describe('Get correct values', () => {
  
      it(`${semanticMode}, ${semanticName} = ${semanticValue}`, () => {
        assert.equal(designTokens[semanticMode][semanticName], semanticValue);
      });
      it(`${figma.PRIMITIVE}, ${primitiveName} = ${primitiveValue}`, () => {
        assert.equal(designTokens[figma.PRIMITIVE][primitiveName], primitiveValue);
      });
    });
  
    describe('designTokens object is immutable', () => {
  
      it('Cannot assign to designTokens object', () => {
        assert.throws(() => {designTokens = 'invalid'});
      });
      it('Cannot add property to designTokens object', () => {
        assert.throws(() => {designTokens.invalid = 'invalid'});
      });
    });
  
    describe(`designTokens['${semanticMode}'] object is immutable`, () => {
  
      it(`Cannot assign to designTokens['${semanticMode}'] object`, () => {
        assert.throws(() => {designTokens[semanticMode] = 'invalid'});
      });
      it(`Cannot add property to designTokens['${semanticMode}'] object`, () => {
        assert.throws(() => {designTokens[semanticMode].invalid = 'invalid'});
      });
      it(`Cannot delete designTokens['${semanticMode}'] property`, () => {
        assert.throws(() => {delete designTokens[semanticMode]});
      });
    });
  
    describe(`designTokens['${semanticMode}']['${semanticName}'] property is immutable`, () => {
  
      it(`Cannot assign to designTokens['${semanticMode}']['${semanticName}'] property`, () => {
        assert.throws(() => {designTokens[semanticMode][semanticName] = 'invalid'});
      });
      it(`Cannot delete designTokens['${semanticMode}']['${semanticName}'] property`, () => {
        assert.throws(() => {delete designTokens[semanticMode][semanticName]});
      });
    });
  
    describe(`designTokens.${figma.PRIMITIVE} object is immutable`, () => {
  
      it(`Cannot assign to designTokens.${figma.PRIMITIVE} object`, () => {
        assert.throws(() => {designTokens[figma.PRIMITIVE] = 'invalid'});
      });
      it(`Cannot add property to designTokens.${figma.PRIMITIVE} object`, () => {
        assert.throws(() => {designTokens[figma.PRIMITIVE].invalid = 'invalid'});
      });
      it(`Cannot delete designTokens.${figma.PRIMITIVE} property`, () => {
        assert.throws(() => {delete designTokens[figma.PRIMITIVE]});
      });
    });
  
    describe(`designTokens.${figma.PRIMITIVE}['${primitiveName}'] property is immutable`, () => {
      it(`Cannot assign to designTokens.${figma.PRIMITIVE}['${primitiveName}'] property`, () => {
        assert.throws(() => {designTokens[figma.PRIMITIVE][primitiveName] = 'invalid'});
      });
      it(`Cannot delete designTokens.${figma.PRIMITIVE}['${primitiveName}'] property`, () => {
        assert.throws(() => {delete designTokens[figma.PRIMITIVE][primitiveName]});
      });
    });
  });
