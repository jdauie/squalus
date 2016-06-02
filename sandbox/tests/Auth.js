import group from '../../src/Automation/TestGroup';
import test from '../../src/Automation/Test';

export default group('group0')
  .tests([
    test('test1')
      .post('/login')
      .data('')
      .is(402)
      .save('session', (res) => res.cookie('.submittable')),
  ]);
