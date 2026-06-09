import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Colors palette for chart bars/slices
// ---------------------------------------------------------------------------
const COLORS = [
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
];

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatAmount(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
  return v?.toLocaleString('fr-FR') || '0';
}

// ---------------------------------------------------------------------------
// Vertical BarChart — responsive SVG with animated bars
// ---------------------------------------------------------------------------
export function BarChart({
  data = [],
  height = 200,
  color = '#f59e0b',
  showValues = true,
  valueFormatter = formatAmount,
  barWidth = 28,
  gap = 8,
}) {
  if (!data.length) return <EmptyChart />;

  const values = data.map((d) => d.value ?? 0);
  const max = Math.max(...values, 1);
  const totalWidth = data.length * (barWidth + gap) - gap + 40;
  const chartWidth = Math.max(totalWidth, 300);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={height + 30}
        viewBox={`0 0 ${chartWidth} ${height + 40}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - height * ratio;
          return (
            <g key={ratio}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray={ratio > 0 ? '4 4' : undefined}
              />
              <text
                x={chartWidth - 5}
                y={y + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
              >
                {valueFormatter(max * ratio)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const barH = ((item.value ?? 0) / max) * height;
          const x = 10 + i * (barWidth + gap);
          const y = height - barH;
          const barColor = item.color || color;

          return (
            <g key={i}>
              <motion.rect
                x={x}
                y={height}
                width={barWidth}
                height={0}
                fill={barColor}
                rx={4}
                initial={false}
                animate={{
                  y,
                  height: Math.max(barH, 0),
                }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                className="hover:opacity-80 transition-opacity"
              />
              {showValues && barH > 15 && (
                <motion.text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill={barColor}
                  fontSize="10"
                  fontWeight="600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  {valueFormatter(item.value ?? 0)}
                </motion.text>
              )}
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fill="#d1d5db"
                fontSize="9"
                fontWeight="500"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LineChart — smooth curve with gradient fill
// ---------------------------------------------------------------------------
export function LineChart({
  data = [],
  height = 200,
  color = '#f59e0b',
  valueFormatter = formatAmount,
  showDots = true,
  showLabels = true,
  showGrid = true,
  fillOpacity = 0.12,
}) {
  if (!data.length) return <EmptyChart />;

  const values = data.map((d) => d.value ?? 0);
  const max = Math.max(...values, 1);
  const padding = { top: 20, right: 10, bottom: 45, left: 50 };
  const chartWidth = Math.max(data.length * 60 + padding.left + padding.right, 400);
  const w = chartWidth - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const stepX = w / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + h - ((d.value ?? 0) / max) * h,
    value: d.value ?? 0,
    label: d.label,
  }));

  // Smooth SVG path (cubic bezier)
  function smoothPath(pts, close = false) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1].x + pts[i].x) / 2;
      const my = (pts[i - 1].y + pts[i].y) / 2;
      d += ` C ${pts[i - 1].x + (mx - pts[i - 1].x) / 2},${pts[i - 1].y} ${mx},${pts[i - 1].y} ${mx},${my}`;
      d += ` C ${mx},${pts[i].y} ${pts[i].x - (pts[i].x - mx) / 2},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    if (close) {
      d += ` L ${pts[pts.length - 1].x},${padding.top + h}`;
      d += ` L ${pts[0].x},${padding.top + h} Z`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath = smoothPath(points, true);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={height + 5}
        viewBox={`0 0 ${chartWidth} ${height + 20}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <defs>
          <linearGradient id={`line-grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity + 0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + h - h * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={ratio > 0 ? '4 4' : undefined}
                />
                <text x={padding.left - 6} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
                  {valueFormatter(max * ratio)}
                </text>
              </g>
            );
          })}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill={`url(#line-grad-${color.slice(1)})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <motion.g
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.04, type: 'spring', stiffness: 300 }}
            >
              <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#0f172a" strokeWidth="2" />
              {p.value > 0 && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill={color} fontSize="10" fontWeight="600">
                  {valueFormatter(p.value)}
                </text>
              )}
            </motion.g>
          ))}

        {/* X-axis labels — horizontal, readable */}
        {showLabels &&
          points.map((p, i) => (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={height + 8}
              textAnchor="middle"
              fill="#d1d5db"
              fontSize="10"
              fontWeight="500"
            >
              {p.label}
            </text>
          ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal BarChart — product ranking
// ---------------------------------------------------------------------------
export function HorizontalBarChart({
  data = [],
  height = 240,
  color = '#6366f1',
  valueFormatter = formatAmount,
  barHeight = 28,
}) {
  if (!data.length) return <EmptyChart />;

  const values = data.map((d) => d.value ?? 0);
  const max = Math.max(...values, 1);
  const chartHeight = Math.max(data.length * (barHeight + 8) + 20, height);

  return (
    <svg
      width="100%"
      height={chartHeight}
      viewBox={`0 0 ${500} ${chartHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {data.map((item, i) => {
        const barW = ((item.value ?? 0) / max) * 360;
        const y = 10 + i * (barHeight + 8);
        const barColor = item.color || COLORS[i % COLORS.length];

        return (
          <g key={i}>
            {/* Label */}
            <text
              x={0}
              y={y + barHeight / 2 + 1}
              textAnchor="start"
              fill="#cbd5e1"
              fontSize="11"
              fontWeight="500"
            >
              {item.label}
            </text>

            {/* Bar background */}
            <rect
              x={0}
              y={y}
              width={360}
              height={barHeight}
              rx={4}
              fill="#1e293b"
            />

            {/* Animated bar */}
            <motion.rect
              x={0}
              y={y}
              width={0}
              height={barHeight}
              rx={4}
              fill={barColor}
              initial={false}
              animate={{ width: Math.max(barW, 0) }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.08 }}
            />

            {/* Value */}
            <text
              x={barW + 8}
              y={y + barHeight / 2 + 1}
              textAnchor="start"
              fill={barColor}
              fontSize="11"
              fontWeight="700"
            >
              {valueFormatter(item.value ?? 0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-48 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
      <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate daily sales data from raw orders
// ---------------------------------------------------------------------------
export function buildSalesTimeline(orders = [], period = 'week') {
  const days = period === 'year' ? 365 : period === 'month' ? 30 : 7;
  const now = new Date();
  const map = new Map();

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label =
      period === 'year'
        ? d.toLocaleDateString('fr-FR', { month: 'short' })
        : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    map.set(key, { label, value: 0 });
  }

  // Fill in actual orders
  (orders || [])
    .filter((o) => o.status !== 'cancelled')
    .forEach((o) => {
      const key = (o.created_at || '').slice(0, 10);
      if (map.has(key)) {
        map.get(key).value += Number(o.total_amount) || 0;
      }
    });

  // For year view, aggregate by month
  if (period === 'year') {
    const monthly = new Map();
    for (const [key, { label, value }] of map) {
      const monthKey = key.slice(0, 7);
      if (monthly.has(monthKey)) {
        monthly.get(monthKey).value += value;
      } else {
        const d = new Date(key + 'T12:00:00');
        const monthLabel = d.toLocaleDateString('fr-FR', {
          month: 'short',
          year: '2-digit',
        });
        monthly.set(monthKey, { label: monthLabel, value });
      }
    }
    return Array.from(monthly.values());
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Build product ranking from products + orders
// ---------------------------------------------------------------------------
export function buildProductRanking(products = [], orders = []) {
  const orderMap = new Map();
  (orders || [])
    .filter((o) => o.status !== 'cancelled')
    .forEach((o) => {
      const pid = o.product_id;
      if (pid) {
        orderMap.set(pid, (orderMap.get(pid) || 0) + 1);
      }
    });

  return (products || [])
    .map((p) => ({
      label: p.title?.length > 18 ? p.title.slice(0, 16) + '…' : p.title || 'Produit',
      value: orderMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Summary stat card with trend
// ---------------------------------------------------------------------------
export function StatCard({ title, value, subtitle, icon: Icon, color = 'amber', format = (v) => v, trend }) {
  const colorMap = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'from-amber-500 to-orange-600' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'from-green-500 to-emerald-600' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'from-blue-500 to-blue-600' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'from-purple-500 to-purple-600' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'from-red-500 to-red-600' },
  };
  const c = colorMap[color] || colorMap.amber;

  return (
    <div className="p-5 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center mb-3`}>
        {Icon && <Icon className="w-5 h-5 text-white" />}
      </div>
      <p className="text-2xl font-bold text-white">{format(value)}</p>
      {trend != null && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
      <p className="text-sm text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
