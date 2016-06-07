import collection from '../../src/Automation/TestCollection';
import Auth from './Authentication/Auth';
import Reminders from './Reminders/Reminders';
import Reminders2 from './Reminders/Reminders2';

export default collection('collection1')
  .groups([
    Auth,
    Reminders,
    //Reminders2,
  ]);
