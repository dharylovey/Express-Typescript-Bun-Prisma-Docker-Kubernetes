import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    offset_pagination: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s',
      exec: 'offsetTest',
    },
    cursor_pagination: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s',
      exec: 'cursorTest',
      startTime: '10s', // Run after offset test finishes
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = 'http://api:3000/products';

export function offsetTest() {
  // Test deep pagination with offset (e.g., page 10,000)
  // 10,000 * 10 = 100,000 records skipped
  const page = 10000;
  const res = http.get(`${BASE_URL}/offset?page=${page}&limit=10`);
  
  check(res, {
    'offset status is 200': (r) => r.status === 200,
    'offset has data': (r) => r.json('data') && r.json('data').length > 0,
  });
  sleep(1);
}

export function cursorTest() {
  let res = http.get(`${BASE_URL}/cursor?limit=10`);
  
  const nextCursor = res.json('meta.nextCursor');
  
  if (nextCursor) {
      res = http.get(`${BASE_URL}/cursor?limit=10&cursor=${nextCursor}`);
  }

  check(res, {
    'cursor status is 200': (r) => r.status === 200,
    'cursor has data': (r) => r.json('data') && r.json('data').length > 0,
  });
  sleep(1);
}
