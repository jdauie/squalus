import { group, test } from '../../../src/SqualusNode';

export default group('test')
  .parallel()
  .tests([
    test('')
      .get('/test/ObjectScalars')
      .expect('Test.ObjectScalars'),

    test('')
      .get('/test/ObjectArrays')
      .expect('Test.ObjectArrays'),

    test('')
      .get('/test/ObjectSimple')
      .expect('Test.ObjectSimple'),

    test('')
      .get('/test/ObjectMultipleInheritanceArray')
      .expect('Test.ObjectMultipleInheritanceArray'),

    test('')
      .get('/test/ObjectAnyArray')
      .expect('Test.ObjectAnyArray'),

    test('')
      .get('/test/MapStringObject')
      .expect('Test.MapStringObject'),

    test('')
      .get('/test/ObjectKnownInheritanceArray')
      .expect('Test.ObjectKnownInheritanceArray'),

    // test('')
    //   .get('/test/ObjectAll')
    //   .expect('Test.ObjectAll'),
  ]);
