import { collection } from '../../src/SqualusNode';
import Test from './Test/Test';

export default collection('all')
  .groups([
    Test,
  ]);
