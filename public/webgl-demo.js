'use strict';
(function(){

  const renderOffset = [-6.5, -2.3, 0];
  const renderScale = [6, 4, 1];

  // Warping Halos (WIP)
  const mapping = [];

  for(var i=0; i<15; i++) {
    mapping.push({dmx_start: {universe: i, value: 0}, dmx_length: 512, rect_normalized: [
      [0, 0.1*i+0.1], // top left; dmx_start
      [0, 0.1*i], // bottom left, dmx_start
      [1, 0.1*i+0.1], // top right, dmx_end
      [1, 0.1*i] // bottom right, dmx_end
    ]});
  }


    // {dmx_start: {universe: 0, value: 0}, dmx_length: 512, rect_normalized: [
    //   [0, 0.25], // top left; dmx_start
    //   [0, 0], // bottom left, dmx_start
    //   [1, 0.25], // top right, dmx_end
    //   [1, 0] // bottom right, dmx_end
    // ]},


    // {dmx_length: 512, rect_normalized: [
    //   [0, 0.5], // top left; dmx_start
    //   [0, 0.25], // bottom left, dmx_start
    //   [1, 0.5], // top right, dmx_end
    //   [1, 0.25] // bottom right, dmx_end
    // ]},

    // {dmx_length: 512, rect_normalized: [
    //   [0, 0.75], // top left; dmx_start
    //   [0, 0.5], // bottom left, dmx_start
    //   [1, 0.75], // top right, dmx_end
    //   [1, 0.5] // bottom right, dmx_end
    // ]},

    // {dmx_length: 512, rect_normalized: [
    //   [0, 1], // top left; dmx_start
    //   [0, 0.75], // bottom left, dmx_start
    //   [1, 1], // top right, dmx_end
    //   [1, 0.75] // bottom right, dmx_end
    // ]},

    // {dmx_length: 512, rect_normalized: [
    //   [1-0.1, 1-0.1], // top left; dmx_start
    //   [1-0.1, 1-0], // bottom left, dmx_start
    //   [1-0.2, 1-0.1], // top right, dmx_end
    //   [1-0.2, 1-0] // bottom right, dmx_end
    // ]}
  // ];



  function log(msg) {
    if (window.logfunc) {
      window.logfunc(msg);
    } else {
      console.log(msg);
    }
  }


  const universeList = function(mapping) {
    const universes = [];

    var cur_universe = undefined;
    var cur_value = undefined;

    mapping.forEach(info => {
      const start_universe = info.dmx_start ? info.dmx_start.universe : cur_universe;
      const start_value = info.dmx_start ? info.dmx_start.value : cur_value;

      cur_universe = start_universe;
      cur_value = start_value + info.dmx_length;

      while (true) {
        if (universes.indexOf(cur_universe) === -1)
          universes.push(cur_universe);

        if (cur_value < 512) break;

        cur_value -= 512;
        cur_universe++;
      }
    });

    return universes;
  }(mapping);

  window.dmxconsumer = function (universe, data) {
    const idx = universeList.indexOf(universe);
    if (idx >= 0) {
      // log(`Got data for universe ${universe} (row: ${idx}, amount: ${data.length})`);
      // for (var i=data.length-1; i>=0; i--) data[i] = 255; // TODO: disable
      updateTextureRow(idx, data);
    }
  };

  const texwidth = 256; // Math.floor(512 / 3); // every pixel need 3 values (R,G,B)
  const texheight = universeList.length > 0 ? universeList.length : 1;
  const bytes_per_pixel = 3;
  
  var newTexturePixels = null; // new Uint8Array();
  const dmxData = new Uint8Array(texwidth*texheight*bytes_per_pixel);
  for (var i=texwidth*texheight*bytes_per_pixel-1; i>=0; i--) dmxData[i] = 0;

  function updateTextureRow(rowidx, data) {
    const bytes_per_row = bytes_per_pixel * texwidth;
    const startidx = bytes_per_row*rowidx

    for (var i=0; i<data.length; i++) {
      dmxData[startidx+i] = data[i];
    }

    // this triggers texture update
    newTexturePixels = dmxData;
  }

  const positionsAndTexCoords = function(mapping, universeList) {
    const poslist = [];
    const coordslist = []

    var cur_universe = undefined;
    var cur_value = undefined;

    mapping.forEach(info => {
      const start_universe = info.dmx_start ? info.dmx_start.universe : cur_universe;
      const start_value = info.dmx_start ? info.dmx_start.value : cur_value;

      cur_universe = start_universe;
      cur_value = start_value // + info.dmx_length;

      var done = 0;
      var left = info.dmx_length;

      while (left > 0) {
        // create  quad (two triangles)
        const amount = (cur_value+left > 512) ? 512-(cur_value+left) : left;

        const start_norm = done / info.dmx_length;
        const end_norm = (done+amount) / info.dmx_length;

        poslist.push(
          // add quad (4 vertices) for mapping
          // v1
          info.rect_normalized[0][0] + (info.rect_normalized[2][0]-info.rect_normalized[0][0]) * start_norm * renderScale[0] + renderOffset[0],
          info.rect_normalized[0][1] + (info.rect_normalized[2][1]-info.rect_normalized[0][1]) * start_norm * renderScale[1] + renderOffset[1],
          0.0 * renderScale[2] + renderOffset[2],
          // v2
          info.rect_normalized[1][0] + (info.rect_normalized[3][0]-info.rect_normalized[1][0]) * start_norm * renderScale[0] + renderOffset[0],
          info.rect_normalized[1][1] + (info.rect_normalized[3][1]-info.rect_normalized[1][1]) * start_norm * renderScale[1] + renderOffset[1],
          0.0 * renderScale[2] + renderOffset[2],
          // v3
          info.rect_normalized[1][0] + (info.rect_normalized[3][0]-info.rect_normalized[1][0]) * end_norm * renderScale[0] + renderOffset[0],
          info.rect_normalized[1][1] + (info.rect_normalized[3][1]-info.rect_normalized[1][1]) * end_norm * renderScale[1] + renderOffset[1],
          0.0 * renderScale[2] + renderOffset[2],
          // v4
          info.rect_normalized[0][0] + (info.rect_normalized[2][0]-info.rect_normalized[0][0]) * end_norm * renderScale[0] + renderOffset[0],
          info.rect_normalized[0][1] + (info.rect_normalized[2][1]-info.rect_normalized[0][1]) * end_norm * renderScale[1] + renderOffset[1],
          0.0 * renderScale[2] + renderOffset[2],
        );
          

        const value_from = start_value + start_norm * info.dmx_length;
        const value_to = start_value + end_norm * info.dmx_length;


        var next_value = cur_value + amount;
        var next_universe = cur_universe;

        if (next_value >= 512) {
          next_value -= 512;
          next_universe++;
        }

        const x1 = cur_value / 512 * texwidth;
        const x2 = (next_value-1) / 512 * texwidth;
        const y1 = (universeList.indexOf(cur_universe) + 0.5) / universeList.length;
        // const y2 = (universeList.indexOf(next_universe) + 0.5) / universeList.length
        coordslist.push(
          // 0.0,  0.0,
          // 1.0,  0.0,
          // 1.0,  1.0,
          // 0.0,  1.0
          // // #1
          x1, y1,
          // #2
          x1, y1,
          // #3
          x2, y1,
          // #4
          x2, y1,
        );

        left -= amount;
        done += amount;

        cur_value = next_value;
        cur_universe = next_universe;
      }
    });


    // add quad for original dmx 
    poslist.push(
      1.1 * renderScale[0] + renderOffset[0],
      1.1 * renderScale[1] + renderOffset[1],
      0 * renderScale[2] + renderOffset[2],

      1.1 * renderScale[0] + renderOffset[0],
      0 * renderScale[1] + renderOffset[1],
      0 * renderScale[2] + renderOffset[2],

      2.1 * renderScale[0] + renderOffset[0],
      0 * renderScale[1] + renderOffset[1],
      0 * renderScale[2] + renderOffset[2],
            
      2.1 * renderScale[0] + renderOffset[0],
      1.1 * renderScale[1] + renderOffset[1],
      0 * renderScale[2] + renderOffset[2],
    );

    coordslist.push(
      0,1,
      0,0,
      1,0,
      1,1
    );

    return {positions: poslist, texCoords: coordslist};
  }(mapping, universeList);

  const mappingVertices = positionsAndTexCoords.positions;
  const mappingTexCoords = positionsAndTexCoords.texCoords;

  const mappingIndices = function (vertices) {
    const indices = [];
    const numvertices = vertices.length/3; // each vertex is x,y,z;
    for(var i=0; (i+3)<numvertices; i+=4) {
      indices.push(i+0, i+1, i+2);
      indices.push(i+0, i+2, i+3);
    }

    return indices
  }(mappingVertices);

  log(`Initialized ${mappingVertices.length/3} vertices`);
  log(`Initialized ${mappingTexCoords.length/2} texcoords`);
  log(`Initialized ${mappingIndices.length} indices`);
  //
  // WebGL stuff
  //

  // var cubeRotation = 0.0;


  main();


  //
  // Start here
  //
  function main() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl');

    // If we don't have a GL context, give up now

    if (!gl) {
      alert('Unable to initialize WebGL. Your browser or machine may not support it.');
      return;
    }

    // Vertex shader program

    const vsSource = `
      attribute vec4 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying highp vec2 vTextureCoord;
      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
      }
    `;

    // Fragment shader program

    const fsSource = `
      varying highp vec2 vTextureCoord;
      uniform sampler2D uSampler;
      void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
    `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aTextureCoord and also
    // look up uniform locations.
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // const texture = loadTexture(gl, 'cubetexture.png');
    log(`Creating solid texture of ${texwidth}x${texheight}`)
    const texture = createSolidTexture(gl, texwidth, texheight, 200,0,200);

    // Draw the scene repeatedly
    function render(now) {
      if (newTexturePixels) {
        const pixels = newTexturePixels;
        newTexturePixels = null;
        updateTexture(gl, texture, pixels, texwidth, texheight);
      }

      drawScene(gl, programInfo, buffers, texture);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  //
  // initBuffers
  //
  // Initialize the buffers we'll need. For this demo, we just
  // have one object -- a simple three-dimensional cube.
  //
  function initBuffers(gl) {

    // Create a buffer for the cube's vertex positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the cube.

    // const positions = [
    //   // Front face
    //   -1.0, -1.0,  1.0,
    //   1.0, -1.0,  1.0,
    //   1.0,  1.0,  1.0,
    //   -1.0,  1.0,  1.0,
    // ];
    const positions = mappingVertices;

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Now set up the texture coordinates for the faces.

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    // const textureCoordinates = [
    //   // Front
    //   0.0,  0.0,
    //   1.0,  0.0,
    //   1.0,  1.0,
    //   0.0,  1.0
    // ];
    const textureCoordinates = mappingTexCoords;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                  gl.STATIC_DRAW);

    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    // const indices = [
    //   0,  1,  2,      0,  2,  3    // front
    // ];
    const indices = mappingIndices;

    // Now send the element array to GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }

  //
  // Initialize a texture and load an image.
  // When the image finished loading copy it into the texture.
  //
  function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);

    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);

      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // No, it's not a power of 2. Turn of mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;

    return texture;
  }

  function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }

  //
  // Draw the scene.
  //
  function drawScene(gl, programInfo, buffers, texture) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                    fieldOfView,
                    aspect,
                    zNear,
                    zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    mat4.translate(modelViewMatrix,     // destination matrix
                  modelViewMatrix,     // matrix to translate
                  [-0.0, 0.0, -6.0]);  // amount to translate
    // mat4.rotate(modelViewMatrix,  // destination matrix
    //             modelViewMatrix,  // matrix to rotate
    //             cubeRotation,     // amount to rotate in radians
    //             [0, 0, 1]);       // axis to rotate around (Z)
    // mat4.rotate(modelViewMatrix,  // destination matrix
    //             modelViewMatrix,  // matrix to rotate
    //             cubeRotation * .7,// amount to rotate in radians
    //             [0, 1, 0]);       // axis to rotate around (X)

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
      gl.vertexAttribPointer(
          programInfo.attribLocations.textureCoord,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    // Specify the texture to map onto the faces.

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
      const vertexCount = mappingIndices.length;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }

  //
  // Initialize a shader program, so WebGL knows how to draw our data
  //
  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  //
  // creates a shader of the given type, uploads the source and
  // compiles it.
  //
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function updateTexture(gl, texture, data, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
    // gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    // gl.texImage2D(gl.TEXTURE_2D, 2, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  function createSolidTexture(gl, width, height, r, g, b) {
      var data = new Uint8Array(width * height * bytes_per_pixel); //[r, g, b, a]);
      for (var i=0; i<(width*height); i++) {
        data[i*bytes_per_pixel+0] = r;
        data[i*bytes_per_pixel+1] = g;
        data[i*bytes_per_pixel+2] = b;
        // data[i*bytes_per_pixel+3] = a;
      }

      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      

      return texture;
  }

})();