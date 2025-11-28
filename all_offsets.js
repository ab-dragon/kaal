// Enumerate all cities and print their current UTC offsets using robust method
// Standalone script (does not import app.js to avoid browser-only APIs like localStorage)
const data = {
  'Australia/Oceania': {
    'Auckland': 'Pacific/Auckland',
    'Wellington': 'Pacific/Auckland',
    'Sydney': 'Australia/Sydney',
    'Melbourne': 'Australia/Melbourne',
    'Brisbane': 'Australia/Brisbane',
    'Adelaide': 'Australia/Adelaide',
    'Darwin': 'Australia/Darwin',
    'Perth': 'Australia/Perth',
    'Port Moresby': 'Pacific/Port_Moresby',
    'Suva': 'Pacific/Fiji'
  },
  'Asia': {
    'Tokyo': 'Asia/Tokyo',
    'Seoul': 'Asia/Seoul',
    'Shanghai': 'Asia/Shanghai',
    'Hong Kong': 'Asia/Hong_Kong',
    'Manila': 'Asia/Manila',
    'Singapore': 'Asia/Singapore',
    'Bangkok': 'Asia/Bangkok',
    'Jakarta': 'Asia/Jakarta',
    'Dhaka': 'Asia/Dhaka',
    'Mumbai': 'Asia/Kolkata',
    'Karachi': 'Asia/Karachi',
    'Dubai': 'Asia/Dubai',
    'Moscow': 'Europe/Moscow'
  },
  'Europe': {
    'Istanbul': 'Europe/Istanbul',
    'Helsinki': 'Europe/Helsinki',
    'Athens': 'Europe/Athens',
    'Bucharest': 'Europe/Bucharest',
    'Kiev': 'Europe/Kiev',
    'Berlin': 'Europe/Berlin',
    'Paris': 'Europe/Paris',
    'Rome': 'Europe/Rome',
    'Barcelona': 'Europe/Madrid',
    'Amsterdam': 'Europe/Amsterdam',
    'London': 'Europe/London',
    'Dublin': 'Europe/Dublin',
    'Lisbon': 'Europe/Lisbon'
  },
  'North America': {
    'Halifax': 'America/Halifax',
    'New York': 'America/New_York',
    'Toronto': 'America/Toronto',
    'Chicago': 'America/Chicago',
    'Mexico City': 'America/Mexico_City',
    'Denver': 'America/Denver',
    'Phoenix': 'America/Phoenix',
    'Los Angeles': 'America/Los_Angeles',
    'Vancouver': 'America/Vancouver',
    'Anchorage': 'America/Anchorage',
    'Honolulu': 'Pacific/Honolulu'
  },
  'South America': {
    'Buenos Aires': 'America/Argentina/Buenos_Aires',
    'Montevideo': 'America/Montevideo',
    'Sao Paulo': 'America/Sao_Paulo',
    'Rio de Janeiro': 'America/Sao_Paulo',
    'Brasilia': 'America/Sao_Paulo',
    'Santiago': 'America/Santiago',
    'La Paz': 'America/La_Paz',
    'Lima': 'America/Lima',
    'Quito': 'America/Guayaquil',
    'Bogota': 'America/Bogota',
    'Caracas': 'America/Caracas'
  }
};

function getTimezoneOffset(timezone) {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return (tzDate - utcDate) / 3600000;
}

function formatUtcOffset(offset) {
  const sign = offset >= 0 ? '+' : '-';
  const totalMinutes = Math.round(Math.abs(offset) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

console.log('Current offsets (DST sensitive) for all cities:');
for (const [continent, cities] of Object.entries(data)) {
  console.log(`\n${continent}`);
  const entries = Object.entries(cities).map(([name, tz]) => {
    const offset = getTimezoneOffset(tz);
    return { name, tz, offsetStr: formatUtcOffset(offset), offsetValue: offset };
  }).sort((a, b) => b.offsetValue - a.offsetValue); // east to west
  for (const e of entries) {
    console.log(`${e.name.padEnd(15)} ${e.offsetStr.padEnd(10)} ${e.tz}`);
  }
}
