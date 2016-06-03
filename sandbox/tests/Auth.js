import group from '../../src/Automation/TestGroup';
import test from '../../src/Automation/Test';

export default group('auth-group')
  .tests([
    test('auth-test-1')
      .post('/login')
      .data('')
      .is(402)
      .save('session', (res) => res.cookie('.submittable')),
  ]);
