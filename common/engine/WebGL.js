// This class handles creation and compilation of shaders,
// linking shaders into programs, creating textures, buffers, 
// quads and samplers

export class WebGL {

    static createShader(gl, source, type) {

        // Create constant gl shader of type (gl.VERTEX_SHADER, gl.FRAGMENT_SHADER)
        const shader = gl.createShader(type);

        // Append source code to current shader
        // Source code is located in ../src/shaders/shaders.js
        gl.shaderSource(shader, source);

        // Compile current shader
        gl.compileShader(shader);

        // Get shader compilation status
        const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!status) {
            // If shader wasn't compiled succesfully, throw error and log
            const log = gl.getShaderInfoLog(shader);
            throw new Error('Cannot compile shader\nInfo log:\n' + log);
        }

        // If shader was compiled succesfully, return it
        return shader;
    }

    static createProgram(gl, shaders) {

        // Create constant gl program - a gl program is a combination of 
        // a vertex and fragment shader, used for drawing
        const program = gl.createProgram();

        // Attach all shaders to current program
        for (const shader of shaders) {
            gl.attachShader(program, shader);
        }

        // Link shaders to program
        gl.linkProgram(program);

        // Get program link status
        const status = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!status) {
            // If program wasn't linked succesfully, throw error and log 
            const log = gl.getProgramInfoLog(program);
            throw new Error('Cannot link program\nInfo log:\n' + log);
        }


        // Create empty dictionary of attributes - attributes are inputs of  
        // vertex shader
        const attributes = {};

        // Get set of active attributes
        const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        // Store all active attriubutes into set of attributes
        for (let i = 0; i < activeAttributes; i++) {
            // Get active attribute at index i
            const info = gl.getActiveAttrib(program, i);

            // Get location of attribute with name
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }


        // Create empty dictionary of uniforms - uniforms are constants in 
        // shaders
        const uniforms = {};

        // Get set of active uniforms
        const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < activeUniforms; i++) {
            // Get active uniform at index i
            const info = gl.getActiveUniform(program, i);

            // Get location of uniform with name
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }

        // Return set of program, program attributes and program uniforms
        return { program, attributes, uniforms };
    }

    static buildPrograms(gl, shaders) {

        // Create empty dictionary of programs
        const programs = {};

        // Loop through shader combinations (each name contains vertex and fragment shader)
        for (const name in shaders) {
            try {
                // Set current shaders to constant program variable
                const program = shaders[name];

                // Create new program from current shaders
                programs[name] = WebGL.createProgram(gl, [
                    WebGL.createShader(gl, program.vertex, gl.VERTEX_SHADER),
                    WebGL.createShader(gl, program.fragment, gl.FRAGMENT_SHADER)
                ]);
            } catch (err) {
                // If a program could not be created, throw error and log
                throw new Error('Error compiling ' + name + '\n' + err);
            }
        }

        // If all programs were created succesfully, return them
        return programs;
    }

    static createTexture(gl, options) {

        // Set default options if alternative options were not given
        const target = options.target || gl.TEXTURE_2D;
        const iformat = options.iformat || gl.RGBA;
        const format = options.format || gl.RGBA;
        const type = options.type || gl.UNSIGNED_BYTE;
        const texture = options.texture || gl.createTexture();

        // If unit was given in options, activate texture unit
        if (typeof options.unit !== 'undefined') {
            gl.activeTexture(gl.TEXTURE0 + options.unit);
        }

        // Bind texture to target
        gl.bindTexture(target, texture);

        // If image was given, load data to GPU
        if (options.image) {
            gl.texImage2D(
                target, 0, iformat,
                format, type, options.image);
        } else {
            // If options.data == null, just allocate
            gl.texImage2D(
                target, 0, iformat,
                options.width, options.height, 0,
                format, type, options.data);
        }

        // If texture parameters were given, apply them to texture
        if (options.wrapS) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS); }
        if (options.wrapT) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT); }
        if (options.min) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min); }
        if (options.mag) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag); }
        if (options.mip) { gl.generateMipmap(target); }

        // Return created texture
        return texture;
    }

    static createBuffer(gl, options) {
        const target = options.target || gl.ARRAY_BUFFER;
        const hint = options.hint || gl.STATIC_DRAW;
        const buffer = options.buffer || gl.createBuffer();

        gl.bindBuffer(target, buffer);
        gl.bufferData(target, options.data, hint);

        return buffer;
    }

    static createUnitQuad(gl) {
        return WebGL.createBuffer(gl, { data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]) });
    }

    static createClipQuad(gl) {
        return WebGL.createBuffer(gl, { data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]) });
    }

    static createSampler(gl, options) {
        const sampler = options.sampler || gl.createSampler();

        if (options.wrapS) { gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, options.wrapS); }
        if (options.wrapT) { gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, options.wrapT); }
        if (options.min) { gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, options.min); }
        if (options.mag) { gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, options.mag); }

        return sampler;
    }

}
