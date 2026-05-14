/* Local-LLM machine selector — main UI */

const { useState, useMemo, useEffect } = React;

/* ── Small atoms ──────────────────────────────────────────── */

function Icon({ name, size }) {
  return (
    <span className="material-symbols-outlined" style={size ? { fontSize: size } : null}>
      {name}
    </span>
  );
}

function QSelect({ value, onChange, children }) {
  return (
    <div className="qselect">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={o.value === value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RangeRow({ value, onChange, min, max, step, unit }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-row">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": pct + "%" }}
      />
      <div className="range-row__val">{value} {unit}</div>
    </div>
  );
}

function UsageBar({ used, total }) {
  const pct = Math.min(100, (used / total) * 100);
  const tone = used > total ? "over" : (used > total * 0.8 ? "tight" : "");
  return (
    <div className="usage-bar">
      <div className="usage-bar__top">
        <span className="label">VRAM utilization</span>
        <span className="val">{window.fmtGB(used)} / {window.fmtGB(total)}</span>
      </div>
      <div className="usage-bar__track">
        <div className={"usage-bar__fill " + tone} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function QuantLadder({ ladder, bestId }) {
  return (
    <div className="quant-ladder">
      <span className="quant-ladder__label">Quant</span>
      {ladder.map((it) => (
        <div
          key={it.quant.id}
          className={"quant-ladder__pip" + (it.fits ? " fits" : "") + (it.quant.id === bestId ? " best" : "")}
          title={it.quant.label + (it.fits ? " — fits" : " — too large")}
        >
          {it.quant.id.replace("_K_M", "").replace("_K", "k").replace("_0", "")}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "fits-comfortable":     { icon: "check_circle", label: "Runs well" },
    "fits-tight":           { icon: "warning",      label: "Tight fit" },
    "wont-fit":             { icon: "block",        label: "Won't fit" },
    "engine-incompatible":  { icon: "do_not_disturb_on", label: "No engine" },
  };
  const m = map[status] || map["wont-fit"];
  return (
    <span className="rcard__status">
      <Icon name={m.icon} /> {m.label}
    </span>
  );
}

/* ── Mode 1: machine → models ─────────────────────────────── */

function MachineConfig({ cfg, setCfg }) {
  const vendor = window.findVendor(cfg.vendorId);
  const maxVram = vendor.id === "nvidia-dgx" ? 1536 : 512;
  const maxRam  = vendor.id === "nvidia-dgx" ? 4096 : 1024;

  // available engines for this vendor
  const availEngines = window.ENGINES.filter(e => e.vendors.includes(vendor.id));
  useEffect(() => {
    if (!availEngines.find(e => e.id === cfg.engineId)) {
      setCfg({ ...cfg, engineId: availEngines[0].id });
    }
  }, [vendor.id]);

  function pickPreset(p) {
    setCfg({ ...cfg, vram: p.vram, ram: p.ram });
  }
  function pickVendor(v) {
    const def = v.presets[Math.min(2, v.presets.length - 1)];
    const eng = window.ENGINES.find(e => e.vendors.includes(v.id));
    setCfg({ ...cfg, vendorId: v.id, vram: def.vram, ram: def.ram, engineId: eng.id });
  }

  return (
    <div className="config-panel">
      <div className="config-panel__head">
        <h3 className="config-panel__title">Machine configuration</h3>
      </div>

      <div className="fld">
        <div className="fld__label">Platform</div>
        <div className="vendor-grid">
          {window.VENDORS.map(v => (
            <button
              key={v.id}
              className={"vendor-pill" + (v.id === cfg.vendorId ? " active" : "")}
              onClick={() => pickVendor(v)}
            >
              <Icon name={v.icon} />
              <span>{v.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fld">
        <div className="fld__label">
          {vendor.unified ? "GPU share of unified RAM" : "GPU VRAM"}
          <span className="fld__value">{cfg.vram} GB</span>
        </div>
        <RangeRow
          value={cfg.vram}
          onChange={(v) => setCfg({ ...cfg, vram: v })}
          min={4} max={maxVram} step={4}
          unit="GB"
        />
        <div className="preset-row" style={{ marginTop: 8 }}>
          {vendor.presets.map((p, i) => (
            <button
              key={i}
              className={"preset-chip" + (p.vram === cfg.vram && p.ram === cfg.ram ? " active" : "")}
              onClick={() => pickPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fld">
        <div className="fld__label">
          System RAM
          <span className="fld__value">{cfg.ram} GB</span>
        </div>
        <RangeRow
          value={cfg.ram}
          onChange={(v) => setCfg({ ...cfg, ram: v })}
          min={8} max={maxRam} step={8}
          unit="GB"
        />
        {vendor.unified ? (
          <div className="fld__hint">Unified memory — VRAM is allocated from this pool.</div>
        ) : null}
      </div>

      <div className="fld">
        <div className="fld__label">Inference engine</div>
        <QSelect value={cfg.engineId} onChange={(v) => setCfg({ ...cfg, engineId: v })}>
          {availEngines.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </QSelect>
      </div>

      <div className="fld">
        <div className="fld__label">
          Target context length
          <span className="fld__value">{window.fmtContext(cfg.ctx)} tokens</span>
        </div>
        <Segmented
          options={window.CONTEXT_LENGTHS.map(c => ({ value: c.value, label: c.label }))}
          value={cfg.ctx}
          onChange={(v) => setCfg({ ...cfg, ctx: Number(v) })}
        />
      </div>

      <div className="fld">
        <div className="fld__label">KV cache precision</div>
        <Segmented
          options={window.KV_PRECISIONS.map(k => ({ value: k.id, label: k.label }))}
          value={cfg.kvPrecId}
          onChange={(v) => setCfg({ ...cfg, kvPrecId: v })}
        />
        <div className="fld__hint">Lower precision shrinks KV cache linearly; Q4 has minor quality impact on long contexts.</div>
      </div>
    </div>
  );
}

function ModelResultCard({ model, machineLike, cfg }) {
  const ladder = window.quantLadder(model, cfg.ctx, cfg.kvPrecId, cfg.engineId, machineLike);
  const best   = window.bestQuantFor(model, cfg.ctx, cfg.kvPrecId, cfg.engineId, machineLike);
  const r      = best.result;

  let status = r.status;
  if (!best.fits) status = "wont-fit";
  if (!r.engineOk) status = "engine-incompatible";

  const subParts = [
    window.fmtParams(model.params) + " params",
    model.layers + "L",
    model.moe ? "MoE • " + window.fmtParams(model.active) + " active" : null,
  ].filter(Boolean);

  return (
    <div className={"rcard " + status}>
      <div className="rcard__head">
        <div className="rcard__icon"><Icon name="psychology" /></div>
        <div className="rcard__title-block">
          <h4 className="rcard__title" title={model.name}>{model.name}</h4>
          <div className="rcard__sub">{subParts.join(" • ")}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="rcard__meta">
        <dt>Best fit</dt>
        <dd>{best.fits ? best.quant.id : "—"}</dd>
        <dt>Required</dt>
        <dd>{window.fmtGB(r.total)}</dd>
      </dl>

      <UsageBar used={r.total} total={machineLike.vram} />

      <QuantLadder ladder={ladder} bestId={best.fits ? best.quant.id : null} />

      {status === "wont-fit" && (
        <div className="rcard__reason">
          Needs {window.fmtGB(r.total - machineLike.vram)} more VRAM, even at {window.QUANTS[window.QUANTS.length-1].id}.
        </div>
      )}
      {status === "engine-incompatible" && (
        <div className="rcard__reason">
          {window.findEngine(cfg.engineId).label} doesn't target this platform — pick a different engine.
        </div>
      )}
      {status === "fits-tight" && (
        <div className="rcard__reason">
          Runs at {best.quant.id} but leaves &lt;20% VRAM headroom.
        </div>
      )}
    </div>
  );
}

function MachineMode() {
  const [cfg, setCfg] = useState({
    vendorId: "nvidia-cuda",
    vram: 24, ram: 64,
    engineId: "llama.cpp",
    ctx: 8192,
    kvPrecId: "fp16",
  });
  const [filter, setFilter] = useState("all"); // all | fits | wont

  const machineLike = useMemo(() => {
    const v = window.findVendor(cfg.vendorId);
    return { vendor: cfg.vendorId, vram: cfg.vram, ram: cfg.ram, unified: v.unified };
  }, [cfg.vendorId, cfg.vram, cfg.ram]);

  const ranked = useMemo(() => {
    const list = window.MODELS.map(m => {
      const best = window.bestQuantFor(m, cfg.ctx, cfg.kvPrecId, cfg.engineId, machineLike);
      return { model: m, best };
    });
    // sort: comfortable > tight > wont; among comfortable, largest params first
    return list.sort((a, b) => {
      const af = a.best.fits ? 1 : 0;
      const bf = b.best.fits ? 1 : 0;
      if (af !== bf) return bf - af;
      if (a.best.fits && b.best.fits) return b.model.params - a.model.params;
      return a.model.params - b.model.params;
    });
  }, [cfg, machineLike]);

  const filtered = ranked.filter(r => {
    if (filter === "fits") return r.best.fits;
    if (filter === "wont") return !r.best.fits;
    return true;
  });

  const fitCount = ranked.filter(r => r.best.fits).length;
  const vendor = window.findVendor(cfg.vendorId);
  const engine = window.findEngine(cfg.engineId);

  return (
    <div className="workbench">
      <MachineConfig cfg={cfg} setCfg={setCfg} />

      <div className="results">
        <div className="results__head">
          <h2 className="results__title">
            Open-source models
            <small>{fitCount} of {ranked.length} run on this configuration</small>
          </h2>
          <div className="results__filters">
            <Segmented
              options={[
                { value: "all",  label: "All"  },
                { value: "fits", label: "Fits" },
                { value: "wont", label: "Won't fit" },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <div className="summary-strip">
          <Icon name="info" />
          <div>
            <strong>{vendor.name}</strong> at <strong>{cfg.vram} GB</strong> VRAM running <strong>{engine.label}</strong>,
            sized for <strong>{window.fmtContext(cfg.ctx)}</strong> context with <strong>{window.findKvPrec(cfg.kvPrecId).label}</strong> KV cache.
          </div>
        </div>

        <div className="results__legend">
          <span><span className="swatch" style={{background:"var(--qtm-success)"}}></span>Runs well (&gt;20% headroom)</span>
          <span><span className="swatch" style={{background:"var(--qtm-warning)"}}></span>Tight fit</span>
          <span><span className="swatch" style={{background:"var(--qtm-divider)"}}></span>Won't fit / engine incompatible</span>
        </div>

        <div className="grid">
          {filtered.map(({ model }) => (
            <ModelResultCard key={model.id} model={model} machineLike={machineLike} cfg={cfg} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <Icon name="search_off" />
            <p>No models match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mode 2: model → machines ─────────────────────────────── */

function ModelConfig({ cfg, setCfg }) {
  const model = window.findModel(cfg.modelId);
  const grouped = useMemo(() => {
    const g = {};
    for (const m of window.MODELS) {
      (g[m.family] = g[m.family] || []).push(m);
    }
    return g;
  }, []);

  // KV size at picked precision for one token, displayed for reference
  const kvAt = (cfg.ctx / 1024) * model.kvPer1K * window.findKvPrec(cfg.kvPrecId).scale / 1024;
  const weights = model.params * window.findQuant(cfg.quantId).bpp;

  return (
    <div className="config-panel">
      <div className="config-panel__head">
        <h3 className="config-panel__title">Model configuration</h3>
      </div>

      <div className="fld">
        <div className="fld__label">Model</div>
        <QSelect value={cfg.modelId} onChange={(v) => setCfg({ ...cfg, modelId: v })}>
          {Object.entries(grouped).map(([fam, list]) => (
            <optgroup key={fam} label={fam}>
              {list.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
          ))}
        </QSelect>
      </div>

      <div className="model-pick">
        <div className="model-pick__top">
          <div className="model-pick__icon"><Icon name="psychology" /></div>
          <div>
            <div className="model-pick__name">{model.name}</div>
            <div className="model-pick__sub">
              {model.family}{model.moe ? " • Mixture-of-Experts" : ""}
            </div>
          </div>
        </div>
        <div className="model-pick__stats">
          <div>
            <span className="k">Params</span>
            <span className="v">{window.fmtParams(model.params)}</span>
          </div>
          <div>
            <span className="k">{model.moe ? "Active" : "Layers"}</span>
            <span className="v">{model.moe ? window.fmtParams(model.active) : model.layers}</span>
          </div>
          <div>
            <span className="k">Weights</span>
            <span className="v">{window.fmtGB(weights)}</span>
          </div>
        </div>
      </div>

      <div className="fld">
        <div className="fld__label">Quantization</div>
        <QSelect value={cfg.quantId} onChange={(v) => setCfg({ ...cfg, quantId: v })}>
          {window.QUANTS.map(q => (
            <option key={q.id} value={q.id}>
              {q.label} — {q.quality}
            </option>
          ))}
        </QSelect>
        <div className="fld__hint">
          {window.fmtParams(model.params)} × {window.findQuant(cfg.quantId).bpp.toFixed(2)} bytes/param = {window.fmtGB(weights)} weights.
        </div>
      </div>

      <div className="fld">
        <div className="fld__label">
          Context length
          <span className="fld__value">{window.fmtContext(cfg.ctx)} tokens</span>
        </div>
        <Segmented
          options={window.CONTEXT_LENGTHS.map(c => ({ value: c.value, label: c.label }))}
          value={cfg.ctx}
          onChange={(v) => setCfg({ ...cfg, ctx: Number(v) })}
        />
      </div>

      <div className="fld">
        <div className="fld__label">KV cache precision</div>
        <Segmented
          options={window.KV_PRECISIONS.map(k => ({ value: k.id, label: k.label }))}
          value={cfg.kvPrecId}
          onChange={(v) => setCfg({ ...cfg, kvPrecId: v })}
        />
        <div className="fld__hint">
          KV cache at {window.findKvPrec(cfg.kvPrecId).label} for {window.fmtContext(cfg.ctx)} ≈ {window.fmtGB(kvAt)}.
        </div>
      </div>

      <div className="fld">
        <div className="fld__label">Inference engine</div>
        <QSelect value={cfg.engineId} onChange={(v) => setCfg({ ...cfg, engineId: v })}>
          {window.ENGINES.map(e => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </QSelect>
      </div>
    </div>
  );
}

function MachineResultCard({ machine, model, cfg }) {
  const r = window.checkFit(model, cfg.quantId, cfg.ctx, cfg.kvPrecId, cfg.engineId, machine);

  const sub = `${machine.tier} • ${machine.vram}GB${machine.unified ? " unified" : " VRAM"}`;
  const vendor = window.findVendor(machine.vendor);

  return (
    <div className={"rcard " + r.status}>
      <div className="rcard__head">
        <div className="rcard__icon"><Icon name={vendor.icon} /></div>
        <div className="rcard__title-block">
          <h4 className="rcard__title" title={machine.name}>{machine.name}</h4>
          <div className="rcard__sub">{sub}</div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <dl className="rcard__meta">
        <dt>Required</dt>
        <dd>{window.fmtGB(r.total)}</dd>
        <dt>Available</dt>
        <dd>{machine.vram} GB</dd>
        <dt>Platform</dt>
        <dd style={{ fontFamily: "var(--qtm-font-sans)", fontSize: 11 }}>{vendor.name}</dd>
        <dt>Indicative</dt>
        <dd style={{ fontFamily: "var(--qtm-font-sans)", fontSize: 11 }}>{machine.msrp}</dd>
      </dl>

      <UsageBar used={r.total} total={machine.vram} />

      {r.status === "wont-fit" && (
        <div className="rcard__reason">
          Short by {window.fmtGB(r.total - machine.vram)} — try a lower quant or shorter context.
        </div>
      )}
      {r.status === "engine-incompatible" && (
        <div className="rcard__reason">
          {window.findEngine(cfg.engineId).label} doesn't run on {vendor.name}.
        </div>
      )}
      {r.status === "fits-tight" && (
        <div className="rcard__reason">
          Fits with &lt;20% headroom — works for batch=1 inference, no room for concurrency.
        </div>
      )}
      {r.status === "fits-comfortable" && machine.note && (
        <div className="rcard__reason">{machine.note}</div>
      )}
    </div>
  );
}

function ModelMode() {
  const [cfg, setCfg] = useState({
    modelId: "llama-3.3-70b",
    quantId: "Q4_K_M",
    ctx: 8192,
    kvPrecId: "fp16",
    engineId: "llama.cpp",
  });
  const [filter, setFilter] = useState("all");

  const model = window.findModel(cfg.modelId);

  const ranked = useMemo(() => {
    const list = window.MACHINES.map(m => ({
      machine: m,
      result: window.checkFit(model, cfg.quantId, cfg.ctx, cfg.kvPrecId, cfg.engineId, m),
    }));
    return list.sort((a, b) => {
      const af = a.result.fits ? 1 : 0;
      const bf = b.result.fits ? 1 : 0;
      if (af !== bf) return bf - af;
      // Among fitters, prefer smallest machine that fits (cheapest)
      if (a.result.fits) return a.machine.vram - b.machine.vram;
      // Among non-fitters, biggest first (closest to fitting)
      return b.machine.vram - a.machine.vram;
    });
  }, [cfg]);

  const filtered = ranked.filter(r => {
    if (filter === "fits") return r.result.fits;
    if (filter === "wont") return !r.result.fits;
    return true;
  });

  const fitCount = ranked.filter(r => r.result.fits).length;
  const totalNeeded = window.sizeModel(model, cfg.quantId, cfg.ctx, cfg.kvPrecId, cfg.engineId).total;
  const minimum = ranked.find(r => r.result.fits);

  return (
    <div className="workbench">
      <ModelConfig cfg={cfg} setCfg={setCfg} />

      <div className="results">
        <div className="results__head">
          <h2 className="results__title">
            Compatible machines
            <small>{fitCount} of {ranked.length} can run this configuration</small>
          </h2>
          <div className="results__filters">
            <Segmented
              options={[
                { value: "all",  label: "All" },
                { value: "fits", label: "Fits" },
                { value: "wont", label: "Won't fit" },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <div className="summary-strip">
          <Icon name="calculate" />
          <div>
            <strong>{model.name}</strong> at <strong>{cfg.quantId}</strong>, <strong>{window.fmtContext(cfg.ctx)}</strong> context,&nbsp;
            <strong>{window.findKvPrec(cfg.kvPrecId).label}</strong> KV cache needs <strong>≈ {window.fmtGB(totalNeeded)} VRAM</strong>
            {minimum ? <> — minimum: <strong>{minimum.machine.name}</strong>.</> : <> — no listed machine fits.</>}
          </div>
        </div>

        <div className="results__legend">
          <span><span className="swatch" style={{background:"var(--qtm-success)"}}></span>Runs well (&gt;20% headroom)</span>
          <span><span className="swatch" style={{background:"var(--qtm-warning)"}}></span>Tight fit</span>
          <span><span className="swatch" style={{background:"var(--qtm-divider)"}}></span>Won't fit / engine incompatible</span>
        </div>

        <div className="grid">
          {filtered.map(({ machine }) => (
            <MachineResultCard key={machine.id} machine={machine} model={model} cfg={cfg} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <Icon name="search_off" />
            <p>No machines match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Top-level app ────────────────────────────────────────── */

function App() {
  const [mode, setMode] = useState("machine"); // "machine" | "model"

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <img src="design-system/thales-logo.svg" alt="Thales" />
        </div>
        <div className="topbar__divider"></div>
        <div className="topbar__title">
          Local LLM Machine Selector
          <small>Quantum • Inference sizing</small>
        </div>
        <div className="topbar__spacer"></div>
        <div className="topbar__meta">
          <span><Icon name="memory" /> {window.MODELS.length} models</span>
          <span><Icon name="developer_board" /> {window.MACHINES.length} machines</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero__overline">Inference planner</div>
        <h1>Match local LLMs to the right hardware.</h1>
        <p>
          Pick a starting point — either the machine you have (or are considering), or the model
          you want to run — and the planner sizes weights, KV cache, and engine overhead to tell
          you what's feasible.
        </p>
      </section>

      <div className="mode-switch">
        <button
          className={"mode-card" + (mode === "machine" ? " active" : "")}
          onClick={() => setMode("machine")}
        >
          <div className="mode-card__icon"><Icon name="developer_board" /></div>
          <div className="mode-card__body">
            <div className="mode-card__kicker">Option 1 • Hardware-first</div>
            <h3 className="mode-card__title">I have a machine — which models can I run?</h3>
            <p className="mode-card__desc">
              Pick a platform and configure VRAM, system RAM, and inference engine.
              See which open-source models fit at which quantization.
            </p>
          </div>
          <Icon name="arrow_forward" />
        </button>

        <button
          className={"mode-card" + (mode === "model" ? " active" : "")}
          onClick={() => setMode("model")}
        >
          <div className="mode-card__icon"><Icon name="psychology" /></div>
          <div className="mode-card__body">
            <div className="mode-card__kicker">Option 2 • Model-first</div>
            <h3 className="mode-card__title">I have a model — which machines do I need?</h3>
            <p className="mode-card__desc">
              Pick a model, set quantization, context length, and KV cache precision.
              See which off-the-shelf machines can run it.
            </p>
          </div>
          <Icon name="arrow_forward" />
        </button>
      </div>

      {mode === "machine" ? <MachineMode /> : <ModelMode />}

      <footer className="foot-note">
        Sizing follows the standard rule of thumb:&nbsp;
        <code>weights = params × bytes/param</code>,&nbsp;
        <code>kv = 2 × layers × kv_dim × ctx × kv_bytes</code>,&nbsp;
        plus 1–2&nbsp;GB engine overhead. Numbers are approximate — use them to scope, not to provision production hardware.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
