import group from '../../../src/Automation/TestGroup';
import test from '../../../src/Automation/Test';

export default group('auth')
  .tests([
    test('admin login')
      .post('/account/ajaxlogin')
      .json(context => ({
        UserName: context.get('adminUser'),
        Password: context.get('adminPassword'),
      }))
      .save('sessionCookie', (body, res) => res.headers['set-cookie'][0]),
  ]);
