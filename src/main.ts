import './style.scss';

import quadShader from './shaders/quad.wgsl?raw';
import shaderCode from './shaders/triangle.wgsl?raw';

const createFullscreenPass = (
  context: GPUCanvasContext,
  presentationFormat: GPUTextureFormat,
  device: GPUDevice,
  presentationSize: Array<number>
) => {
  const fullscreenQuadBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform',
        },
      },
    ],
  });

  const fullscreenQuadPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [fullscreenQuadBindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({
        code: quadShader,
      }),
      entryPoint: 'vert_main',
    },
    fragment: {
      module: device.createShaderModule({
        code: quadShader,
      }),
      entryPoint: 'frag_main',
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  const uniformBufferSize = 4 * Float32Array.BYTES_PER_ELEMENT; // screen width & height
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const fullscreenQuadBindGroup = device.createBindGroup({
    layout: fullscreenQuadBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(), // Assigned later

        clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  } as any;

  const uniforms = new Float32Array([presentationSize[0], presentationSize[1], 0, presentationSize[0] / presentationSize[1]])

  const addFullscreenPass = (
    context: GPUCanvasContext,
    commandEncoder: GPUCommandEncoder,
    timestamp: number
  ) => {
    // write to uniform
    uniforms[0] = presentationSize[0]
    uniforms[1] = presentationSize[1]
    uniforms[2] = timestamp
    uniforms[3] = presentationSize[0] / presentationSize[1]

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      uniforms
    );

    renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(fullscreenQuadPipeline);
    passEncoder.setBindGroup(0, fullscreenQuadBindGroup);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.end();
  };

  return { addFullscreenPass };
};

async function init() {
  const navigator = window.navigator as any;
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported, falling back to WebGL');
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  if (!canvas) {
    throw new Error('No canvas found');
  }

  const context = canvas.getContext('webgpu');

  const setCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', () => {
    setCanvasSize();
  });

  setCanvasSize();

  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [
    Math.floor(canvas.clientWidth * devicePixelRatio),
    Math.floor(canvas.clientHeight * devicePixelRatio),
  ];

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  if (context) {
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'opaque',
    });

    const { addFullscreenPass } = createFullscreenPass(
      context,
      presentationFormat,
      device,
      presentationSize
    );

    function draw() {
      const commandEncoder = device.createCommandEncoder();

      const timestamp = performance.now() / 1000;
      addFullscreenPass(context as GPUCanvasContext, commandEncoder, timestamp);

      device.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(draw);
    }

    draw();
  }
}

init()