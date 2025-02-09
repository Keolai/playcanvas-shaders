// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name PixelateEffect
 * @classdesc Implements the PixelateEffect along with a contrast changer post processing effect.
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
            "   gl_FragColor = color;",
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
    default: 1.1,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the low contrast multiplier'
});

Pixelate.attributes.add('highContrast', {
    type: 'number',
    default: 0.9,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the high contrast multiplier'
});

Pixelate.prototype.initialize = function () {

    this.effect = new PixelateEffect(this.app.graphicsDevice);
    this.effect.amount = this.amount;
    this.effect.lowContrast = this.lowContrast;
    this.effect.highContrast = this.highContrast;

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
