// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name saturateEffect
 * @classdesc Implements the saturateEffect AND a 1bit contrast post processing effect.
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function saturateEffect(graphicsDevice) {
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
            "uniform float uSaturation;",
            "",
            "vec3 rgb2hsv(vec3 c)",
            "{",
            " vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);",
            "vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));",
            "vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));",

            "float d = q.x - min(q.w, q.y);",
            "float e = 1.0e-10;",
            "return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);",
            "}",

            "vec3 hsv2rgb(vec3 c)",
            "{",
            "vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);",
            "vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);",
            "return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);",
            "}",

            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            "",
            "    vec4 color = texture2D(uColorBuffer, uv);",
            "vec3 hsvColor = rgb2hsv(color.xyz);",
            "hsvColor.g *= uSaturation; //saturate",
            "hsvColor.g = clamp(hsvColor.g,0.0,1.0);",
            "vec4 newColor = vec4(hsv2rgb(hsvColor), 1.0);",
            "   gl_FragColor = newColor;",
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

saturateEffect.prototype = Object.create(pc.PostEffect.prototype);
saturateEffect.prototype.constructor = saturateEffect;

Object.assign(saturateEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {

        var device = this.device;
        var scope = device.scope;

        scope.resolve("uResolution").setValue([device.width, device.height]);
        scope.resolve("uSaturation").setValue(this.amount);
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);

        pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var saturate = pc.createScript('saturate');

saturate.attributes.add('satMult', {
    type: 'number',
    default: 1.0,
    min: 0.0,
    max: 5.0,
    title: 'Saturation',
    description: 'Saturation Multiplier'
});

saturate.prototype.initialize = function () {

    this.effect = new saturateEffect(this.app.graphicsDevice);
    this.effect.amount = this.satMult;

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
