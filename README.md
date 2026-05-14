# Local LLM Machine Selector

A lightweight, browser-based tool that helps you match open-source Large Language Models to the right hardware. Select a machine and discover which models it can run, or select a model and find every GPU configuration that fits — all without installing anything.

**Live Demo:** https://superma168.github.io/local-llm-machine-selector/

---

## Features

**Two Selection Modes**
- **Hardware-First:** Pick a machine → see which models run and at what quantization
- **Model-First:** Pick a model → see every machine that can load it

**VRAM & RAM Sizing**
- Calculates weight memory, KV-cache footprint, and engine overhead automatically
- Accounts for context length (4K–128K), KV-cache precision (FP16/FP8/INT8/INT4), and inference engine overhead

**Quantization Support**
- FP16, Q8_0, Q6_K, Q5_K_M, Q4_K_M, Q3_K_M, Q2_K
- Visual quantization ladder on every result card shows exactly which levels fit

**Model Library (35 models)**
- **Llama** — 4 Scout (MoE), 4 Maverick (MoE), 3.2 1B, 3.2 3B, 3.1 8B, 3.3 70B, 3.1 405B
- **Qwen 2.5** — 7B, 14B, 32B, Coder 32B, 72B
- **Qwen 3.6** — 27B, 35B
- **Qwen 3** — Coder 30B, Coder 480B
- **DeepSeek** — R1 Distill Llama 70B, R1 Distill Qwen 32B, V3 671B (MoE), R1 671B (MoE)
- **Mistral / Mixtral** — 7B, Small 3 24B, 8×7B (MoE), 8×22B (MoE)
- **Gemma 4** — E2B, E4B, 26B A4B (MoE), 31B
- **Gemma 3** — 4B, 12B, 27B
- **Gemma 2** — 9B
- **Phi** — 4 14B, 3.5 Mini 3.8B
- **Command** — R 35B, R+ 104B
- **Yi** — 1.5 34B

**Hardware Catalog**
- NVIDIA: RTX 3090, RTX 4070/4090, RTX 6000, A100 40/80 GB, H100, B200, DGX H100/B200
- AMD: RX 7900 XTX, MI300X, Strix Halo (APU, unified memory)
- Intel: Arc A770, Arc B580
- Apple Silicon: MacBook Pro M4 Max, Mac Studio M4 Max/Ultra, Mac mini M4

**Inference Engine Awareness**
- llama.cpp, Ollama, ExLlamaV2, vLLM, TensorRT-LLM, MLX
- Engine incompatibilities shown per card (e.g., MLX is Apple-only)

**Smart Result Ranking**
- Comfortable fit (>20% headroom), Tight fit (0–20%), Won't fit — color-coded and sorted
- Filter bar to show all / fits only / won't-fit only
- Unified-memory machines (Apple, Strix Halo) allocate a user-defined RAM slice as VRAM

---

## How the Sizing Math Works

**VRAM requirement**
```
weights_GB  = params(B) × bytes_per_param(quantization)
kv_GB       = kvPer1K(MB) × (context / 1024) × kv_precision_scale / 1024
overhead_GB = engine_base + (FP16 ? 1.0 : 0) + (ctx ≥ 32K ? 0.5 : 0)
total_GB    = weights_GB + kv_GB + overhead_GB
```

**Speed estimate (tokens / second)**
```
effective_params = active_params   (MoE models: only active experts are streamed)
                 = total_params    (dense models)
weights_GB       = effective_params × bytes_per_param(quantization)
speed_t_s        = memory_bandwidth_GB_s ÷ weights_GB
```
This is the memory-bandwidth-bound ceiling for single-token autoregressive decode at batch=1. It reflects how fast the GPU can stream weights per generated token. Prefill (prompt processing) is compute-bound and not estimated here.

**Caveats**
- Parameter, layer, and KV-dim numbers are approximations from public model cards — accurate enough for hardware scoping, not production provisioning.
- Speed estimates assume 100% memory bandwidth utilisation; real throughput is typically 70–90% of this figure depending on engine and context length.
- DGX bandwidth figures use the 8-GPU NVLink aggregate; actual tensor-parallel throughput varies by engine configuration.
- MSRPs are rough reference figures.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 (CDN, no build step) |
| JSX Compiler | Babel Standalone |
| Styling | CSS3 with Quantum Design System tokens |
| Icons | Material Symbols Outlined |
| Fonts | Inter, Roboto Mono |
| Data | Plain JavaScript object literals |
| Hosting | GitHub Pages |

---

## Project Structure

```
local-llm-machine-selector/
├── index.html              Entry point — loads CDN dependencies
├── app.jsx                 React components and application logic
├── data.js                 Models, machines, engines, and quantization profiles
├── compat.js               Sizing math and compatibility checks
├── styles.css              Component styles
└── design-system/
    ├── colors_and_type.css Design tokens (colors, typography, spacing)
    └── thales-logo.svg     Brand asset
```

---

## Usage

Open the live demo (or serve the repo locally with any static file server) and:

1. Choose **Hardware-First** or **Model-First** mode from the hero section.
2. Use the configuration panel to set vendor/platform, VRAM, system RAM, inference engine, context length, and KV-cache precision.
3. Browse result cards — green for comfortable fits, orange for tight fits, gray for won't-fit.
4. Use the filter bar to narrow results; hover cards for detailed VRAM breakdowns.

---

## Contributing

This project was built as a "no-code" experiment using Claude Design and Claude Code.
Clone it, modify the data in `data.js`, tweak the sizing logic in `compat.js`, or restyle via `styles.css` — no build toolchain required.

---

## License

Unlicense — public domain, do as you wish.
