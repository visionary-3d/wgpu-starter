struct ColorData {
  data: array<u32>,
};

struct Uniforms {
  screenWidth: f32,
  screenHeight: f32,
  time: f32,
  aspectRatio: f32,
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

    // make everything between 0 and 1
    uv *= 2.0;

    // mirror y
    uv.y = 1.0 - uv.y;

    // take the aspect ratio into account 
    uv.x *= uniforms.aspectRatio;

    return uv;
}

// * 2D hash function
fn hash2D(p: vec2<f32>) -> vec2<f32> {
    var c = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(c) * 18.5453);
}

fn min(a: vec3<f32>, b: vec3<f32>, cond: bool) -> vec3<f32> {
    if cond {
        return a;
    } else {
        return b;
    }
}

fn mix(a: vec3<f32>, b: vec3<f32>, cond: bool) -> vec3<f32> {
    return a * (1.0 - f32(cond)) + b * f32(cond);
}

// return distance
fn voronoi(p: vec2<f32>) -> f32 {
    let n = floor(p);
    let f = fract(p);

    var m = vec3(8.0);

    for (var j = -1; j <= 1; j++) {
        for (var i = -1; i <= 1; i++) {
            let g = vec2(f32(i), f32(j));
            let o = hash2D(n + g);
            let  r = g - f + (0.5 + 0.5 * sin(uniforms.time + 6.2831 * o));
            let d = dot(r, r);
            m = mix(m, vec3(d, o), d < m.x);
        }
    }

    return sqrt(m.x);
}

@fragment
fn frag_main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = getUVs(coord);

    // * voronoi pattern
    let voronoi = voronoi(uv * 10.0 + uniforms.time);

    let finalColor = vec4<f32>(vec3(voronoi), 1.0);
    return finalColor;
}

