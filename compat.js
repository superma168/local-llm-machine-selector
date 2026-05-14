/* Local-LLM machine selector — sizing math
 *
 * The numbers are rough but well-defined:
 *
 *   weights_GB = params(B) * bpp(quant)
 *   kv_GB     = kvPer1K(MB) * (ctx/1024) * kv_scale(precision)  /  1024
 *   overhead  = engine.overhead  (+1GB for FP16, +0.5GB for >32K ctx)
 *   total_GB  = weights_GB + kv_GB + overhead
 *
 * Then we compare total against the machine's VRAM (or unified pool).
 * `fits` = total <= vram. `comfortable` = total <= 0.8 * vram (20% headroom).
 *
 * For unified-memory machines (Apple, Strix Halo) VRAM = configurable share of
 * total RAM — the user picks how much; the rest stays for the OS.
 *
 * For MoE models we still load all expert weights on disk/in VRAM, so we size
 * against `params` not `active`. The active count is just shown for context.
 *
 * Engines that don't target a given vendor return `fits=false` with a
 * `reason: "engine-incompatible"` — these still grey out the card.
 */

function findQuant(id)   { return window.QUANTS.find(q => q.id === id); }
function findEngine(id)  { return window.ENGINES.find(e => e.id === id); }
function findVendor(id)  { return window.VENDORS.find(v => v.id === id); }
function findKvPrec(id)  { return window.KV_PRECISIONS.find(k => k.id === id); }
function findModel(id)   { return window.MODELS.find(m => m.id === id); }
function findMachine(id) { return window.MACHINES.find(m => m.id === id); }

/* Core sizing — returns a breakdown so callers can show "why". */
function sizeModel(model, quantId, ctx, kvPrecId, engineId) {
  const quant   = findQuant(quantId);
  const kvPrec  = findKvPrec(kvPrecId);
  const engine  = findEngine(engineId);

  const weights = model.params * quant.bpp;             // GB
  const kv      = (model.kvPer1K * (ctx / 1024) * kvPrec.scale) / 1024; // GB
  let overhead  = engine ? engine.overhead : 1.0;
  if (quantId === "FP16") overhead += 1.0;              // FP16 activations are larger
  if (ctx >= 32768)        overhead += 0.5;             // long ctx needs more workspace

  const total = weights + kv + overhead;
  return { weights, kv, overhead, total };
}

/* Compatibility check: does (model @ quant @ ctx @ kv) run on (machine) with engine? */
function checkFit(model, quantId, ctx, kvPrecId, engineId, machine) {
  const engine = findEngine(engineId);
  const breakdown = sizeModel(model, quantId, ctx, kvPrecId, engineId);

  // Engine must support this vendor at all
  const engineOk = engine.vendors.includes(machine.vendor);

  const vendor = findVendor(machine.vendor);
  // For unified-memory machines: the VRAM slot is the addressable
  // GPU share; we also need enough RAM headroom for the OS (~8GB).
  const availableVram = machine.vram;
  const ramOk = machine.unified
    ? (machine.ram - machine.vram) >= 8 || true   // allow user's preset
    : machine.ram >= 16;

  const fits        = engineOk && breakdown.total <= availableVram && ramOk;
  const comfortable = fits && breakdown.total <= availableVram * 0.80;
  const utilization = breakdown.total / availableVram;

  let status = "fits-tight";
  if (!engineOk)        status = "engine-incompatible";
  else if (!fits)       status = "wont-fit";
  else if (comfortable) status = "fits-comfortable";

  return { ...breakdown, fits, comfortable, utilization, status, engineOk };
}

/* For Mode 1: for a given machine config, find the best quant of each model
 * that fits — and the verdict if nothing fits. */
function bestQuantFor(model, ctx, kvPrecId, engineId, machineLike) {
  for (const q of window.QUANTS) {                        // ordered FP16 → Q2
    const r = checkFit(model, q.id, ctx, kvPrecId, engineId, machineLike);
    if (r.fits) return { quant: q, result: r, fits: true };
  }
  // Nothing fit — still return the smallest-quant breakdown so the card can
  // show how short the user is.
  const last = window.QUANTS[window.QUANTS.length - 1];
  return { quant: last, result: checkFit(model, last.id, ctx, kvPrecId, engineId, machineLike), fits: false };
}

/* For each model, count how many quants fit — feeds the "quant ladder" pip
 * indicator on cards. */
function quantLadder(model, ctx, kvPrecId, engineId, machineLike) {
  return window.QUANTS.map(q => ({
    quant: q,
    fits: checkFit(model, q.id, ctx, kvPrecId, engineId, machineLike).fits,
  }));
}

/* Format helpers */
function fmtGB(n) {
  if (n >= 100) return Math.round(n) + " GB";
  if (n >= 10)  return n.toFixed(1) + " GB";
  return n.toFixed(2) + " GB";
}
function fmtParams(b) {
  if (b >= 1000) return (b / 1000).toFixed(1) + "T";
  if (b >= 100)  return Math.round(b) + "B";
  if (b >= 10)   return b.toFixed(0) + "B";
  return b.toFixed(1) + "B";
}
function fmtContext(t) {
  if (t >= 1024) return (t / 1024) + "K";
  return t.toString();
}

Object.assign(window, {
  findQuant, findEngine, findVendor, findKvPrec, findModel, findMachine,
  sizeModel, checkFit, bestQuantFor, quantLadder,
  fmtGB, fmtParams, fmtContext,
});
