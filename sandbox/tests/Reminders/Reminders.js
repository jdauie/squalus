import group from '../../../src/Automation/TestGroup';
import test from '../../../src/Automation/Test';
import Auth from '../Authentication/Auth';

export default group('reminders-group')
  .requires(Auth)
  .tests([
    test('get all reminder targets')
      .get('/api/remindables')
      .is('ReminderTarget.GetAll')
      .save('templateId', (body) => body.find(t => t.templateId).templateId)
      .save('productId', (body) => body.find(t => t.productId).productId),

    test('create product reminder for far future date')
      .post('/api/reminders')
      .json(context => ({
        reminderDate: (() => {
          const d = new Date();
          return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 92);
        })().toISOString(),
        productId: context.get('productId'),
      }))
      .is('Reminder.Get')
      .save('productReminderId', body => body.id),

    test('verify far future reminder is not returned')
      .get('/api/reminders')
      .is('Reminder.GetAll')
      .test('no reminder', (body, context) => body.every(r => r.id !== context.get('productReminderId'))),

    test('get reminder directly')
      .get(context => `/api/reminders/${context.get('productReminderId')}`)
      .is('Reminder.Get'),

    test('update reminder date')
      .put(context => `/api/reminders/${context.get('productReminderId')}`)
      .json({
        reminderDate: (() => {
          const d = new Date();
          return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 20);
        })().toISOString(),
      }),

    test('verify future reminder is returned')
      .get('/api/reminders')
      .is('Reminder.GetAll')
      .test('reminder', (body, context) => body.some(r => r.id === context.get('productReminderId'))),

    test('update reminder to recurring')
      .put(context => `/api/reminders/${context.get('productReminderId')}`)
      .json({
        intervalUnit: 'monthly',
        intervalOffset: 15,
      }),

    test('update reminder with invalid data to test validation')
      .put(context => `/api/reminders/${context.get('productReminderId')}`)
      .json({
        reminderDate: new Date().toISOString(),
        intervalUnit: 'weekly',
        intervalOffset: 45,
      })
      .is(400)
      .test('3 errors', body => body.modelState.reminder.length === 3),

    test('create reminder with invalid data to test validation')
      .post('/api/reminders')
      .json(context => ({
        intervalUnit: 'weekly',
        intervalOffset: 6,
        productId: context.get('productId'),
        templateId: context.get('templateId'),
      }))
      .is(400),

    test('create template reminder')
      .post('/api/reminders')
      .is('Reminder.Get')
      .json(context => ({
        intervalUnit: 'weekly',
        intervalOffset: 1,
        templateId: context.get('templateId'),
      }))
      .save('templateReminderId', body => body.id),

    test('create template reminder')
      .post('/api/reminders')
      .is('Reminder.Get')
      .json(context => ({
        intervalUnit: 'weekly',
        intervalOffset: 1,
        templateId: context.get('templateId'),
      }))
      .save('templateReminderId', body => body.id),

    test('delete product reminder')
      .delete(context => `/api/reminders/${context.get('productReminderId')}`),

    test('delete template reminder')
      .delete(context => `/api/reminders/${context.get('templateReminderId')}`),

    // test('reminders-test-1')
    //   .get('/api/reminders')
    //   .is('Reminder.GetAll')
    //   .save('reminderId', body => body[0].id),
  ]);
