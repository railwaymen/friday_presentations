var canvas,
    gl,
    buffer,
    vertexShader, fragmentShader,
    currentProgram,
    resolutionLocation,
    image1Location,
    image2Location

start();

async function start() {
    vertexShader = await fetch('vertex.glsl').then(resp => resp.text());
    fragmentShader = await fetch('fragment.glsl').then(resp => resp.text());

    canvas = document.querySelector('canvas');
    canvas.width = 640;
    canvas.height = 480;

    gl = canvas.getContext('webgl');

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([- 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0]), gl.STATIC_DRAW);

    currentProgram = createProgram(vertexShader, fragmentShader);
    resolutionLocation = gl.getUniformLocation(currentProgram, 'resolution');
    image1Location = gl.getUniformLocation(currentProgram, 'image1');
    image2Location = gl.getUniformLocation(currentProgram, 'image2');

    render();
}

function createProgram(vertex, fragment) {
    var program = gl.createProgram();

    var vs = createShader(vertex, gl.VERTEX_SHADER);
    var fs = createShader('#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment, gl.FRAGMENT_SHADER);

    if (vs == null || fs == null) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("ERROR:\n" +
            "VALIDATE_STATUS: " + gl.getProgramParameter(program, gl.VALIDATE_STATUS) + "\n" +
            "ERROR: " + gl.getError() + "\n\n" +
            "- Vertex Shader -\n" + vertex + "\n\n" +
            "- Fragment Shader -\n" + fragment);

        return null;

    }

    return program;
}

function loadTexture(gl, url, number) {
    const texture = gl.createTexture();

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const image = new Image();

    const promise = new Promise((resolve) => {
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            resolve(texture);

            document.body.appendChild(image);
        };
    });
    image.src = url;

    return promise;
}

function createShader(src, type) {
    var shader = gl.createShader(type);

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error((type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") + " SHADER:\n" + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

async function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(currentProgram);

    const image1 = await loadTexture(gl, 'diff1.png');
    const image2 = await loadTexture(gl, 'diff2.png');

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, image1);
    gl.uniform1i(image1Location, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, image2);
    gl.uniform1i(image2Location, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(0);

}