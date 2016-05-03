import Squalus from './Squalus';
import docReady from 'es6-docready';

docReady(() => {
  Squalus.build([
    {
      id: 'foo1',
      endpoint: {
        url: 'some/url',
        method: 'GET',
      },
      type: {
        class: 'Scalar',
        type: {
          name: 'int',
        },
      },
      params: {
        guid: {
          name: 'int',
        },
      },
    },
  ]);
});
