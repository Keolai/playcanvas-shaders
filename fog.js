// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name FogEffect
 * @classdesc Implements a linear fog effect
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function FogEffect(graphicsDevice) {
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
            "uniform vec3 uFogColor;",
            "",
            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            " float sceneDepth = getLinearScreenDepth(uv);",
            "vec4 colorGreen = vec4(0,1,0,1);",
            "float fogMix = clamp(sceneDepth/10.0,0.0,1.0); //this is linear", 
            "",
            "    vec4 color = texture2D(uColorBuffer, uv);",
            "   gl_FragColor = mix(color,vec4(uFogColor,1),fogMix);",
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

FogEffect.prototype = Object.create(pc.PostEffect.prototype);
FogEffect.prototype.constructor = FogEffect;

Object.assign(FogEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {

        var device = this.device;
        var scope = device.scope;

        scope.resolve("uResolution").setValue([device.width, device.height]);
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
        scope.resolve("uFogColor").setValue(this.fogColorArray);

        pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var Fog = pc.createScript('fog');
Fog.attributes.add( 'fogColor', { type: 'rgb', default: [0, 0, 0], title: 'Fog Color' } );

Fog.prototype.initialize = function () {

    this.effect = new FogEffect(this.app.graphicsDevice);
    this.fogColorArray = [this.fogColor.r,this.fogColor.g,this.fogColor.b];
    this.entity.camera.requestSceneDepthMap(true);
    this.effect.fogColorArray = this.fogColorArray;

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
