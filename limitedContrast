// --------------- POST EFFECT DEFINITION --------------- //
/**
 * @class
 * @name LimiterEffect
 * @classdesc Implements the Limited palette Effect along with a contrast changer post processing effect.
 * @description Creates new instance of the post effect.
 * @augments PostEffect
 * @param {GraphicsDevice} graphicsDevice - The graphics device of the application.
 */
function LimiterEffect(graphicsDevice) {
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
            "const vec3 palette[16] = vec3[16](",
            "vec3(0.0, 0.0, 0.0),",  // done
            "vec3(0.0, 0.0, 0.1098),",  // done
            "vec3(0.1098, 0.0, 0.0),",  // done
            "vec3(0.1098,0.0117, 0.1098),",  // done
            "vec3(0.019, 0.1098, 0.1098),",  // DONE
            "vec3(0.1098, 0.1098, 0.1098),",  // black DONE
            "vec3(0.223, 0.145, 0.1098),",  // done
            "vec3(0.2235, 0.2235, 0.2235),",  // done
            "vec3(0.3333,0.3333, 0.3333),",  // done
            "vec3(0.33, 0.33, 0.2588),",  // done
            "vec3(0.4431, 0.333, 0.333),",  // done
            "vec3(0.890, 0.890, 0.890),",  // done
            "vec3(1.0, 1.0, 0.89),",    //done
            "vec3(0.44, 0.44, 0.36),",  // done
            "vec3(0.66, 0.66, 0.55),",  //done
            "vec3(0.109, 0.109, 0.054)",   // doneDONE
            ");",

            "",
            "void main() {",
            "    highp vec2 uv = vUv0; // variable_vertex.xy; // interpolated at pixel's center",
            "",
            "   vec2 limiterDxy = uAmount / uResolution;",
            "   vec2 limiterCoord = limiterDxy * floor( uv / limiterDxy );",
            "    vec4 color = texture2D(uColorBuffer, limiterCoord);",
            "float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));",
            "vec4 newColor = vec4(0);",
            " if (brightness > 0.4 && brightness < 0.6){",
            " color = clamp(color * uLowContrast,0.0,1.0);",    
            "} else if (brightness > 0.75 && brightness < 1.0) {",
            "color = clamp(color * uHighContrast,0.0,1.0);",
             "} else {",
            "color = color;}",
           
            "float minDist = 1000.0;",
            "vec3 bestMatch = palette[0];",

            "for (int i = 0; i < 16; i++) {", // Iterate over the fixed-size palette
            "float dist = distance(color.rbg,palette[i]);",
            "if (dist < minDist) {",
            "minDist = dist;",
            "bestMatch = palette[i];",
                "}",
            "}",
            "   gl_FragColor = mix(vec4(bestMatch,1.0),color,0.5);", //this mixes the original and new colors together to help expand color selection artificially 
            "}"
        ].join("\n")
    });

    // Uniforms
    this.amount = 10.0;
}

LimiterEffect.prototype = Object.create(pc.PostEffect.prototype);
LimiterEffect.prototype.constructor = LimiterEffect;

Object.assign(LimiterEffect.prototype, {
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
var Limiter = pc.createScript('limiter');

Limiter.attributes.add('amount', {
    type: 'number',
    default: 12,
    min: 1,
    max: 64,
    title: 'Amount',
    description: 'The size of each pixel.'
});

Limiter.attributes.add('lowContrast', {
    type: 'number',
    default: 0.9,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the low contrast multiplier'
});

Limiter.attributes.add('highContrast', {
    type: 'number',
    default: 1.1,
    min: 0.0,
    max: 2.0,
    title: 'Amount',
    description: 'the high contrast multiplier'
});

Limiter.prototype.initialize = function () {

    this.effect = new LimiterEffect(this.app.graphicsDevice);
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
