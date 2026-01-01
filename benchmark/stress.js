import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp to 50 users
        { duration: '30s', target: 100 }, // Ramp to 100 users
        { duration: '30s', target: 300 }, // Ramp to 300 users
        { duration: '30s', target: 300 }, // Hold at 300 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '0s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
  },
};

const BASE_URL = 'http://api:3000/products';

export default function () {
  // We use the fast cursor endpoint to test pure throughput
  const res = http.get(`${BASE_URL}/cursor?limit=10`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(0.1); // Small sleep to avoid instant flooding (10 req/s per user max)
}
