
import figma from './figma.mjs';

// Build CSS and Javascript. Figma REST API doesn't correctly order variables in the payload with the order in the UI, so we have to code around this.
// In order, we want semantic colors, semantic non-colors, primitive colors, primitive non-colors.
export default class writeJsAndCss {
    constructor (allVariables, allCollections, colorRamps) {

        let modeNames = {};
        let cssSemanticModes = {};
        let cssPrimitiveLines = [];
        let jsSemanticLines = {};
        let jsPrimitiveLines = [];

        // Build mode id -> name map for later reference
        for (const collection in allCollections) {
            allCollections[collection].modes.forEach(mode => {
                modeNames[mode.modeId] = mode.name;
            });
        }

        // Convert `allVariables` object to an array sorted by colors first
        Object.values(allVariables)
            .sort((a, b) => {
                if (a.resolvedType == figma.TYPE_COLOR && b.resolvedType != figma.TYPE_COLOR) {
                    return -1;
                } else if (a.resolvedType != figma.TYPE_COLOR && b.resolvedType == figma.TYPE_COLOR) {
                    return 1;
                }
                return 0;
            })

            // Then add each of them to arrays that will populate a template literal later
            .forEach(figmaVariable => {

                // Add Semantic lines first
                for (const modeId in figmaVariable.valuesByMode) {
                    if (figma.modeValueIsAlias(figmaVariable.valuesByMode[modeId])) {
                        cssSemanticModes[modeNames[modeId]] = cssSemanticModes[modeNames[modeId]] || [];
                        jsSemanticLines[modeNames[modeId]] = jsSemanticLines[modeNames[modeId]] || [];
                        const aliasId = figmaVariable.valuesByMode[modeId].id;
                        cssSemanticModes[modeNames[modeId]].push(this.cssLine(modeNames[modeId], figmaVariable.name, figma.toCssVar(figma.PRIMITIVE, allVariables[aliasId].name)));
                        jsSemanticLines[modeNames[modeId]].push(this.jsSemanticLine(figmaVariable.name, `${figma.JS_OBJECT_NAME}.${figma.PRIMITIVE}['${allVariables[aliasId].name}']`));
                    }
                }

                // Then add Primitive lines, ignoring possible additional modes which are not supported. See README.md "Known Limitations" for explanation.
                const leftModeId = Object.keys(figmaVariable.valuesByMode)[0];
                const leftModeValue = figmaVariable.valuesByMode[leftModeId];
                if (!figma.modeValueIsAlias(leftModeValue)) {
                    if (figmaVariable.resolvedType == figma.TYPE_COLOR){

                        // Add color series (like "cobalt/50", "slate/20", etc.)
                        if (figma.RGX_BASE_COLOR_SUFFIX.test(figmaVariable.name)) {
                            const colorNameWithoutSeries = figmaVariable.name.replace(figma.RGX_COLOR_RAMP_SUFFIX, '');
                            const colorRamp = colorRamps[colorNameWithoutSeries][leftModeId];
                            for (const seriesName in colorRamp) {
                                cssPrimitiveLines.push(this.cssLine(figma.PRIMITIVE, seriesName, colorRamp[seriesName].hex));
                                jsPrimitiveLines.push(this.jsPrimitiveLine(seriesName, `'${colorRamp[seriesName].hex}'`));
                            }
                        }

                        // Add non-series colors (like "white", "black", "accessibility-blue", etc.)
                        else if (!figma.RGX_COLOR_RAMP_SUFFIX.test(figmaVariable.name)) {
                            cssPrimitiveLines.push(this.cssLine(figma.PRIMITIVE, figmaVariable.name, figma.toCssHex(leftModeValue)));
                            jsPrimitiveLines.push(this.jsPrimitiveLine(figmaVariable.name, `'${figma.toCssHex(leftModeValue)}'`));
                        }
                    }
                    else if (figmaVariable.resolvedType == figma.TYPE_STRING){
                        cssPrimitiveLines.push(this.cssLine(figma.PRIMITIVE, figmaVariable.name, leftModeValue));
                        jsPrimitiveLines.push(this.jsPrimitiveLine(figmaVariable.name, `'${leftModeValue}'`));
                    }
                    else if (figmaVariable.resolvedType == figma.TYPE_FLOAT){
                        cssPrimitiveLines.push(this.cssLine(figma.PRIMITIVE, figmaVariable.name, leftModeValue));
                        jsPrimitiveLines.push(this.jsPrimitiveLine(figmaVariable.name, leftModeValue));
                    }
                    else if (figmaVariable.resolvedType == figma.TYPE_BOOLEAN) {
                        // Don't add booleans to CSS. Doesn't make sense. Only add to JS (which also doesn't really make sense, but might be useful to someone oneday???)
                        jsPrimitiveLines.push(this.jsPrimitiveLine(figmaVariable.name, leftModeValue));
                    }
                }
            });

        // Write CSS file
        let cssFileContent = `:root {

    /*
        Case-Sensitive! Call these like: background-color: var(--${figma.NAMESPACE}Light-Mode-Brand-Primary); 
    */
`;
        for (const modeName in cssSemanticModes) {
            cssFileContent += `${cssSemanticModes[modeName].join('\n')}\n`;
        }
        cssFileContent += `
    /*
        Don't use these! Use a property from above instead. If you absolutely have to use one of these, please discuss with the UX team so they can update their designs.
        To temporarily unblock yourself, you could call one of these like var(--${figma.NAMESPACE}${figma.PRIMITIVE}-Cobalt-70);
    */
${cssPrimitiveLines.join('\n')}
}`;
        figma.writeFile(figma.FILE_VARIABLES_CSS, cssFileContent);

        // Write JS file
        let jsFileContent = `"use strict";

/*
    Import these at the top of your file like this:
        import designTokens from '${figma.FILE_VARIABLES_JS}';
    then you can call them like this:
        const someColor = designTokens['Light Mode']['Brand/Primary'];
 */
const ${figma.JS_OBJECT_NAME} = {
`;

        for (const modeName in jsSemanticLines) {
            jsFileContent += `
    '${modeName}': {
${jsSemanticLines[modeName].join(`,\n`)}
    },
`;
        }
        jsFileContent += `
    /*
        Don't use these! Use a property from above instead.
        If you absolutely have to use one of these, please discuss with the UX team so they can update their designs.
        To temporarily unblock yourself, you could call one of these like designTokens.${figma.PRIMITIVE}['Cobalt/70'];
    */
    ${figma.PRIMITIVE}: {
${jsPrimitiveLines.join(`,\n`)}
    }
}
export default ${figma.JS_OBJECT_NAME};

// Prevent adding or deleting properties on this object because they won't be in sync w/ Figma or the generated CSS file.
Object.freeze(${figma.JS_OBJECT_NAME});
Object.freeze(${figma.JS_OBJECT_NAME}.${figma.PRIMITIVE});`;
        for( const modeName in jsSemanticLines) {
            jsFileContent += `\nObject.freeze(${figma.JS_OBJECT_NAME}['${modeName}']);`;
        }

        figma.writeFile(figma.FILE_VARIABLES_JS, jsFileContent);
    }

    // String decorators
    jsSemanticLine(name, value) {
        return `        get '${name}'() {return ${value};}`;
    }
    jsPrimitiveLine(name, value) {
        return `        '${name}': ${value}`;
    }
    cssLine(group, name, value) {
        return `    ${figma.toCssName(group, name)}: ${value};`;
    }
}
