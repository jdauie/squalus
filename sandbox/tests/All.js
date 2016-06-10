import { collection } from '../../src/SqualusNode';
import Auth from './Authentication/Auth';
import Reminders from './Reminders/Reminders';

export default collection('all')
  .groups([
    Auth,
    Reminders,
  ]);
