import figma from './figma.mjs';
import writeJsAndCss from './writeJsAndCss.mjs';

// If your IT department messed up your computer's certificates, you'll need to uncomment this.
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// Get Figma file and personal access token from environment
const FILE_KEY = process.env.FIGMA_FILE_KEY;
const PAT = process.env.FIGMA_PAT;

// Make sure we got key and pat before continuing
if (!FILE_KEY || !PAT) throw new Error('FIGMA_FILE_KEY or FIGMA_PAT not found in environment variables. See: figmaApi/README.md for instructions on obtaining and setting these correctly.');

// Request variables from Figma
figma.fetchVariables(FILE_KEY, PAT, true).then( data => {

    // Write the raw response for debugging
    figma.writeFile(`${figma.DIR_GENERATED}lastRawFigmaSuccessResponse.json`, figma.prettyJson(data));

    let allVariables = data.meta.variables;
    let allVariablesByName = {};
    let allCollections = data.meta.variableCollections;
    let modeNames = {};
    let colorRamps = {};
    let brokenAliases = [];
    let auditPromise = Promise.resolve();
    let figmaWritePayload = {
        variables: [],
        variableModeValues: []
    };

    // Create mode names reference for later use
    for (const collectionId in allCollections) {
        allCollections[collectionId].modes.forEach(mode => {
            modeNames[mode.modeId] = mode.name;
        });
    }

    // Generate color ramps and check the response to make sure it will be able to build our JS and CSS files later.
    for (const varId in allVariables) {

        // Test for duplicate names between collections
        if (allVariablesByName[allVariables[varId].name]) {
            throw new Error(`Duplicate variable in Figma named "${allVariables[varId].name}" found in multiple collections. Cannot continue.`);
        } else {
            allVariablesByName[allVariables[varId].name] = allVariables[varId];
        }

        // Define color ramp if the variable's left-most mode is a value (not an alias), and is a "base" series color, meaning its suffix is "/50".
        const leftModeValue = Object.values(allVariables[varId].valuesByMode)[0];;
        if (!figma.modeValueIsAlias(leftModeValue) && allVariables[varId].resolvedType == figma.TYPE_COLOR && figma.RGX_BASE_COLOR_SUFFIX.test(allVariables[varId].name)) {
            let colorName = allVariables[varId].name.replace(figma.RGX_COLOR_RAMP_SUFFIX, '');
            for (const modeId in allVariables[varId].valuesByMode) {
                if (!figma.modeValueIsAlias(allVariables[varId].valuesByMode[modeId])) {
                    colorRamps[colorName] = colorRamps[colorName] || {};
                    colorRamps[colorName][modeId] = figma.colorSeries(allVariables[varId].valuesByMode[modeId], colorName);
                }
            }
        }
        
        // Sanity check types to see if Figma has fundamentally changed their API (which is in Beta at the time of writing this comment) that will cause failures later.
        if (allVariables[varId].resolvedType != figma.TYPE_COLOR && allVariables[varId].resolvedType != figma.TYPE_FLOAT && allVariables[varId].resolvedType != figma.TYPE_STRING && allVariables[varId].resolvedType != figma.TYPE_BOOLEAN) {
            throw new Error(`Received unknown "resolvedType" property from Figma: "${allVariables[varId].resolvedType}" for variable: "${allVariables[varId].name}".`);
        }

        // Look for any broken aliases that need to be fixed by the UX team before proceeding
        for (const modeId in allVariables[varId].valuesByMode) {
            if (figma.modeValueIsAlias(allVariables[varId].valuesByMode[modeId])) {
                const aliasId = allVariables[varId].valuesByMode[modeId].id;

                // Look for broken aliases and make a list of them to throw in one big error outside of these loops.
                if (!allVariables[aliasId]) {
                    brokenAliases.push(allVariables[varId].name);
                }
            }
        }
    }

    // Only proceed if we didn't find any broken aliases. These must be fixed by the UX team.
    if (brokenAliases.length) throw new Error(`Broken alias(es) found in Figma! The UX Team will need to fix. The following variable alias(es) "${brokenAliases}" is/are aliased to a primitive variable that doesn't exist. This is caused by deleting the primitive varibale after the alias was created, and will need to be restored.`);

    // Now that we have our color ramps defined and no fatal errors, loop again to see what we can programmatically add or update back to Figma.
    for (const varId in allVariables) {
        const leftModeId = Object.keys(allVariables[varId].valuesByMode)[0];
        const leftModeValue = allVariables[varId].valuesByMode[leftModeId];

        // Audit colors by looking for non-alias "base" (".../50") color names, and their tints and shades (".../10" - ".../90"). Add missing tints and shades, and update existing ones with correct hex values.
        if (!figma.modeValueIsAlias(leftModeValue) && allVariables[varId].resolvedType == figma.TYPE_COLOR && figma.RGX_COLOR_RAMP_SUFFIX.test(allVariables[varId].name)) {
            let colorName = allVariables[varId].name.replace(figma.RGX_COLOR_RAMP_SUFFIX, '');

            // This variable is a "base" color definition (name ends with "/50").
            if (figma.RGX_BASE_COLOR_SUFFIX.test(allVariables[varId].name)) {

                // Audit tints and shades.
                for (let seriesNum = figma.COLOR_SERIES_MIN; seriesNum <= figma.COLOR_SERIES_MAX; seriesNum += figma.COLOR_SERIES_INCREMENT) {
                    let seriesColorName = `${colorName}${figma.COLOR_SUFFIX_DELIM}${seriesNum}`;

                    // If they're missing, add them.
                    if (!allVariablesByName[seriesColorName]) {
                        console.warn(`Warning: Missing tint/shade in Figma will be added. [${seriesColorName}] "${colorRamps[colorName][leftModeId][seriesColorName].hex}"`);
                        let tempVariableId = new figma().tempId;
                        figmaWritePayload.variables.push(figma.variableInterface(figma.ACTION_CREATE, tempVariableId, {
                            name: seriesColorName,
                            modeName: figma.PRIMITIVE,
                            variableCollectionId: allVariables[varId].variableCollectionId,
                            resolvedType: figma.TYPE_COLOR
                        }));
                        for (const modeId in allVariables[varId].valuesByMode) {
                            figmaWritePayload.variableModeValues.push(figma.modeValueInterface(tempVariableId, modeId, colorRamps[colorName][modeId][seriesColorName].rgba));
                        }
                    }
                    // else if it does exist, its hex value will be verified later, outside of this for loop.
                }
            }

            // This is an existing tint/shade. Validate its hex value and add to update queue if it's incorrect.
            else {
                for (const modeId in allVariables[varId].valuesByMode) {
                    if (figma.toCssHex(allVariables[varId].valuesByMode[modeId]) != colorRamps[colorName][modeId][allVariables[varId].name].hex) {
                        console.warn(`Warning: Incorrect color value in Figma will be replaced. [${allVariables[varId].name}] (mode: ${modeNames[modeId]}) "${figma.toCssHex(allVariables[varId].valuesByMode[modeId])}" -> "${colorRamps[colorName][modeId][allVariables[varId].name].hex}"`);
                        figmaWritePayload.variableModeValues.push(figma.modeValueInterface(varId, modeId, colorRamps[colorName][modeId][allVariables[varId].name].rgba));
                    }
                }
            }
        }

        // Audit Figma CSS syntax property (which Figma refers to as "WEB"). A single variable could have mulitple modes in the name, so use the "left-most" mode for this syntax property.
        const correctSyntax = figma.toCssVar(figma.modeValueIsAlias(leftModeValue) ? modeNames[leftModeId] : figma.PRIMITIVE, allVariables[varId].name);
        if (!allVariables[varId].codeSyntax || !allVariables[varId].codeSyntax.WEB || allVariables[varId].codeSyntax.WEB != correctSyntax) {
            console.warn(`Warning: Incorrect syntax value in Figma will be replaced. [${allVariables[varId].name}] ${allVariables[varId].codeSyntax.WEB ? `"${allVariables[varId].codeSyntax.WEB}"` : '<empty>'} -> "${correctSyntax}"`);
            figmaWritePayload.variables.push(figma.variableInterface(figma.ACTION_UPDATE, varId, {codeSyntax: {WEB: correctSyntax}}));
        }

        // Audit "Hide from publishing" option
        if (!allVariables[varId].hiddenFromPublishing) {
            console.warn(`Warning: Incorrect "Hide from publishing" option in Figma will be replaced. [${allVariables[varId].name}] "${allVariables[varId].hiddenFromPublishing}" -> "true"`);
            figmaWritePayload.variables.push(figma.variableInterface(figma.ACTION_UPDATE, varId, {hiddenFromPublishing: true}));
        }
    }

    // If we have updates that need to be written to Figma, send them.
    if (figmaWritePayload.variables.length || figmaWritePayload.variableModeValues.length) {

        // For debugging
        figma.writeFile(`${figma.DIR_GENERATED}lastRawFigmaWritePayload.json`, figma.prettyJson(figmaWritePayload));

        // --- You can comment out this block if your PAT isn't associated with a full design seat/license in Figma, but the generated files will be out of sync and should not be used in a production environment. ---
        auditPromise = figma.writeVariables(FILE_KEY, PAT, figmaWritePayload).then(data => {
            console.log( `Successfully updated variables in Figma.`);
        }, error => {
            return Promise.reject(error && error.status == 403 ? 'The personal access token provided does not have a full Figma design seat/license, and is not allowed to write to Figma. You can comment out this request, but the generated files will be out of sync and should not be used in a production environment.' : error);
        });
    }

    // Write JS and CSS if everything above passed.
    auditPromise.then(() => {
        new writeJsAndCss(allVariables, allCollections, colorRamps);
    }, error => {
        throw new Error(`Could not write to Figma! ${figma.prettyJson(error)}`)
    });
},

// Figma returned an error when trying to fetch.
error => {
    throw new Error(`Figma didn't respond successfully. The response was: ${figma.prettyJson(error)}`);
});
