import { group, test } from '../../../src/SqualusNode';

export default group('test')
  .tests([
    test('')
      .get('/test')
      .expect('Test.ObjectArrays'),
  ]);
