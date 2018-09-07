uniform float time;
uniform vec2 resolution;

uniform sampler2D image1;
uniform sampler2D image2;

float brightness(vec4 color) {
  return 0.34 * color.x + 0.5 * color.y + 0.16 * color.z;
}

bool is_different(vec4 a, vec4 b) {
    float ba = brightness(a);
    float bb = brightness(b);

    return abs(ba - bb) > 0.1;
}

void main( void ) {
    // vec2 position = gl_FragCoord.xy / resolution.xy;
    // position.y = 1.0 - position.y;

    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

    // vec4 image1pix = texture2D(image1, position);
    // vec4 image2pix = texture2D(image2, position);

    // if (is_different(image1pix, image2pix)) {
    //     gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }
    // else {
    //     gl_FragColor = image1pix;
    // }
}