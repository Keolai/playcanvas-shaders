// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name CompressEffect
 * @classdesc Implements the CompressEffect AND a 1bit contrast post processing effect.
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function CompressEffect(graphicsDevice) {
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
            "uniform float uSteps;",
            "",
            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            "",
            "   vec2 compressDxy = uAmount / uResolution;",
            "   vec2 compressCoord = compressDxy * floor( uv / compressDxy );",
            "    vec4 color = texture2D(uColorBuffer, compressCoord);",
            "float colorR = round(color.r / uSteps) * uSteps;",
            "float colorG = round(color.g / uSteps) * uSteps;",
            "float colorB = round(color.b / uSteps) * uSteps;",
            "float colorA = round(color.a / uSteps) * uSteps;",
            "vec4 newColor = vec4(colorR,colorG,colorB, 1);",
            "   gl_FragColor = newColor;",
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

CompressEffect.prototype = Object.create(pc.PostEffect.prototype);
CompressEffect.prototype.constructor = CompressEffect;

Object.assign(CompressEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {

        var device = this.device;
        var scope = device.scope;

        scope.resolve("uResolution").setValue([device.width, device.height]);
        scope.resolve("uAmount").setValue(this.amount);
        scope.resolve("uSteps").setValue(1 / this.steps);
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);

        pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var Compress = pc.createScript('compress');

Compress.attributes.add('amount', {
    type: 'number',
    default: 12,
    min: 1,
    max: 64,
    title: 'Amount',
    description: 'The size of each pixel.'
});

Compress.attributes.add('steps', {
    type: 'number',
    default: 8,
    min: 1,
    max: 256,
    title: 'Amount',
    description: 'The steps for each channel.'
});

Compress.prototype.initialize = function () {

    this.effect = new CompressEffect(this.app.graphicsDevice);
    this.effect.amount = this.amount;
    this.effect.steps = this.steps

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
