import { group, test } from '../../../src/SqualusNode';
import Auth from '../Authentication/Auth';

function getFutureDay(days) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).toISOString();
}

export default group('reminders')
  .requires(Auth)
  .session('adminSessionCookie')
  .tests([
    test('get all reminder targets')
      .get('/api/remindables')
      .expect('ReminderTarget.GetAll')
      .save('templateId', body => body.find(t => t.templateId).templateId)
      .save('productId', body => body.find(t => t.productId).productId),

    test('create product reminder for far future date')
      .post('/api/reminders')
      .json(context => ({
        reminderDate: getFutureDay(92),
        productId: context.get('productId'),
      }))
      .expect('Reminder.Get')
      .save('productReminderId', body => body.id),

    test('verify far future reminder is not returned')
      .get('/api/reminders')
      .expect('Reminder.GetAll')
      .expect((body, productReminderId) => body.every(r => r.id !== productReminderId)),

    test('get reminder directly')
      .get('/api/reminders/:productReminderId')
      .expect('Reminder.Get'),

    test('update reminder date')
      .put('/api/reminders/:productReminderId')
      .json({
        reminderDate: getFutureDay(20),
      }),

    test('verify future reminder is returned')
      .get('/api/reminders')
      .expect('Reminder.GetAll')
      .expect((body, productReminderId) => body.some(r => r.id === productReminderId)),

    test('update reminder to recurring')
      .put('/api/reminders/:productReminderId')
      .json({
        intervalUnit: 'monthly',
        intervalOffset: 15,
      }),

    test('update reminder with invalid data')
      .put('/api/reminders/:productReminderId')
      .json({
        reminderDate: new Date().toISOString(),
        intervalUnit: 'weekly',
        intervalOffset: 45,
      })
      .expect(400)
      .expect('Reminder.Error')
      .expect(body => body.modelState.reminder.length === 2),

    test('create reminder with invalid data')
      .post('/api/reminders')
      .json(context => ({
        intervalUnit: 'weekly',
        intervalOffset: 6,
        productId: context.get('productId'),
        templateId: context.get('templateId'),
      }))
      .expect(400)
      .expect('Reminder.Error')
      .expect(body => body.modelState.reminder.length === 1),

    test('create template reminder')
      .post('/api/reminders')
      .expect('Reminder.Get')
      .json(context => ({
        intervalUnit: 'weekly',
        intervalOffset: 1,
        templateId: context.get('templateId'),
      }))
      .save('templateReminderId', body => body.id),

    test('delete product reminder')
      .delete('/api/reminders/:productReminderId'),

    test('delete template reminder')
      .delete('/api/reminders/:templateReminderId'),
  ]);
