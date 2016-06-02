import group from '../../src/Automation/TestGroup';
import test from '../../src/Automation/Test';
import Auth from './Auth';

export default group('group1')
  .requires(Auth)
  .tests([
    test('test1')
      .post('/reminders')
      .data('')
      .is('')
      .save('reminderId', (res) => res.data[0].Id),
  ]);
