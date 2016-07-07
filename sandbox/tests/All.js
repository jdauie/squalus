import { collection } from '../../src/SqualusNode';
import Test from './Test/Test';

export default collection('all', {
  sequential: true,
})
  .groups([
    Test,
  ]);
