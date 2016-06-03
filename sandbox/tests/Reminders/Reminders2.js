import group from '../../../src/Automation/TestGroup';
import test from '../../../src/Automation/Test';
import Auth from '../Authentication/Auth';
import Reminders from './Reminders';

export default group('reminders2-group')
  .requires([Auth, Reminders])
  .tests([
    test('reminders2-test-1')
      .post('/api/reminders2')
      .json({})
      .is('')
      .save('reminderId', (res) => res.data[0].Id),
  ]);
