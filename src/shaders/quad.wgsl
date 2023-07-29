struct ColorData {
  data: array<u32>,
};

struct Uniforms {
  screenWidth: f32,
  screenHeight: f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
};

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(-1.0, 1.0)
    );

    var output: VertexOutput;
    output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
    return output;
}

fn getUVs(coord: vec4<f32>) -> vec2<f32> {
    var uv = vec2<f32>(coord.x / uniforms.screenWidth, coord.y / uniforms.screenHeight);
    uv *= 2.0;

    // mirror y
    uv.y = 1.0 - uv.y;

    return uv;
}

@fragment
fn frag_main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = getUVs(coord);
    let finalColor = vec4<f32>(uv, 0.0, 1.0);
    return finalColor;
}

