import group from '../../../src/Automation/TestGroup';
import test from '../../../src/Automation/Test';

export default group('auth-group')
  .tests([
    test('auth-test-1')
      .post('/account/ajaxlogin')
      .json({
        UserName: 'josh+level5@submittable.com',
        Password: 'password',
      })
      .save('token', (res) => res.json().then(json => json /*.token*/)),
  ]);
