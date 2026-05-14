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

**Model Library (26 models)**
- Llama 3.1/3.3 (1.2B–405B), Qwen 2.5 (7B–72B), DeepSeek R2 / V3 (32B–671B MoE)
- Mistral / Mixtral (7B–141B MoE), Gemma 3 (4B–27B), Phi-4, Command R+, Yi

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

```
weights_GB  = params(B) × bytes_per_param(quantization)
kv_GB       = kvPer1K(MB) × (context / 1024) × kv_precision_scale / 1024
overhead_GB = engine_base + (FP16 ? 1.0 : 0) + (ctx ≥ 32K ? 0.5 : 0)
total_GB    = weights_GB + kv_GB + overhead_GB
```

**Caveats**
- Parameter, layer, and KV-dim numbers are approximations from public model cards — accurate enough for hardware scoping, not production provisioning.
- DGX boxes assume pooled NVLink VRAM; real multi-GPU placement varies by engine.
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
