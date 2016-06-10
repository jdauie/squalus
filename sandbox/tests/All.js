import collection from '../../src/Automation/TestCollection';
import Auth from './Authentication/Auth';
import Reminders from './Reminders/Reminders';

export default collection('all')
  .groups([
    Auth,
    Reminders,
  ]);
