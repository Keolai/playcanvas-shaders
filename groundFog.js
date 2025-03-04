// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name HFogEffect
 * @classdesc Implements a linear heightFog effect
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function HFogEffect(graphicsDevice) {
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
            "varying vec3 fPosition;",

              "uniform mat4 matrix_viewProjection;",
            "",
            "void main(void)",
            "{",
            "vec2 vPosition = aPosition.xy;",
            "    gl_Position = vec4(aPosition, 0.0, 1.0);",
            "vec4 world = inverse(matrix_viewProjection) * vec4(aPosition.xy,1.0,1.0);",
            "world /= world.w;",
            "fPosition = world.xyz;",
            "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
            "}"
        ].join("\n"),
        fshader: [
            (graphicsDevice.webgl2) ? ("#version 300 es\n\n" + pc.shaderChunks.gles3PS) : "",
            "precision " + graphicsDevice.precision + " float;",
            pc.shaderChunks.screenDepthPS,
            "",
            "varying vec2 vUv0;",
            "varying vec3 fPosition;",
            "",
            "uniform vec2 uResolution;",
            "uniform sampler2D uColorBuffer;",
            "uniform vec3 uFogColor;",
            "uniform vec3 uCameraPosition;",

            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            "float depth = getLinearScreenDepth(uv)/1000.0;",
            
            "vec4 positionRecon =(vec4(fPosition * depth,1.0));",
             "vec3 uCameraView = positionRecon.xyz; //worldPosition",
            "",
            "float fogDepth = distance(uCameraView,uCameraPosition);",
            "vec4 color = texture2D(uColorBuffer, uv);",
            "vec3 fogOrigin = uCameraPosition;",
            "vec3 fogDirection = normalize(uCameraView - fogOrigin);",
            "float heightFactor = 0.05;",
            "float fogDensity = 0.1;",
            "float fogFactor = heightFactor * exp(-fogOrigin.y * fogDensity) * (1.0 - exp(-fogDepth * fogDirection.y * fogDensity)) /fogDirection.y;",
            "fogFactor = clamp(fogFactor,0.0,1.0);",
            "",
            "//gl_FragColor = vec4(uCameraView,1);",
            "gl_FragColor = mix(color,vec4(uFogColor,1),fogFactor);",
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

HFogEffect.prototype = Object.create(pc.PostEffect.prototype);
HFogEffect.prototype.constructor = HFogEffect;

Object.assign(HFogEffect.prototype, {
    render: function (inputTarget, outputTarget, rect) {

        var device = this.device;
        var scope = device.scope;

        scope.resolve("uResolution").setValue([device.width, device.height]);
        scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
        scope.resolve("uFogColor").setValue(this.fogColorArray);
        scope.resolve("uCameraPosition").setValue([this.cameraPos.x,this.cameraPos.y,this.cameraPos.z]);
        pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
    }
});

// ----------------- SCRIPT DEFINITION ------------------ //
var heightFog = pc.createScript('heightFog');
heightFog.attributes.add( 'fogColor', { type: 'rgb', default: [0, 0, 0], title: 'Fog Color' } );

heightFog.prototype.initialize = function () {

    this.effect = new HFogEffect(this.app.graphicsDevice);
    this.fogColorArray = [this.fogColor.r,this.fogColor.g,this.fogColor.b];
    this.entity.camera.requestSceneDepthMap(true);
    this.effect.fogColorArray = this.fogColorArray;
    const cameraPos = this.entity.getPosition();

    this.effect.cameraPos = cameraPos;

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

heightFog.prototype.update = function(dt) {
    // Update the camera view matrix each frame

    const cameraPos = this.entity.getPosition();
    this.effect.cameraPos = cameraPos;
  
};
