import group from '../../../src/Automation/TestGroup';
import test from '../../../src/Automation/Test';

function getCookie(name) {
  const map = new Map();
  document.cookie.split(';').forEach(c => {
    const [key, val] = c.split('=', 2);
    map.set(key, val);
  });
  return map.get(name);
}

export default group('auth-group')
  .tests([
    test('auth-test-1')
      .post('/account/ajaxlogin')
      .json({
        UserName: 'josh+level5@submittable.com',
        Password: 'password',
      })
      .save('session', () => getCookie('.submittable')),
  ]);
