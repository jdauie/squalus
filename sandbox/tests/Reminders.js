import group from '../../src/Automation/TestGroup';
import test from '../../src/Automation/Test';
import Auth from './Auth';

export default group('reminders-group')
  .requires(Auth)
  .tests([
    test('reminders-test-1')
      .post('/reminders')
      .data('')
      .is('')
      .save('reminderId', (res) => res.data[0].Id),
  ]);
