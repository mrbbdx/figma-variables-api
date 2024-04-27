
import fs from 'node:fs';
import fetch from 'node-fetch';

// Figma Utilities
export default class Figma {

    // Polyfill hack to expose constant properties until ES7 proposal is out
    static get DIR_GENERATED() {return `generated/`;}
    static get FILE_VARIABLES_JS() {return `${this.DIR_GENERATED}designTokens.js`;}
    static get FILE_VARIABLES_CSS() {return `${this.DIR_GENERATED}design-tokens.css`;}
    static get NAMESPACE() {return 'DT-';}
    static get JS_OBJECT_NAME() {return 'DESIGN_TOKENS';}
    static get FIGMA_HOST() {return 'https://api.figma.com';}
    static get TYPE_COLOR() {return 'COLOR';}
    static get TYPE_FLOAT() {return 'FLOAT';}
    static get TYPE_STRING() {return 'STRING';}
    static get TYPE_BOOLEAN() {return 'BOOLEAN';}
    static get VARIABLE_ALIAS() {return 'VARIABLE_ALIAS';}
    static get ACTION_CREATE() {return 'CREATE';}
    static get ACTION_UPDATE() {return 'UPDATE';}
    static get PRIMITIVE() {return '__primitive';}
    static get COLOR_SUFFIX_DELIM() {return '\/'};
    static get RGX_BASE_COLOR_SUFFIX() {return new RegExp(`${this.COLOR_SUFFIX_DELIM}50$`);}
    static get RGX_COLOR_RAMP_SUFFIX() {return new RegExp(`${this.COLOR_SUFFIX_DELIM}\\d{2}$`);}
    static get COLOR_SERIES_MIN() {return 10;}
    static get COLOR_SERIES_MAX() {return 90;}
    static get COLOR_SERIES_INCREMENT() {return 10;}


    /*
        Color and string utilities
    */

    // Generate unique temporary IDs with `new Figma().tempId;`
    static #lastIncrement = 0;
    constructor () {
        this.tempId = `figmaTempId-${++Figma.#lastIncrement}`;
    }

    // Convert Figma 0-1 decimal RGBA values to CSS RGB[a]
    static toCssRgba({r, g, b, a = 1}) {
        [r, g, b, a].forEach( color => { if (color === undefined || color > 1 || color < 0) throw new Error('Invalid color object. Required: { r: 0-1, g: 0-1, b: 0-1[, a: 0-1] }'); });
        return `rgb(${this.#decimalToInt(r)} ${this.#decimalToInt(g)} ${this.#decimalToInt(b)} / ${a})`;
    }

    // Convert Figma 0-1 decimal RGBA values to CSS hex
    static toCssHex({r, g, b, a = 1}) {
        [r, g, b, a].forEach( color => { if (color === undefined || color > 1 || color < 0) throw new Error('Invalid color object. Required: { r: 0-1, g: 0-1, b: 0-1[, a: 0-1] }'); });

        let alpha = (a !== 1) ? this.#decimalToHex(a) : '';
        return `#${this.#decimalToHex(r)}${this.#decimalToHex(g)}${this.#decimalToHex(b)}${alpha}`;
    }

    // Convert design token name to CSS name. Ex: "Brand/Primary" (Light Mode) -> "--DT-Light-Mode-Brand-Primary"
    static toCssName(group, variableName) {
        if (!group || !variableName) throw new Error('Missing argument(s)!');
        return `--${this.NAMESPACE}${group}-${variableName}`.replace(/\W/g, '-');
    }

    // Return CSS variable syntax. Ex: "Brand/Primary" (Light Mode) -> "var(--DT-Light-Mode-Brand-Primary)"
    static toCssVar(group, variableName) {
        if (!group || !variableName) throw new Error('Missing argument(s)!');
        return `var(${this.toCssName(group, variableName)})`;
    }

    // Helper to make an object human-readable
    static prettyJson(obj) {
        return JSON.stringify(obj, null, 2);
    }

    // Generate the 8 additional UX tints and shades of a base color.
    // "Tint" (add white) to series 1-50, and "shade" (add black) to 50-99.
        // Series 10 = 80% * (white - orig) + orig
        // Series 20 = 60% * (white - orig) + orig
        // Series 30 = 40% * (white - orig) + orig
        // Series 40 = 20% * (white - orig) + orig
        // Series 50 = Original color
        // Series 60 = 20% * (black - orig) + orig
        // Series 70 = 40% * (black - orig) + orig
        // Series 80 = 60% * (black - orig) + orig
        // Series 90 = 80% * (black - orig) + orig
    static colorSeries(colorRgba, baseColorName) {

        // Sanity check
        ['r', 'g', 'b', 'a'].forEach( color => { if (colorRgba[color] === undefined || colorRgba[color] > 1 || colorRgba[color] < 0) throw new Error('Invalid color object. Required: { r: 0-1, g: 0-1, b: 0-1[, a: 0-1] }'); });

        let series = {};
        for (let seriesNum = this.COLOR_SERIES_MIN; seriesNum <= this.COLOR_SERIES_MAX; seriesNum += this.COLOR_SERIES_INCREMENT) {

            // Determine white or black mix color based on UX series number
            let mixColor, percent;
            if( seriesNum > 50 ) {
                mixColor = 0; // Mix series > 50 with black
                percent = (seriesNum - 50) * 2;
            } else {
                mixColor = 1; // Mix series < 50 with white
                percent = 100 - (seriesNum * 2);
            }

            let newColor = this.mixColors(colorRgba, {r: mixColor, g: mixColor, b: mixColor}, percent);
            series[`${baseColorName}${this.COLOR_SUFFIX_DELIM}${seriesNum}`] = {
                hex: this.toCssHex(newColor),
                rgba: newColor
            };
        }

        return series;
    }

    // Mix two colors together. Same as SASS mix(), but with rgba{} input instead of hex string
    static mixColors(originalColor, mixColor, percent) {
        if (originalColor.a === undefined) {
            originalColor.a = 1;
        }

        // Sanity checks
        ['r', 'g', 'b', 'a'].forEach( color => { if (originalColor[color] === undefined || originalColor[color] > 1 || originalColor[color] < 0) throw new Error('Invalid color object. Required: { r: 0-1, g: 0-1, b: 0-1[, a: 0-1] }'); });
        if (percent < 0 || percent > 100 || percent === undefined) throw new Error(`Percent must be between 0-100, but received '${percent}'.`);

        let newColor = {a: originalColor.a};
        ['r', 'g', 'b'].forEach(color => {
            newColor[color] = percent / 100 * (mixColor[color] - originalColor[color]) + originalColor[color];
        });
        return newColor;
    }


    /*
        Fetch and file methods
    */

    // Get variables of a specific file from Figma
    static fetchVariables(fileKey, pat, unpublished = false) {
        return new Promise( (resolveCb, rejectionCb) => {

            let endpoint = `${this.FIGMA_HOST}/v1/files/${fileKey}/variables/${unpublished ? 'local' : 'published'}`;
            console.log(`Fetching from ${endpoint}`)
            fetch(endpoint, {
                method: 'GET',
                headers: {'X-Figma-Token': pat}
            })
                .then(async successResponse => {
                    let data = await successResponse.json();

                    // Before we resolve(), see if Figma's successful HTTP response return an error status and reject() if so.
                    data.status == 200 ? resolveCb(data) : rejectionCb(data);
                }, rejectionCb);
        });
    }

    // Write variables back to Figma
    static writeVariables(fileKey, pat, payload) {
        return new Promise( (resolveCb, rejectionCb) =>  {

            let endpoint = `${this.FIGMA_HOST}/v1/files/${fileKey}/variables`;
            console.log(`Attempting to write variables to ${endpoint}`);
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-Figma-Token': pat,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(async successResponse => {
                    let data = await successResponse.json();

                    // Before we resolve(), see if Figma's successful HTTP response return an error status and reject() if so.
                    data.status == 200 ? resolveCb(data) : rejectionCb(data);
                }, rejectionCb);
        });
    }

    // helper to write to a file to the local filesystem
    static writeFile(filename, content) {
        console.log( `Writing to ${filename}.`);
        fs.writeFileSync(filename, content);
    }


    /*
        Figma object utilities
    */

    static variableInterface(action, variableId, optionalProperties) {

        // Set some default values if not passed and creating new variable
        if (action == this.ACTION_CREATE) {
            optionalProperties.hiddenFromPublishing = optionalProperties.hiddenFromPublishing !== undefined ? optionalProperties.hiddenFromPublishing : true;
            optionalProperties.scopes = optionalProperties.scopes || ['ALL_SCOPES'];
            optionalProperties.codeSyntax = optionalProperties.codeSyntax || {
                WEB: this.toCssVar(optionalProperties.modeName, optionalProperties.name)
            }
        }

        // See: https://www.figma.com/developers/api#variablechange-type
        return {
            action: action,
            id: variableId,
            name: optionalProperties.name,
            variableCollectionId: optionalProperties.variableCollectionId,
            resolvedType: optionalProperties.resolvedType,
            description: optionalProperties.description,
            hiddenFromPublishing: optionalProperties.hiddenFromPublishing,
            scopes: optionalProperties.scopes,
            codeSyntax: optionalProperties.codeSyntax
        };
    }

    static modeValueInterface(variableId, modeId, value) {
        // See: https://www.figma.com/developers/api#variablemodevalue-type
        return {
            variableId: variableId,
            modeId: modeId,
            value: value
        };
    }

    static modeValueIsAlias(modeValue) {
        return !!(modeValue.type && modeValue.type == this.VARIABLE_ALIAS);
    }


    /*
        Private utilities below
    */

    // Convert decimal 0-1 to int 0-255
    static #decimalToInt(decimalValue) {
        return Math.round(decimalValue * 255);
    }

    // Convert decimal 0-1 to hex
    static #decimalToHex(decimalValue) {
        return this.#decimalToInt(decimalValue)
            .toString(16) // Convert base 10 to base 16
            .padStart(2,0) // Prefix 0 to values < 10
            .toUpperCase(); // For consistency, not functionality
    }
}
