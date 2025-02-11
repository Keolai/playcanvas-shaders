// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name PixelateEffect
 * @classdesc Implements the PixelateEffect post processing effect.
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function PixelateEffect(graphicsDevice) {
    pc.PostEffect.call(this, graphicsDevice);

    this.shader = new pc.Shader(graphicsDevice, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION
        },
        vshader: [
            (graphicsDevice.webgl2) ? ("#version 300 es\n\n" + pc.shaderChunks.gles3VS) : "",
            "attribute vec2 aPosition;",
            "",
            "varying vec2 vUv0;",
            "",
            "void main(void)",
            "{",
            "    gl_Position = vec4(aPosition, 0.0, 1.0);",
            "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
            "}"
        ].join("\n"),
        fshader: [
            (graphicsDevice.webgl2) ? ("#version 300 es\n\n" + pc.shaderChunks.gles3PS) : "",
            "precision " + graphicsDevice.precision + " float;",
            pc.shaderChunks.screenDepthPS,
            "",
            "varying vec2 vUv0;",
            "",
            "uniform vec2 uResolution;",
            "uniform sampler2D uColorBuffer;",
            "uniform float uAmount;",
            "uniform float uLowContrast;",
            "uniform float uHighContrast;",
            "uniform sampler2D uLUTTexture;", //this is the LUT
            "",
            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            "",
            "   vec2 pixelateDxy = uAmount / uResolution;",
            "   vec2 pixelateCoord = pixelateDxy * floor( uv / pixelateDxy );",
            "    vec4 color = texture2D(uColorBuffer, pixelateCoord);",
            "float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));",
            "vec4 newColor = vec4(0);",
            " if (brightness > 0.4 && brightness < 0.6){",
            " color = clamp(color * uLowContrast,0.0,1.0);",    
            "} else if (brightness > 0.75 && brightness < 1.0) {",
            "color = clamp(color * uHighContrast,0.0,1.0);",
             "} else {",
            "color = color;}",
            // THIS IS THE LUT CODE 
            // "const float lutLevel = 16.0;",
            // " vec3 scaledColor = color.rgb * (lutLevel - 1.0);",

            // " float rIndex = scaledColor.r;",
            // "float gIndex = scaledColor.g;",
            // "float bIndex = scaledColor.b;",
            // "float sliceX = mod(bIndex, lutLevel);",
            // "float sliceY = floor(bIndex / lutLevel);",
            // " float totalSize = lutLevel * lutLevel; // 16*16 = 256 for a level-16 LUT.",
            // "vec2 uvCords;",
            // "uvCords.x = ((rIndex + sliceX * lutLevel + 0.5) / totalSize);",
            // "uvCords.y = ((gIndex + sliceY * lutLevel + 0.5) / totalSize)s;",


            // "float index = floor(color.b * (256.0 - 1.0));",
            // "float lutY = (index + 0.5) / 256.0;",
            // "vec2 lutUV = vec2(color.r, lutY);",
            // "vec3 lutColor = texture2D(uLUTTexture,lutUV).rgb;",

            "    // 3. Quantize the color channels to 40 levels.",  
"    float levels = 40.0;",  
"    // Multiply by levels then floor to get an integer value for each channel.",  
"    // Clamp to ensure values remain in the 0 to 39 range.",  
"    ivec3 quant = ivec3(clamp(floor(color.rgb * levels), 0.0, levels - 1.0));",  
"",  
"    // 4. Combine the quantized values into a single index.",  
"    //    The index is computed as: index = r*40^2 + g*40 + b.",  
"    int index = quant.r * int(levels * levels) + quant.g * int(levels) + quant.b;",  
"    float indexF = float(index);",  
"",  
"    // 5. Convert the index into UV coordinates.",  
"    //    The LUT texture is 256x256, so:",  
"    float lutTexSize = 256.0;",  
"    // Compute the pixel coordinates in the LUT.",  
"    float x = mod(indexF, lutTexSize) + 0.5;",  
"    float y = floor(indexF / lutTexSize) + 0.5;",  
"    vec2 lutUV = vec2(x, y) / lutTexSize;",  
            "gl_FragColor = vec4((texture2D(uLUTTexture, lutUV).rgb),1.0);",
            // "   gl_FragColor = vec4(lutColor,1.0);",
            // END OF LUT CODE
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

PixelateEffect.prototype = Object.create(pc.PostEffect.prototype);
PixelateEffect.prototype.constructor = PixelateEffect;

Object.assign(PixelateEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {

        var device = this.device;
        var scope = device.scope;

        scope.resolve("uResolution").setValue([device.width, device.height]);
        scope.resolve("uAmount").setValue(this.amount);
        scope.resolve("uLowContrast").setValue(this.lowContrast);
        scope.resolve("uHighContrast").setValue(this.highContrast);
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
        scope.resolve("uLUTTexture").setValue(this.lutTexture);


        pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var Pixelate = pc.createScript('pixelate');

Pixelate.attributes.add('amount', {
    type: 'number',
    default: 12,
    min: 1,
    max: 64,
    title: 'Amount',
    description: 'The size of each pixel.'
});

Pixelate.attributes.add('lowContrast', {
    type: 'number',
    default: 0.9,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the low contrast multiplier'
});

Pixelate.attributes.add('highContrast', {
    type: 'number',
    default: 1.1,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the high contrast multiplier'
});

Pixelate.attributes.add('textureAsset', {
    type: 'asset'
});

Pixelate.prototype.initialize = function () {

    this.effect = new PixelateEffect(this.app.graphicsDevice);
    this.effect.amount = this.amount;
    this.effect.lowContrast = this.lowContrast;
    this.effect.highContrast = this.highContrast;

    this.lutTexture = new pc.Texture(this.app.graphicsDevice, {
    format: pc.PIXELFORMAT_R8_G8_B8_A8,
    mipmaps: false
    });

     this.effect.lutTexture = new pc.Asset("lutTexture", "texture");
    // const asset = new pc.Asset("lutTexture", "texture", { url: "path/to/lut.png" });
    this.app.assets.add(this.textureAsset);
    this.app.assets.load(this.textureAsset);

    this.textureAsset.ready(() => {
        console.log("ready");
      // console.log(this.lutTexture);
    this.effect.lutTexture.minFilter = pc.FILTER_LINEAR;
    this.effect.lutTexture.magFilter = pc.FILTER_LINEAR;
    this.effect.lutTexture.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
    this.effect.lutTexture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
    //this.effect.lutTexture.setSource(this.textureAsset.resource);
    this.effect.lutTexture= this.textureAsset.resource;
    console.log(this.effect.lutTexture); 
    });



    this.on('attr', function (name, value) {
        this.effect[name] = value;
    }, this);

    var queue = this.entity.camera.postEffects;

    queue.addEffect(this.effect);

    this.on('state', function (enabled) {
        if (enabled) {
            queue.addEffect(this.effect);
        } else {
            queue.removeEffect(this.effect);
        }
    });

    this.on('destroy', function () {
        queue.removeEffect(this.effect);
    });
};
