import { useMemo, useReducer, useRef, useState, type FormEvent } from 'react'
import {
  CostTracker,
  getPricing,
  knownModels,
  registerPricing,
  type TokenUsage,
} from 'llm-ledger'
import './App.css'

const CUSTOM_MODEL = '__custom__'

const formatTokens = (n: number) => n.toLocaleString('en-US')

const formatUSD = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`

function App() {
  const tracker = useRef(new CostTracker()).current
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)

  const builtInModels = useMemo(() => knownModels().sort(), [])

  const [model, setModel] = useState<string>(builtInModels[0] ?? CUSTOM_MODEL)
  const [customModelId, setCustomModelId] = useState('')
  const [customInputRate, setCustomInputRate] = useState('')
  const [customOutputRate, setCustomOutputRate] = useState('')
  const [tag, setTag] = useState('')
  const [inputTokens, setInputTokens] = useState('')
  const [outputTokens, setOutputTokens] = useState('')
  const [cacheReadTokens, setCacheReadTokens] = useState('')
  const [cacheWrite5m, setCacheWrite5m] = useState('')
  const [cacheWrite1h, setCacheWrite1h] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isCustom = model === CUSTOM_MODEL
  const activePricing = !isCustom ? getPricing(model) : undefined

  function resetTokenFields() {
    setInputTokens('')
    setOutputTokens('')
    setCacheReadTokens('')
    setCacheWrite5m('')
    setCacheWrite1h('')
    setTag('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const modelId = isCustom ? customModelId.trim() : model
    if (!modelId) {
      setError('Enter a model id.')
      return
    }

    if (isCustom) {
      registerPricing(modelId, {
        input: Number(customInputRate) || 0,
        output: Number(customOutputRate) || 0,
      })
    }

    const usage: Partial<TokenUsage> = {
      inputTokens: Number(inputTokens) || 0,
      outputTokens: Number(outputTokens) || 0,
      cacheReadTokens: Number(cacheReadTokens) || 0,
      cacheWrite5mTokens: Number(cacheWrite5m) || 0,
      cacheWrite1hTokens: Number(cacheWrite1h) || 0,
    }

    try {
      tracker.record(modelId, usage, tag.trim() || undefined)
      resetTokenFields()
      forceUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleClear() {
    tracker.reset()
    forceUpdate()
  }

  const records = [...tracker.records].reverse()
  const byModel = Object.entries(tracker.byModel())

  return (
    <div className="page">
      <header className="page-header">
        <h1>LLM Token & Cost Calculator</h1>
        <p>Estimate spend across requests using the llm-ledger pricing table.</p>
      </header>

      <div className="layout">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>Add a request</h2>

          <label className="field">
            <span>Model</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {builtInModels.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
              <option value={CUSTOM_MODEL}>Custom model…</option>
            </select>
          </label>

          {isCustom ? (
            <div className="custom-model">
              <label className="field">
                <span>Model id</span>
                <input
                  type="text"
                  placeholder="e.g. gpt-4o"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Input $ / MTok</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={customInputRate}
                    onChange={(e) => setCustomInputRate(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Output $ / MTok</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={customOutputRate}
                    onChange={(e) => setCustomOutputRate(e.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : (
            activePricing && (
              <p className="pricing-hint">
                {formatUSD(activePricing.input)} / MTok in ·{' '}
                {formatUSD(activePricing.output)} / MTok out ·{' '}
                {formatUSD(activePricing.cacheRead)} / MTok cache read
              </p>
            )
          )}

          <div className="field-row">
            <label className="field">
              <span>Input tokens</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={inputTokens}
                onChange={(e) => setInputTokens(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Output tokens</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Cache read tokens</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cacheReadTokens}
                onChange={(e) => setCacheReadTokens(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Cache write (5m)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cacheWrite5m}
                onChange={(e) => setCacheWrite5m(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Cache write (1h)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cacheWrite1h}
                onChange={(e) => setCacheWrite1h(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Tag (optional)</span>
            <input
              type="text"
              placeholder="e.g. feature-x"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="primary">
              Add request
            </button>
            <button type="button" onClick={handleClear} disabled={records.length === 0}>
              Clear all
            </button>
          </div>
        </form>

        <div className="results">
          <div className="stats">
            <div className="stat card">
              <span className="stat-label">Requests</span>
              <span className="stat-value">{tracker.requestCount}</span>
            </div>
            <div className="stat card">
              <span className="stat-label">Total tokens</span>
              <span className="stat-value">{formatTokens(tracker.totalTokens)}</span>
            </div>
            <div className="stat card">
              <span className="stat-label">Total cost</span>
              <span className="stat-value">{formatUSD(tracker.totalCost)}</span>
            </div>
            <div className="stat card">
              <span className="stat-label">Cache savings</span>
              <span className="stat-value">{formatUSD(tracker.totalCacheSavings)}</span>
            </div>
          </div>

          {byModel.length > 0 && (
            <div className="card">
              <h2>By model</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Requests</th>
                      <th>Input</th>
                      <th>Output</th>
                      <th>Cache read</th>
                      <th>Cache write</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byModel.map(([id, summary]) => (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>{summary.requests}</td>
                        <td>{formatTokens(summary.inputTokens)}</td>
                        <td>{formatTokens(summary.outputTokens)}</td>
                        <td>{formatTokens(summary.cacheReadTokens)}</td>
                        <td>{formatTokens(summary.cacheWriteTokens)}</td>
                        <td>{formatUSD(summary.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <h2>Requests</h2>
            {records.length === 0 ? (
              <p className="empty">No requests yet — add one to see it here.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Model</th>
                      <th>Tag</th>
                      <th>Input</th>
                      <th>Output</th>
                      <th>Cost</th>
                      <th>Cache savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={records.length - i}>
                        <td>{r.timestamp.toLocaleTimeString()}</td>
                        <td>{r.model}</td>
                        <td>{r.tag ?? '—'}</td>
                        <td>{formatTokens(r.usage.inputTokens)}</td>
                        <td>{formatTokens(r.usage.outputTokens)}</td>
                        <td>{formatUSD(r.cost)}</td>
                        <td>{formatUSD(r.cacheSavings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
