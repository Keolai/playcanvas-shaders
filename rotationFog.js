// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name FogEffect
 * @classdesc Implements a linear fog effect, while allowing for the sky to be viewed
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
            "uniform float uCameraRotation;",
            "float calculatePitch(vec3 rightVector) {",
            "float pitch = acos(clamp(dot(rightVector, vec3(1.0, 0.0, 0.0)), -1.0, 1.0));",
            "return degrees(pitch);", // Pitch angle in degrees
            "}",
            "",
            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            " float sceneDepth = getLinearScreenDepth(uv);",
            "vec4 colorGreen = vec4(0,1,0,1);",
            "float fogMix = clamp(sceneDepth/10.0,0.0,1.0); //this is linear",
            "float newCameraRotation = uCameraRotation;",
            "if (uCameraRotation < -89.0){",
                "newCameraRotation = uCameraRotation + 180.0;",
            "}",
            "if (sceneDepth > 1000.0){",
                "//gl_FragColor = vec4(pow(uCameraRotation,2.0));",
                "if (newCameraRotation > 170.0){",
                    "fogMix = newCameraRotation/180.0;",
                "} else {",
                "fogMix = 1.0 - newCameraRotation/180.0;",
                "}",
            "} //else { vec4 color = texture2D(uColorBuffer, uv);gl_FragColor = mix(color,vec4(uFogColor,1),fogMix);}", 
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
        scope.resolve("uCameraRotation").setValue(this.cameraRotation);
        //console.log(this.cameraRotation);

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
    this.effect.cameraUpRotation = this.entity.getRotation().x;
    const viewMatrix = this.entity.camera.viewMatrix;

// Extract the right (X) and up (Y) vectors from the view matrix
    const cameraRight = new pc.Vec3(viewMatrix.data[0], viewMatrix.data[1], viewMatrix.data[2]);

    this.effect.cameraRotation = this.entity.getEulerAngles().x;

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

Fog.prototype.update = function(dt) {
    // Update the camera view matrix each frame
     const viewMatrix = this.entity.camera.viewMatrix;

// Extract the right (X) and up (Y) vectors from the view matrix
    const cameraRight = new pc.Vec3(viewMatrix.data[0], viewMatrix.data[1], viewMatrix.data[2]);
    this.effect.cameraRotation = this.entity.getEulerAngles().x;
};
