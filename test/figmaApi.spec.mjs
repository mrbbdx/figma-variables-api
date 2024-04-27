
import assert from 'assert';
import figma from '../figma.mjs';

describe('Figma Utilities', () => {


  describe('Temp ID generation', () => {

    it('First new temp ID', () => {
      assert.equal( new figma().tempId, "figmaTempId-1");
    });
    it('Second new temp ID', () => {
      assert.equal( new figma().tempId, "figmaTempId-2");
    });
  });


  describe('CSS rgb() successes', () => {

    it('Best case scenario', () => {
      assert.equal(figma.toCssRgba({r: .5, g: .6, b: .4, a: 1 }), "rgb(128 153 102 / 1)");
    });
    it('Missing alpha property', () => {
      assert.equal(figma.toCssRgba({r: 0.5, g: 0.6, b: 0.4 }), "rgb(128 153 102 / 1)");
    });
    it('Non-1 alpha property', () => {
      assert.equal(figma.toCssRgba({r: .5, g: .6, b: .4, a: .5 }), "rgb(128 153 102 / 0.5)");
    });
    it('White', () => {
      assert.equal(figma.toCssRgba({r: 1, g: 1, b: 1, a: 1 }), "rgb(255 255 255 / 1)");
    });
    it('Black', () => {
      assert.equal(figma.toCssRgba({r: 0, g: 0, b: 0, a: 1 }), "rgb(0 0 0 / 1)");
    });
    it('Near, but not 0', () => {
      assert.equal(figma.toCssRgba({r: .02511111, g: .031111, b: .0030000001, a: 1 }), "rgb(6 8 1 / 1)");
    });
    it('Near, but not 255', () => {
      assert.equal(figma.toCssRgba({r: .95, g: .995, b: .91, a: 1 }), "rgb(242 254 232 / 1)");
    });
    it('Cobalt/50', () => {
      assert.equal(figma.toCssRgba({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}), "rgb(0 100 146 / 1)");
    });
  });


  describe('CSS rgb() failures', () => {
  
    it('Parameter is empty object', () => {
      assert.throws(()=>{figma.toCssRgba({})});
    });
    it('Parameter is empty string', () => {
      assert.throws(()=>{figma.toCssRgba('')});
    });
    it('Parameter missing green value', () => {
      assert.throws(()=>{figma.toCssRgba({r: .5, b: .4, a: 1 })});
    });
    it('Green value is more than 1"', () => {
      assert.throws(()=>{figma.toCssRgba({r: .5, g: 1.6, b: .4, a: 1 })});
    });
    it('Green value is less than 0"', () => {
      assert.throws(()=>{figma.toCssRgba({r: .5, g: -.6, b: .4, a: 1 })});
    });
    it('Alpha value is more than 1"', () => {
      assert.throws(()=>{figma.toCssRgba({r: .5, g: .6, b: .4, a: 1.1 })});
    });
    it('Alpha value is less than 0"', () => {
      assert.throws(()=>{figma.toCssRgba({r: .5, g: .6, b: .4, a: -1 })});
    });
  });


  describe('CSS #hex successes', () => {

    it('Best case scenario', () => {
      assert.equal(figma.toCssHex({r: .5, g: .6, b: .4, a: 1 }), "#809966");
    });
    it('Missing alpha property', () => {
      assert.equal(figma.toCssHex({r: 0.5, g: 0.6, b: 0.4 }), "#809966");
    });
    it('Non-1 alpha property', () => {
      assert.equal(figma.toCssHex({r: .5, g: .6, b: .4, a: .5 }), "#80996680");
    });
    it('White', () => {
      assert.equal(figma.toCssHex({r: 1, g: 1, b: 1, a: 1 }), "#FFFFFF");
    });
    it('Black', () => {
      assert.equal(figma.toCssHex({r: 0, g: 0, b: 0, a: 1 }), "#000000");
    });
    it('Near, but not 0', () => {
      assert.equal(figma.toCssHex({r: .02511111, g: .031111, b: .0030000001, a: 1 }), "#060801");
    });
    it('Near, but not 255', () => {
      assert.equal(figma.toCssHex({r: .95, g: .995, b: .91, a: 1 }), "#F2FEE8");
    });
    it('Cobalt/50', () => {
      assert.equal(figma.toCssHex({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}), "#006492");
    });
  });


  describe('CSS #hex failures', () => {

    it('Parameter is empty object', () => {
      assert.throws(()=>{figma.toCssHex({})});
    });
    it('Parameter is empty string', () => {
      assert.throws(()=>{figma.toCssHex('')});
    });
    it('Parameter missing green value', () => {
      assert.throws(()=>{figma.toCssHex({r: .5, b: .4, a: 1 })});
    });
    it('Green value is more than 1"', () => {
      assert.throws(()=>{figma.toCssHex({r: .5, g: 1.6, b: .4, a: 1 })});
    });
    it('Green value is less than 0"', () => {
      assert.throws(()=>{figma.toCssHex({r: .5, g: -.6, b: .4, a: 1 })});
    });
    it('Alpha value is more than 1"', () => {
      assert.throws(()=>{figma.toCssHex({r: .5, g: .6, b: .4, a: 1.1 })});
    });
    it('Alpha value is less than 0"', () => {
      assert.throws(()=>{figma.toCssHex({r: .5, g: .6, b: .4, a: -1 })});
    });
  });
  

  describe('mixColors() successes', () => {

    it('Black/20 gray', () => {
      assert.deepEqual(figma.mixColors({r: 0, g: 0, b: 0, a: 1}, {r: 1, g: 1, b: 1}, 60), {r: .6, g: .6, b: .6, a: 1});
    });
    it('Black/80 (still black...)', () => {
      assert.deepEqual(figma.mixColors({r: 0, g: 0, b: 0, a: 1}, {r: 0, g: 0, b: 0}, 60), {r: 0, g: 0, b: 0, a: 1});
    });
    it('White/80 gray', () => {
      assert.deepEqual(figma.mixColors({r: 1, g: 1, b: 1, a: 1}, {r: 0, g: 0, b: 0}, 60), {r: .4, g: .4, b: .4, a: 1});
    });
    it('Cobalt/50 (shade 50, no color change)', () => {
      assert.deepEqual(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}, {r: 1, g: 1, b: 1}, 0), {r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1});
    });
    it('Cobalt/50 Alpha undefined (shade 50, no color change)', () => {
      assert.deepEqual(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907}, {r: 1, g: 1, b: 1}, 0), {r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1});
    });
    it('Cobalt/10 light cobalt', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}, {r: 1, g: 1, b: 1}, 80)), '#CCE0E9');
    });
    it('Cobalt/20 light cobalt', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}, {r: 1, g: 1, b: 1}, 60)), '#99C1D3');
    });
    it('Cobalt/80 dark cobalt', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}, {r: 0, g: 0, b: 0}, 60)), '#00283A');
    });
    it('Cobalt/90 dark cobalt', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: 0, g: 0.3921568691730499, b: 0.572549045085907, a: 1}, {r: 0, g: 0, b: 0}, 80)), '#00141D');
    });
    it('Alpha 0.5', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: .5, g: .6, b: .4, a: .5 }, {r: 1, g: 1, b: 1}, 80)), '#E6EBE080');
    });
    it('Alpha undefined', () => {
      assert.equal(figma.toCssHex(figma.mixColors({r: .5, g: .6, b: .4}, {r: 1, g: 1, b: 1}, 80)), '#E6EBE0');
    });
  });


  describe('mixColors() failures', () => {

    it('Percent undefined', () => {
      assert.throws(() => {figma.mixColors({r: 1, g: 1, b: 1}, {r: 0, g: 0, b: 0})});
    });
    it('Alpha > 1', () => {
      assert.throws(() => {figma.mixColors({r: .5, g: .6, b: .4, a: 1.5 }, {r: 1, g: 1, b: 1}, 80)});
    });
  });


  describe('colorSeries() successes', () =>{

    it('Cobalt', () => {
      assert.deepEqual(figma.colorSeries({
        "r": 0,
        "g": 0.3921568691730499,
        "b": 0.572549045085907,
        "a": 1
      }, 'Cobalt'), {
        "Cobalt/10": {"hex": "#CCE0E9", "rgba": {"a": 1, "r": 0.8, "g": 0.87843137383461, "b": 0.9145098090171815}},
        "Cobalt/20": {"hex": "#99C1D3", "rgba": {"a": 1, "r": 0.6, "g": 0.75686274766922, "b": 0.8290196180343627}},
        "Cobalt/30": {"hex": "#66A2BE", "rgba": {"a": 1, "r": 0.4, "g": 0.6352941215038299, "b": 0.7435294270515442}},
        "Cobalt/40": {"hex": "#3383A8", "rgba": {"a": 1, "r": 0.2, "g": 0.5137254953384399, "b": 0.6580392360687256}},
        "Cobalt/50": {"hex": "#006492", "rgba": {"a": 1, "r": 0, "g": 0.3921568691730499, "b": 0.572549045085907}},
        "Cobalt/60": {"hex": "#005075", "rgba": {"a": 1, "r": 0, "g": 0.31372549533843996, "b": 0.4580392360687256}},
        "Cobalt/70": {"hex": "#003C58", "rgba": {"a": 1, "r": 0, "g": 0.23529412150382994, "b": 0.3435294270515442}},
        "Cobalt/80": {"hex": "#00283A", "rgba": {"a": 1, "r": 0, "g": 0.15686274766921998, "b": 0.22901961803436283}},
        "Cobalt/90": {"hex": "#00141D", "rgba": {"a": 1, "r": 0, "g": 0.07843137383460996, "b": 0.11450980901718139}}
      });
    });
    it('Slate', () => {
      assert.deepEqual(figma.colorSeries({
        "r": 0.7921568751335144,
        "g": 0.8078431487083435,
        "b": 0.843137264251709,
        "a": 1
      }, 'Slate'), {
        "Slate/10": {"hex": "#F4F5F7", "rgba": {"a": 1, "r": 0.9584313750267028, "g": 0.9615686297416687, "b": 0.9686274528503418}},
        "Slate/20": {"hex": "#EAEBEF", "rgba": {"a": 1, "r": 0.9168627500534058, "g": 0.9231372594833374, "b": 0.9372549057006836}},
        "Slate/30": {"hex": "#DFE2E7", "rgba": {"a": 1, "r": 0.8752941250801086, "g": 0.8847058892250061, "b": 0.9058823585510254}},
        "Slate/40": {"hex": "#D5D8DF", "rgba": {"a": 1, "r": 0.8337255001068116, "g": 0.8462745189666748, "b": 0.8745098114013672}},
        "Slate/50": {"hex": "#CACED7", "rgba": {"a": 1, "r": 0.7921568751335144, "g": 0.8078431487083435, "b": 0.843137264251709}},
        "Slate/60": {"hex": "#A2A5AC", "rgba": {"a": 1, "r": 0.6337255001068115, "g": 0.6462745189666748, "b": 0.6745098114013672}},
        "Slate/70": {"hex": "#797C81", "rgba": {"a": 1, "r": 0.4752941250801086, "g": 0.48470588922500607, "b": 0.5058823585510254}},
        "Slate/80": {"hex": "#515256", "rgba": {"a": 1, "r": 0.3168627500534058, "g": 0.32313725948333744, "b": 0.3372549057006836}},
        "Slate/90": {"hex": "#28292B", "rgba": {"a": 1, "r": 0.1584313750267028, "g": 0.16156862974166863, "b": 0.16862745285034175}}
      });
    });
    it('Avocado', () => {
      assert.deepEqual(figma.colorSeries({
        "r": 0.2980392277240753,
        "g": 0.6235294342041016,
        "b": 0.545098066329956,
        "a": 1
      }, 'Avocado'), {
        "Avocado/10": {"hex": "#DBECE8", "rgba": {"a": 1, "r": 0.8596078455448151, "g": 0.9247058868408203, "b": 0.9090196132659912}},
        "Avocado/20": {"hex": "#B7D9D1", "rgba": {"a": 1, "r": 0.7192156910896301, "g": 0.8494117736816407, "b": 0.8180392265319825}},
        "Avocado/30": {"hex": "#94C5B9", "rgba": {"a": 1, "r": 0.5788235366344452, "g": 0.7741176605224609, "b": 0.7270588397979736}},
        "Avocado/40": {"hex": "#70B2A2", "rgba": {"a": 1, "r": 0.43843138217926025, "g": 0.6988235473632812, "b": 0.6360784530639648}},
        "Avocado/50": {"hex": "#4C9F8B", "rgba": {"a": 1, "r": 0.2980392277240753, "g": 0.6235294342041016, "b": 0.545098066329956}},
        "Avocado/60": {"hex": "#3D7F6F", "rgba": {"a": 1, "r": 0.23843138217926024, "g": 0.49882354736328127, "b": 0.43607845306396487}},
        "Avocado/70": {"hex": "#2E5F53", "rgba": {"a": 1, "r": 0.17882353663444517, "g": 0.3741176605224609, "b": 0.3270588397979736}},
        "Avocado/80": {"hex": "#1E4038", "rgba": {"a": 1, "r": 0.11921569108963012, "g": 0.24941177368164064, "b": 0.21803922653198243}},
        "Avocado/90": {"hex": "#0F201C", "rgba": {"a": 1, "r": 0.05960784554481505, "g": 0.12470588684082029, "b": 0.10901961326599119}}
      });
    });
    it('Taupe', () => {
      assert.deepEqual(figma.colorSeries({
        "r": 0.7647058963775635,
        "g": 0.615686297416687,
        "b": 0.47058823704719543,
        "a": 1
      }, 'Taupe'), {
        "Taupe/10": {"hex": "#F3EBE4", "rgba": {"a": 1, "r": 0.9529411792755127, "g": 0.9231372594833374, "b": 0.8941176474094391}},
        "Taupe/20": {"hex": "#E7D8C9", "rgba": {"a": 1, "r": 0.9058823585510254, "g": 0.8462745189666748, "b": 0.7882352948188782}},
        "Taupe/30": {"hex": "#DBC4AE", "rgba": {"a": 1, "r": 0.8588235378265381, "g": 0.7694117784500122, "b": 0.6823529422283172}},
        "Taupe/40": {"hex": "#CFB193", "rgba": {"a": 1, "r": 0.8117647171020508, "g": 0.6925490379333497, "b": 0.5764705896377563}},
        "Taupe/50": {"hex": "#C39D78", "rgba": {"a": 1, "r": 0.7647058963775635, "g": 0.615686297416687, "b": 0.47058823704719543}},
        "Taupe/60": {"hex": "#9C7E60", "rgba": {"a": 1, "r": 0.6117647171020508, "g": 0.4925490379333496, "b": 0.37647058963775637}},
        "Taupe/70": {"hex": "#755E48", "rgba": {"a": 1, "r": 0.45882353782653806, "g": 0.36941177845001216, "b": 0.28235294222831725}},
        "Taupe/80": {"hex": "#4E3F30", "rgba": {"a": 1, "r": 0.3058823585510254, "g": 0.2462745189666748, "b": 0.18823529481887818}},
        "Taupe/90": {"hex": "#271F18", "rgba": {"a": 1, "r": 0.15294117927551265, "g": 0.12313725948333737, "b": 0.09411764740943906}}
      });
    });
    it('Taupe w/ 50% Alpha Transparency', () => {
      assert.deepEqual(figma.colorSeries({
        "r": 0.7647058963775635,
        "g": 0.615686297416687,
        "b": 0.47058823704719543,
        "a": 0.5
      }, 'Taupe'), {
        "Taupe/10": {"hex": "#F3EBE480", "rgba": {"a": 0.5, "r": 0.9529411792755127, "g": 0.9231372594833374, "b": 0.8941176474094391}},
        "Taupe/20": {"hex": "#E7D8C980", "rgba": {"a": 0.5, "r": 0.9058823585510254, "g": 0.8462745189666748, "b": 0.7882352948188782}},
        "Taupe/30": {"hex": "#DBC4AE80", "rgba": {"a": 0.5, "r": 0.8588235378265381, "g": 0.7694117784500122, "b": 0.6823529422283172}},
        "Taupe/40": {"hex": "#CFB19380", "rgba": {"a": 0.5, "r": 0.8117647171020508, "g": 0.6925490379333497, "b": 0.5764705896377563}},
        "Taupe/50": {"hex": "#C39D7880", "rgba": {"a": 0.5, "r": 0.7647058963775635, "g": 0.615686297416687, "b": 0.47058823704719543}},
        "Taupe/60": {"hex": "#9C7E6080", "rgba": {"a": 0.5, "r": 0.6117647171020508, "g": 0.4925490379333496, "b": 0.37647058963775637}},
        "Taupe/70": {"hex": "#755E4880", "rgba": {"a": 0.5, "r": 0.45882353782653806, "g": 0.36941177845001216, "b": 0.28235294222831725}},
        "Taupe/80": {"hex": "#4E3F3080", "rgba": {"a": 0.5, "r": 0.3058823585510254, "g": 0.2462745189666748, "b": 0.18823529481887818}},
        "Taupe/90": {"hex": "#271F1880", "rgba": {"a": 0.5, "r": 0.15294117927551265, "g": 0.12313725948333737, "b": 0.09411764740943906}}
      });
    });
  });


  describe('colorSeries() failures', () => {

    it('Bad input', () => {
      assert.throws(() => {figma.colorSeries('Invalid')});
    });
    it('Blue out of range', () => {
      assert.throws(() => {figma.colorSeries({r: .5, g: .5, b: 1.5, a: 1})});
    });
    it('Alpha undefined', () => {
      assert.throws(() => {figma.colorSeries({r: .5, g: .5, b: .5})});
    });
    it('Alpha > 1', () => {
      assert.throws(() => {figma.colorSeries({r: .5, g: .5, b: .5, a: 1.5})});
    });
  });


  describe('Mode value is an alias?', () => {

    it('Is an alias', () => {
      assert.strictEqual(figma.modeValueIsAlias({
        "type": "VARIABLE_ALIAS",
        "id": "VariableID:54835:25141"
      }), true);
    });
    it('Is not an alias', () => {
      assert.strictEqual(figma.modeValueIsAlias({
        "r": 0.6196078658103943,
        "g": 0.6196078658103943,
        "b": 0.6196078658103943,
        "a": 1
      }), false);
    });
    it('Is invalid (should return false)', () => {
      assert.strictEqual(figma.modeValueIsAlias('invalid'), false);
    });
  });


  describe('CSS Name helpers', () => {

    it('CSS Name is valid Light Mode', () => {
      assert.equal(figma.toCssName('Light Mode', 'Brand/Primary'), '--DT-Light-Mode-Brand-Primary');
    });
    it('CSS Name is valid Primitive', () => {
      assert.equal(figma.toCssName(figma.PRIMITIVE, 'Cobalt/50'), '--DT-__primitive-Cobalt-50');
    });
    it('CSS Name is missing mode', () => {
      assert.throws(() => {figma.toCssName(undefined, 'Brand/Primary')});
    });
    it('CSS Name is invalid args', () => {
      assert.throws(() => {figma.toCssName('Brand/Primary')});
    });
    it('CSS Variable Name is valid Light Mode', () => {
      assert.equal(figma.toCssVar('Light Mode', 'Brand/Primary'), 'var(--DT-Light-Mode-Brand-Primary)');
    });
    it('CSS Variable Name is valid Primitive', () => {
      assert.equal(figma.toCssVar(figma.PRIMITIVE, 'Cobalt/50'), 'var(--DT-__primitive-Cobalt-50)');
    });
    it('CSS Variable Name is missing mode', () => {
      assert.throws(() => {figma.toCssVar(undefined, 'Brand/Primary')});
    });
    it('CSS Variable Name is invalid args', () => {
      assert.throws(() => {figma.toCssVar('Brand/Primary')});
    });
  });
});
