const db = require('../config/db');
const MIN_SAMPLE_SIZE = 20;

function positionBand(position) {
  if (position <= 2) return { min: 1, max: 2, label: '1–2' };
  if (position <= 5) return { min: 3, max: 5, label: '3–5' };
  if (position <= 10) return { min: 6, max: 10, label: '6–10' };
  if (position <= 20) return { min: 11, max: 20, label: '11–20' };
  return { min: 21, max: 1000000, label: '21+' };
}

function leadTimeBand(days) {
  if (days <= 1) return { min: 0, max: 1, label: '0–1 days' };
  if (days <= 3) return { min: 2, max: 3, label: '2–3 days' };
  if (days <= 7) return { min: 4, max: 7, label: '4–7 days' };
  return { min: 8, max: 1000000, label: 'more than 7 days' };
}

async function fetchOutcomes({ routeId, classType, posBand, leadBand, includeRoute = true, includeTime = true }) {
  const where = [
    'class_type = ?',
    'waitlist_position_at_observation BETWEEN ? AND ?',
    "final_outcome IN ('CONFIRMED', 'NOT_CONFIRMED')"
  ];
  const params = [classType, posBand.min, posBand.max];
  if (includeRoute) { where.push('route_id = ?'); params.push(routeId); }
  if (includeTime) { where.push('days_remaining_at_observation BETWEEN ? AND ?'); params.push(leadBand.min, leadBand.max); }

  const [rows] = await db.query(
    `SELECT final_outcome, data_source FROM waitlist_probability_history WHERE ${where.join(' AND ')}`,
    params
  );
  return rows;
}

async function estimate({ routeId, classType, position, daysRemaining }) {
  const posBand = positionBand(position);
  const leadBand = leadTimeBand(daysRemaining);
  const comparisons = [
    {
      includeRoute: true, includeTime: true,
      label: `Same route and class · positions ${posBand.label} · ${leadBand.label}`
    },
    {
      includeRoute: true, includeTime: false,
      label: `Same route and class · positions ${posBand.label} · all recorded lead times`
    },
    {
      includeRoute: false, includeTime: false,
      label: `Same class · positions ${posBand.label} · routes and lead times combined`
    }
  ];

  let selected = [];
  let comparisonGroup = comparisons[0].label;
  for (const comparison of comparisons) {
    const rows = await fetchOutcomes({ routeId, classType, posBand, leadBand, ...comparison });
    selected = rows;
    comparisonGroup = comparison.label;
    if (rows.length >= MIN_SAMPLE_SIZE) break;
  }

  const successes = selected.filter((row) => row.final_outcome === 'CONFIRMED').length;
  const totalSample = selected.length;
  const simulatedObservations = selected.filter((row) => row.data_source === 'SIMULATED_DEMO').length;
  const recordedObservations = selected.filter((row) => row.data_source === 'RECORDED_OUTCOME').length;
  if (totalSample < MIN_SAMPLE_SIZE) {
    return {
      canEstimate: false,
      message: 'There are not enough comparable completed historical cases to make a responsible estimate yet.',
      totalSample,
      simulatedObservations,
      recordedObservations,
      minimumSampleRequired: MIN_SAMPLE_SIZE,
      comparisonGroup,
      dataSupport: 'INSUFFICIENT'
    };
  }

  return {
    canEstimate: true,
    probabilityPercent: Number(((successes / totalSample) * 100).toFixed(1)),
    totalSample,
    simulatedObservations,
    recordedObservations,
    successes,
    unsuccessful: totalSample - successes,
    comparisonGroup,
    positionBand: posBand.label,
    leadTimeBand: leadBand.label,
    dataSupport: totalSample >= 50 ? 'STRONG' : 'ADEQUATE',
    dataSource: 'Historical outcomes stored in MySQL; simulated and recorded samples are counted separately.',
    disclaimer: 'This is a historical estimate, not a guarantee that an individual booking will be confirmed.'
  };
}

module.exports = { estimate };
