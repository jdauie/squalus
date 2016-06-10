import { group, test } from '../../../src/SqualusNode';

export default group('auth')
  .tests([
    test('admin login')
      .post('/account/ajaxlogin')
      .json(context => ({
        UserName: context.get('adminUser'),
        Password: context.get('adminPassword'),
      }))
      .is('Login.Response')
      .save('sessionCookie', (body, res) => res.headers['set-cookie'][0]),
  ]);
