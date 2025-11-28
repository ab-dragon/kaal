// Quick verification of timezone offsets without +/-12 clamping
const sampleTimezones = [
  'Pacific/Auckland', // NZ
  'Australia/Sydney', // Sydney
  'Europe/London', // London
  'America/New_York', // New York
  'Asia/Kolkata', // India (no DST, +5:30)
  'Asia/Kathmandu', // Nepal (+5:45)
  'Pacific/Kiritimati', // +14
  'Pacific/Niue', // -11
  'America/Caracas' // Venezuela (-4 currently, no DST)
];

function getTimezoneOffset(timezone) {
  const now = new Date();
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const getMinutes = (formatter) => {
    const parts = formatter.formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
    return h * 60 + m;
  };
  const utcTotal = getMinutes(utcFormatter);
  const tzTotal = getMinutes(tzFormatter);
  let diffMinutes = tzTotal - utcTotal;
  // DO NOT clamp; adjust only if diff exceeds 18 hours (rare DST anomalies)
  if (diffMinutes > 18 * 60) diffMinutes -= 24 * 60;
  if (diffMinutes < -18 * 60) diffMinutes += 24 * 60;
  return diffMinutes / 60;
}

function formatUtcOffset(offset) {
  const sign = offset >= 0 ? '+' : '-';
  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

console.log('Offset verification (current date):');
for (const tz of sampleTimezones) {
  const offset = getTimezoneOffset(tz);
  console.log(`${tz.padEnd(25)} => ${formatUtcOffset(offset)}`);
}
