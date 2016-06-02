import collection from '../../src/Automation/TestCollection';
import Auth from './Auth';
import Reminders from './Reminders';

export default collection('collection1')
  .groups([
    Auth,
    Reminders,
  ]);
