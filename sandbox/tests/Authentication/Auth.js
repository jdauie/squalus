import { group, test } from '../../../src/Automation/TestGroup';

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
