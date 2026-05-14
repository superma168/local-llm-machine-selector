/* Local-LLM machine selector — data
 *
 * Numbers below are approximations from public model cards / benchmarks and
 * vendor specs. They're "close enough" to drive a reasonable fits/doesn't-fit
 * recommendation, not a guaranteed sizing tool.
 *
 *   - params       total parameters, in billions
 *   - active       active params for MoE models, in billions (else === params)
 *   - layers       transformer block count
 *   - kvPer1K      KV cache size at FP16, in MB, per 1024 tokens of context.
 *                  Computed as 2 * num_layers * num_kv_heads * head_dim *
 *                  1024 / (1024*1024). Pre-baked so we don't carry head counts.
 *   - family       grouping for the model dropdown
 *   - moe          MoE-style sparse model (affects sizing notes)
 */

const MODELS = [
  // ── Llama family ──────────────────────────────────────────
  { id: "llama-3.2-1b",    name: "Llama 3.2 1B",          family: "Llama",     params: 1.24,  active: 1.24,  layers: 16,  kvPer1K: 16  },
  { id: "llama-3.2-3b",    name: "Llama 3.2 3B",          family: "Llama",     params: 3.21,  active: 3.21,  layers: 28,  kvPer1K: 56  },
  { id: "llama-3.1-8b",    name: "Llama 3.1 8B Instruct", family: "Llama",     params: 8.03,  active: 8.03,  layers: 32,  kvPer1K: 64  },
  { id: "llama-3.3-70b",   name: "Llama 3.3 70B Instruct",family: "Llama",     params: 70.6,  active: 70.6,  layers: 80,  kvPer1K: 160 },
  { id: "llama-3.1-405b",  name: "Llama 3.1 405B",        family: "Llama",     params: 405,   active: 405,   layers: 126, kvPer1K: 252 },

  // ── Qwen family ───────────────────────────────────────────
  { id: "qwen-2.5-7b",     name: "Qwen 2.5 7B Instruct",  family: "Qwen",      params: 7.62,  active: 7.62,  layers: 28,  kvPer1K: 28  },
  { id: "qwen-2.5-14b",    name: "Qwen 2.5 14B Instruct", family: "Qwen",      params: 14.8,  active: 14.8,  layers: 48,  kvPer1K: 96  },
  { id: "qwen-2.5-32b",    name: "Qwen 2.5 32B Instruct", family: "Qwen",      params: 32.5,  active: 32.5,  layers: 64,  kvPer1K: 128 },
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder 32B", family: "Qwen",      params: 32.5,  active: 32.5,  layers: 64,  kvPer1K: 128 },
  { id: "qwen-2.5-72b",    name: "Qwen 2.5 72B Instruct", family: "Qwen",      params: 72.7,  active: 72.7,  layers: 80,  kvPer1K: 160 },

  // ── DeepSeek family ───────────────────────────────────────
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B", family: "DeepSeek", params: 70.6, active: 70.6, layers: 80, kvPer1K: 160 },
  { id: "deepseek-r1-distill-qwen-32b",  name: "DeepSeek R1 Distill Qwen 32B",  family: "DeepSeek", params: 32.5, active: 32.5, layers: 64, kvPer1K: 128 },
  { id: "deepseek-v3",     name: "DeepSeek V3 671B (MoE)",family: "DeepSeek",  params: 671,   active: 37,    layers: 61,  kvPer1K: 70,  moe: true },
  { id: "deepseek-r1",     name: "DeepSeek R1 671B (MoE)",family: "DeepSeek",  params: 671,   active: 37,    layers: 61,  kvPer1K: 70,  moe: true },

  // ── Mistral / Mixtral ────────────────────────────────────
  { id: "mistral-7b-v3",   name: "Mistral 7B v0.3",       family: "Mistral",   params: 7.25,  active: 7.25,  layers: 32,  kvPer1K: 64  },
  { id: "mistral-small-24b",name: "Mistral Small 3 24B",  family: "Mistral",   params: 23.6,  active: 23.6,  layers: 40,  kvPer1K: 80  },
  { id: "mixtral-8x7b",    name: "Mixtral 8x7B (MoE)",    family: "Mistral",   params: 46.7,  active: 12.9,  layers: 32,  kvPer1K: 64,  moe: true },
  { id: "mixtral-8x22b",   name: "Mixtral 8x22B (MoE)",   family: "Mistral",   params: 141,   active: 39,    layers: 56,  kvPer1K: 112, moe: true },

  // ── Google Gemma ──────────────────────────────────────────
  { id: "gemma-4-e2b",     name: "Gemma 4 E2B",           family: "Gemma",     params: 2.0,   active: 2.0,   layers: 18,  kvPer1K: 36  },
  { id: "gemma-4-e4b",     name: "Gemma 4 E4B",           family: "Gemma",     params: 4.0,   active: 4.0,   layers: 28,  kvPer1K: 56  },
  { id: "gemma-4-26b-a4b", name: "Gemma 4 26B A4B",       family: "Gemma",     params: 26.0,  active: 4.0,   layers: 42,  kvPer1K: 84,  moe: true },
  { id: "gemma-4-31b",     name: "Gemma 4 31B",           family: "Gemma",     params: 31.0,  active: 31.0,  layers: 62,  kvPer1K: 124 },
  { id: "gemma-3-4b",      name: "Gemma 3 4B Instruct",   family: "Gemma",     params: 4.30,  active: 4.30,  layers: 34,  kvPer1K: 68  },
  { id: "gemma-3-12b",     name: "Gemma 3 12B Instruct",  family: "Gemma",     params: 12.2,  active: 12.2,  layers: 48,  kvPer1K: 96  },
  { id: "gemma-3-27b",     name: "Gemma 3 27B Instruct",  family: "Gemma",     params: 27.4,  active: 27.4,  layers: 62,  kvPer1K: 124 },
  { id: "gemma-2-9b",      name: "Gemma 2 9B Instruct",   family: "Gemma",     params: 9.24,  active: 9.24,  layers: 42,  kvPer1K: 168 },

  // ── Microsoft Phi ─────────────────────────────────────────
  { id: "phi-4-14b",       name: "Phi-4 14B",             family: "Phi",       params: 14.7,  active: 14.7,  layers: 40,  kvPer1K: 100 },
  { id: "phi-3.5-mini",    name: "Phi-3.5 Mini 3.8B",     family: "Phi",       params: 3.82,  active: 3.82,  layers: 32,  kvPer1K: 64  },

  // ── Cohere Command ────────────────────────────────────────
  { id: "command-r-35b",   name: "Command R 35B",         family: "Command",   params: 35,    active: 35,    layers: 40,  kvPer1K: 80  },
  { id: "command-r-plus",  name: "Command R+ 104B",       family: "Command",   params: 104,   active: 104,   layers: 64,  kvPer1K: 128 },

  // ── Qwen 3.6 ─────────────────────────────────────────────
  { id: "qwen-3.6-27b",    name: "Qwen 3.6 27B",          family: "Qwen 3.6",  params: 27.0,  active: 27.0,  layers: 48,  kvPer1K: 96  },
  { id: "qwen-3.6-35b",    name: "Qwen 3.6 35B",          family: "Qwen 3.6",  params: 35.0,  active: 35.0,  layers: 64,  kvPer1K: 128 },

  // ── Qwen 3 Coder ─────────────────────────────────────────
  { id: "qwen3-coder-30b",  name: "Qwen3 Coder 30B",      family: "Qwen 3",    params: 30.0,  active: 30.0,  layers: 64,  kvPer1K: 128 },
  { id: "qwen3-coder-480b", name: "Qwen3 Coder 480B",     family: "Qwen 3",    params: 480.0, active: 480.0, layers: 96,  kvPer1K: 192 },

  // ── 01.AI Yi ──────────────────────────────────────────────
  { id: "yi-34b",          name: "Yi 1.5 34B Chat",       family: "Yi",        params: 34.4,  active: 34.4,  layers: 60,  kvPer1K: 120 },
];

/* Quantization presets — bytes per parameter (approx, GGUF-style averages).
 * GGUF block formats include a small metadata overhead; the numbers below are
 * the conventional "effective bits per weight" / 8 figures used by llama.cpp
 * sizing rules of thumb. */
const QUANTS = [
  { id: "FP16",   label: "FP16 (full)",       bpp: 2.00, quality: "Reference",  kv: 1.00 },
  { id: "Q8_0",   label: "Q8_0",              bpp: 1.06, quality: "Near-loss",  kv: 0.50 },
  { id: "Q6_K",   label: "Q6_K",              bpp: 0.82, quality: "Very good",  kv: 0.50 },
  { id: "Q5_K_M", label: "Q5_K_M",            bpp: 0.69, quality: "Good",       kv: 0.50 },
  { id: "Q4_K_M", label: "Q4_K_M",            bpp: 0.56, quality: "Recommended",kv: 0.50 },
  { id: "Q3_K_M", label: "Q3_K_M",            bpp: 0.44, quality: "Lossy",      kv: 0.25 },
  { id: "Q2_K",   label: "Q2_K",              bpp: 0.32, quality: "Aggressive", kv: 0.25 },
];

/* KV cache precision options (decoupled from weight quant) */
const KV_PRECISIONS = [
  { id: "fp16", label: "FP16", scale: 1.00 },
  { id: "q8",   label: "Q8",   scale: 0.50 },
  { id: "q4",   label: "Q4",   scale: 0.25 },
];

/* Context-length presets */
const CONTEXT_LENGTHS = [
  { value: 2048,    label: "2K" },
  { value: 4096,    label: "4K" },
  { value: 8192,    label: "8K" },
  { value: 16384,   label: "16K" },
  { value: 32768,   label: "32K" },
  { value: 65536,   label: "64K" },
  { value: 131072,  label: "128K" },
];

/* Inference engines — affects the overhead estimate (CUDA graphs, paged
 * attention buffers, etc) and which vendors it can target. */
const ENGINES = [
  { id: "llama.cpp",     label: "llama.cpp",     overhead: 0.8,  vendors: ["nvidia-cuda","nvidia-dgx","amd-rocm","amd-strix","intel-arc","apple"] },
  { id: "vllm",          label: "vLLM",          overhead: 2.0,  vendors: ["nvidia-cuda","nvidia-dgx","amd-rocm"] },
  { id: "tensorrt-llm",  label: "TensorRT-LLM",  overhead: 2.5,  vendors: ["nvidia-cuda","nvidia-dgx"] },
  { id: "mlx",           label: "MLX",           overhead: 0.6,  vendors: ["apple"] },
  { id: "exllamav2",     label: "ExLlamaV2",     overhead: 1.0,  vendors: ["nvidia-cuda","nvidia-dgx","amd-rocm"] },
  { id: "ollama",        label: "Ollama",        overhead: 1.0,  vendors: ["nvidia-cuda","nvidia-dgx","amd-rocm","amd-strix","intel-arc","apple"] },
];

/* Machine vendors / platforms. `unified` means VRAM and System RAM come from
 * a single pool (Apple Silicon, Strix Halo) — sizing accounts for this. */
const VENDORS = [
  {
    id: "nvidia-cuda",
    name: "NVIDIA CUDA",
    subtitle: "GeForce / RTX consumer + workstation",
    icon: "developer_board",
    unified: false,
    presets: [
      { vram: 12, ram: 32,  label: "RTX 4070 / 3060" },
      { vram: 16, ram: 64,  label: "RTX 4080 / 4060 Ti 16GB" },
      { vram: 24, ram: 64,  label: "RTX 3090 / 4090" },
      { vram: 32, ram: 128, label: "RTX 5090" },
      { vram: 48, ram: 128, label: "RTX 6000 Ada" },
    ],
  },
  {
    id: "nvidia-dgx",
    name: "NVIDIA DGX",
    subtitle: "Datacenter — H100 / A100 / B200",
    icon: "memory",
    unified: false,
    presets: [
      { vram: 80,  ram: 1024, label: "H100 / A100 80GB" },
      { vram: 141, ram: 1024, label: "H200 141GB" },
      { vram: 192, ram: 2048, label: "B200 192GB" },
      { vram: 640, ram: 2048, label: "DGX H100 (8×80GB)" },
      { vram: 1536,ram: 4096, label: "DGX B200 (8×192GB)" },
    ],
  },
  {
    id: "amd-rocm",
    name: "AMD ROCm",
    subtitle: "Radeon + Instinct on ROCm",
    icon: "memory",
    unified: false,
    presets: [
      { vram: 16,  ram: 32,  label: "RX 7800 XT" },
      { vram: 20,  ram: 64,  label: "RX 7900 XT" },
      { vram: 24,  ram: 64,  label: "RX 7900 XTX" },
      { vram: 192, ram: 512, label: "Instinct MI300X" },
    ],
  },
  {
    id: "amd-strix",
    name: "AMD Strix Halo",
    subtitle: "Ryzen AI Max+ — unified memory APU",
    icon: "dynamic_form",
    unified: true,
    presets: [
      { vram: 96,  ram: 128, label: "Ryzen AI Max+ 395 (128GB)" },
      { vram: 32,  ram: 64,  label: "Ryzen AI Max 390 (64GB)" },
    ],
  },
  {
    id: "intel-arc",
    name: "Intel Arc",
    subtitle: "Arc + IPEX / OpenVINO",
    icon: "developer_board",
    unified: false,
    presets: [
      { vram: 8,  ram: 32, label: "Arc A750" },
      { vram: 12, ram: 32, label: "Arc B580" },
      { vram: 16, ram: 64, label: "Arc A770 16GB" },
    ],
  },
  {
    id: "apple",
    name: "Apple Silicon",
    subtitle: "M-series — unified memory",
    icon: "laptop_mac",
    unified: true,
    presets: [
      { vram: 18,  ram: 24,  label: "MacBook Pro M4 (24GB)" },
      { vram: 36,  ram: 48,  label: "MacBook Pro M4 Pro (48GB)" },
      { vram: 96,  ram: 128, label: "MacBook Pro M4 Max (128GB)" },
      { vram: 144, ram: 192, label: "Mac Studio M3 Ultra (192GB)" },
      { vram: 400, ram: 512, label: "Mac Studio M3 Ultra (512GB)" },
    ],
  },
];

/* Specific market machines — used as the result set for Mode 2.
 * vendor maps back into VENDORS for the engine compatibility check. */
const MACHINES = [
  // NVIDIA consumer
  { id: "rtx-5090",     vendor: "nvidia-cuda", name: "NVIDIA RTX 5090",         tier: "Consumer",   vram: 32,  ram: 128, msrp: "$1,999" },
  { id: "rtx-4090",     vendor: "nvidia-cuda", name: "NVIDIA RTX 4090",         tier: "Consumer",   vram: 24,  ram: 64,  msrp: "$1,599" },
  { id: "rtx-3090",     vendor: "nvidia-cuda", name: "NVIDIA RTX 3090",         tier: "Consumer",   vram: 24,  ram: 64,  msrp: "$700 used" },
  { id: "rtx-4080s",    vendor: "nvidia-cuda", name: "NVIDIA RTX 4080 SUPER",   tier: "Consumer",   vram: 16,  ram: 64,  msrp: "$999" },
  { id: "rtx-4060ti",   vendor: "nvidia-cuda", name: "NVIDIA RTX 4060 Ti 16GB", tier: "Consumer",   vram: 16,  ram: 32,  msrp: "$499" },
  { id: "rtx-6000-ada", vendor: "nvidia-cuda", name: "NVIDIA RTX 6000 Ada",     tier: "Workstation",vram: 48,  ram: 128, msrp: "$6,800" },

  // NVIDIA datacenter
  { id: "a100-80",      vendor: "nvidia-dgx",  name: "NVIDIA A100 80GB",        tier: "Datacenter", vram: 80,  ram: 1024,msrp: "$15k+" },
  { id: "h100-80",      vendor: "nvidia-dgx",  name: "NVIDIA H100 80GB",        tier: "Datacenter", vram: 80,  ram: 1024,msrp: "$30k+" },
  { id: "h200-141",     vendor: "nvidia-dgx",  name: "NVIDIA H200 141GB",       tier: "Datacenter", vram: 141, ram: 2048,msrp: "$32k+" },
  { id: "b200-192",     vendor: "nvidia-dgx",  name: "NVIDIA B200 192GB",       tier: "Datacenter", vram: 192, ram: 2048,msrp: "$40k+" },
  { id: "dgx-h100",     vendor: "nvidia-dgx",  name: "NVIDIA DGX H100",         tier: "Datacenter", vram: 640, ram: 2048,msrp: "$300k+", note: "8×H100 NVLink" },
  { id: "dgx-b200",     vendor: "nvidia-dgx",  name: "NVIDIA DGX B200",         tier: "Datacenter", vram: 1536,ram: 4096,msrp: "$500k+", note: "8×B200 NVLink" },

  // AMD
  { id: "rx-7900xtx",   vendor: "amd-rocm",    name: "AMD Radeon RX 7900 XTX",  tier: "Consumer",   vram: 24,  ram: 64,  msrp: "$999" },
  { id: "rx-7900xt",    vendor: "amd-rocm",    name: "AMD Radeon RX 7900 XT",   tier: "Consumer",   vram: 20,  ram: 64,  msrp: "$749" },
  { id: "mi300x",       vendor: "amd-rocm",    name: "AMD Instinct MI300X",     tier: "Datacenter", vram: 192, ram: 512, msrp: "$15k+" },
  { id: "strix-halo-128",vendor: "amd-strix",  name: "Ryzen AI Max+ 395 (128GB)",tier: "Workstation",vram: 96, ram: 128, msrp: "$2,300", unified: true },
  { id: "strix-halo-64",vendor: "amd-strix",   name: "Ryzen AI Max 390 (64GB)", tier: "Consumer",   vram: 48,  ram: 64,  msrp: "$1,500", unified: true },

  // Intel
  { id: "arc-a770",     vendor: "intel-arc",   name: "Intel Arc A770 16GB",     tier: "Consumer",   vram: 16,  ram: 64,  msrp: "$329" },
  { id: "arc-b580",     vendor: "intel-arc",   name: "Intel Arc B580",          tier: "Consumer",   vram: 12,  ram: 32,  msrp: "$249" },

  // Apple
  { id: "mac-mini-m4",  vendor: "apple",       name: "Mac mini M4 Pro (64GB)",  tier: "Consumer",   vram: 48,  ram: 64,  msrp: "$2,199", unified: true },
  { id: "mbp-m4-max-128",vendor: "apple",      name: "MacBook Pro M4 Max (128GB)",tier:"Workstation",vram:96,  ram: 128, msrp: "$5,499", unified: true },
  { id: "studio-m3u-192",vendor: "apple",      name: "Mac Studio M3 Ultra (192GB)",tier:"Workstation",vram:144,ram: 192, msrp: "$6,999", unified: true },
  { id: "studio-m3u-512",vendor: "apple",      name: "Mac Studio M3 Ultra (512GB)",tier:"Workstation",vram:400,ram: 512, msrp: "$9,499", unified: true },
];

Object.assign(window, {
  MODELS, QUANTS, KV_PRECISIONS, CONTEXT_LENGTHS, ENGINES, VENDORS, MACHINES,
});
