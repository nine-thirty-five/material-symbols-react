import {
  useEffect,
  useMemo,
  useState,
  useDeferredValue,
  type CSSProperties,
} from 'react';
import {
  STYLES,
  WEIGHTS,
  FILLS,
  loadVariant,
  importPath,
  variantKey,
  type Style,
  type Weight,
  type Fill,
  type IconModule,
  type IconComponent,
} from './variants';
import { toComponentName } from '../../src/naming';
import metaJson from '../../_data/icons.json';

interface Meta {
  name: string;
  categories: string[];
  tags: string[];
  styles: string[];
}

const META = (metaJson as Meta[]).map((m) => ({
  ...m,
  component: toComponentName(m.name),
}));

const CATEGORIES = [
  'All',
  ...Array.from(new Set(META.flatMap((m) => m.categories))).sort(),
];

const MAX_RENDERED = 500;

export default function App() {
  const [style, setStyle] = useState<Style>('outlined');
  const [weight, setWeight] = useState<Weight>(400);
  const [fill, setFill] = useState<Fill>(0);
  const [size, setSize] = useState(48);
  const [color, setColor] = useState('#1f1f1f');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState('search');
  const [showAll, setShowAll] = useState(false);

  const [iconModule, setIconModule] = useState<IconModule>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadVariant(style, weight, fill).then((m) => {
      if (active) {
        setIconModule(m);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [style, weight, fill]);

  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return META.filter((m) => {
      if (category !== 'All' && !m.categories.includes(category)) return false;
      if (!q) return true;
      return (
        m.name.includes(q) || m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [deferredQuery, category]);

  const shown = filtered.slice(0, MAX_RENDERED);
  const iconStyle: CSSProperties = { color };
  const snippet = `import { ${toComponentName(selected)} } from '${importPath(
    style,
    weight,
    fill
  )}';`;

  return (
    <div className="app">
      <header className="hero">
        <h1>Material Symbols React</h1>
        <p>
          Every style, weight and fill — fully tree-shakeable. Pick a variant
          below and copy the import.
        </p>
      </header>

      <section className="controls">
        <Field label="Style">
          <Segmented
            options={STYLES.map((s) => ({ label: s, value: s }))}
            value={style}
            onChange={(v) => setStyle(v as Style)}
          />
        </Field>

        <Field label={`Weight · ${weight}`}>
          <Segmented
            options={WEIGHTS.map((w) => ({ label: String(w), value: w }))}
            value={weight}
            onChange={(v) => setWeight(v as Weight)}
          />
        </Field>

        <Field label="Fill">
          <Segmented
            options={FILLS.map((f) => ({
              label: f ? 'Filled' : 'Outlined',
              value: f,
            }))}
            value={fill}
            onChange={(v) => setFill(v as Fill)}
          />
        </Field>

        <Field label={`Size · ${size}px`}>
          <input
            type="range"
            min={16}
            max={96}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </Field>

        <Field label="Color">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
      </section>

      <section className="snippet">
        <code>{snippet}</code>
        <button onClick={() => navigator.clipboard?.writeText(snippet)}>
          Copy
        </button>
      </section>

      <section className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search icons by name or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="count">
          {filtered.length} icons
          {filtered.length > MAX_RENDERED ? ` (showing ${MAX_RENDERED})` : ''}
        </span>
      </section>

      {loading ? (
        <p className="muted">Loading {variantKey(style, weight, fill)}…</p>
      ) : (
        <section className="grid">
          {shown.map((m) => {
            const Icon = iconModule[m.component] as IconComponent | undefined;
            return (
              <button
                key={m.name}
                className={`cell${selected === m.name ? ' selected' : ''}`}
                title={m.name}
                onClick={() => {
                  setSelected(m.name);
                  setShowAll(true);
                }}
              >
                {Icon ? (
                  <Icon size={size} style={iconStyle} />
                ) : (
                  <span className="missing" style={{ fontSize: size / 3 }}>
                    n/a
                  </span>
                )}
                <span className="label">{m.name}</span>
              </button>
            );
          })}
        </section>
      )}

      {showAll && (
        <AllVariants
          iconName={selected}
          color={color}
          onClose={() => setShowAll(false)}
        />
      )}
    </div>
  );
}

function AllVariants({
  iconName,
  color,
  onClose,
}: {
  iconName: string;
  color: string;
  onClose: () => void;
}) {
  const [grid, setGrid] = useState<Record<string, IconComponent | undefined>>(
    {}
  );
  const component = toComponentName(iconName);

  useEffect(() => {
    let active = true;
    Promise.all(
      STYLES.flatMap((s) =>
        WEIGHTS.flatMap((w) =>
          FILLS.map((f) =>
            loadVariant(s, w, f)
              .then((m) => [variantKey(s, w, f), m[component]] as const)
              .catch(() => [variantKey(s, w, f), undefined] as const)
          )
        )
      )
    ).then((entries) => {
      if (active) setGrid(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [component]);

  return (
    <section className="all-variants">
      <div className="all-head">
        <h2>
          All 42 variants of <code>{iconName}</code>
        </h2>
        <button onClick={onClose}>Close</button>
      </div>
      {STYLES.map((s) => (
        <div key={s} className="all-row">
          <div className="all-style">{s}</div>
          {FILLS.map((f) => (
            <div key={f} className="all-fill">
              <span className="muted">{f ? 'filled' : 'outlined'}</span>
              <div className="all-weights">
                {WEIGHTS.map((w) => {
                  const Icon = grid[variantKey(s, w, f)];
                  return (
                    <div key={w} className="all-cell" title={`w${w}`}>
                      {Icon ? (
                        <Icon size={32} style={{ color }} />
                      ) : (
                        <span className="missing">·</span>
                      )}
                      <span className="all-w">{w}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
