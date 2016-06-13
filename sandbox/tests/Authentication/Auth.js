import { group, test } from '../../../src/SqualusNode';

export default group('auth')
  .tests([
    test('admin login')
      .post('/account/ajaxlogin')
      .json(context => ({
        UserName: context.get('adminUser'),
        Password: context.get('adminPassword'),
      }))
      .expect('Login.Response')
      .save('adminSessionCookie', response => response.headers['set-cookie'][0]),
  ]);
