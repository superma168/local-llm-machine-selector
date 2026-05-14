LLM Hardware Selector
A lightweight web utility designed to help users identify the specific hardware configurations (GPU, VRAM, and RAM) required to run targeted Large Language Models (LLMs) efficiently.

🚀 Live Demo
[https://superma168.github.io/local-llm-machine-selector/]

✨ Features
Model Library: Search through popular LLMs (Llama 3, Mistral, Gemma, etc.).

Quantization Support: Calculate requirements based on 4-bit, 8-bit, or full 16-bit precision.

Hardware Matching: Recommends specific consumer and enterprise GPUs (e.g., RTX 4090, A100) based on the model's memory footprint.

Performance Estimates: Machine cards rank by best-cheapest-fit and grey out anything that can't run it. (TBD: Predicts tokens-per-second based on hardware bandwidth)

🛠️ How It Works
Sizing math (shown in the footer): 
weights = params × bytes/param, kv = 2 × layers × kv_dim × ctx × kv_bytes, plus 1–2 GB engine overhead. 
MoE models sized against total params, unified-memory machines (Apple, Strix) treated as a shared pool.

Caveats:
Parameter / layer / KV-dim numbers are approximate from public model cards — fine for scoping, not for production provisioning.
DGX boxes assume pooled NVLink VRAM; real multi-GPU placement varies by engine.
Indicative MSRPs are rough — drop in real pricing if you want it tighter.

💻 Tech Stack
Frontend: HTML5, CSS3, JavaScript, JavaScript XML

Data: JavaScript arrays

Hosting: GitHub Pages

📖 Usage
UC1: Select a platform, adjust configuration.
UC2: Select a model, adjust configuration.

View Results: The app will highlight which models are supported (UC1), or which machines capable of loading the model.

🤝 Contributing
This project is to experiment "no code" development with Claude Design and Claude Code.
You're welcome to clone the project and modify it for your own use.

📄 License
Unlicense
